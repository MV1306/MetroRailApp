import { useEffect, useState, useCallback, useRef } from 'react';
import { Typography, Spin, Empty } from 'antd';
import { ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { metroApi } from '../../api/metro';
import type { NextDeparture } from '../../types';
import { toTitleCase } from '../../utils';

interface Props { stationId: number; stationName: string; }

export default function LiveDepartures({ stationId, stationName }: Props) {
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

  const sorted = [...departures].sort((a, b) => a.departureInMinutes - b.departureInMinutes);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Text strong style={{ fontSize: 14 }}>
          <ClockCircleOutlined style={{ marginRight: 6, color: '#1565c0' }} />
          {toTitleCase(stationName)}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>Updated {lastUpdated}</Typography.Text>
      </div>

      {sorted.length === 0 ? (
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map((d, i) => {
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  <div style={{ minWidth: 0 }}>
                    <Typography.Text strong style={{ fontSize: 13, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {toTitleCase(d.towardsTerminal)}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      PF {d.platformNumber} · {d.departureTime}
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
      )}
    </div>
  );
}
