<p align="center">
  <img src="app/static/favicon.svg" alt="Wardrove" width="80" height="80">
</p>

<h1 align="center">Wardrove</h1>

<p align="center">
  <strong>Self-hosted wardriving map & dashboard</strong><br>
  <em>Your personal WiGLE, on your own infrastructure.</em>
</p>

<p align="center">
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white" alt="Docker"></a>
  <a href="https://python.org"><img src="https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white" alt="Python"></a>
  <a href="https://fastapi.tiangolo.com"><img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white" alt="FastAPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT"></a>
</p>

---

## About

Wardrove is a lightweight, self-hosted alternative to [WiGLE.net](https://wigle.net). Import your wardriving captures, visualize them on an interactive map with heatmap support, track your progress with an RPG-style leveling system, and keep full ownership of your data.

Built for the **M5Stack Cardputer** running [M5PORKCHOP](https://github.com/recessburton/M5PORKCHOP) firmware (WARHOG mode), but compatible with any tool that exports **WiGLE CSV v1.6**.

---

## Features

**Map & Visualization**
- Interactive map with individual markers color-coded by encryption type
- Cluster view when zoomed out, individual AP precision when zoomed in
- Heatmap overlay toggle with RSSI-based signal intensity
- Click overlapping APs to browse through them with prev/next navigation

**Data Management**
- Multi-file drag & drop upload (`.wigle.csv`)
- Smart deduplication by BSSID (updates only if signal is better or data is newer)
- WiGLE CSV v1.6 export for re-import into WiGLE.net or other tools
- Dedicated Bluetooth/BLE device page with search

**Dashboard & Stats**
- Total unique networks counter
- Encryption type breakdown (donut chart)
- Top 10 most common SSIDs
- Upload session history with mini bar chart

**Gamification**
- XP earned per unique AP discovered
- 100 levels from *Script Kiddie* to *Omniscient Eye*
- Rank progression designed around mapping an entire island

**Infrastructure**
- Single Docker container (~120MB)
- SQLite database with automatic migrations
- No external dependencies, no API keys, no cloud
- REST API for scripting and automation

---

## Quick Start

```bash
git clone https://github.com/Arcneell/warmap.git
cd warmap
docker compose up -d --build
```

Open **http://localhost:8847** — enter your pseudo and start importing.

---

## Usage

### Web UI

Click **Upload** in the header, drag & drop one or more `.wigle.csv` files. The map and stats update automatically.

### CLI / Automation

```bash
# Upload files
curl -X POST http://localhost:8847/api/upload \
  -F "files=@capture1.wigle.csv" \
  -F "files=@capture2.wigle.csv"

# Export all data as WiGLE CSV
curl http://localhost:8847/api/export -o wardrove_export.wigle.csv

# Get stats
curl http://localhost:8847/api/stats
```

### Auto-push from M5Stack Cardputer

```bash
#!/bin/bash
FILE=$(ls -t *.wigle.csv | head -1)
curl -X POST http://YOUR_SERVER:8847/api/upload -F "files=@$FILE"
```

---

## Map Controls

| Feature | Description |
|---------|-------------|
| Clusters | APs are grouped when zoomed out for performance |
| Individual markers | At zoom 17+, every AP is shown at its real position |
| Overlapping APs | Click to open a popup with arrow navigation (1/N) |
| Heatmap toggle | Switch between marker view and signal density heatmap |

### Marker Colors

| Color | Encryption |
|-------|------------|
| Green | WPA3 |
| Blue | WPA2 |
| Orange | WPA |
| Red | WEP |
| Gray | Open / Unknown |

---

## Ranks & XP

Each unique AP discovered earns 1 XP. Designed so that mapping ~100,000 networks reaches level 100.

| Level | XP | Rank |
|-------|----|------|
| 1 | 0 | Script Kiddie |
| 5 | 200 | Signal Hunter |
| 12 | 1,320 | RF Scout |
| 22 | 4,620 | Airspace Mapper |
| 40 | 15,600 | Frequency Ghost |
| 70 | 48,300 | Phantom Scanner |
| 100 | 99,000 | Omniscient Eye |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload `.wigle.csv` files (multipart, field: `files`) |
| `GET` | `/api/accesspoints` | List APs with optional filters |
| `GET` | `/api/accesspoints/geojson` | GeoJSON for map rendering |
| `GET` | `/api/export` | Download all data as WiGLE CSV |
| `GET` | `/api/bluetooth` | List BT/BLE devices |
| `GET` | `/api/stats` | Global statistics |
| `GET` | `/api/sessions` | Upload session history |
| `GET` | `/api/profile` | User profile and XP |
| `POST` | `/api/profile` | Create profile (`{"pseudo": "name"}`) |
| `DELETE` | `/api/accesspoints/{id}` | Delete an AP |

---

## Configuration

```yaml
# docker-compose.yml
services:
  wardrove:
    ports:
      - "8847:8000"       # Host port
    environment:
      - TZ=Indian/Reunion # Timezone
```

Data is stored in `./data/wardrove.db` (SQLite, Docker volume). Persists across rebuilds.

---

## Stack

| Component | Technology |
|-----------|------------|
| Backend | Python 3.12, FastAPI, aiosqlite |
| Frontend | Vanilla HTML/CSS/JS (no build step) |
| Map | Leaflet.js, MarkerCluster, Leaflet.heat |
| Charts | Chart.js |
| Database | SQLite |
| Container | Docker (~120MB image) |

---

## Project Structure

```
wardrove/
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── LICENSE
├── app/
│   ├── main.py
│   ├── database.py
│   ├── parser.py
│   ├── routes/
│   │   ├── upload.py
│   │   ├── accesspoints.py
│   │   └── stats.py
│   └── static/
│       ├── index.html
│       ├── style.css
│       ├── app.js
│       └── favicon.svg
└── data/
    └── wardrove.db
```

---

## License

[MIT](LICENSE)

---

<p align="center"><em>No cloud. No tracking. Just you, your Cardputer, and the open road.</em></p>
