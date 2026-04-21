import { useEffect, useRef, useCallback, useState } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
// Side-effect import: attaches L.heatLayer() to the Leaflet namespace.
// Without this the `Heat` toggle is a no-op because L.heatLayer is undefined.
import 'leaflet.heat'
import { Sidebar } from '@/components/layout/Sidebar'
import { useMapStore } from '@/stores/mapStore'
import { useGlobalStats } from '@/api/hooks'
import { authFetch } from '@/api/client'
import { SearchField } from '@/components/ui/SearchField'
import { CompassRose, ParchmentCard, PanelTitle } from '@/components/parchment/Primitives'
import { formatNumber } from '@/lib/format'

type LeafletHeat = (data: number[][], opts: Record<string, unknown>) => L.Layer
declare module 'leaflet' {
  function heatLayer(data: number[][], opts: Record<string, unknown>): L.Layer
}

const ENC_COLORS: Record<string, string> = {
  WPA3: '#3d5a2a',
  WPA2: '#4a6b5a',
  WPA: '#b8860b',
  WEP: '#8b1a1a',
  Open: '#6b4820',
  Unknown: '#8a6c3e',
}
const LAYER_WIFI = '#4a6b5a'
const LAYER_BT = '#4a3a6b'
const LAYER_CELL = '#b8860b'

