import { useEffect, useState } from 'react';
import { Select, Button, Typography, Alert, Tag, Tabs, Empty, Spin, message } from 'antd';
import {
  ArrowRightOutlined, SwapOutlined, QrcodeOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import { metroApi } from '../../api/metro';
import type { Station, Ticket } from '../../types';
import { toTitleCase } from '../../utils';

const STATUS_CONFIG = {
  Active:  { color: 'success', icon: <ClockCircleOutlined /> },
  Used:    { color: 'default', icon: <CheckCircleOutlined /> },
  Expired: { color: 'error',   icon: <CloseCircleOutlined /> },
} as const;

function TicketCard({ ticket }: { ticket: Ticket }) {
  const cfg = STATUS_CONFIG[ticket.status];
  const validUntil = new Date(ticket.validUntil);
  const purchased  = new Date(ticket.purchasedAt);
  const minutesLeft = Math.max(0, Math.round((validUntil.getTime() - Date.now()) / 60000));
  const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };

  return (
    <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(21,101,192,0.08)', border: '1.5px solid #e2e8f0', marginBottom: 16 }}>
      <div style={{ background: 'linear-gradient(135deg, #0d47a1, #1565c0)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <QrcodeOutlined style={{ color: '#fff', fontSize: 18 }} />
          <Typography.Text strong style={{ color: '#fff', fontSize: 15, letterSpacing: 1 }}>
            {ticket.ticketRef}
          </Typography.Text>
        </div>
        <Tag color={cfg.color} icon={cfg.icon} style={{ borderRadius: 8, fontWeight: 600 }}>
          {ticket.status}
        </Tag>
      </div>

      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Typography.Text strong style={{ fontSize: 14, color: '#0d47a1' }}>
            {toTitleCase(ticket.fromStationName)}
          </Typography.Text>
          <ArrowRightOutlined style={{ color: '#94a3b8' }} />
          <Typography.Text strong style={{ fontSize: 14, color: '#0d47a1' }}>
            {toTitleCase(ticket.toStationName)}
          </Typography.Text>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Fare</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#00897b' }}>₹{ticket.totalFare}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Per Person</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>₹{ticket.fare}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Passengers</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#334155' }}>{ticket.passengers}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Purchased</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
              {purchased.toLocaleTimeString('en-IN', timeOpts)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Expires at</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: ticket.status === 'Active' && minutesLeft <= 15 ? '#e53935' : '#475569' }}>
              {validUntil.toLocaleTimeString('en-IN', timeOpts)}
              {ticket.status === 'Active' && (
                <span style={{ marginLeft: 6, fontSize: 11, color: minutesLeft <= 15 ? '#e53935' : '#64748b' }}>
                  ({minutesLeft} min left)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TicketBooking() {
  const [stations, setStations]   = useState<Station[]>([]);
  const [from, setFrom]           = useState<number>(0);
  const [to, setTo]               = useState<number>(0);
  const [passengers, setPassengers] = useState<number>(1);
  const [farePreview, setFarePreview] = useState<number | null>(null);
  const [tickets, setTickets]     = useState<Ticket[]>([]);
  const [loading, setLoading]     = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError]         = useState('');
  const [, setTick]               = useState(0); // forces countdown re-render
  const [messageApi, ctx]         = message.useMessage();

  const loadTickets = async () => {
    setListLoading(true);
    try { setTickets((await metroApi.getMyTickets()).data); }
    catch { /* ignore */ }
    finally { setListLoading(false); }
  };

  const silentRefresh = async () => {
    try { setTickets((await metroApi.getMyTickets()).data); }
    catch { /* ignore */ }
  };

  useEffect(() => {
    metroApi.getStations().then(r => setStations(r.data));
    loadTickets();
  }, []);

  // Poll every 30s only while there are active tickets
  useEffect(() => {
    const hasActive = tickets.some(t => t.status === 'Active');
    if (!hasActive) return;
    const id = setInterval(silentRefresh, 30_000);
    return () => clearInterval(id);
  }, [tickets]);

  // Tick countdown every 60s so "X min left" updates without a network call
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!from || !to || from === to) { setFarePreview(null); return; }
    metroApi.getFare(from, to).then(r => setFarePreview(r.data.fare)).catch(() => setFarePreview(null));
  }, [from, to]);

  const book = async () => {
    if (!from || !to) return;
    setLoading(true); setError('');
    try {
      await metroApi.bookTicket(from, to, passengers);
      messageApi.success('Ticket booked successfully!');
      setFrom(0); setTo(0); setPassengers(1); setFarePreview(null);
      await loadTickets();
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.error ?? 'Failed to book ticket.');
    } finally { setLoading(false); }
  };

  const opts = stations.map(s => ({ value: s.id, label: toTitleCase(s.name) }));
  const active  = tickets.filter(t => t.status === 'Active');
  const history = tickets.filter(t => t.status !== 'Active');

  return (
    <div className="page-bg">
      {ctx}
      <div className="page-header">
        <div style={{ maxWidth: 620, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Typography.Title level={2} style={{ color: '#fff', margin: '0 0 4px', fontWeight: 800 }}>
            🎫 Tickets
          </Typography.Title>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>
            Book and manage your metro tickets
          </Typography.Text>
        </div>
      </div>

      <div style={{ maxWidth: 620, margin: '0 auto', padding: '0 12px 48px' }}>
        {/* Book card */}
        <div className="glass-card fade-up" style={{ padding: 'clamp(16px,4vw,28px)', marginTop: -20, marginBottom: 24 }}>
          <Typography.Text strong style={{ fontSize: 13, color: '#475569', display: 'block', marginBottom: 14 }}>
            Book a New Ticket
          </Typography.Text>

          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>From</div>
          <Select showSearch optionFilterProp="label" placeholder="Departure station"
            style={{ width: '100%', marginBottom: 12 }} size="large"
            options={opts} onChange={setFrom} value={from || undefined} />

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <button
              onClick={() => { const t = from; setFrom(to); setTo(t); }}
              style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid #e2e8f0', background: '#f8faff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#1565c0'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <SwapOutlined style={{ color: '#1565c0', transform: 'rotate(90deg)' }} />
            </button>
          </div>

          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>To</div>
          <Select showSearch optionFilterProp="label" placeholder="Destination station"
            style={{ width: '100%', marginBottom: 20 }} size="large"
            options={opts} onChange={setTo} value={to || undefined} />

          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Passengers</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[1,2,3,4,5,6].map(n => (
              <button key={n} onClick={() => setPassengers(n)}
                style={{ flex: 1, height: 40, borderRadius: 8, border: `2px solid ${passengers === n ? '#1565c0' : '#e2e8f0'}`, background: passengers === n ? '#e8f0fe' : '#f8faff', color: passengers === n ? '#1565c0' : '#64748b', fontWeight: passengers === n ? 700 : 500, fontSize: 15, cursor: 'pointer', transition: 'all 0.15s' }}>
                {n}
              </button>
            ))}
          </div>

          {farePreview !== null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: 16 }}>
              <Typography.Text style={{ fontSize: 13, color: '#475569' }}>
                ₹{farePreview} × {passengers} passenger{passengers > 1 ? 's' : ''}
              </Typography.Text>
              <Typography.Text strong style={{ fontSize: 16, color: '#00897b' }}>
                Total: ₹{(farePreview * passengers).toFixed(2)}
              </Typography.Text>
            </div>
          )}

          {error && <Alert type="error" message={error} showIcon style={{ borderRadius: 10, marginBottom: 16 }} />}

          <Button type="primary" block size="large" onClick={book}
            disabled={!from || !to || from === to} loading={loading}
            icon={<QrcodeOutlined />}
            style={{ height: 48, borderRadius: 10, fontWeight: 700, fontSize: 15, background: 'linear-gradient(135deg, #1565c0, #0288d1)', border: 'none', boxShadow: '0 4px 14px rgba(21,101,192,0.3)' }}>
            Book Ticket
          </Button>
        </div>

        {/* Tickets list */}
        {listLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
        ) : (
          <Tabs
            defaultActiveKey="active"
            items={[
              {
                key: 'active',
                label: `Active (${active.length})`,
                children: active.length === 0
                  ? <Empty description="No active tickets" style={{ padding: 32 }} />
                  : active.map(t => <TicketCard key={t.id} ticket={t} />),
              },
              {
                key: 'history',
                label: `History (${history.length})`,
                children: history.length === 0
                  ? <Empty description="No past tickets" style={{ padding: 32 }} />
                  : history.map(t => <TicketCard key={t.id} ticket={t} />),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
