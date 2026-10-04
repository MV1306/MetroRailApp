import { useEffect, useState, useCallback, useRef } from 'react';
import { Typography, Spin, Empty } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { metroApi } from '../../api/metro';
import type { NextDeparture } from '../../types';
import { toTitleCase } from '../../utils';

interface Props { stationId: number; stationName: string; }

export default function PlatformDepartures({ stationId, stationName }: Props) {
  const [departures, setDepartures] = useState<NextDeparture[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const fetchedAt = useRef<Date | null>(null);

  const fetchDepartures = useCallback(async () => {
    try {
      const { data } = await metroApi.getStationLive(stationId, 10);
      setDepartures(data.nextDepartures);
      setLastUpdated(new Date().toLocaleTimeString());
      fetchedAt.current = new Date();
      setSecondsElapsed(0);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [stationId]);

  useEffect(() => {
    setLoading(true);
    fetchDepartures();
    const interval = setInterval(fetchDepartures, 30000);
    return () => clearInterval(interval);
  }, [fetchDepartures]);

  useEffect(() => {
    const tick = setInterval(() => setSecondsElapsed(s => s + 1), 1000);
    return () => clearInterval(tick);
  }, []);

  const getLiveMinutes = (base: number) => Math.max(0, base - Math.floor(secondsElapsed / 60));
  const getLiveSeconds = (base: number) => {
    const total = base * 60 - secondsElapsed;
    return total <= 0 ? 0 : total % 60;
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>;

  const byPlatform = departures.reduce<Record<string, NextDeparture[]>>((acc, d) => {
    const pf = d.platformNumber || '—';
    if (!acc[pf]) acc[pf] = [];
    acc[pf].push(d);
    return acc;
  }, {});

  const platforms = Object.keys(byPlatform).sort();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Text strong style={{ fontSize: 14 }}>
          {toTitleCase(stationName)}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>Updated {lastUpdated}</Typography.Text>
      </div>

      {departures.length === 0 ? (
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {platforms.map(pf => {
            const trains = byPlatform[pf];
            const lineColor = trains[0]?.lineColor ?? '#1565c0';
            return (
              <div key={pf} style={{ borderRadius: 12, overflow: 'hidden', border: `1.5px solid ${lineColor}44`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                {/* Platform header */}
                <div style={{ background: lineColor, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 6, padding: '2px 10px' }}>
                    <Typography.Text strong style={{ color: '#fff', fontSize: 13, letterSpacing: 0.5 }}>
                      PF {pf}
                    </Typography.Text>
                  </div>
                  <Typography.Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                    {toTitleCase(trains[0]?.lineName ?? '')}
                  </Typography.Text>
                </div>

                {/* Train rows */}
                <div style={{ background: '#fff' }}>
                  {trains.map((d, i) => {
                    const liveMin = getLiveMinutes(d.departureInMinutes);
                    const liveSec = getLiveSeconds(d.departureInMinutes);
                    const isDue = liveMin === 0;
                    const isUrgent = liveMin <= 2;
                    const isWarning = liveMin <= 5 && !isUrgent;
                    const timeBg = isDue || isUrgent ? '#ff4d4f' : isWarning ? '#fa8c16' : '#52c41a';

                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderTop: i > 0 ? `1px solid ${lineColor}22` : undefined,
                        background: i % 2 === 0 ? '#fff' : `${lineColor}06`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: lineColor, flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <Typography.Text strong style={{ fontSize: 13, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {toTitleCase(d.towardsTerminal)}
                            </Typography.Text>
                            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                              {d.departureTime}
                            </Typography.Text>
                          </div>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
