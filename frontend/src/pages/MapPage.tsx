import { useEffect, useRef, useCallback, useState } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
import { Sidebar } from '@/components/layout/Sidebar'
import { useMapStore } from '@/stores/mapStore'
import { useAuthStore } from '@/stores/authStore'
import { authFetch } from '@/api/client'
import { Flame, MapPin, Search } from 'lucide-react'

// Fix leaflet default icon
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
L.Icon.Default.mergeOptions({ iconUrl, shadowUrl })

const ENC_COLORS: Record<string, string> = {
  WPA3: '#44d97f', WPA2: '#3ea8f5', WPA: '#e8a23e', WEP: '#e8524a', Open: '#7a7486', Unknown: '#5a5466',
}

const BT_COLOR = '#7c6df0'
const CELL_COLOR = '#e8a23e'

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

  // Initialize map (once)
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

  const fetchWifiData = useCallback(async (map: L.Map, cluster: L.MarkerClusterGroup) => {
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
      const geojson = await res.json()

      cluster.clearLayers()
      if (heatRef.current) {
        mapRef.current?.removeLayer(heatRef.current)
        heatRef.current = null
      }

      const features = geojson.features?.filter((f: any) => {
        const enc = f.properties?.encryption ?? 'Unknown'
        return encryptionFilters[enc] !== false
      }) ?? []

      if (viewMode === 'heatmap') {
        const heatData = features.map((f: any) => [
          f.geometry.coordinates[1],
          f.geometry.coordinates[0],
          0.5,
        ])
        if (heatData.length > 0 && (L as any).heatLayer) {
          heatRef.current = (L as any).heatLayer(heatData, {
            radius: 18,
            blur: 25,
            maxZoom: 17,
            gradient: { 0.2: '#15141c', 0.4: '#3ea8f544', 0.6: '#3ea8f5', 0.8: '#44d97f', 1: '#e8b830' },
          }).addTo(map)
        }
      } else {
        features.forEach((f: any) => {
          const [lon, lat] = f.geometry.coordinates
          const p = f.properties
          const enc = p.encryption ?? 'Unknown'
          const color = ENC_COLORS[enc] ?? ENC_COLORS.Unknown

          const marker = L.circleMarker([lat, lon], {
            radius: 5,
            color,
            fillColor: color,
            fillOpacity: 0.75,
            weight: 1.5,
          })

          marker.bindPopup(`
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.8;">
              <div style="font-weight: 700; color: ${color}; margin-bottom: 4px; font-size: 13px;">${escapeHtml(p.ssid || '<hidden>')}</div>
              <span style="color: #9e96b0;">BSSID</span> ${escapeHtml(String(p.bssid))}<br/>
              <span style="color: #9e96b0;">Enc</span> <span style="color: ${color}; font-weight: 600;">${escapeHtml(enc)}</span><br/>
              ${p.channel ? `<span style="color: #9e96b0;">Ch</span> ${p.channel}<br/>` : ''}
              ${p.rssi ? `<span style="color: #9e96b0;">Sig</span> ${p.rssi} dBm<br/>` : ''}
              <span style="color: #9e96b0;">GPS</span> <a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank" rel="noopener" style="color: #c9a84c; text-decoration: none;">${lat.toFixed(5)}, ${lon.toFixed(5)}</a>
            </div>
          `)

          cluster.addLayer(marker)
        })
      }
    } catch (err) {
      console.error('Failed to load WiFi data:', err)
    }
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
        L.circleMarker([lat, lon], {
          radius: 4, color: BT_COLOR, fillColor: BT_COLOR, fillOpacity: 0.75, weight: 1,
        }).bindPopup(`
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px;">
            <div style="font-weight: 700; color: ${BT_COLOR};">${escapeHtml(f.properties.name || '<unknown>')}</div>
            <span style="color: #9e96b0;">MAC</span> ${escapeHtml(String(f.properties.mac))}<br/>
            <span style="color: #9e96b0;">Type</span> ${escapeHtml(String(f.properties.device_type))}
          </div>
        `).addTo(btLayerRef.current!)
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
        L.circleMarker([lat, lon], {
          radius: 6, color: CELL_COLOR, fillColor: CELL_COLOR, fillOpacity: 0.75, weight: 1,
        }).bindPopup(`
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px;">
            <div style="font-weight: 700; color: ${CELL_COLOR};">${f.properties.radio}</div>
            <span style="color: #9e96b0;">MCC/MNC</span> ${f.properties.mcc}/${f.properties.mnc}<br/>
            <span style="color: #9e96b0;">LAC/CID</span> ${f.properties.lac}/${f.properties.cid}
          </div>
        `).addTo(cellLayerRef.current!)
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
        const { latitude, longitude } = results[0]
        mapRef.current.setView([latitude, longitude], 16)
      }
    } catch {}
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <div className="flex-1 relative">
        <div ref={containerRef} className="absolute inset-0" />

        {/* Map view mode controls — top right */}
        <div className="absolute top-2.5 right-2.5 z-[1000]">
          <div className="flex gap-0.5 ornate-card rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('markers')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                viewMode === 'markers'
                  ? 'bg-gold/12 text-gold'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <MapPin size={12} />
              <span className="hidden sm:inline">Markers</span>
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                viewMode === 'heatmap'
                  ? 'bg-gold/12 text-gold'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <Flame size={12} />
              <span className="hidden sm:inline">Heatmap</span>
            </button>
          </div>
        </div>

        {/* Search — bottom right */}
        <div className="absolute bottom-3 right-3 left-3 sm:left-auto z-[1000] sm:w-72">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search SSID or BSSID..."
              className="w-full pl-8 pr-3 py-2 ornate-card rounded-lg text-[11px] font-mono text-primary placeholder:text-muted focus:border-gold/40 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
