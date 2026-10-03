import { useEffect, useRef, useState } from 'react';
import { Select, Button, Typography, Row, Col, Tag } from 'antd';
import {
  ArrowRightOutlined, SwapOutlined, EnvironmentOutlined,
  ClockCircleOutlined, DollarOutlined, CompassOutlined,
  ThunderboltOutlined, SafetyOutlined, TeamOutlined, HistoryOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { metroApi } from '../../api/metro';
import type { Station, Line } from '../../types';
import { toTitleCase, getRecentSearches, type RecentSearch } from '../../utils';

const FEATURES = [
  {
    icon: <ThunderboltOutlined style={{ fontSize: 28, color: '#1565c0' }} />,
    title: 'Journey Planner',
    desc: 'Find the fastest route between any two stations with real-time fare calculation.',
    link: '/journey',
    color: '#1565c0',
  },
  {
    icon: <EnvironmentOutlined style={{ fontSize: 28, color: '#00897b' }} />,
    title: 'Station Directory',
    desc: 'Browse all stations, facilities, gates and feeder services across every line.',
    link: '/stations',
    color: '#00897b',
  },
  {
    icon: <DollarOutlined style={{ fontSize: 28, color: '#f57c00' }} />,
    title: 'Fare Calculator',
    desc: 'Instantly calculate the fare for any journey based on distance.',
    link: '/fare',
    color: '#f57c00',
  },
  {
    icon: <CompassOutlined style={{ fontSize: 28, color: '#6a1b9a' }} />,
    title: 'Metro Map',
    desc: 'Explore the full Chennai Metro network map with all lines and interchanges.',
    link: '/map',
    color: '#6a1b9a',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [stations, setStations] = useState<Station[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [from, setFrom] = useState<number | undefined>();
  const [to, setTo] = useState<number | undefined>();
  const [animatedStats, setAnimatedStats] = useState({ stations: 0, lines: 0, km: 0 });
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const statsRef = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    metroApi.getStations().then(r => setStations(r.data));
    metroApi.getLines().then(r => setLines(r.data));
    setRecentSearches(getRecentSearches());
  }, []);

  // animate stats when scrolled into view
  useEffect(() => {
    if (!stations.length || !lines.length) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animatedRef.current) {
        animatedRef.current = true;
        const target = { stations: stations.length, lines: lines.length, km: Math.round(stations.length * 1.2) };
        const duration = 1200;
        const steps = 40;
        let step = 0;
        const interval = setInterval(() => {
          step++;
          const progress = step / steps;
          setAnimatedStats({
            stations: Math.round(target.stations * progress),
            lines: Math.round(target.lines * progress),
            km: Math.round(target.km * progress),
          });
          if (step >= steps) { clearInterval(interval); setAnimatedStats(target); }
        }, duration / steps);
      }
    }, { threshold: 0.3 });
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [stations, lines]);

  const stationOptions = stations.map(s => ({ value: s.id, label: toTitleCase(s.name) }));

  const handlePlan = () => {
    if (from && to) navigate(`/journey?from=${from}&to=${to}`);
    else navigate('/journey');
  };

  return (
    <div style={{ background: '#f0f4ff', minHeight: '100vh' }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 40%, #1976d2 70%, #0288d1 100%)',
        padding: 'clamp(32px, 6vw, 72px) 16px clamp(40px, 7vw, 80px)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative circles */}
        {[
          { size: 320, top: -80, right: -60, opacity: 0.06 },
          { size: 200, top: 40, right: 180, opacity: 0.05 },
          { size: 150, bottom: -40, left: 80, opacity: 0.07 },
          { size: 80, top: 20, left: '40%', opacity: 0.08 },
        ].map((c, i) => (
          <div key={i} style={{
            position: 'absolute', width: c.size, height: c.size, borderRadius: '50%',
            background: '#fff', opacity: c.opacity, pointerEvents: 'none',
            top: c.top, bottom: (c as any).bottom, left: c.left, right: c.right,
          }} />
        ))}

        <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* badge */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Tag style={{
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff', borderRadius: 20, padding: '4px 16px', fontSize: 12, letterSpacing: 1,
            }}>
              🚇 CHENNAI METRO RAIL
            </Tag>
          </div>

          <Typography.Title level={1} style={{
            color: '#fff', textAlign: 'center', margin: '0 0 12px',
            fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, lineHeight: 1.2,
          }}>
            Your City. Your Metro.
          </Typography.Title>
          <Typography.Text style={{
            color: 'rgba(255,255,255,0.8)', display: 'block',
            textAlign: 'center', fontSize: 16, marginBottom: 40,
          }}>
            Plan journeys, explore stations and navigate Chennai Metro with ease.
          </Typography.Text>

          {/* Quick Journey Planner */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 'clamp(16px, 4vw, 28px)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <Typography.Text strong style={{ fontSize: 13, color: '#888', letterSpacing: 1, textTransform: 'uppercase' }}>
              Plan your journey
            </Typography.Text>
            <Row gutter={[12, 12]} style={{ marginTop: 12 }} align="middle">
              <Col xs={24} sm={10}>
                <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>From</div>
                <Select
                  showSearch optionFilterProp="label"
                  placeholder="Departure station"
                  style={{ width: '100%' }} size="large"
                  options={stationOptions}
                  value={from} onChange={setFrom}
                />
              </Col>
              <Col xs={24} sm={4} style={{ textAlign: 'center' }}>
                <button
                  onClick={() => { const t = from; setFrom(to); setTo(t); }}
                  style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1565c0, #0288d1)',
                    border: 'none', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(21,101,192,0.35)',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'rotate(180deg)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'rotate(0deg)')}
                >
                  <SwapOutlined style={{ color: '#fff', fontSize: 16 }} />
                </button>
              </Col>
              <Col xs={24} sm={10}>
                <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>To</div>
                <Select
                  showSearch optionFilterProp="label"
                  placeholder="Destination station"
                  style={{ width: '100%' }} size="large"
                  options={stationOptions}
                  value={to} onChange={setTo}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="primary" size="large" icon={<ArrowRightOutlined />}
                onClick={handlePlan}
                style={{
                  borderRadius: 10, height: 46, paddingInline: 32, fontSize: 15,
                  background: 'linear-gradient(135deg, #1565c0, #0288d1)',
                  border: 'none', boxShadow: '0 4px 14px rgba(21,101,192,0.4)',
                }}
              >
                Find Route
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Line Pills ───────────────────────────────────────────────── */}
      {lines.length > 0 && (
        <div style={{ background: '#fff', padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography.Text type="secondary" style={{ fontSize: 12, marginRight: 4 }}>Lines:</Typography.Text>
            {lines.map(l => (
              <button key={l.id} onClick={() => navigate('/stations')} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 14px', borderRadius: 20,
                background: l.color + '18', border: `1.5px solid ${l.color}`,
                color: l.color, fontWeight: 600, fontSize: 12, cursor: 'pointer',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
                {toTitleCase(l.name)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(24px, 4vw, 48px) 16px' }}>

        {/* ── Recent Searches ──────────────────────────────────────────── */}
        {recentSearches.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <HistoryOutlined style={{ color: '#94a3b8' }} />
              <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Recent Searches</Typography.Text>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {recentSearches.map((r, i) => (
                <button key={i} onClick={() => navigate(`/journey?from=${r.fromId}&to=${r.toId}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#334155', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1565c0'; e.currentTarget.style.color = '#1565c0'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(21,101,192,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}>
                  <EnvironmentOutlined style={{ fontSize: 11, color: '#94a3b8' }} />
                  {toTitleCase(r.fromName)} → {toTitleCase(r.toName)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Network Stats ────────────────────────────────────────────── */}
        <div ref={statsRef} style={{
          background: 'linear-gradient(135deg, #1565c0, #0288d1)',
          borderRadius: 20, padding: '36px 32px', marginBottom: 48,
          boxShadow: '0 8px 32px rgba(21,101,192,0.25)',
        }}>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
            Network at a glance
          </Typography.Text>
          <Row gutter={[24, 24]} style={{ marginTop: 16 }}>
            {[
              { icon: <EnvironmentOutlined />, value: animatedStats.stations, label: 'Stations', suffix: '' },
              { icon: <TeamOutlined />, value: animatedStats.lines, label: 'Lines', suffix: '' },
              { icon: <SafetyOutlined />, value: animatedStats.km, label: 'Est. Network km', suffix: '+' },
              { icon: <ClockCircleOutlined />, value: 5, label: 'Min Frequency', suffix: ' min' },
            ].map((s, i) => (
              <Col xs={12} sm={6} key={i}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ color: '#fff', fontSize: 32, fontWeight: 800, lineHeight: 1 }}>
                    {s.value}{s.suffix}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 4 }}>{s.label}</div>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* ── Feature Cards ────────────────────────────────────────────── */}
        <Typography.Title level={3} style={{ color: '#1a237e', marginBottom: 24, textAlign: 'center' }}>
          Everything you need
        </Typography.Title>
        <Row gutter={[16, 16]} style={{ marginBottom: 48 }}>
          {FEATURES.map((f, i) => (
            <Col xs={24} sm={12} key={i}>
              <div
                onClick={() => navigate(f.link)}
                style={{
                  background: '#fff', borderRadius: 16, padding: '24px 24px 20px',
                  cursor: 'pointer', border: `1.5px solid ${f.color}22`,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s', height: '100%',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 32px ${f.color}22`;
                  (e.currentTarget as HTMLDivElement).style.borderColor = f.color + '66';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = f.color + '22';
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: f.color + '12', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                }}>
                  {f.icon}
                </div>
                <Typography.Text strong style={{ fontSize: 16, color: '#1a237e', display: 'block', marginBottom: 6 }}>
                  {f.title}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 13, lineHeight: 1.5 }}>
                  {f.desc}
                </Typography.Text>
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 4, color: f.color, fontSize: 13, fontWeight: 600 }}>
                  Explore <ArrowRightOutlined style={{ fontSize: 11 }} />
                </div>
              </div>
            </Col>
          ))}
        </Row>

        {/* ── Quick Tips ───────────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <Typography.Text strong style={{ fontSize: 15, color: '#1a237e' }}>💡 Quick Tips</Typography.Text>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Trains run every 5–7 minutes during peak hours (8–11 AM, 5–8 PM).',
              'Use the Journey Planner to find the fastest route and exact fare before you travel.',
              'Interchange stations let you switch between lines — check the Metro Map for transfer points.',
              'All stations are accessible — lifts and escalators are available at every station.',
            ].map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', background: '#e8f0fe',
                  color: '#1565c0', fontSize: 11, fontWeight: 700, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
                }}>
                  {i + 1}
                </div>
                <Typography.Text style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{tip}</Typography.Text>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
