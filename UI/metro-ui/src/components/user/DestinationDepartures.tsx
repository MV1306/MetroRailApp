import { useEffect, useState, useCallback, useRef } from 'react';
import { Typography, Spin, Empty, Select } from 'antd';
import { WarningOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { metroApi } from '../../api/metro';
import type { NextDeparture, Line, LineStation } from '../../types';
import { toTitleCase } from '../../utils';

interface Props { stationId: number; lines: Line[]; }

export default function DestinationDepartures({ stationId, lines }: Props) {
  const [terminals, setTerminals] = useState<{ label: string; stationId: number; lineColor: string }[]>([]);
  const [selectedTerminalId, setSelectedTerminalId] = useState<number | null>(null);
  const [departures, setDepartures] = useState<NextDeparture[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const fetchedAt = useRef<Date | null>(null);

  // Build terminal list from lines passing through this station
  useEffect(() => {
    const load = async () => {
      const results: { label: string; stationId: number; lineColor: string }[] = [];
      await Promise.all(lines.map(async line => {
        try {
          const { data } = await metroApi.getLineStations(line.id);
          const sorted = (data as LineStation[]).sort((a, b) => a.sequenceNo - b.sequenceNo);
          if (sorted.length === 0) return;
          const first = sorted[0];
          const last = sorted[sorted.length - 1];
          // add both terminals if not already added
          for (const t of [first, last]) {
            if (t.stationId !== stationId && !results.find(r => r.stationId === t.stationId)) {
              results.push({ label: toTitleCase(t.stationName), stationId: t.stationId, lineColor: line.color });
            }
          }
        } catch { /* ignore */ }
      }));
      setTerminals(results);
    };
    if (lines.length > 0) load();
  }, [stationId, lines]);

  const fetchDepartures = useCallback(async (terminalId: number) => {
    setLoading(true);
    try {
      const { data } = await metroApi.getStationLive(stationId, 6, terminalId);
      setDepartures(data.nextDepartures);
      setLastUpdated(new Date().toLocaleTimeString());
      fetchedAt.current = new Date();
      setSecondsElapsed(0);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [stationId]);

  useEffect(() => {
    if (!selectedTerminalId) return;
    fetchDepartures(selectedTerminalId);
    const interval = setInterval(() => fetchDepartures(selectedTerminalId), 30000);
    return () => clearInterval(interval);
  }, [selectedTerminalId, fetchDepartures]);

  useEffect(() => {
    const tick = setInterval(() => setSecondsElapsed(s => s + 1), 1000);
    return () => clearInterval(tick);
  }, []);

  const getLiveMinutes = (base: number) => Math.max(0, base - Math.floor(secondsElapsed / 60));
  const getLiveSeconds = (base: number) => {
    const total = base * 60 - secondsElapsed;
    return total <= 0 ? 0 : total % 60;
  };

  return (
    <div>
      {/* Terminal selector */}
      <div style={{ marginBottom: 16 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
          Select destination terminal
        </Typography.Text>
        <Select
          placeholder="Choose a terminal..."
          style={{ width: '100%' }}
          value={selectedTerminalId}
          onChange={val => { setSelectedTerminalId(val); setDepartures([]); setSecondsElapsed(0); }}
          options={terminals.map(t => ({
            value: t.stationId,
            label: (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.lineColor, flexShrink: 0, display: 'inline-block' }} />
                {t.label}
              </div>
            ),
          }))}
        />
      </div>

      {!selectedTerminalId ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Pick a terminal above to see upcoming trains
          </Typography.Text>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
      ) : departures.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Empty description={null} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>No upcoming trains</Typography.Text>
          <div style={{ marginTop: 8, padding: '8px 14px', borderRadius: 8, background: '#fff7e6', border: '1px solid #ffd591', display: 'inline-block' }}>
            <Typography.Text style={{ fontSize: 12, color: '#d46b08' }}>
              <WarningOutlined style={{ marginRight: 4 }} />Service may have ended for today
            </Typography.Text>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowRightOutlined style={{ color: '#1565c0' }} />
              <Typography.Text strong style={{ fontSize: 13 }}>
                Towards {terminals.find(t => t.stationId === selectedTerminalId)?.label}
              </Typography.Text>
            </div>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>Updated {lastUpdated}</Typography.Text>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {departures.map((d, i) => {
              const liveMin = getLiveMinutes(d.departureInMinutes);
              const liveSec = getLiveSeconds(d.departureInMinutes);
              const isDue = liveMin === 0;
              const isUrgent = liveMin <= 2;
              const isWarning = liveMin <= 5 && !isUrgent;
              const timeBg = isDue || isUrgent ? '#ff4d4f' : isWarning ? '#fa8c16' : '#52c41a';

              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 10,
                  background: '#f8faff', border: `1px solid ${d.lineColor}33`,
                  borderLeft: `4px solid ${d.lineColor}`,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Typography.Text strong style={{ fontSize: 13, display: 'block' }}>
                      PF {d.platformNumber}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>{d.departureTime}</Typography.Text>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ background: timeBg, color: '#fff', borderRadius: 8, padding: '4px 10px', fontWeight: 700, fontSize: 13, minWidth: 52, textAlign: 'center' }}>
                      {isDue ? 'Due' : `${liveMin} min`}
                    </div>
                    {!isDue && liveMin < 10 && (
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, textAlign: 'center' }}>
                        {String(liveSec).padStart(2, '0')}s
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
