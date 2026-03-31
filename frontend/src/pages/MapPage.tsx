import { useEffect, useRef, useCallback, useState } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
import { Sidebar } from '@/components/layout/Sidebar'
import { useMapStore } from '@/stores/mapStore'
import { useAuthStore } from '@/stores/authStore'
import { authFetch } from '@/api/client'
import { Flame, MapPin, Search, Crosshair } from 'lucide-react'

import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
L.Icon.Default.mergeOptions({ iconUrl, shadowUrl })

const ENC_COLORS: Record<string, string> = {
  WPA3: '#5cb85c', WPA2: '#4a9eda', WPA: '#d4943a', WEP: '#c9463e', Open: '#8a7e6a', Unknown: '#6a6050',
}
const BT_COLOR = '#8a7ad8'
const CELL_COLOR = '#d4943a'

function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

export function MapPage() {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null)
  const heatRef = useRef<L.Layer | null>(null)
  const btLayerRef = useRef<L.LayerGroup | null>(null)
  const cellLayerRef = useRef<L.LayerGroup | null>(null)
  const [searchVal, setSearchVal] = useState('')
  const { viewMode, mineOnly, showBtLayer, showCellLayer, encryptionFilters, setViewMode } = useMapStore()
  const { isAuthenticated } = useAuthStore()
  const fetchWifiRef = useRef<((map: L.Map, cluster: L.MarkerClusterGroup) => Promise<void>) | null>(null)

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [46.6, 2.3],
      zoom: 6,
      zoomControl: false,
    })

    L.control.zoom({ position: 'bottomleft' }).addTo(map)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map)

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

    // Try to geolocate user
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.setView([pos.coords.latitude, pos.coords.longitude], 13)
        },
        () => { /* fallback to default view */ },
        { timeout: 5000, enableHighAccuracy: false }
      )
    }

    const loadData = () => fetchWifiRef.current?.(map, cluster)
    map.on('moveend', loadData)
    loadData()

    return () => { map.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !clusterRef.current) return
    fetchWifiRef.current?.(mapRef.current, clusterRef.current)
  }, [mineOnly, encryptionFilters, viewMode])

  useEffect(() => {
    if (!mapRef.current) return
    if (showBtLayer) { btLayerRef.current?.addTo(mapRef.current); fetchBtData(mapRef.current) }
    else { btLayerRef.current?.remove() }
  }, [showBtLayer])

  useEffect(() => {
    if (!mapRef.current) return
    if (showCellLayer) { cellLayerRef.current?.addTo(mapRef.current); fetchCellData(mapRef.current) }
    else { cellLayerRef.current?.remove() }
  }, [showCellLayer])

  const fetchWifiData = useCallback(async (map: L.Map, cluster: L.MarkerClusterGroup) => {
    const bounds = map.getBounds()
    const params = new URLSearchParams({
      lat_min: String(bounds.getSouth()), lat_max: String(bounds.getNorth()),
      lon_min: String(bounds.getWest()), lon_max: String(bounds.getEast()),
    })
    if (mineOnly) params.set('mine_only', 'true')

    try {
      const res = await authFetch(`/networks/wifi/geojson?${params}`)
      if (!res.ok) return
      const geojson = await res.json()

      cluster.clearLayers()
      if (heatRef.current) { mapRef.current?.removeLayer(heatRef.current); heatRef.current = null }

      const features = geojson.features?.filter((f: any) => {
        const enc = f.properties?.encryption ?? 'Unknown'
        return encryptionFilters[enc] !== false
      }) ?? []

      if (viewMode === 'heatmap') {
        const heatData = features.map((f: any) => [f.geometry.coordinates[1], f.geometry.coordinates[0], 0.5])
        if (heatData.length > 0 && (L as any).heatLayer) {
          heatRef.current = (L as any).heatLayer(heatData, {
            radius: 20, blur: 25, maxZoom: 17,
            gradient: { 0.2: '#1a1714', 0.4: '#4a9eda44', 0.6: '#4a9eda', 0.8: '#5cb85c', 1: '#c9a032' },
          }).addTo(map)
        }
      } else {
        features.forEach((f: any) => {
          const [lon, lat] = f.geometry.coordinates
          const p = f.properties
          const enc = p.encryption ?? 'Unknown'
          const color = ENC_COLORS[enc] ?? ENC_COLORS.Unknown

          const marker = L.circleMarker([lat, lon], {
            radius: 6, color, fillColor: color, fillOpacity: 0.8, weight: 1.5,
          })
          marker.bindPopup(`
            <div style="font-size:13px; line-height:1.8;">
              <div style="font-weight:700; color:${color}; font-size:14px; margin-bottom:4px;">${escapeHtml(p.ssid || '<hidden>')}</div>
              <span style="color:#a89880;">BSSID</span> ${escapeHtml(String(p.bssid))}<br/>
              <span style="color:#a89880;">Enc</span> <span style="color:${color}; font-weight:600;">${escapeHtml(enc)}</span><br/>
              ${p.channel ? `<span style="color:#a89880;">Ch</span> ${p.channel}<br/>` : ''}
              ${p.rssi ? `<span style="color:#a89880;">Sig</span> ${p.rssi} dBm<br/>` : ''}
              <a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank" rel="noopener" style="color:#c4a24e; text-decoration:none;">${lat.toFixed(5)}, ${lon.toFixed(5)}</a>
            </div>
          `)
          cluster.addLayer(marker)
        })
      }
    } catch (err) { console.error('Failed to load WiFi data:', err) }
  }, [mineOnly, encryptionFilters, viewMode])

  fetchWifiRef.current = fetchWifiData

  const fetchBtData = async (map: L.Map) => {
    const bounds = map.getBounds()
    try {
      const res = await authFetch(`/networks/bt/geojson?lat_min=${bounds.getSouth()}&lat_max=${bounds.getNorth()}&lon_min=${bounds.getWest()}&lon_max=${bounds.getEast()}`)
      if (!res.ok) return
      const geojson = await res.json()
      btLayerRef.current?.clearLayers()
      geojson.features?.forEach((f: any) => {
        const [lon, lat] = f.geometry.coordinates
        L.circleMarker([lat, lon], { radius: 5, color: BT_COLOR, fillColor: BT_COLOR, fillOpacity: 0.8, weight: 1 })
          .bindPopup(`<div style="font-size:13px;"><b style="color:${BT_COLOR};">${escapeHtml(f.properties.name || '<unknown>')}</b><br/><span style="color:#a89880;">MAC</span> ${escapeHtml(String(f.properties.mac))}<br/><span style="color:#a89880;">Type</span> ${escapeHtml(String(f.properties.device_type))}</div>`)
          .addTo(btLayerRef.current!)
      })
    } catch {}
  }

  const fetchCellData = async (map: L.Map) => {
    const bounds = map.getBounds()
    try {
      const res = await authFetch(`/networks/cell/geojson?lat_min=${bounds.getSouth()}&lat_max=${bounds.getNorth()}&lon_min=${bounds.getWest()}&lon_max=${bounds.getEast()}`)
      if (!res.ok) return
      const geojson = await res.json()
      cellLayerRef.current?.clearLayers()
      geojson.features?.forEach((f: any) => {
        const [lon, lat] = f.geometry.coordinates
        L.circleMarker([lat, lon], { radius: 7, color: CELL_COLOR, fillColor: CELL_COLOR, fillOpacity: 0.8, weight: 1 })
          .bindPopup(`<div style="font-size:13px;"><b style="color:${CELL_COLOR};">${f.properties.radio}</b><br/><span style="color:#a89880;">MCC/MNC</span> ${f.properties.mcc}/${f.properties.mnc}<br/><span style="color:#a89880;">LAC/CID</span> ${f.properties.lac}/${f.properties.cid}</div>`)
          .addTo(cellLayerRef.current!)
      })
    } catch {}
  }

  const handleSearch = async () => {
    if (!searchVal.trim() || !mapRef.current) return
    try {
      const res = await authFetch(`/networks/wifi?ssid=${encodeURIComponent(searchVal)}&limit=1`)
      if (!res.ok) return
      const data = await res.json()
      const results = data.results ?? data
      if (results.length > 0) {
        mapRef.current.setView([results[0].latitude, results[0].longitude], 16)
      }
    } catch {}
  }

  const geolocate = () => {
    if (!mapRef.current || !('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 14),
      () => {},
      { timeout: 5000 }
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <div className="flex-1 relative">
        <div ref={containerRef} className="absolute inset-0" />

        {/* Controls — top right */}
        <div className="absolute top-3 right-3 z-[1000] flex gap-1.5">
          <div className="flex gap-0.5 parchment rounded-lg p-1">
            <CtrlBtn active={viewMode === 'markers'} onClick={() => setViewMode('markers')} icon={<MapPin size={15} />} label="Markers" />
            <CtrlBtn active={viewMode === 'heatmap'} onClick={() => setViewMode('heatmap')} icon={<Flame size={15} />} label="Heatmap" />
          </div>
          <button
            onClick={geolocate}
            className="parchment rounded-lg p-2.5 text-secondary hover:text-gold transition-colors"
            title="Center on my location"
          >
            <Crosshair size={16} />
          </button>
        </div>

        {/* Search — bottom */}
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-[1000] sm:w-80">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search SSID or BSSID..."
              className="w-full pl-10 pr-4 py-2.5 parchment rounded-lg text-[13px] font-mono text-primary placeholder:text-muted focus:border-gold/40 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function CtrlBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-semibold transition-all ${
        active ? 'bg-gold/12 text-gold' : 'text-secondary hover:text-primary'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
