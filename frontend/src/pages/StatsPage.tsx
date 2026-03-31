import { useGlobalStats, useChannelStats, useManufacturerStats, useCountryStats, useTopSSIDs } from '@/api/hooks'
import { formatNumber } from '@/lib/format'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Wifi, Bluetooth, Radio, Users, Upload, Shield, BarChart3, Globe, Cpu } from 'lucide-react'

const ENC_ORDER = ['WPA3', 'WPA2', 'WPA', 'WEP', 'Open', 'Unknown']
const ENC_COLORS: Record<string, string> = {
  WPA3: '#44d97f', WPA2: '#3ea8f5', WPA: '#e8a23e', WEP: '#e8524a', Open: '#7a7486', Unknown: '#5a5466',
}

const tooltipStyle = {
  contentStyle: {
    background: '#15141c',
    border: '1px solid #322f45',
    borderRadius: '8px',
    fontSize: '11px',
    fontFamily: 'JetBrains Mono',
    color: '#ece8e1',
  },
}

export function StatsPage() {
  const { data: stats } = useGlobalStats()
  const { data: channels } = useChannelStats()
  const { data: manufacturers } = useManufacturerStats()
  const { data: countries } = useCountryStats()
  const { data: topSSIDs } = useTopSSIDs()

  const encData = stats
    ? ENC_ORDER.map((enc) => ({
        name: enc,
        value: stats.by_encryption[enc] ?? 0,
        color: ENC_COLORS[enc],
      })).filter((d) => d.value > 0)
    : []

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gold mb-1">World Status</h1>
          <p className="text-xs text-secondary">Global intelligence from all wardrivers combined</p>
        </div>

        {/* Big stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-6">
            <BigStat icon={<Wifi size={18} />} value={stats.total_wifi} label="WiFi Networks" color="text-wifi" />
            <BigStat icon={<Bluetooth size={18} />} value={stats.total_bt} label="BT Devices" color="text-bt" />
            <BigStat icon={<Radio size={18} />} value={stats.total_cell} label="Cell Towers" color="text-cell" />
            <BigStat icon={<Users size={18} />} value={stats.total_users} label="Operators" color="text-epic" />
            <BigStat icon={<Upload size={18} />} value={stats.total_uploads} label="Uploads" color="text-xp" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {encData.length > 0 && (
            <Card title="Encryption Distribution" icon={<Shield size={14} />}>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={encData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {encData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(value: number) => formatNumber(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-1">
                {encData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1 text-[10px]">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-muted">{d.name}</span>
                    <span className="font-mono text-primary">{formatNumber(d.value)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {channels && channels.length > 0 && (
            <Card title="Channel Distribution" icon={<BarChart3 size={14} />}>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channels.slice(0, 20)}>
                    <XAxis dataKey="channel" tick={{ fill: '#9e96b0', fontSize: 9 }} />
                    <YAxis tick={{ fill: '#9e96b0', fontSize: 9 }} />
                    <Tooltip {...tooltipStyle} formatter={(value: number) => formatNumber(value)} />
                    <Bar dataKey="count" fill="#3ea8f5" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {manufacturers && manufacturers.length > 0 && (
            <Card title="Top Manufacturers" icon={<Cpu size={14} />}>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {manufacturers.slice(0, 15).map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-mono text-[9px] text-muted w-4 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="h-1 bg-void/60 rounded-full overflow-hidden">
                        <div className="h-full bg-wifi/30 rounded-full" style={{ width: `${(m.count / manufacturers[0].count) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] text-primary truncate max-w-[120px]">{m.manufacturer}</span>
                    <span className="font-mono text-[9px] text-muted flex-shrink-0">{formatNumber(m.count)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {topSSIDs && topSSIDs.length > 0 && (
            <Card title="Most Common SSIDs" icon={<Wifi size={14} />}>
              <div className="space-y-0.5 max-h-64 overflow-y-auto">
                {topSSIDs.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-[9px] text-muted w-4 text-right">{i + 1}</span>
                      <span className="font-mono text-[10px] text-primary truncate">{s.ssid || '<hidden>'}</span>
                    </div>
                    <span className="font-mono text-[9px] text-muted flex-shrink-0 ml-2">{formatNumber(s.count)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {countries && countries.length > 0 && (
            <Card title="Countries (MCC)" icon={<Globe size={14} />}>
              <div className="space-y-0.5 max-h-64 overflow-y-auto">
                {countries.slice(0, 15).map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[9px] text-muted w-4 text-right">{i + 1}</span>
                      <span className="text-[10px] text-primary">{c.country}</span>
                      <span className="font-mono text-[8px] text-muted">({c.mcc})</span>
                    </div>
                    <span className="font-mono text-[9px] text-muted">{formatNumber(c.count)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function BigStat({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div className="ornate-card rounded-xl p-3 sm:p-4 text-center">
      <div className={`${color} mb-1 flex justify-center opacity-70`}>{icon}</div>
      <div className={`font-mono font-bold text-lg sm:text-xl ${color}`}>{formatNumber(value)}</div>
      <div className="text-[9px] text-muted mt-0.5">{label}</div>
    </div>
  )
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="ornate-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-gold opacity-70">{icon}</span>
        <h3 className="text-xs font-display font-bold text-gold">{title}</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-gold/10 to-transparent" />
      </div>
      {children}
    </div>
  )
}
