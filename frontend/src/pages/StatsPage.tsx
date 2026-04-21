import {
  useGlobalStats,
  useChannelStats,
  useManufacturerStats,
  useCountryStats,
  useTopSSIDs,
} from '@/api/hooks'
import { formatNumber } from '@/lib/format'
import {
  PageHeader,
  ParchmentCard,
  PanelTitle,
  BigStat,
} from '@/components/parchment/Primitives'
import {
  ParchmentPieChart,
  HorizontalBar,
} from '@/components/parchment/RpgBits'
import {
  PlumeWifi,
  PlumeBluetooth,
  PlumeRadio,
  PlumeUpload,
  PlumeShield,
} from '@/components/icons/PlumeIcons'

const ENC_ORDER = ['WPA3', 'WPA2', 'WPA', 'WEP', 'Open', 'Unknown']
const ENC_COLORS: Record<string, string> = {
  WPA3: '#3d5a2a',
  WPA2: '#4a6b5a',
  WPA: '#b8860b',
  WEP: '#8b1a1a',
  Open: '#6b4820',
  Unknown: '#8a6c3e',
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
        value: stats.by_encryption?.[enc] ?? 0,
        color: ENC_COLORS[enc],
      })).filter((d) => d.value > 0)
    : []

  const encTotal = encData.reduce((s, d) => s + d.value, 0) || 1

  const channelMax = channels?.reduce((m, c) => Math.max(m, c.count), 0) ?? 0
  const manufacturerMax = manufacturers?.[0]?.count ?? 1
  const ssidMax = topSSIDs?.[0]?.count ?? 1

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--page-pad-y) var(--page-pad-x)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <PageHeader
          title="The World"
          subtitle="an atlas of the wireless realm"
        />

        {stats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 14,
              marginBottom: 24,
            }}
          >
            <BigStat
              label="Networks"
              value={formatNumber(stats.total_wifi)}
              icon={<PlumeWifi size={28} />}
            />
            <BigStat
              label="Bluetooth"
              value={formatNumber(stats.total_bt)}
              icon={<PlumeBluetooth size={28} />}
            />
            <BigStat
              label="Towers"
              value={formatNumber(stats.total_cell)}
              icon={<PlumeRadio size={28} />}
            />
            <BigStat
              label="Chroniclers"
              value={formatNumber(stats.total_users)}
              icon={<PlumeShield size={28} />}
            />
            <BigStat
              label="Scrolls"
              value={formatNumber(stats.total_uploads)}
              icon={<PlumeUpload size={28} />}
            />
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {encData.length > 0 && (
            <ParchmentCard padding={20}>
              <PanelTitle>Encryption Sigils</PanelTitle>
              <div
                style={{
                  display: 'flex',
                  gap: 24,
                  marginTop: 16,
                  alignItems: 'center',
                }}
              >
                <ParchmentPieChart
                  data={encData}
                  size={180}
                  centerLabel="TOTAL"
                  centerValue={formatNumber(encTotal)}
                />
                <ul
                  style={{
                    flex: 1,
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {encData.map((d) => (
                    <li
                      key={d.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 12,
                      }}
                    >
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          background: d.color,
                          border: '1px solid var(--color-ink)',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ flex: 1, color: 'var(--color-ink)' }}>
                        {d.name}
                      </span>
                      <span
                        className="font-mono"
                        style={{ color: 'var(--color-sepia)' }}
                      >
                        {formatNumber(d.value)}
                      </span>
                      <span
                        className="font-mono"
                        style={{
                          color: 'var(--color-gold-tarnish)',
                          minWidth: 44,
                          textAlign: 'right',
                        }}
                      >
                        {((d.value / encTotal) * 100).toFixed(1)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </ParchmentCard>
          )}

          {channels && channels.length > 0 && (
            <ParchmentCard padding={20}>
              <PanelTitle>Channel Spread</PanelTitle>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 3,
                  height: 180,
                  marginTop: 16,
                  padding: '0 4px',
                }}
                role="img"
                aria-label="WiFi channel distribution"
              >
                {channels.slice(0, 20).map((c) => {
                  const is5 = c.channel >= 36
                  const h = Math.max(4, (c.count / (channelMax || 1)) * 160)
                  return (
                    <div
                      key={c.channel}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span
                        className="font-mono"
                        style={{ fontSize: 8, color: 'var(--color-sepia)' }}
                      >
                        {formatNumber(c.count)}
                      </span>
                      <div
                        style={{
                          width: '100%',
                          height: h,
                          background: is5 ? 'var(--color-gold-tarnish)' : 'var(--color-wax-red)',
                          border: '1px solid var(--color-ink)',
                        }}
                      />
                      <span
                        className="font-mono"
                        style={{ fontSize: 8, color: 'var(--color-ink)' }}
                      >
                        {c.channel}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 18,
                  marginTop: 8,
                  fontSize: 10,
                  color: 'var(--color-sepia)',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                <span>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      background: 'var(--color-wax-red)',
                      marginRight: 6,
                      verticalAlign: 'middle',
                    }}
                  />
                  2.4 GHz
                </span>
                <span>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      background: 'var(--color-gold-tarnish)',
                      marginRight: 6,
                      verticalAlign: 'middle',
                    }}
                  />
                  5 GHz
                </span>
              </div>
            </ParchmentCard>
          )}

          {manufacturers && manufacturers.length > 0 && (
            <ParchmentCard padding={20}>
              <PanelTitle>Top Manufacturers</PanelTitle>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  marginTop: 14,
                  maxHeight: 280,
                  overflowY: 'auto',
                }}
              >
                {manufacturers.slice(0, 12).map((m, i) => (
                  <HorizontalBar
                    key={`${m.manufacturer}-${i}`}
                    label={m.manufacturer || '<unknown>'}
                    value={m.count}
                    max={manufacturerMax}
                  />
                ))}
              </div>
            </ParchmentCard>
          )}

          {topSSIDs && topSSIDs.length > 0 && (
            <ParchmentCard padding={20}>
              <PanelTitle>Most Spoken SSIDs</PanelTitle>
              <ol
                style={{
                  listStyle: 'none',
                  margin: '14px 0 0',
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 280,
                  overflowY: 'auto',
                }}
              >
                {topSSIDs.slice(0, 14).map((s, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '24px 1fr auto',
                      gap: 10,
                      padding: '6px 0',
                      borderBottom:
                        i < topSSIDs.length - 1
                          ? '1px dotted rgba(26,20,16,0.2)'
                          : 'none',
                      fontSize: 12,
                    }}
                  >
                    <span
                      className="font-mono"
                      style={{
                        color: 'var(--color-gold-tarnish)',
                        fontWeight: 700,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      style={{
                        color: 'var(--color-ink)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.ssid || '<hidden>'}
                    </span>
                    <span
                      className="font-mono"
                      style={{ color: 'var(--color-sepia)' }}
                    >
                      {formatNumber(s.count)}
                    </span>
                  </li>
                ))}
              </ol>
            </ParchmentCard>
          )}

          {countries && countries.length > 0 && (
            <ParchmentCard padding={20} style={{ gridColumn: 'span 2' }}>
              <PanelTitle>Realms by MCC</PanelTitle>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px 20px',
                  marginTop: 14,
                  maxHeight: 260,
                  overflowY: 'auto',
                }}
              >
                {countries.slice(0, 24).map((c, i) => (
                  <div
                    key={`${c.mcc}-${i}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '4px 0',
                      borderBottom: '1px dotted rgba(26,20,16,0.15)',
                      fontSize: 12,
                    }}
                  >
                    <span
                      className="font-mono"
                      style={{ color: 'var(--color-sepia)', minWidth: 24 }}
                    >
                      {i + 1}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        color: 'var(--color-ink)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.country}
                    </span>
                    <span
                      className="font-mono"
                      style={{ fontSize: 10, color: 'var(--color-sepia-muted)' }}
                    >
                      ({c.mcc})
                    </span>
                    <span
                      className="font-mono"
                      style={{ color: 'var(--color-sepia)' }}
                    >
                      {formatNumber(c.count)}
                    </span>
                  </div>
                ))}
              </div>
            </ParchmentCard>
          )}

          {!topSSIDs?.length && !manufacturers?.length && (
            <ParchmentCard padding={24} style={{ gridColumn: 'span 2', textAlign: 'center' }}>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontStyle: 'italic',
                  color: 'var(--color-sepia)',
                }}
              >
                The scouts have not yet returned…
              </p>
            </ParchmentCard>
          )}

          {ssidMax === 1 && null}
        </div>
      </div>
    </div>
  )
}
