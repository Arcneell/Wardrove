<p align="center">
  <img src="frontend/public/favicon.svg" width="80" height="80" alt="Wardrove">
</p>

<h1 align="center">Wardrove</h1>

<p align="center">
  <strong>Self-hosted wardriving platform with RPG progression</strong><br>
  Map &bull; Collect &bull; Level up &bull; Compete
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.12-blue?logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white" alt="Redis">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT">
</p>

---

## Features

| | |
|---|---|
| **Multi-format import** | WiGLE CSV, Kismet, KML/KMZ, NetStumbler, iOS consolidated.db, and more |
| **Interactive map** | WiFi / Bluetooth / Cell layers, clustering, heatmap, live refresh |
| **RPG progression** | 100 levels, 13 ranks, 42 badges with tiered rarity and glow effects |
| **Player profiles** | Public profiles, badge showcase, embeddable SVG card |
| **Leaderboard** | Global rankings, groups, clickable player profiles |
| **Advanced stats** | Encryption, channels, manufacturers (OUI), countries (MCC), top SSIDs |
| **Export** | WiGLE CSV, KML, GeoJSON |
| **Async processing** | Parallel workers, bulk DB operations, real-time status via SSE |

## Quick Start

```bash
git clone https://github.com/Arcneell/Wardrove.git
cd Wardrove
cp .env.example .env    # edit with your secrets
docker compose up -d --build
```

Open `http://localhost:8847`

## GitHub OAuth

1. Create an OAuth App at [github.com/settings/developers](https://github.com/settings/developers)
2. Set callback URL to `http://<your-url>/api/v1/auth/callback/github`
3. Add to `.env`:
```env
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
APP_URL=http://localhost:8847
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PASSWORD` | `wardrove` | PostgreSQL password |
| `SECRET_KEY` | -- | JWT signing key |
| `APP_URL` | `http://localhost:8847` | Public URL |
| `GITHUB_CLIENT_ID` | -- | OAuth client ID |
| `GITHUB_CLIENT_SECRET` | -- | OAuth secret |
| `WORKER_MAX_JOBS` | `10` | Concurrent jobs per worker |

## Architecture

```
Browser  -->  FastAPI (port 8847)  -->  PostgreSQL + PostGIS
                  |                         ^
                  v                         |
               Redis  <-->  ARQ Workers (x2, 10 jobs each)
```

**Services**: `app` &bull; `worker-1` &bull; `worker-2` &bull; `postgres` &bull; `redis`

## API

Base: `/api/v1`

```bash
# Upload
curl -X POST http://localhost:8847/api/v1/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "files=@capture.wigle.csv"

# Player profile
curl http://localhost:8847/api/v1/profile/u/username

# Export
curl http://localhost:8847/api/v1/export/geojson > networks.geojson
```

Full API docs at `/docs` (Swagger UI).

## Development

```bash
# Backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev

# Worker
python -m arq app.tasks.worker.WorkerSettings
```

## License

MIT
