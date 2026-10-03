import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import { Typography, Tag } from 'antd';
import 'leaflet/dist/leaflet.css';
import { metroApi } from '../../api/metro';
import type { Station, Line, LineStation } from '../../types';

export default function MetroMap() {
  const [stations, setStations] = useState<Station[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [lineStations, setLineStations] = useState<LineStation[]>([]);
  const [lineMap, setLineMap] = useState<Record<number, Line[]>>({});

  useEffect(() => {
    metroApi.getStations().then(r => setStations(r.data));
    metroApi.getLines().then(async linesRes => {
      setLines(linesRes.data);
      const all: LineStation[] = [];
      const map: Record<number, Line[]> = {};
      await Promise.all(linesRes.data.map(async line => {
        const ls = await metroApi.getLineStations(line.id);
        all.push(...ls.data);
        ls.data.forEach(({ stationId }) => {
          if (!map[stationId]) map[stationId] = [];
          map[stationId].push(line);
        });
      }));
      setLineStations(all);
      setLineMap(map);
    });
  }, []);

  const stationMap = Object.fromEntries(stations.map(s => [s.id, s]));
  const linePolylines = lines.map(line => {
    const coords = lineStations
      .filter(ls => ls.lineId === line.id)
      .sort((a, b) => a.sequenceNo - b.sequenceNo)
      .map(ls => stationMap[ls.stationId])
      .filter(Boolean)
      .map(s => [s.latitude, s.longitude] as [number, number]);
    return { line, coords };
  });

  const interchangeCount = Object.values(lineMap).filter(l => l.length > 1).length;

  return (
    <div className="page-bg">
      {/* Header */}
      <div className="page-header">
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Typography.Title level={2} style={{ color: '#fff', margin: '0 0 4px', fontWeight: 800 }}>
            🗺️ Metro Network Map
          </Typography.Title>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>
            Live view of all Chennai Metro stations and routes
          </Typography.Text>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 12px 48px' }}>
        {/* Legend + stats — overlaps header */}
        <div className="glass-card fade-up" style={{ padding: '16px 20px', marginTop: -20, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {lines.map(l => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10, background: l.color + '12', border: `1.5px solid ${l.color}44` }}>
                <div style={{ width: 28, height: 4, borderRadius: 2, background: l.color }} />
                <Typography.Text strong style={{ color: l.color, fontSize: 13 }}>{l.name}</Typography.Text>
                <Tag style={{ margin: 0, fontSize: 10, borderRadius: 6 }}>{l.code}</Tag>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { value: stations.length, label: 'Stations', color: '#1565c0' },
              { value: lines.length, label: 'Lines', color: '#00897b' },
              { value: interchangeCount, label: 'Interchanges', color: '#6a1b9a' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="fade-up fade-up-1" style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 32px rgba(21,101,192,0.14)', border: '1px solid rgba(21,101,192,0.08)' }}>
          <div style={{ height: 'clamp(320px, 60vh, 72vh)', minHeight: 320 }}>
            <MapContainer center={[13.0827, 80.2707]} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {linePolylines.map(({ line, coords }) =>
                coords.length > 1 && (
                  <Polyline key={line.id} positions={coords}
                    pathOptions={{ color: line.color, weight: 5, opacity: 0.9 }} />
                )
              )}
              {stations.map(s => {
                const sl = lineMap[s.id] ?? [];
                const color = sl[0]?.color ?? '#1565c0';
                const isInterchange = sl.length > 1;
                return (
                  <CircleMarker key={s.id} center={[s.latitude, s.longitude]}
                    radius={isInterchange ? 11 : 7}
                    pathOptions={{ color: '#fff', weight: isInterchange ? 3 : 2, fillColor: color, fillOpacity: 1 }}>
                    <Popup>
                      <div style={{ minWidth: 170 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0d47a1', marginBottom: 2 }}>{s.name}</div>
                        <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>{s.code}</div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                          {sl.map(l => (
                            <span key={l.id} style={{ background: l.color + '18', border: `1px solid ${l.color}`, color: l.color, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{l.name}</span>
                          ))}
                        </div>
                        <div style={{ fontSize: 13, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {s.hasParking && <span title="Parking">🅿️</span>}
                          {s.hasLift && <span title="Lift">🛗</span>}
                          {s.hasEscalator && <span title="Escalator">🪜</span>}
                          {s.hasToilet && <span title="Toilet">🚻</span>}
                          {s.isAccessible && <span title="Accessible">♿</span>}
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Map tip */}
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Click any station marker to view details · Larger dots indicate interchange stations
          </Typography.Text>
        </div>
      </div>
    </div>
  );
}
