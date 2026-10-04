import { useEffect, useState } from 'react';
import { Typography, Tag, Spin, Empty, Tabs } from 'antd';
import {
  ClockCircleOutlined, ThunderboltOutlined, FieldTimeOutlined,
} from '@ant-design/icons';
import { metroApi } from '../../api/metro';
import type { Line, LineTimetable } from '../../types';
import { toTitleCase } from '../../utils';

const DAY_LABELS: Record<string, string> = {
  Weekday: '📅 Weekday',
  Saturday: '📅 Saturday',
  Sunday: '🌅 Sunday',
  Holiday: '🎉 Holiday',
};

function TimetableCard({ tt }: { tt: LineTimetable }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(21,101,192,0.07)', border: '1.5px solid #e2e8f0', marginBottom: 14 }}>
      <div style={{ background: `linear-gradient(135deg, ${tt.lineColor}, ${tt.lineColor}cc)`, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Typography.Text strong style={{ color: '#fff', fontSize: 14 }}>
            {DAY_LABELS[tt.dayType] ?? tt.dayType}
          </Typography.Text>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 }}>
            {tt.direction === 'Both' ? '↔ Both Directions' : `→ ${tt.direction}`}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
            {tt.firstDeparture} – {tt.lastDeparture}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>First – Last train</div>
        </div>
      </div>

      <div style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThunderboltOutlined style={{ color: '#e53935', fontSize: 14 }} />
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Peak Frequency</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#e53935' }}>Every {tt.peakFrequencyMinutes} min</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClockCircleOutlined style={{ color: '#1565c0', fontSize: 14 }} />
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Off-Peak Frequency</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1565c0' }}>Every {tt.offPeakFrequencyMinutes} min</div>
            </div>
          </div>
        </div>

        {tt.peakWindows.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              <FieldTimeOutlined style={{ marginRight: 4 }} />Peak Windows
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {tt.peakWindows.map((w, i) => (
                <Tag key={i} color="red" style={{ borderRadius: 6, fontWeight: 600, fontSize: 12 }}>
                  {w.start} – {w.end}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TimetablePage() {
  const [lines, setLines] = useState<Line[]>([]);
  const [timetables, setTimetables] = useState<LineTimetable[]>([]);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([metroApi.getLines(), metroApi.getTimetable()])
      .then(([linesRes, ttRes]) => {
        setLines(linesRes.data);
        setTimetables(ttRes.data);
        if (linesRes.data.length > 0) setSelectedLine(linesRes.data[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = selectedLine
    ? timetables.filter(tt => tt.lineId === selectedLine)
    : timetables;

  const byDayType = filtered.reduce<Record<string, LineTimetable[]>>((acc, tt) => {
    if (!acc[tt.dayType]) acc[tt.dayType] = [];
    acc[tt.dayType].push(tt);
    return acc;
  }, {});

  const dayOrder = ['Weekday', 'Saturday', 'Sunday', 'Holiday'];
  const sortedDays = Object.keys(byDayType).sort((a, b) => {
    const ai = dayOrder.indexOf(a), bi = dayOrder.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const activeLine = lines.find(l => l.id === selectedLine);

  return (
    <div className="page-bg">
      <div className="page-header">
        <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Typography.Title level={2} style={{ color: '#fff', margin: '0 0 4px', fontWeight: 800 }}>
            🕐 Timetable
          </Typography.Title>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>
            Train schedules and frequencies for all lines
          </Typography.Text>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 12px 48px' }}>
        {/* Line selector */}
        <div className="glass-card fade-up" style={{ padding: 'clamp(14px,4vw,22px)', marginTop: -20, marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Select Line</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {lines.map(l => {
              const active = selectedLine === l.id;
              return (
                <button key={l.id} onClick={() => setSelectedLine(l.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 20, border: `2px solid ${l.color}`, cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.2s', background: active ? l.color : '#fff', color: active ? '#fff' : l.color, boxShadow: active ? `0 2px 10px ${l.color}66` : 'none' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: active ? '#fff' : l.color, flexShrink: 0 }} />
                  {toTitleCase(l.name)}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 56 }}><Spin size="large" /></div>
        ) : filtered.length === 0 ? (
          <Empty description="No timetable data available for this line" style={{ padding: 48 }} />
        ) : (
          <>
            {activeLine && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 16px', background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(21,101,192,0.06)' }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: activeLine.color }} />
                <Typography.Text strong style={{ color: '#0d47a1', fontSize: 14 }}>{toTitleCase(activeLine.name)}</Typography.Text>
                <Tag style={{ marginLeft: 'auto', borderRadius: 6 }}>{filtered.length} schedule{filtered.length !== 1 ? 's' : ''}</Tag>
              </div>
            )}

            <Tabs
              items={sortedDays.map(day => ({
                key: day,
                label: DAY_LABELS[day] ?? day,
                children: (
                  <div>
                    {byDayType[day].map(tt => <TimetableCard key={tt.id} tt={tt} />)}
                  </div>
                ),
              }))}
            />
          </>
        )}
      </div>
    </div>
  );
}
