import { useEffect, useState } from 'react';
import { Select, Button, Tag, Typography, Alert, Spin, Row, Col, Switch, Tooltip, message } from 'antd';
import {
  ClockCircleOutlined, EnvironmentOutlined, DollarOutlined,
  SwapOutlined, ArrowRightOutlined, SwapRightOutlined, FieldTimeOutlined,
  DownOutlined, UpOutlined, ShareAltOutlined, HistoryOutlined, CloseOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { metroApi } from '../../api/metro';
import type { Station, RouteOption, NextDeparture, RecentSearch } from '../../types';
import { toTitleCase, saveRecentSearch, getRecentSearches } from '../../utils';
import { useAuth } from '../../context/AuthContext';

const LABEL_CONFIG: Record<string, { color: string; icon: string }> = {
  'Fastest':           { color: '#1565c0', icon: '⚡' },
  'Shortest Distance': { color: '#00897b', icon: '📍' },
  'Available Route':   { color: '#6a1b9a', icon: '🗺️' },
};

export default function JourneyPlanner() {
  const [stations, setStations] = useState<Station[]>([]);
  const [from, setFrom] = useState<number>(0);
  const [to, setTo] = useState<number>(0);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [departures, setDepartures] = useState<NextDeparture[]>([]);
  const [avoidInterchange, setAvoidInterchange] = useState(false);
  const [expandedRoutes, setExpandedRoutes] = useState<Record<number, boolean>>({});
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [searchParams] = useSearchParams();
  const [messageApi, contextHolder] = message.useMessage();
  const { user } = useAuth();

  const loadRecent = async () => {
    if (user) {
      try {
        const { data } = await metroApi.getRecentSearches();
        setRecentSearches(data.map(r => ({ fromId: r.fromStationId, fromName: r.fromStationName, toId: r.toStationId, toName: r.toStationName, searchedAt: r.searchedAt })));
      } catch { setRecentSearches(getRecentSearches()); }
    } else {
      setRecentSearches(getRecentSearches());
    }
  };

  const persistRecent = (f: number, t: number, fromStation: Station, toStation: Station) => {
    if (user) {
      metroApi.saveRecentSearch(f, t).catch(() => {});
      // optimistically update local state
      setRecentSearches(prev => {
        const filtered = prev.filter(r => !(r.fromId === f && r.toId === t));
        return [{ fromId: f, fromName: fromStation.name, toId: t, toName: toStation.name }, ...filtered].slice(0, 5);
      });
    } else {
      saveRecentSearch({ fromId: f, toId: t, fromName: fromStation.name, toName: toStation.name });
      setRecentSearches(getRecentSearches());
    }
  };

  const findRoutes = async (f = from, t = to) => {
    if (!f || !t) return;
    setLoading(true); setError(''); setSearched(true); setDepartures([]);
    try {
      const { data } = await metroApi.findRoutes(f, t);
      const filtered = avoidInterchange ? data.filter(r => r.interchanges === 0) : data;
      setRoutes(filtered);
      // expand all routes by default
      const expanded: Record<number, boolean> = {};
      filtered.forEach((_, i) => { expanded[i] = false; }); // collapsed by default
      setExpandedRoutes(expanded);
      if (!filtered.length) {
        setError(avoidInterchange
          ? 'No direct route found. Try disabling "Avoid Interchange".'
          : 'No route found between selected stations.');
        return;
      }
      // save to recent
      const fromStation = stations.find(s => s.id === f);
      const toStation = stations.find(s => s.id === t);
      if (fromStation && toStation) persistRecent(f, t, fromStation, toStation);
      try {
        const live = await metroApi.getStationLive(f, 9, t);
        setDepartures(live.data.nextDepartures);
      } catch { /* optional */ }
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data ?? (err as any)?.message ?? 'Failed to find routes.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally { setLoading(false); }
  };

  useEffect(() => {
    metroApi.getStations().then(r => {
      setStations(r.data);
      loadRecent();
      const fromParam = Number(searchParams.get('from'));
      const toParam   = Number(searchParams.get('to'));
      if (fromParam) setFrom(fromParam);
      if (toParam)   setTo(toParam);
      if (fromParam && toParam) findRoutes(fromParam, toParam);
    });
  }, []);

  const fromName = toTitleCase(stations.find(s => s.id === from)?.name ?? '');
  const toName   = toTitleCase(stations.find(s => s.id === to)?.name ?? '');
  const opts     = stations.map(s => ({ value: s.id, label: toTitleCase(s.name) }));

  const toggleExpand = (i: number) =>
    setExpandedRoutes(prev => ({ ...prev, [i]: !prev[i] }));

  const shareRoute = () => {
    const url = `${window.location.origin}/journey?from=${from}&to=${to}`;
    navigator.clipboard.writeText(url).then(() => messageApi.success('Link copied!'));
  };

  // compute estimated arrival for a route given a departure
  const getArrival = (depTime: string, totalMinutes: number) => {
    const [h, m] = depTime.split(':').map(Number);
    const d = new Date(); d.setHours(h, m + totalMinutes, 0);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="page-bg">
      {contextHolder}
      <div className="page-header">
        <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Typography.Title level={2} style={{ color: '#fff', margin: '0 0 4px', fontWeight: 800 }}>
            ⚡ Journey Planner
          </Typography.Title>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>
            Find the fastest route across Chennai Metro
          </Typography.Text>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 12px 48px' }}>
        {/* Search card */}
        <div className="glass-card fade-up" style={{ padding: 'clamp(16px, 4vw, 28px)', marginTop: -20, marginBottom: 20 }}>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} sm={10}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>From</div>
              <Select showSearch optionFilterProp="label" placeholder="Departure station"
                style={{ width: '100%' }} size="large" options={opts}
                onChange={setFrom} value={from || undefined} />
            </Col>
            <Col xs={24} sm={4} style={{ textAlign: 'center', paddingTop: 20 }}>
              <button onClick={() => { const t = from; setFrom(to); setTo(t); }}
                style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #1565c0, #0288d1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(21,101,192,0.35)', transition: 'transform 0.3s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'rotate(180deg)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'rotate(0deg)')}>
                <SwapOutlined style={{ color: '#fff', fontSize: 16 }} />
              </button>
            </Col>
            <Col xs={24} sm={10}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>To</div>
              <Select showSearch optionFilterProp="label" placeholder="Destination station"
                style={{ width: '100%' }} size="large" options={opts}
                onChange={setTo} value={to || undefined} />
            </Col>
          </Row>

          {/* Options row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Switch size="small" checked={avoidInterchange} onChange={setAvoidInterchange} />
              <Typography.Text style={{ fontSize: 13, color: '#64748b' }}>Direct routes only</Typography.Text>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {searched && (
                <Button icon={<CloseOutlined />} size="middle" onClick={() => { setFrom(0); setTo(0); setRoutes([]); setDepartures([]); setSearched(false); setError(''); }} style={{ borderRadius: 8 }}>Clear</Button>
              )}
              {searched && from && to && (
                <Tooltip title="Copy shareable link">
                  <Button icon={<ShareAltOutlined />} size="middle" onClick={shareRoute} style={{ borderRadius: 8 }} />
                </Tooltip>
              )}
              <Button type="primary" size="large" onClick={() => findRoutes()}
                disabled={!from || !to} loading={loading} icon={<ArrowRightOutlined />}
                style={{ height: 46, paddingInline: 28, borderRadius: 10, fontWeight: 700, fontSize: 15, background: 'linear-gradient(135deg, #1565c0, #0288d1)', border: 'none', boxShadow: '0 4px 14px rgba(21,101,192,0.35)' }}>
                Find Route
              </Button>
            </div>
          </div>
        </div>

        {/* Recent searches */}
        {!searched && recentSearches.length > 0 && (
          <div className="fade-up" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <HistoryOutlined style={{ color: '#94a3b8' }} />
              <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Recent</Typography.Text>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {recentSearches.map((r, i) => (
                <button key={i} onClick={() => { setFrom(r.fromId); setTo(r.toId); findRoutes(r.fromId, r.toId); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#334155', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1565c0'; e.currentTarget.style.color = '#1565c0'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}>
                  <EnvironmentOutlined style={{ fontSize: 11 }} />
                  {toTitleCase(r.fromName)} → {toTitleCase(r.toName)}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: 56 }}>
            <Spin size="large" />
            <div style={{ marginTop: 14, color: '#64748b', fontSize: 14 }}>Finding best routes…</div>
          </div>
        )}

        {error && <Alert type="warning" message={error} showIcon style={{ borderRadius: 10, marginBottom: 16 }} />}

        {/* Journey header */}
        {!loading && searched && routes.length > 0 && (
          <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '12px 16px', background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(21,101,192,0.06)' }}>
            <EnvironmentOutlined style={{ color: '#1565c0', fontSize: 16 }} />
            <Typography.Text strong style={{ fontSize: 14, color: '#0d47a1' }}>{fromName}</Typography.Text>
            <SwapRightOutlined style={{ color: '#94a3b8' }} />
            <EnvironmentOutlined style={{ color: '#e53935', fontSize: 16 }} />
            <Typography.Text strong style={{ fontSize: 14, color: '#0d47a1' }}>{toName}</Typography.Text>
            <Tag color="blue" style={{ marginLeft: 'auto', borderRadius: 8 }}>{routes.length} route{routes.length > 1 ? 's' : ''}</Tag>
          </div>
        )}

        {/* Route cards */}
        {!loading && routes.map((route, i) => {
          const cfg = LABEL_CONFIG[route.label] ?? { color: '#1565c0', icon: '🗺️' };
          const isExpanded = expandedRoutes[i] ?? false;

          // count stops per line segment
          const lineSegments: { name: string; color: string; count: number }[] = [];
          route.steps.forEach((step, j) => {
            const prev = route.steps[j - 1];
            if (j === 0 || prev.lineName !== step.lineName) {
              lineSegments.push({ name: step.lineName, color: step.lineColor, count: 1 });
            } else {
              lineSegments[lineSegments.length - 1].count++;
            }
          });

          // next trains for this route
          const firstLineName = route.steps[0]?.lineName;
          const lineDeparts = departures.filter(d => d.lineName === firstLineName);
          const correctDir = lineDeparts[0]?.direction;
          const nextTrains = lineDeparts.filter(d => d.direction === correctDir).slice(0, 3);

          return (
            <div key={i} className="fade-up" style={{ animationDelay: `${i * 0.08}s`, marginBottom: 20, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(21,101,192,0.08)', border: `1.5px solid ${cfg.color}22` }}>
              {/* Card header */}
              <div style={{ background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{cfg.icon}</span>
                  <Typography.Text strong style={{ color: '#fff', fontSize: 15 }}>{route.label}</Typography.Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {route.interchanges > 0 && (
                    <Tag icon={<SwapOutlined />} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 8 }}>
                      {route.interchanges} interchange{route.interchanges > 1 ? 's' : ''}
                    </Tag>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
                {[
                  { icon: <ClockCircleOutlined />, value: `${route.totalTimeMinutes} min`, label: 'Travel Time', color: cfg.color },
                  { icon: <EnvironmentOutlined />, value: `${route.totalDistanceKm} km`, label: 'Distance', color: '#475569' },
                  { icon: <DollarOutlined />, value: `₹${route.fare}`, label: 'Fare', color: '#00897b' },
                ].map((s, j) => (
                  <div key={j} style={{ flex: 1, padding: '14px 16px', borderRight: j < 2 ? '1px solid #f1f5f9' : 'none', textAlign: 'center' }}>
                    <div style={{ color: s.color, fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      {s.icon} {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Line segment summary */}
              <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {lineSegments.map((seg, k) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {k > 0 && <SwapRightOutlined style={{ color: '#f59e0b', fontSize: 12 }} />}
                    <span style={{ background: seg.color + '18', border: `1px solid ${seg.color}44`, color: seg.color, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                      {toTitleCase(seg.name)}
                    </span>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>{seg.count} stop{seg.count > 1 ? 's' : ''}</Typography.Text>
                  </div>
                ))}
                <button onClick={() => toggleExpand(i)}
                  style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: cfg.color, fontSize: 12, fontWeight: 600, padding: '2px 6px' }}>
                  {isExpanded ? <><UpOutlined style={{ fontSize: 10 }} /> Hide stops</> : <><DownOutlined style={{ fontSize: 10 }} /> Show all stops</>}
                </button>
              </div>

              {/* Steps — collapsible */}
              {isExpanded && (
                <div style={{ padding: '16px 20px 12px' }}>
                  {route.steps.map((step, j) => {
                    const isFirst = j === 0, isLast = j === route.steps.length - 1;
                    const prevStep = route.steps[j - 1];
                    const isInterchangePoint = j > 0 && prevStep.lineName !== step.lineName;

                    return (
                      <div key={j}>
                        {isInterchangePoint && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 4px 26px', padding: '8px 14px', borderRadius: 10, background: 'linear-gradient(135deg, #fff8e1, #fff3cd)', border: '1.5px dashed #f59e0b' }}>
                            <SwapOutlined style={{ color: '#f59e0b', fontSize: 14, flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>Transfer at {toTitleCase(prevStep.stationName)}</div>
                              <div style={{ fontSize: 11, color: '#b45309', marginTop: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ background: prevStep.lineColor + '22', border: `1px solid ${prevStep.lineColor}`, color: prevStep.lineColor, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>{toTitleCase(prevStep.lineName)}</span>
                                <span>→</span>
                                <span style={{ background: step.lineColor + '22', border: `1px solid ${step.lineColor}`, color: step.lineColor, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>{toTitleCase(step.lineName)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="route-step">
                          <div className="route-spine">
                            <div className="route-dot" style={{ width: isFirst || isLast || isInterchangePoint ? 14 : 10, height: isFirst || isLast || isInterchangePoint ? 14 : 10, background: step.lineColor, border: `2px solid ${isFirst || isLast || isInterchangePoint ? step.lineColor : '#fff'}`, boxShadow: `0 0 0 2px ${step.lineColor}44` }} />
                            {!isLast && <div className="route-line" style={{ background: step.lineColor }} />}
                          </div>
                          <div style={{ paddingBottom: isLast ? 0 : 12, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <Typography.Text strong={isFirst || isLast || isInterchangePoint} style={{ fontSize: isFirst || isLast || isInterchangePoint ? 14 : 13, color: isFirst || isLast || isInterchangePoint ? '#0d47a1' : '#334155' }}>
                                {toTitleCase(step.stationName)}
                              </Typography.Text>
                              <span style={{ background: step.lineColor + '18', border: `1px solid ${step.lineColor}44`, color: step.lineColor, borderRadius: 6, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>
                                {toTitleCase(step.lineName)}
                              </span>
                            </div>
                            {step.distanceFromPrevKm != null && (
                              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                {step.distanceFromPrevKm} km · {step.timeFromPrevMinutes} min
                              </Typography.Text>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer: summary + estimated arrival */}
              <div style={{ padding: '10px 20px', background: '#f8faff', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {route.steps.length} stations · {route.totalTimeMinutes} min total
                </Typography.Text>
                {nextTrains[0] && (
                  <Typography.Text style={{ fontSize: 12, color: '#00897b', fontWeight: 600 }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    Arrive ~{getArrival(nextTrains[0].departureTime, route.totalTimeMinutes)}
                  </Typography.Text>
                )}
              </div>

              {/* Next trains */}
              {nextTrains.length > 0 && (
                <div style={{ padding: '12px 20px 16px', borderTop: '1px solid #f1f5f9', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <FieldTimeOutlined style={{ color: cfg.color, fontSize: 13 }} />
                    <Typography.Text style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                      Next trains from {toTitleCase(route.steps[0]?.stationName)}
                    </Typography.Text>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {nextTrains.map((d, k) => (
                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 10, flex: '1 1 auto', background: d.departureInMinutes <= 2 ? '#fff1f0' : d.departureInMinutes <= 5 ? '#fffbe6' : '#f0fdf4', border: `1px solid ${d.departureInMinutes <= 2 ? '#ffccc7' : d.departureInMinutes <= 5 ? '#ffe58f' : '#bbf7d0'}` }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>
                            {d.departureInMinutes === 0 ? 'Due' : `${d.departureInMinutes} min`}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                            {d.departureTime} · Plt {d.platformNumber} · Arrive {getArrival(d.departureTime, route.totalTimeMinutes)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
