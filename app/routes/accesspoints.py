import io
import csv

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse, StreamingResponse

from app.database import get_db

router = APIRouter()


@router.get("/accesspoints")
async def list_accesspoints(
    encryption: str | None = Query(None),
    ssid: str | None = Query(None),
    limit: int = Query(100, ge=1, le=10000),
    offset: int = Query(0, ge=0),
):
    db = await get_db()
    try:
        conditions = []
        params = []

        if encryption:
            conditions.append("encryption = ?")
            params.append(encryption)
        if ssid:
            conditions.append("ssid LIKE ?")
            params.append(f"%{ssid}%")

        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        query = f"SELECT * FROM access_points {where} ORDER BY id DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()


@router.get("/accesspoints/geojson")
async def geojson(
    encryption: str | None = Query(None),
    ssid: str | None = Query(None),
):
    db = await get_db()
    try:
        conditions = ["device_type = 'WIFI'"]
        params = []

        if encryption:
            enc_list = encryption.split(",")
            placeholders = ",".join("?" for _ in enc_list)
            conditions.append(f"encryption IN ({placeholders})")
            params.extend(enc_list)
        if ssid:
            conditions.append("ssid LIKE ?")
            params.append(f"%{ssid}%")

        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        query = f"SELECT * FROM access_points {where}"

        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()

        features = []
        for row in rows:
            r = dict(row)
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [r["longitude"], r["latitude"]],
                },
                "properties": {
                    "id": r["id"],
                    "bssid": r["bssid"],
                    "ssid": r["ssid"],
                    "encryption": r["encryption"],
                    "channel": r["channel"],
                    "rssi": r["rssi"],
                    "first_seen": r["first_seen"],
                    "last_seen": r["last_seen"],
                    "device_type": r["device_type"],
                },
            })

        return {
            "type": "FeatureCollection",
            "features": features,
        }
    finally:
        await db.close()


@router.get("/export")
async def export_wigle_csv():
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM access_points ORDER BY first_seen")
        rows = await cursor.fetchall()

        output = io.StringIO()
        output.write("WigleWifi-1.6,appRelease=wardrove,model=export,release=1.0,device=wardrove,display=web,board=server,brand=wardrove\n")

        writer = csv.writer(output)
        writer.writerow(["MAC", "SSID", "AuthMode", "FirstSeen", "Channel", "RSSI",
                         "CurrentLatitude", "CurrentLongitude", "AltitudeMeters", "AccuracyMeters", "Type"])

        enc_to_auth = {
            "WPA3": "[WPA3-SAE][ESS]",
            "WPA2": "[WPA2-PSK-CCMP][ESS]",
            "WPA": "[WPA-PSK-TKIP][ESS]",
            "WEP": "[WEP][ESS]",
            "Open": "[ESS]",
            "Unknown": "",
        }

        for row in rows:
            r = dict(row)
            auth = enc_to_auth.get(r["encryption"], "")
            writer.writerow([
                r["bssid"], r["ssid"], auth, r["first_seen"], r["channel"], r["rssi"],
                r["latitude"], r["longitude"], 0.0, 0.0, r["device_type"],
            ])

        output.seek(0)
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=wardrove_export.wigle.csv"},
        )
    finally:
        await db.close()


@router.get("/bluetooth")
async def list_bluetooth(
    search: str | None = Query(None),
):
    db = await get_db()
    try:
        conditions = ["device_type IN ('BT', 'BLE')"]
        params = []

        if search:
            conditions.append("(ssid LIKE ? OR bssid LIKE ?)")
            params.extend([f"%{search}%", f"%{search}%"])

        where = f"WHERE {' AND '.join(conditions)}"
        cursor = await db.execute(
            f"SELECT * FROM access_points {where} ORDER BY last_seen DESC", params
        )
        rows = await cursor.fetchall()

        cursor2 = await db.execute(
            f"SELECT COUNT(*) as total FROM access_points {where}", params
        )
        total = (await cursor2.fetchone())["total"]

        return {"total": total, "devices": [dict(row) for row in rows]}
    finally:
        await db.close()


@router.delete("/accesspoints/{ap_id}")
async def delete_accesspoint(ap_id: int):
    db = await get_db()
    try:
        await db.execute("DELETE FROM access_points WHERE id = ?", (ap_id,))
        await db.commit()
        return JSONResponse(status_code=204, content=None)
    finally:
        await db.close()
