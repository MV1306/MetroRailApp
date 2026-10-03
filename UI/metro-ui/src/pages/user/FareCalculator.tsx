import { useEffect, useState } from 'react';
import { Select, Button, Typography, Alert } from 'antd';
import {
  SwapOutlined, ArrowRightOutlined, EnvironmentOutlined,
  RiseOutlined, DollarOutlined,
} from '@ant-design/icons';
import { metroApi } from '../../api/metro';
import type { Station } from '../../types';

export default function FareCalculator() {
  const [stations, setStations] = useState<Station[]>([]);
  const [from, setFrom] = useState<number>(0);
  const [to, setTo] = useState<number>(0);
  const [result, setResult] = useState<{ distanceKm: number; fare: number } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { metroApi.getStations().then(r => setStations(r.data)); }, []);

  const calculate = async () => {
    if (!from || !to) return;
    setLoading(true);
    try {
      const { data } = await metroApi.getFare(from, to);
      setResult(data); setError('');
    } catch { setError('Could not calculate fare.'); }
    finally { setLoading(false); }
  };

  const opts = stations.map(s => ({ value: s.id, label: s.name }));
  const fromName = stations.find(s => s.id === from)?.name ?? '';
  const toName   = stations.find(s => s.id === to)?.name ?? '';

  return (
    <div className="page-bg">
      {/* Header */}
      <div className="page-header">
        <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Typography.Title level={2} style={{ color: '#fff', margin: '0 0 4px', fontWeight: 800 }}>
            💰 Fare Calculator
          </Typography.Title>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>
            Calculate your metro journey fare instantly
          </Typography.Text>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 12px 48px' }}>
        {/* Input card */}
        <div className="glass-card fade-up" style={{ padding: 'clamp(16px, 4vw, 28px)', marginTop: -20, marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>From</div>
          <Select showSearch optionFilterProp="label" placeholder="Select departure station"
            style={{ width: '100%', marginBottom: 16 }} size="large"
            options={opts} onChange={setFrom} value={from || undefined} />

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <button
              onClick={() => { const t = from; setFrom(to); setTo(t); setResult(null); }}
              style={{
                width: 40, height: 40, borderRadius: '50%', border: '2px solid #e2e8f0',
                background: '#f8faff', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#1565c0'; e.currentTarget.style.background = '#e8f0fe'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8faff'; }}
            >
              <SwapOutlined style={{ color: '#1565c0', transform: 'rotate(90deg)', fontSize: 15 }} />
            </button>
          </div>

          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>To</div>
          <Select showSearch optionFilterProp="label" placeholder="Select destination station"
            style={{ width: '100%', marginBottom: 24 }} size="large"
            options={opts} onChange={setTo} value={to || undefined} />

          <Button type="primary" block size="large" onClick={calculate}
            disabled={!from || !to} loading={loading} icon={<ArrowRightOutlined />}
            style={{ height: 48, borderRadius: 10, fontWeight: 700, fontSize: 15, background: 'linear-gradient(135deg, #1565c0, #0288d1)', border: 'none', boxShadow: '0 4px 14px rgba(21,101,192,0.3)' }}>
            Calculate Fare
          </Button>

          {error && <Alert type="error" message={error} style={{ marginTop: 16, borderRadius: 10 }} showIcon />}
        </div>

        {/* Result */}
        {result && (
          <div className="fade-up" style={{
            borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(21,101,192,0.22)',
          }}>
            {/* Journey label */}
            <div style={{ background: 'linear-gradient(135deg, #0d47a1, #1565c0)', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <EnvironmentOutlined style={{ color: 'rgba(255,255,255,0.7)' }} />
              <Typography.Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, flex: 1 }} ellipsis>{fromName}</Typography.Text>
              <ArrowRightOutlined style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
              <Typography.Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, flex: 1, textAlign: 'right' }} ellipsis>{toName}</Typography.Text>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', background: 'linear-gradient(135deg, #1565c0, #0288d1)' }}>
              <div style={{ flex: 1, padding: '28px 24px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <RiseOutlined /> Distance
                </div>
                <div style={{ color: '#fff', fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{result.distanceKm}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>kilometres</div>
              </div>
              <div style={{ flex: 1, padding: '28px 24px', textAlign: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <DollarOutlined /> Fare
                </div>
                <div style={{ color: '#69f0ae', fontSize: 36, fontWeight: 800, lineHeight: 1 }}>₹{result.fare}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>one way</div>
              </div>
            </div>

            <div style={{ background: 'rgba(13,71,161,0.95)', padding: '12px 24px', textAlign: 'center' }}>
              <Typography.Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
                Fare is calculated based on shortest path distance
              </Typography.Text>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
