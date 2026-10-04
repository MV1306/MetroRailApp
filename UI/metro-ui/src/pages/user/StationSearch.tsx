import { useEffect, useState } from 'react';
import { Input, Row, Col, Card, Tag, Typography, Badge, Empty, Drawer, Tabs, Spin } from 'antd';
import {
  SearchOutlined, CarOutlined, ArrowUpOutlined, RestOutlined,
  ManOutlined, EnvironmentOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { metroApi } from '../../api/metro';
import type { Line, Station, LineStation, StationDetail } from '../../types';
import LiveDepartures from '../../components/user/LiveDepartures';
import PlatformDepartures from '../../components/user/PlatformDepartures';
import { toTitleCase } from '../../utils';

const styleTag = document.createElement('style');
styleTag.textContent = `
  .station-card { transition: transform 0.2s, box-shadow 0.2s !important; }
  .station-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; }
  .station-card .ant-card-body { background: transparent !important; }
`;
document.head.appendChild(styleTag);

function toHex(color: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.fillStyle = color;
  return ctx.fillStyle;
}

function lineGradient(colors: string[]): string {
  if (colors.length === 0) return '#f8f9ff';
  const hexes = colors.map(toHex);
  if (hexes.length === 1) return hexes[0] + '40';
  const stops = hexes.map((c, i) => `${c}40 ${(i / (hexes.length - 1)) * 100}%`);
  return `linear-gradient(135deg, ${stops.join(', ')})`;
}

const FACILITIES = [
  { key: 'hasParking',   icon: <CarOutlined />,     label: 'Parking',    color: '#1677ff' },
  { key: 'hasLift',      icon: <ArrowUpOutlined />, label: 'Lift',       color: '#13c2c2' },
  { key: 'hasEscalator', icon: <ArrowUpOutlined />, label: 'Escalator',  color: '#722ed1' },
  { key: 'hasToilet',    icon: <RestOutlined />,    label: 'Toilet',     color: '#eb2f96' },
  { key: 'isAccessible', icon: <ManOutlined />,     label: 'Accessible', color: '#52c41a' },
];

export default function StationSearch() {
  const [stations, setStations] = useState<Station[]>([]);
  const [allStations, setAllStations] = useState<Station[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [lineMap, setLineMap] = useState<Record<number, Line[]>>({});
  const [lineStationMap, setLineStationMap] = useState<Record<number, LineStation[]>>({});
  const [selectedLine, setSelectedLine] = useState<number | 'all'>('all');
  const [facilityFilter, setFacilityFilter] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [stationDetail, setStationDetail] = useState<StationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    metroApi.getLines().then(async linesRes => {
      setLines(linesRes.data);
      const map: Record<number, Line[]> = {};
      const lsMap: Record<number, LineStation[]> = {};
      await Promise.all(linesRes.data.map(async line => {
        const ls = await metroApi.getLineStations(line.id);
        lsMap[line.id] = ls.data.sort((a, b) => a.sequenceNo - b.sequenceNo);
        ls.data.forEach(({ stationId }) => {
          if (!map[stationId]) map[stationId] = [];
          map[stationId].push(line);
        });
      }));
      setLineMap(map);
      setLineStationMap(lsMap);
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      metroApi.getStations(query || undefined).then(r => {
        setAllStations(r.data);
        setStations(r.data);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let filtered = allStations;
    if (selectedLine !== 'all') {
      const orderedIds = (lineStationMap[selectedLine] ?? []).map(ls => ls.stationId);
      const byId = Object.fromEntries(allStations.map(s => [s.id, s]));
      filtered = orderedIds.map(id => byId[id]).filter(Boolean) as Station[];
    }
    if (facilityFilter) {
      filtered = filtered.filter(s => s[facilityFilter as keyof Station]);
    }
    setStations(filtered);
  }, [selectedLine, facilityFilter, allStations, lineStationMap]);

  const openStation = async (s: Station) => {
    setSelectedStation(s);
    setStationDetail(null);
    setDetailLoading(true);
    try {
      const { data } = await metroApi.getStationDetail(s.id);
      setStationDetail(data);
    } catch { /* ignore */ }
    finally { setDetailLoading(false); }
  };

  const totalLines = lines.length;
  const activeLine = selectedLine !== 'all' ? lines.find(l => l.id === selectedLine) : null;
  const lineRoute = activeLine ? lineStationMap[activeLine.id] ?? [] : [];

  return (
    <div className="page-bg">
      <div className="page-header">
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Typography.Title level={2} style={{ color: '#fff', margin: '0 0 4px', fontWeight: 800 }}>📍 Station Directory</Typography.Title>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>Browse and search all Chennai Metro stations</Typography.Text>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 12px 48px' }}>
        {/* Stats bar */}
        <div className="glass-card fade-up" style={{ padding: '16px 24px', marginTop: -20, marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          {[
            { label: 'Showing', value: stations.length, color: '#1565c0' },
            { label: 'Lines', value: totalLines, color: '#00897b' },
            { label: 'With Parking', value: allStations.filter(s => s.hasParking).length, color: '#f57c00' },
            { label: 'Accessible', value: allStations.filter(s => s.isAccessible).length, color: '#6a1b9a' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', flex: 1, minWidth: 80 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Line filter */}
        <div style={{ marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
          <div style={{ display: 'flex', gap: 8, minWidth: 'max-content' }}>
            <button onClick={() => setSelectedLine('all')} style={{ padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.2s', background: selectedLine === 'all' ? '#1565c0' : '#fff', color: selectedLine === 'all' ? '#fff' : '#555', boxShadow: selectedLine === 'all' ? '0 2px 10px rgba(21,101,192,0.4)' : '0 1px 4px rgba(0,0,0,0.1)' }}>
              All Lines
            </button>
            {lines.map(l => {
              const active = selectedLine === l.id;
              return (
                <button key={l.id} onClick={() => setSelectedLine(l.id)} style={{ padding: '8px 18px', borderRadius: 20, border: `2px solid ${l.color}`, cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.2s', background: active ? l.color : '#fff', color: active ? '#fff' : l.color, boxShadow: active ? `0 2px 10px ${l.color}66` : '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: active ? '#fff' : l.color }} />
                  {toTitleCase(l.name)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Facility filter chips */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Typography.Text type="secondary" style={{ fontSize: 12, alignSelf: 'center' }}>Filter:</Typography.Text>
          {FACILITIES.map(f => {
            const active = facilityFilter === f.key;
            return (
              <button key={f.key} onClick={() => setFacilityFilter(active ? null : f.key)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 16, border: `1.5px solid ${active ? f.color : '#e2e8f0'}`, background: active ? f.color + '18' : '#fff', color: active ? f.color : '#64748b', fontWeight: active ? 700 : 500, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
                {f.icon} {f.label}
              </button>
            );
          })}
          {facilityFilter && (
            <button onClick={() => setFacilityFilter(null)} style={{ padding: '5px 12px', borderRadius: 16, border: '1.5px solid #e2e8f0', background: '#fff', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
              Clear ✕
            </button>
          )}
        </div>

        {/* Line route strip */}
        {activeLine && lineRoute.length > 0 && (
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: activeLine.color + '12', border: `1.5px solid ${activeLine.color}44`, overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 'max-content' }}>
              {lineRoute.map((ls, i) => (
                <div key={ls.stationId} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: i === 0 || i === lineRoute.length - 1 ? 14 : 10, height: i === 0 || i === lineRoute.length - 1 ? 14 : 10, borderRadius: '50%', background: activeLine.color, border: '2px solid #fff', boxShadow: `0 0 0 2px ${activeLine.color}`, flexShrink: 0 }} />
                    <Typography.Text style={{ fontSize: i === 0 || i === lineRoute.length - 1 ? 11 : 10, fontWeight: i === 0 || i === lineRoute.length - 1 ? 700 : 400, color: i === 0 || i === lineRoute.length - 1 ? activeLine.color : '#555', maxWidth: 72, textAlign: 'center', lineHeight: 1.2, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {toTitleCase(ls.stationName)}
                    </Typography.Text>
                  </div>
                  {i < lineRoute.length - 1 && <div style={{ width: 28, height: 3, background: activeLine.color, opacity: 0.5, flexShrink: 0, marginBottom: 18 }} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <Input prefix={<SearchOutlined style={{ color: '#1565c0' }} />} placeholder="Search by station name or code..." value={query} onChange={e => setQuery(e.target.value)} allowClear size="large" style={{ marginBottom: 16, borderRadius: 10, background: '#fff', boxShadow: '0 2px 8px rgba(21,101,192,0.06)' }} />

        {query && <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>{stations.length} result{stations.length !== 1 ? 's' : ''} for "{query}"</Typography.Text>}
        {stations.length === 0 && <Empty description="No stations found" style={{ marginTop: 48 }} />}

        {/* Station Cards */}
        <Row gutter={[16, 16]}>
          {stations.map(s => {
            const stationLines = lineMap[s.id] ?? [];
            const colors = stationLines.map(l => l.color);
            const isInterchange = stationLines.length > 1;
            const activeFacilities = FACILITIES.filter(f => s[f.key as keyof Station]);
            return (
              <Col xs={24} sm={12} md={8} key={s.id}>
                <Badge.Ribbon text={isInterchange ? 'Interchange' : toTitleCase(stationLines[0]?.name ?? '')} color={isInterchange ? '#722ed1' : (colors[0] ?? '#1677ff')}>
                  <Card className="station-card" onClick={() => openStation(s)}
                    style={{ borderRadius: 14, cursor: 'pointer', background: lineGradient(colors), border: `2px solid ${colors[0] ? toHex(colors[0]) + '99' : '#e8e8e8'}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}
                    styles={{ body: { padding: 16, background: lineGradient(colors), borderRadius: '0 0 14px 14px' } }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ flex: 1, paddingRight: 8 }}>
                        <Typography.Text strong style={{ fontSize: 14, lineHeight: 1.3, display: 'block' }}>{toTitleCase(s.name)}</Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}><EnvironmentOutlined style={{ marginRight: 3 }} />{s.code}</Typography.Text>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                        {stationLines.map(l => <span key={l.id} style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: l.color, boxShadow: `0 0 0 2px ${l.color}44` }} />)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                      {stationLines.map(l => <Tag key={l.id} style={{ background: l.color + '22', border: `1px solid ${l.color}`, color: l.color, fontWeight: 600, fontSize: 11, borderRadius: 6 }}>{toTitleCase(l.name)}</Tag>)}
                    </div>
                    <div style={{ height: 1, background: colors[0] ? colors[0] + '33' : '#f0f0f0', marginBottom: 10 }} />
                    {activeFacilities.length > 0 ? (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {activeFacilities.map(f => (
                          <span key={f.key} title={f.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: f.color + '18', border: `1px solid ${f.color}44`, color: f.color, borderRadius: 6, padding: '2px 7px', fontSize: 11 }}>
                            {f.icon} {f.label}
                          </span>
                        ))}
                      </div>
                    ) : <Typography.Text type="secondary" style={{ fontSize: 11 }}>No facilities listed</Typography.Text>}
                  </Card>
                </Badge.Ribbon>
              </Col>
            );
          })}
        </Row>
      </div>

      {/* Station Detail Drawer */}
      <Drawer
        title={<span style={{ fontWeight: 700, color: '#0d47a1' }}>{toTitleCase(selectedStation?.name ?? '')}</span>}
        placement="right" width={420}
        open={!!selectedStation}
        onClose={() => { setSelectedStation(null); setStationDetail(null); }}>
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : selectedStation && (
          <Tabs items={[
            {
              key: 'live',
              label: <span><ClockCircleOutlined /> All Trains</span>,
              children: <LiveDepartures stationId={selectedStation.id} stationName={selectedStation.name} />,
            },
            {
              key: 'platform',
              label: <span>🚉 By Platform</span>,
              children: <PlatformDepartures stationId={selectedStation.id} stationName={selectedStation.name} />,
            },
            {
              key: 'gates',
              label: `Gates (${stationDetail?.gates.length ?? 0})`,
              children: stationDetail?.gates.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stationDetail.gates.map((g, i) => (
                    <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: '#f8faff', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Tag color="blue" style={{ fontWeight: 700 }}>{g.gateNumber}</Tag>
                        {g.description && <Typography.Text style={{ fontSize: 13 }}>{g.description}</Typography.Text>}
                      </div>
                      {g.accessibles.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {g.accessibles.map((a, j) => <Tag key={j} color="geekblue" style={{ fontSize: 11 }}>{a}</Tag>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : <Empty description="No gates listed" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
            },
            {
              key: 'feeders',
              label: `Feeders (${stationDetail?.feederServices.length ?? 0})`,
              children: stationDetail?.feederServices.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stationDetail.feederServices.map((f, i) => (
                    <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: '#f8faff', border: '1px solid #e2e8f0' }}>
                      <Tag color="cyan" style={{ marginBottom: 4 }}>{f.type}</Tag>
                      <Typography.Text style={{ fontSize: 13, display: 'block' }}>{f.description}</Typography.Text>
                    </div>
                  ))}
                </div>
              ) : <Empty description="No feeder services" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
            },
          ]} />
        )}
      </Drawer>
    </div>
  );
}