function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function parchmentPin(color: string): L.DivIcon {
  const safe = color.replace(/[^#0-9a-fA-F]/g, '') || '#1a1410'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="28" viewBox="0 0 22 28">
    <path d="M11 2 C5.5 2 2 6 2 11 C2 17 11 26 11 26 S20 17 20 11 C20 6 16.5 2 11 2 Z"
      fill="${safe}" stroke="#1a1410" stroke-width="1.6" />
    <circle cx="11" cy="11" r="3.2" fill="#f0e4c8" stroke="#1a1410" stroke-width="1" />
  </svg>`
  return L.divIcon({
    className: 'map-marker-root',
    html: svg,
    iconSize: [22, 28],
    iconAnchor: [11, 26],
  })
}

interface GeoFeature {
  geometry: { coordinates: [number, number] }
  properties: Record<string, unknown>
}

export function MapPage() {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null)
  const heatRef = useRef<L.Layer | null>(null)
  const btLayerRef = useRef<L.LayerGroup | null>(null)
  const cellLayerRef = useRef<L.LayerGroup | null>(null)
  const [searchVal, setSearchVal] = useState('')
  const [counts, setCounts] = useState({ wifi: 0, bt: 0, cell: 0 })
  const {
    viewMode,
    mineOnly,
    showBtLayer,
    showCellLayer,
    encryptionFilters,
    setViewMode,
    toggleBtLayer,
    toggleCellLayer,
  } = useMapStore()
  const fetchWifiRef = useRef<
    ((map: L.Map, cluster: L.MarkerClusterGroup) => Promise<void>) | null
  >(null)
  const { data: stats } = useGlobalStats()

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [46.6, 2.3],
      zoom: 6,
      zoomControl: false,
    })
    L.control.zoom({ position: 'bottomleft' }).addTo(map)

    // CARTO Voyager has softly coloured terrain/roads/water — sepia-filters
    // much more legibly than CARTO Light (which is almost white).
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
        className: 'leaflet-tile-parchment',
      },
    ).addTo(map)

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      disableClusteringAtZoom: 17,
    })
    map.addLayer(cluster)
    clusterRef.current = cluster
    btLayerRef.current = L.layerGroup()
    cellLayerRef.current = L.layerGroup()
    mapRef.current = map

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.setView([pos.coords.latitude, pos.coords.longitude], 13)
        },
        () => {
          /* ignore geolocation rejection */
        },
        { timeout: 5000, enableHighAccuracy: false },
      )
    }

    const loadData = () => fetchWifiRef.current?.(map, cluster)
    map.on('moveend', loadData)
    loadData()

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !clusterRef.current) return
    fetchWifiRef.current?.(mapRef.current, clusterRef.current)
  }, [mineOnly, encryptionFilters, viewMode])

  useEffect(() => {
    if (!mapRef.current) return
    if (showBtLayer) {
      btLayerRef.current?.addTo(mapRef.current)
      fetchBtData(mapRef.current)
    } else {
      btLayerRef.current?.remove()
    }
  }, [showBtLayer])

  useEffect(() => {
    if (!mapRef.current) return
    if (showCellLayer) {
      cellLayerRef.current?.addTo(mapRef.current)
      fetchCellData(mapRef.current)
    } else {
      cellLayerRef.current?.remove()
    }
  }, [showCellLayer])

  const fetchWifiData = useCallback(
    async (map: L.Map, cluster: L.MarkerClusterGroup) => {
      const bounds = map.getBounds()
      const params = new URLSearchParams({
        lat_min: String(bounds.getSouth()),
        lat_max: String(bounds.getNorth()),
        lon_min: String(bounds.getWest()),
        lon_max: String(bounds.getEast()),
      })
      if (mineOnly) params.set('mine_only', 'true')

      try {
        const res = await authFetch(`/networks/wifi/geojson?${params}`)
        if (!res.ok) return
        const geojson = (await res.json()) as { features?: GeoFeature[] }

        cluster.clearLayers()
        if (heatRef.current) {
          mapRef.current?.removeLayer(heatRef.current)
          heatRef.current = null
        }

        const features =
          geojson.features?.filter((f) => {
            const enc = (f.properties.encryption as string) ?? 'Unknown'
            return encryptionFilters[enc] !== false
          }) ?? []

        setCounts((prev) => ({ ...prev, wifi: features.length }))

        if (viewMode === 'heatmap') {
          // Each sample carries the same intensity; overlaps sum to reveal
          // dense areas. `[lat, lon, intensity]`.
          const heatData = features.map<[number, number, number]>((f) => [
            f.geometry.coordinates[1],
            f.geometry.coordinates[0],
            1,
          ])
          const heatFn = (L as unknown as { heatLayer?: LeafletHeat }).heatLayer
          if (heatData.length > 0 && heatFn) {
            heatRef.current = heatFn(heatData, {
              radius: 28,
              blur: 22,
              maxZoom: 17,
              minOpacity: 0.4,
              // Classic blue → cyan → lime → yellow → orange → red ramp.
              // Leaflet.heat treats this as RGBA so fully opaque hot spots
              // pop over the parchment map.
              gradient: {
                0.0: '#1e3a8a',
                0.25: '#06b6d4',
                0.5: '#84cc16',
                0.7: '#eab308',
                0.85: '#f97316',
                1.0: '#dc2626',
              },
            }).addTo(map)
          }
        } else {
          features.forEach((f) => {
            const [lon, lat] = f.geometry.coordinates
            const p = f.properties
            const enc = (p.encryption as string) ?? 'Unknown'
            const color = ENC_COLORS[enc] ?? ENC_COLORS.Unknown

            const marker = L.marker([lat, lon], { icon: parchmentPin(color) })
            marker.bindPopup(`
              <div style="font-family: 'IM Fell English', Georgia, serif; line-height:1.55; color:#1a1410;">
                <div style="font-family: Cinzel, serif; font-weight:700; letter-spacing:0.08em; color:${color}; font-size:13px; margin-bottom:6px;">${escapeHtml(
              (p.ssid as string) || '&lt;hidden&gt;',
            )}</div>
                <div style="font-size:11px; display:grid; grid-template-columns:auto 1fr; gap:4px 10px;">
                  <span style="color:#6b4820;">BSSID</span>
                  <span style="font-family: 'JetBrains Mono', monospace;">${escapeHtml(String(p.bssid))}</span>
                  <span style="color:#6b4820;">Enc</span>
                  <span style="color:${color}; font-weight:600;">${escapeHtml(enc)}</span>
                  ${p.channel ? `<span style="color:#6b4820;">Ch</span><span style="font-family:'JetBrains Mono',monospace;">${p.channel}</span>` : ''}
                  ${p.rssi ? `<span style="color:#6b4820;">Sig</span><span style="font-family:'JetBrains Mono',monospace;">${p.rssi} dBm</span>` : ''}
                </div>
                <div style="margin-top:8px; padding-top:6px; border-top:1px dotted #8a6c3e; font-size:10px;">
                  <a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank" rel="noopener" style="color:#8b6914; text-decoration:underline; font-family:'JetBrains Mono',monospace;">${lat.toFixed(5)}, ${lon.toFixed(5)}</a>
                </div>
              </div>
            `)
            cluster.addLayer(marker)
          })
        }
      } catch (err) {
        console.error('Failed to load WiFi data:', err)
      }
    },
    [mineOnly, encryptionFilters, viewMode],
  )

  fetchWifiRef.current = fetchWifiData

  const fetchBtData = async (map: L.Map) => {
    const bounds = map.getBounds()
    try {
      const res = await authFetch(
        `/networks/bt/geojson?lat_min=${bounds.getSouth()}&lat_max=${bounds.getNorth()}&lon_min=${bounds.getWest()}&lon_max=${bounds.getEast()}`,
      )
      if (!res.ok) return
      const geojson = (await res.json()) as { features?: GeoFeature[] }
      btLayerRef.current?.clearLayers()
      const feats = geojson.features ?? []
      setCounts((prev) => ({ ...prev, bt: feats.length }))
      feats.forEach((f) => {
        const [lon, lat] = f.geometry.coordinates
        L.marker([lat, lon], { icon: parchmentPin(LAYER_BT) })
          .bindPopup(
            `<div style="font-family:'IM Fell English',serif;color:#1a1410;">
              <b style="color:${LAYER_BT};font-family:Cinzel;letter-spacing:0.06em;">${escapeHtml(
              (f.properties.name as string) || '&lt;unknown&gt;',
            )}</b><br/>
              <span style="color:#6b4820;">MAC</span> <span style="font-family:'JetBrains Mono',monospace;">${escapeHtml(String(f.properties.mac))}</span><br/>
              <span style="color:#6b4820;">Type</span> ${escapeHtml(String(f.properties.device_type))}
            </div>`,
          )
          .addTo(btLayerRef.current!)
      })
    } catch {
      /* silent */
    }
  }

  const fetchCellData = async (map: L.Map) => {
    const bounds = map.getBounds()
    try {
      const res = await authFetch(
        `/networks/cell/geojson?lat_min=${bounds.getSouth()}&lat_max=${bounds.getNorth()}&lon_min=${bounds.getWest()}&lon_max=${bounds.getEast()}`,
      )
      if (!res.ok) return
      const geojson = (await res.json()) as { features?: GeoFeature[] }
      cellLayerRef.current?.clearLayers()
      const feats = geojson.features ?? []
      setCounts((prev) => ({ ...prev, cell: feats.length }))
      feats.forEach((f) => {
        const [lon, lat] = f.geometry.coordinates
        L.marker([lat, lon], { icon: parchmentPin(LAYER_CELL) })
          .bindPopup(
            `<div style="font-family:'IM Fell English',serif;color:#1a1410;">
              <b style="color:${LAYER_CELL};font-family:Cinzel;letter-spacing:0.06em;">${f.properties.radio}</b><br/>
              <span style="color:#6b4820;">MCC/MNC</span> <span style="font-family:'JetBrains Mono',monospace;">${f.properties.mcc}/${f.properties.mnc}</span><br/>
              <span style="color:#6b4820;">LAC/CID</span> <span style="font-family:'JetBrains Mono',monospace;">${f.properties.lac}/${f.properties.cid}</span>
            </div>`,
          )
          .addTo(cellLayerRef.current!)
      })
    } catch {
      /* silent */
    }
  }

  const handleSearch = async () => {
    if (!searchVal.trim() || !mapRef.current) return
    try {
      const res = await authFetch(
        `/networks/wifi?ssid=${encodeURIComponent(searchVal)}&limit=1`,
      )
      if (!res.ok) return
      const data = await res.json()
      const results = data.results ?? data
      if (results.length > 0) {
        mapRef.current.setView([results[0].latitude, results[0].longitude], 16)
      }
    } catch {
      /* silent */
    }
  }

  const wifiTotal = stats?.total_wifi ?? counts.wifi

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <Sidebar />

      <div style={{ flex: 1, position: 'relative', minHeight: 0, background: 'var(--color-parchment-dark)' }}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 20 }} />
        {/* Warm parchment wash over the tiles — a single composited layer,
            infinitely cheaper than a CSS filter on every tile image. */}
        <div className="map-parchment-overlay" style={{ inset: 20 }} />

        {/* Title cartouche — top-left */}
        <div style={{ position: 'absolute', top: 32, left: 32, zIndex: 500, maxWidth: 290 }}>
          <ParchmentCard padding={14}>
            <div
              className="font-display"
              style={{
                fontSize: 15,
                fontWeight: 900,
                letterSpacing: '0.2em',
                color: 'var(--color-ink)',
              }}
            >
              MAP OF WHISPERS
            </div>
            <div
              style={{
                fontSize: 11,
                fontStyle: 'italic',
                color: 'var(--color-sepia)',
                marginTop: 2,
              }}
            >
              here be routers, towers and bluetooth wraiths
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: 10,
                color: 'var(--color-sepia)',
                marginTop: 8,
                letterSpacing: '0.04em',
              }}
            >
              drawn anno MMXXVI · tile by CARTO
            </div>
          </ParchmentCard>
        </div>

        {/* View mode & geolocate — top-right */}
        <div
          style={{
            position: 'absolute',
            top: 32,
            right: 32,
            zIndex: 500,
            display: 'flex',
            gap: 8,
            alignItems: 'stretch',
          }}
        >
          <ParchmentCard padding={6} style={{ display: 'flex', gap: 2 }}>
            <ModeBtn
              active={viewMode === 'markers'}
              label="Marks"
              onClick={() => setViewMode('markers')}
            />
            <ModeBtn
              active={viewMode === 'heatmap'}
              label="Heat"
              onClick={() => setViewMode('heatmap')}
            />
          </ParchmentCard>
          <button
            type="button"
            className="btn-parchment"
            onClick={() => {
              if (!mapRef.current || !('geolocation' in navigator)) return
              navigator.geolocation.getCurrentPosition(
                (pos) =>
                  mapRef.current?.setView(
                    [pos.coords.latitude, pos.coords.longitude],
                    14,
                  ),
                () => {
                  /* ignore */
                },
                { timeout: 5000 },
              )
            }}
            title="Centre on me"
            aria-label="Centre on my location"
            style={{ padding: '8px 10px' }}
          >
            ⌖
          </button>
        </div>

        {/* Legend cartouche — bottom-left */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            left: 32,
            zIndex: 500,
            maxWidth: 240,
          }}
        >
          <ParchmentCard padding={14}>
            <PanelTitle align="left">Legend</PanelTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              <LegendRow
                color={LAYER_WIFI}
                label="WiFi"
                count={wifiTotal}
                active
              />
              <LegendRow
                color={LAYER_BT}
                label="Bluetooth"
                count={counts.bt}
                active={showBtLayer}
                onToggle={toggleBtLayer}
              />
              <LegendRow
                color={LAYER_CELL}
                label="Cell towers"
                count={counts.cell}
                active={showCellLayer}
                onToggle={toggleCellLayer}
              />
            </div>
          </ParchmentCard>
        </div>

        {/* Compass rose — bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            right: 32,
            zIndex: 500,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            alignItems: 'flex-end',
            width: 320,
          }}
        >
          <ParchmentCard
            padding={10}
            style={{
              alignSelf: 'flex-end',
              background: 'rgba(240,228,200,0.88)',
            }}
          >
            <CompassRose size={76} />
          </ParchmentCard>

          <SearchField
            value={searchVal}
            onChange={setSearchVal}
            placeholder="Search SSID or BSSID..."
            ariaLabel="Search network by SSID or BSSID"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
      </div>
    </div>
  )
}

function ModeBtn({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: '6px 12px',
        fontFamily: 'var(--font-display)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        border: active ? '1.5px solid var(--color-ink)' : '1.5px solid transparent',
        background: active ? 'var(--color-parchment)' : 'transparent',
        color: active ? 'var(--color-wax-red)' : 'var(--color-sepia)',
        boxShadow: active ? '2px 2px 0 0 rgba(26,20,16,0.85)' : 'none',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function LegendRow({
  color,
  label,
  count,
  active,
  onToggle,
}: {
  color: string
  label: string
  count: number
  active: boolean
  onToggle?: () => void
}) {
  const clickable = Boolean(onToggle)
  const Tag = clickable ? 'button' : 'div'
  return (
    <Tag
      type={clickable ? ('button' as const) : undefined}
      onClick={onToggle}
      aria-pressed={clickable ? active : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 2px',
        border: 'none',
        background: 'transparent',
        textAlign: 'left',
        cursor: clickable ? 'pointer' : 'default',
        opacity: active ? 1 : 0.5,
        fontFamily: 'var(--font-body)',
        color: 'var(--color-ink)',
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          background: color,
          border: '1px solid var(--color-ink)',
        }}
      />
      <span style={{ flex: 1, fontSize: 12 }}>{label}</span>
      <span className="font-mono" style={{ fontSize: 11, color: 'var(--color-sepia)' }}>
        {formatNumber(count)}
      </span>
    </Tag>
  )
}
