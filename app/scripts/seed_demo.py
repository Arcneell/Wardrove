"""Seed a rich demo dataset so every page of the UI has something to show.

Run inside the app container:
    docker compose exec app python -m app.scripts.seed_demo

Idempotent: re-running refreshes the demo user and replaces the demo data
(networks, uploads, badges) so you always land on a clean, full dataset.

Creates / refreshes:
    • user `demo` (1-click login works when DEMO_MODE=true)
    • ~420 WiFi networks around Paris
    • ~140 Bluetooth devices
    • ~60 cell towers
    • 18 upload transactions across done / error / pending
    • XP, badges auto-awarded
"""

from __future__ import annotations

import asyncio
import math
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select

from app.database import async_session, init_db
from app.models.badge import UserBadge
from app.models.network import BtNetwork, CellTower, WifiNetwork
from app.models.observation import WifiObservation
from app.models.transaction import UploadTransaction
from app.models.user import User
from app.services.badges import evaluate_badges, seed_badges
from app.services.stats_cache import invalidate_stats

# ─── Demo account ────────────────────────────────────────────────────────────
DEMO_USERNAME = "demo"
DEMO_EMAIL = "demo@wardrove.local"
DEMO_AVATAR = None

# Centred on the Louvre (Paris) — easy to spot, densely populated with APs.
CENTER_LAT = 48.8606
CENTER_LON = 2.3376

ENCRYPTION_WEIGHTS = [
    ("WPA3", 0.08),
    ("WPA2", 0.58),
    ("WPA", 0.10),
    ("WEP", 0.05),
    ("Open", 0.12),
    ("Unknown", 0.07),
]

SSID_POOL = [
    "Livebox-{X4}", "FreeWifi_Secure", "Bbox-{X4}", "SFR_{X4}", "BouyguesTelecom",
    "eduroam", "Starbucks WiFi", "McDonalds Free WiFi", "Hotel LeMarais",
    "LouvreMuseum", "Cafe_deFlore", "BibVitalise", "TGV_Inoui",
    "UGC_Cinema", "Fnac-Welcome", "Monoprix", "Decathlon-Public",
    "Parisian-Hotspot", "Orange_5G_{X4}", "FreeMobile-{X4}",
    "IoT-Sensor-{X4}", "PrinterHP-{X4}", "Sonos-{X4}", "SamsungTV-{X4}",
    "<hidden>", "", "Palais-Royal-WiFi", "Opera-Guest",
    "RatpFree", "SNCF-WiFi", "Metro-Hub",
]

BT_NAMES = [
    "JBL Flip 6", "AirPods Pro", "Sony WH-1000XM5", "Apple Watch",
    "Tile Slim", "Fitbit Charge", "Bose QC45", "Beats Studio",
    "Galaxy Buds", "Samsung TV", "LG Soundbar", "Nest Thermostat",
    "Tesla Model 3", "Peugeot 308", "Bosch Drill", "Dyson V15",
    "Logitech MX", "Pixel Buds", "Tile Mate", "AirTag",
    "Polar H10", "Garmin Edge", "Oral-B Pro", "Ring Doorbell",
    "Philips Hue", "ikea Tradfri", "Xiaomi Band 7", "Withings Scale",
]

CELL_OPERATORS = [
    # MCC 208 = France
    ("Orange FR",      "LTE",  208, 1),
    ("Orange FR",      "NR",   208, 1),
    ("SFR",            "LTE",  208, 10),
    ("Bouygues",       "LTE",  208, 20),
    ("Free Mobile",    "LTE",  208, 15),
    ("Orange FR",      "UMTS", 208, 1),
    ("SFR",            "UMTS", 208, 10),
]

BADGE_BOOST_VALUES = {
    "wifi_count": 420,
    "bt_count": 140,
    "cell_count": 60,
    "upload_count": 18,
}


def _random_point(radius_m: float = 4500) -> tuple[float, float]:
    """Return a lat/lon uniformly-ish within radius_m metres of the centre."""
    # Simple offset: 1° lat ≈ 111 km, 1° lon ≈ 111 km × cos(lat)
    r_deg_lat = radius_m / 111_000
    r_deg_lon = radius_m / (111_000 * math.cos(math.radians(CENTER_LAT)))
    # Square with slight clustering toward centre
    u = random.random() ** 0.6
    theta = random.random() * 2 * math.pi
    lat = CENTER_LAT + r_deg_lat * u * math.sin(theta)
    lon = CENTER_LON + r_deg_lon * u * math.cos(theta)
    return lat, lon


def _pick_encryption() -> str:
    r = random.random()
    acc = 0.0
    for name, w in ENCRYPTION_WEIGHTS:
        acc += w
        if r <= acc:
            return name
    return "Unknown"


def _random_mac(prefix: str = "02") -> str:
    return ":".join([prefix] + [f"{random.randint(0, 255):02X}" for _ in range(5)])


