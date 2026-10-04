import { useEffect, useState } from 'react';
import { Select, Button, Typography, Alert, Tag, Tabs, Empty, Spin, message, Modal, QRCode, Popconfirm, Row, Col } from 'antd';
import {
  ArrowRightOutlined, SwapOutlined, QrcodeOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined,
  DeleteOutlined, BarChartOutlined, EnvironmentOutlined,
  DollarOutlined, RiseOutlined,
} from '@ant-design/icons';
import { metroApi } from '../../api/metro';
import type { Station, Ticket, JourneyStats } from '../../types';
import { toTitleCase } from '../../utils';

const STATUS_CONFIG = {
  Active:  { color: 'success', icon: <ClockCircleOutlined /> },
  Used:    { color: 'default', icon: <CheckCircleOutlined /> },
  Expired: { color: 'error',   icon: <CloseCircleOutlined /> },
} as const;

function StatsPanel({ stats }: { stats: JourneyStats }) {
  const items = [
    { icon: <QrcodeOutlined />, value: stats.totalTrips, label: 'Total Trips', color: '#1565c0' },
    { icon: <RiseOutlined />, value: `${stats.totalDistanceKm} km`, label: 'Distance Travelled', color: '#00897b' },
    { icon: <DollarOutlined />, value: `₹${stats.totalSpent.toFixed(2)}`, label: 'Total Spent', color: '#f57c00' },
    { icon: <ClockCircleOutlined />, value: stats.activeTickets, label: 'Active Tickets', color: '#6a1b9a' },
  ];
  return (
    <div style={{ background: 'linear-gradient(135deg, #0d47a1, #1565c0)', borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <BarChartOutlined style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }} />
        <Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Your Journey Stats
        </Typography.Text>
      </div>
      <Row gutter={[12, 12]}>
        {items.map((s, i) => (
          <Col xs={12} sm={6} key={i}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4 }}>{s.label}</div>
            </div>
          </Col>
        ))}
      </Row>
      {stats.mostVisitedStation && (
        <div style={{ marginTop: 14, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <EnvironmentOutlined style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
          <Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
            Most visited: <strong style={{ color: '#fff' }}>{toTitleCase(stats.mostVisitedStation)}</strong>
          </Typography.Text>
        </div>
      )}
    </div>
  );
}

function TicketCard({ ticket, onCancel, onShowQr }: { ticket: Ticket; onCancel: (id: number) => void; onShowQr: (t: Ticket) => void }) {
  const cfg = STATUS_CONFIG[ticket.status];
  const validUntil = new Date(ticket.validUntil);
  const purchased  = new Date(ticket.purchasedAt);
  const minutesLeft = Math.max(0, Math.round((validUntil.getTime() - Date.now()) / 60000));
  const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };

  return (
    <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(21,101,192,0.08)', border: '1.5px solid #e2e8f0', marginBottom: 16 }}>
      <div style={{ background: 'linear-gradient(135deg, #0d47a1, #1565c0)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => onShowQr(ticket)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: ticket.status === 'Active' ? 'pointer' : 'default', padding: 0 }}
          title={ticket.status === 'Active' ? 'Show QR Code' : undefined}
        >
          <QrcodeOutlined style={{ color: ticket.status === 'Active' ? '#69f0ae' : 'rgba(255,255,255,0.5)', fontSize: 18 }} />
          <Typography.Text strong style={{ color: '#fff', fontSize: 15, letterSpacing: 1 }}>
            {ticket.ticketRef}
          </Typography.Text>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag color={cfg.color} icon={cfg.icon} style={{ borderRadius: 8, fontWeight: 600 }}>
            {ticket.status}
          </Tag>
          {ticket.status === 'Active' && (
            <Popconfirm
              title="Cancel this ticket?"
              description="This action cannot be undone."
              okText="Yes, cancel"
              okButtonProps={{ danger: true }}
              cancelText="Keep"
              onConfirm={() => onCancel(ticket.id)}
            >
              <button style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, cursor: 'pointer', padding: '3px 7px', color: '#fff', display: 'flex', alignItems: 'center' }}>
                <DeleteOutlined style={{ fontSize: 13 }} />
              </button>
            </Popconfirm>
          )}
        </div>
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
  const [stats, setStats]         = useState<JourneyStats | null>(null);
  const [loading, setLoading]     = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError]         = useState('');
  const [, setTick]               = useState(0);
  const [qrTicket, setQrTicket]   = useState<Ticket | null>(null);
  const [messageApi, ctx]         = message.useMessage();

  const loadTickets = async () => {
    setListLoading(true);
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        metroApi.getMyTickets(),
        metroApi.getTicketStats(),
      ]);
      setTickets(ticketsRes.data);
      setStats(statsRes.data);
    } catch { /* ignore */ }
    finally { setListLoading(false); }
  };

  const silentRefresh = async () => {
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        metroApi.getMyTickets(),
        metroApi.getTicketStats(),
      ]);
      setTickets(ticketsRes.data);
      setStats(statsRes.data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    metroApi.getStations().then(r => setStations(r.data));
    loadTickets();
  }, []);

  useEffect(() => {
    const hasActive = tickets.some(t => t.status === 'Active');
    if (!hasActive) return;
    const id = setInterval(silentRefresh, 30_000);
    return () => clearInterval(id);
  }, [tickets]);

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

  const cancel = async (ticketId: number) => {
    try {
      await metroApi.cancelTicket(ticketId);
      messageApi.success('Ticket cancelled.');
      await loadTickets();
    } catch (err: unknown) {
      messageApi.error((err as any)?.response?.data?.error ?? 'Failed to cancel ticket.');
    }
  };

  const opts = stations.map(s => ({ value: s.id, label: toTitleCase(s.name) }));
  const active  = tickets.filter(t => t.status === 'Active');
  const history = tickets.filter(t => t.status !== 'Active');

  return (
    <div className="page-bg">
      {ctx}

      {/* QR Modal */}
      <Modal
        open={!!qrTicket}
        onCancel={() => setQrTicket(null)}
        footer={null}
        centered
        title={<span style={{ color: '#0d47a1', fontWeight: 700 }}>Ticket QR Code</span>}
      >
        {qrTicket && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <QRCode
              value={qrTicket.ticketRef}
              size={220}
              style={{ margin: '0 auto 16px' }}
            />
            <Typography.Text strong style={{ fontSize: 18, letterSpacing: 2, display: 'block', marginBottom: 8 }}>
              {qrTicket.ticketRef}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              {toTitleCase(qrTicket.fromStationName)} → {toTitleCase(qrTicket.toStationName)}
            </Typography.Text>
            <div style={{ marginTop: 12 }}>
              <Tag color="success" icon={<ClockCircleOutlined />} style={{ fontSize: 13, padding: '4px 12px' }}>
                Valid until {new Date(qrTicket.validUntil).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </Tag>
            </div>
            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>
              Show this QR code to the gate staff for validation
            </Typography.Text>
          </div>
        )}
      </Modal>

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

        {/* Journey Stats */}
        {stats && stats.totalTrips > 0 && <StatsPanel stats={stats} />}

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
                  : active.map(t => <TicketCard key={t.id} ticket={t} onCancel={cancel} onShowQr={setQrTicket} />),
              },
              {
                key: 'history',
                label: `History (${history.length})`,
                children: history.length === 0
                  ? <Empty description="No past tickets" style={{ padding: 32 }} />
                  : history.map(t => <TicketCard key={t.id} ticket={t} onCancel={cancel} onShowQr={setQrTicket} />),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
