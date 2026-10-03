import { useEffect, useState, useCallback, useRef } from 'react';
import { Typography, Tag, Spin, Empty } from 'antd';
import { ClockCircleOutlined, ArrowRightOutlined, WarningOutlined } from '@ant-design/icons';
import { metroApi } from '../../api/metro';
import type { NextDeparture } from '../../types';
import { toTitleCase } from '../../utils';

interface Props { stationId: number; stationName: string; }

export default function LiveDepartures({ stationId, stationName }: Props) {
  const [departures, setDepartures] = useState<NextDeparture[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  // live countdown offsets in seconds since last fetch
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const fetchedAt = useRef<Date | null>(null);

  const fetchDepartures = useCallback(async () => {
    try {
      const { data } = await metroApi.getStationLive(stationId, 6);
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
    const refreshInterval = setInterval(fetchDepartures, 30000);
    return () => clearInterval(refreshInterval);
  }, [fetchDepartures]);

  // 1-second tick to update countdown
  useEffect(() => {
    const tick = setInterval(() => setSecondsElapsed(s => s + 1), 1000);
    return () => clearInterval(tick);
  }, []);

  // adjust departure minutes by elapsed seconds
  const getLiveMinutes = (baseMinutes: number) => {
    const adjusted = baseMinutes - Math.floor(secondsElapsed / 60);
    return Math.max(0, adjusted);
  };

  const getLiveSeconds = (baseMinutes: number) => {
    const totalSeconds = baseMinutes * 60 - secondsElapsed;
    if (totalSeconds <= 0) return 0;
    return totalSeconds % 60;
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>;

  const isLastTrain = (d: NextDeparture, idx: number) =>
    idx === departures.length - 1 && departures.length < 3;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Typography.Text strong style={{ fontSize: 15 }}>
          <ClockCircleOutlined style={{ marginRight: 6, color: '#1565c0' }} />
          Next Trains from {toTitleCase(stationName)}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>Updated {lastUpdated}</Typography.Text>
      </div>

      {departures.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Empty description={null} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>No upcoming trains</Typography.Text>
          <div style={{ marginTop: 8, padding: '8px 14px', borderRadius: 8, background: '#fff7e6', border: '1px solid #ffd591', display: 'inline-block' }}>
            <Typography.Text style={{ fontSize: 12, color: '#d46b08' }}>
              <WarningOutlined style={{ marginRight: 4 }} />
              Service may have ended for today
            </Typography.Text>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {departures.map((d, i) => {
            const liveMin = getLiveMinutes(d.departureInMinutes);
            const liveSec = getLiveSeconds(d.departureInMinutes);
            const isDue = liveMin === 0;
            const isUrgent = liveMin <= 2;
            const isWarning = liveMin <= 5 && !isUrgent;
            const isLast = isLastTrain(d, i);

            return (
              <div key={i}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 10,
                  background: isDue ? '#fff1f0' : isUrgent ? '#fff1f0' : isWarning ? '#fffbe6' : '#f6ffed',
                  border: `1px solid ${isDue || isUrgent ? '#ffccc7' : isWarning ? '#ffe58f' : '#b7eb8f'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.lineColor, flexShrink: 0, boxShadow: `0 0 0 3px ${d.lineColor}33` }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Typography.Text strong style={{ fontSize: 13 }}>{toTitleCase(d.lineName)}</Typography.Text>
                        <ArrowRightOutlined style={{ color: '#aaa', fontSize: 10 }} />
                        <Typography.Text style={{ fontSize: 13 }}>{toTitleCase(d.towardsTerminal)}</Typography.Text>
                      </div>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        Platform {d.platformNumber} · {d.departureTime}
                      </Typography.Text>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Tag color={isDue || isUrgent ? 'red' : isWarning ? 'orange' : 'green'}
                      style={{ fontWeight: 700, fontSize: 13, minWidth: 56, textAlign: 'center', marginBottom: 2 }}>
                      {isDue ? 'Due' : `${liveMin} min`}
                    </Tag>
                    {!isDue && liveMin < 10 && (
                      <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
                        {String(liveSec).padStart(2, '0')}s
                      </div>
                    )}
                  </div>
                </div>
                {isLast && (
                  <div style={{ marginTop: 4, padding: '6px 12px', borderRadius: 8, background: '#fff7e6', border: '1px solid #ffd591', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <WarningOutlined style={{ color: '#d46b08', fontSize: 12 }} />
                    <Typography.Text style={{ fontSize: 11, color: '#d46b08' }}>This may be the last train today</Typography.Text>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