def _fill_template(s: str) -> str:
    return s.replace("{X4}", f"{random.randint(0, 0xFFFF):04X}")


async def _get_or_create_demo_user(db) -> User:
    result = await db.execute(select(User).where(User.username == DEMO_USERNAME))
    user = result.scalar_one_or_none()
    if user:
        user.email = DEMO_EMAIL
        user.is_active = True
        user.oauth_provider = "demo"
        user.oauth_id = "demo-1"
        return user

    user = User(
        username=DEMO_USERNAME,
        email=DEMO_EMAIL,
        oauth_provider="demo",
        oauth_id="demo-1",
        avatar_url=DEMO_AVATAR,
        xp=0,
        is_active=True,
        last_login=datetime.now(timezone.utc),
    )
    db.add(user)
    await db.flush()
    return user


async def _wipe_existing_demo_data(db, user_id: int) -> None:
    # Observations FK cascades from networks; drop demo-owned networks.
    await db.execute(delete(WifiObservation).where(WifiObservation.transaction_id.in_(
        select(UploadTransaction.id).where(UploadTransaction.user_id == user_id)
    )))
    await db.execute(delete(UploadTransaction).where(UploadTransaction.user_id == user_id))
    await db.execute(delete(WifiNetwork).where(WifiNetwork.discovered_by == user_id))
    await db.execute(delete(BtNetwork).where(BtNetwork.discovered_by == user_id))
    await db.execute(delete(CellTower).where(CellTower.discovered_by == user_id))
    await db.execute(delete(UserBadge).where(UserBadge.user_id == user_id))


async def _seed_wifi(db, user: User, n: int = 420) -> int:
    now = datetime.now(timezone.utc)
    inserted = 0
    for i in range(n):
        lat, lon = _random_point()
        enc = _pick_encryption()
        ssid = _fill_template(random.choice(SSID_POOL))
        channel = random.choice([1, 6, 11, 36, 40, 44, 48, 149, 153, 157, 161])
        freq = 2412 + (channel - 1) * 5 if channel <= 14 else 5000 + channel * 5
        bssid = _random_mac("08")
        first_seen = now - timedelta(days=random.randint(1, 180), minutes=random.randint(0, 1440))
        last_seen = first_seen + timedelta(days=random.randint(0, 30))
        db.add(WifiNetwork(
            bssid=bssid,
            ssid=ssid,
            encryption=enc,
            channel=channel,
            frequency=freq,
            rssi=-random.randint(40, 90),
            latitude=lat,
            longitude=lon,
            first_seen=first_seen,
            last_seen=last_seen,
            seen_count=random.randint(1, 12),
            discovered_by=user.id,
            last_updated_by=user.id,
        ))
        inserted += 1
        if i % 80 == 0:
            await db.flush()
    await db.flush()
    return inserted


async def _seed_bt(db, user: User, n: int = 140) -> int:
    now = datetime.now(timezone.utc)
    for i in range(n):
        lat, lon = _random_point()
        name = random.choice(BT_NAMES)
        dtype = "BLE" if random.random() < 0.7 else "BT"
        first_seen = now - timedelta(days=random.randint(1, 90), minutes=random.randint(0, 1440))
        last_seen = first_seen + timedelta(days=random.randint(0, 10))
        db.add(BtNetwork(
            mac=_random_mac("0C"),
            name=name,
            device_type=dtype,
            rssi=-random.randint(50, 95),
            latitude=lat,
            longitude=lon,
            first_seen=first_seen,
            last_seen=last_seen,
            seen_count=random.randint(1, 6),
            discovered_by=user.id,
        ))
        if i % 60 == 0:
            await db.flush()
    await db.flush()
    return n


async def _seed_cell(db, user: User, n: int = 60) -> int:
    now = datetime.now(timezone.utc)
    seen: set[tuple] = set()
    inserted = 0
    attempts = 0
    while inserted < n and attempts < n * 4:
        attempts += 1
        op_name, radio, mcc, mnc = random.choice(CELL_OPERATORS)
        lac = random.randint(1, 0xFFFF)
        cid = random.randint(1, 0xFFFFFF)
        key = (radio, mcc, mnc, lac, cid)
        if key in seen:
            continue
        seen.add(key)
        lat, lon = _random_point(radius_m=8000)
        first_seen = now - timedelta(days=random.randint(1, 200))
        last_seen = first_seen + timedelta(days=random.randint(0, 60))
        db.add(CellTower(
            radio=radio,
            mcc=mcc,
            mnc=mnc,
            lac=lac,
            cid=cid,
            rssi=-random.randint(60, 110),
            latitude=lat,
            longitude=lon,
            first_seen=first_seen,
            last_seen=last_seen,
            seen_count=random.randint(1, 4),
            discovered_by=user.id,
        ))
        inserted += 1
    await db.flush()
    return inserted


