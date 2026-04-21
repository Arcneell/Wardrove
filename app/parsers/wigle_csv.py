import csv
import io
import re
from datetime import datetime, timezone

from app.parsers.base import BaseParser, NetworkObservation


def classify_encryption(auth_mode: str) -> str:
    if not auth_mode or not auth_mode.strip():
        return "Unknown"
    upper = auth_mode.upper()
    if "WPA3" in upper or "SAE" in upper:
        return "WPA3"
    if "WPA2" in upper or "RSN" in upper:
        return "WPA2"
    if "WPA" in upper:
        return "WPA"
    if "WEP" in upper:
        return "WEP"
    if re.search(r"\[", auth_mode):
        return "Open"
    return "Unknown"


def _parse_datetime(dt_str: str) -> datetime | None:
    if not dt_str:
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S%z"):
        try:
            parsed = datetime.strptime(dt_str, fmt)
            if parsed.tzinfo is None:
                return parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)
        except ValueError:
            continue
    return None


class WigleCsvParser(BaseParser):
    def parse(self, content: bytes, filename: str) -> list[NetworkObservation]:
        # utf-8-sig strips the BOM that Windows/Excel often prepends
        text = content.decode("utf-8-sig", errors="replace")
        lines = text.splitlines()
        if len(lines) < 2:
            return []

        # Find the header row dynamically: WiGLE files usually start with a
        # preamble line like "WigleWifi-1.4,appRelease=..." but the column
        # header can be on line 0, 1, or even further down depending on tool.
        header_index = -1
        for i, line in enumerate(lines[:10]):
            lower = line.lower()
            if "currentlatitude" in lower and "currentlongitude" in lower:
                header_index = i
                break
        if header_index < 0:
            return []

        reader = csv.DictReader(io.StringIO("\n".join(lines[header_index:])))
        if not reader.fieldnames:
            return []
        # Case-insensitive column map: lowercased name → actual header
        col = {name.lower().strip(): name for name in reader.fieldnames}

        def get(row: dict, key: str, default: str = "") -> str:
            actual = col.get(key.lower())
            if actual is None:
                return default
            val = row.get(actual)
            return default if val is None else str(val)

        observations = []
        for row in reader:
            try:
                lat = float(get(row, "CurrentLatitude", "0") or 0)
                lon = float(get(row, "CurrentLongitude", "0") or 0)
                if lat == 0.0 and lon == 0.0:
                    continue

                bssid = get(row, "MAC").strip().upper()
                if not bssid:
                    continue

                ssid = get(row, "SSID").strip()
                auth_mode = get(row, "AuthMode").strip()
                encryption = classify_encryption(auth_mode)
                channel = int(get(row, "Channel", "0") or 0)
                frequency = int(get(row, "Frequency", "0") or 0)
                rssi = int(get(row, "RSSI", "-100") or -100)
                first_seen = get(row, "FirstSeen").strip()
                device_type = (get(row, "Type", "WIFI") or "WIFI").strip().upper()
                altitude = float(get(row, "AltitudeMeters", "0") or 0) or None
                accuracy = float(get(row, "AccuracyMeters", "0") or 0) or None

                # Map device type to our network types
                if device_type in ("BT", "BLE"):
                    net_type = device_type.lower()
                elif device_type in ("GSM", "LTE", "CDMA", "WCDMA", "NR"):
                    net_type = "cell"
                else:
                    net_type = "wifi"

                obs = NetworkObservation(
                    network_type=net_type,
                    identifier=bssid,
                    name=ssid,
                    encryption=encryption if net_type == "wifi" else None,
                    channel=channel if net_type == "wifi" else None,
                    frequency=frequency if net_type == "wifi" else None,
                    rssi=rssi,
                    latitude=lat,
                    longitude=lon,
                    altitude=altitude,
                    accuracy=accuracy,
                    seen_at=_parse_datetime(first_seen),
                )

                # Cell-specific fields
                # WiGLE CSV for cell towers:
                #   MAC = composite like "310_260_12345_67890" or "MCC_MNC_LAC_CID"
                #   SSID = operator name
                #   AuthMode = empty or radio type
                #   Channel = may contain LAC or ARFCN
                if net_type == "cell":
                    obs.radio = device_type
                    cell_parts = bssid.replace(":", "_").replace("-", "_").split("_")
                    if len(cell_parts) >= 4:
                        try:
                            obs.mcc = int(cell_parts[0])
                            obs.mnc = int(cell_parts[1])
                            obs.lac = int(cell_parts[2])
                            obs.cid = int(cell_parts[3])
                        except (ValueError, IndexError):
                            pass
                    elif len(cell_parts) >= 2:
                        try:
                            obs.mcc = int(cell_parts[0])
                            obs.mnc = int(cell_parts[1])
                            obs.cid = channel or 0
                        except (ValueError, IndexError):
                            pass

                observations.append(obs)
            except (ValueError, KeyError):
                continue

        return observations