async def _seed_uploads(db, user: User, wifi_n: int, bt_n: int, cell_n: int) -> int:
    now = datetime.now(timezone.utc)
    statuses = (
        # status, count, format, xp_each
        ("done", 14, "wigle_csv", 180),
        ("done", 2, "kismet_netxml", 250),
        ("error", 1, "wigle_csv", 0),
        ("pending", 1, "wigle_csv", 0),
    )
    total = 0
    per_wifi = max(1, wifi_n // 16)
    per_bt = max(1, bt_n // 16)
    per_cell = max(1, cell_n // 16)
    for status, count, fmt, xp in statuses:
        for _ in range(count):
            uploaded_at = now - timedelta(days=random.randint(0, 120), minutes=random.randint(0, 1440))
            completed_at = uploaded_at + timedelta(minutes=random.randint(1, 15)) if status == "done" else None
            wifi_c = random.randint(per_wifi // 2, per_wifi * 2) if status == "done" else 0
            bt_c = random.randint(per_bt // 2, per_bt * 2) if status == "done" else 0
            cell_c = random.randint(per_cell // 2, per_cell * 2) if status == "done" else 0
            new_n = int((wifi_c + bt_c + cell_c) * random.uniform(0.4, 0.9))
            upd_n = int((wifi_c + bt_c + cell_c) * random.uniform(0.05, 0.25))
            skip_n = max(0, wifi_c + bt_c + cell_c - new_n - upd_n)
            db.add(UploadTransaction(
                user_id=user.id,
                filename=f"scan-{random.randint(1000, 9999)}.{ 'csv' if fmt == 'wigle_csv' else 'netxml' }",
                file_size=random.randint(80_000, 3_500_000),
                file_format=fmt,
                status=status,
                status_message="Rejected: invalid header row" if status == "error" else None,
                wifi_count=wifi_c,
                bt_count=int(bt_c * 0.3),
                ble_count=int(bt_c * 0.7),
                cell_count=cell_c,
                gps_points=wifi_c + bt_c + cell_c,
                new_networks=new_n,
                updated_networks=upd_n,
                skipped_networks=skip_n,
                xp_earned=xp if status == "done" else 0,
                uploaded_at=uploaded_at,
                completed_at=completed_at,
            ))
            total += 1
    await db.flush()
    return total


async def main() -> None:
    print("[seed] ensuring tables…")
    await init_db()

    async with async_session() as db:
        print("[seed] seeding badge catalogue…")
        await seed_badges(db)

        print("[seed] upserting demo user…")
        user = await _get_or_create_demo_user(db)
        await db.flush()

        print(f"[seed] wiping existing demo data for user #{user.id}…")
        await _wipe_existing_demo_data(db, user.id)

        random.seed(42)  # reproducible
        print("[seed] inserting WiFi…")
        wifi_n = await _seed_wifi(db, user, n=420)
        print(f"[seed]   {wifi_n} WiFi networks")

        print("[seed] inserting Bluetooth…")
        bt_n = await _seed_bt(db, user, n=140)
        print(f"[seed]   {bt_n} BT devices")

        print("[seed] inserting Cell…")
        cell_n = await _seed_cell(db, user, n=60)
        print(f"[seed]   {cell_n} cell towers")

        print("[seed] inserting upload history…")
        tx_n = await _seed_uploads(db, user, wifi_n, bt_n, cell_n)
        print(f"[seed]   {tx_n} upload transactions")

        # Award XP and evaluate badges based on counts.
        # Bypasses the badge-eval's real "actual wifi owned" check by
        # calling evaluate_badges which reads from DB live counts.
        user.xp = (
            wifi_n * 1 +          # XP_PER_IMPORT
            bt_n * 2 +            # XP_PER_BT
            cell_n * 3 +          # XP_PER_CELL
            tx_n * 10 +           # XP_PER_SESSION
            1500                  # various quest bonuses
        )
        print(f"[seed]   total XP → {user.xp}")

        await db.commit()

        print("[seed] evaluating badges…")
        awarded = await evaluate_badges(db, user)
        await db.commit()
        print(f"[seed]   {len(awarded)} new badge(s) unlocked")

        print("[seed] invalidating stats cache…")
        await invalidate_stats()

    print()
    print("┌─────────────────────────────────────────────────────────┐")
    print("│ Demo data ready                                        │")
    print("│                                                        │")
    print(f"│ User:    {DEMO_USERNAME:<46} │")
    print("│ Login:   1-click button in the Sign-in modal           │")
    print("│          (requires DEMO_MODE=true in .env)             │")
    print("│                                                        │")
    print(f"│ WiFi:    {wifi_n:>6,}                                            │")
    print(f"│ BT:      {bt_n:>6,}                                            │")
    print(f"│ Cell:    {cell_n:>6,}                                            │")
    print(f"│ Uploads: {tx_n:>6,}                                            │")
    print("└─────────────────────────────────────────────────────────┘")


if __name__ == "__main__":
    asyncio.run(main())
