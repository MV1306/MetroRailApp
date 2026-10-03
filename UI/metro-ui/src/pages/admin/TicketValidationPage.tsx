import { useState, useEffect, useRef } from 'react';
import { Input, Button, Typography, Tag, Alert } from 'antd';
import {
  CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined,
  SearchOutlined, ArrowRightOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { adminTicketApi } from '../../api/metro';
import type { Ticket } from '../../types';
import { toTitleCase } from '../../utils';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

const STATUS_CONFIG = {
  Active:  { color: 'success', icon: <ClockCircleOutlined /> },
  Used:    { color: 'default', icon: <CheckCircleOutlined /> },
  Expired: { color: 'error',   icon: <CloseCircleOutlined /> },
} as const;

export default function TicketValidationPage() {
  const [ref, setRef]         = useState('');
  const [result, setResult]   = useState<Ticket | null>(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [, setTick]           = useState(0);
  const pollRef               = useRef<ReturnType<typeof setInterval> | null>(null);

  // countdown tick every 60s
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // poll current ticket status every 30s while it's Active
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!result || result.status !== 'Active') return;

    pollRef.current = setInterval(async () => {
      try {
        const { data } = await adminTicketApi.getTicket(result.ticketRef);
        setResult(data);
        if (data.status !== 'Active') clearInterval(pollRef.current!);
      } catch { /* ignore */ }
    }, 30_000);

    return () => clearInterval(pollRef.current!);
  }, [result?.ticketRef, result?.status]);

  const lookup = async (ticketRef: string) => {
    setLoading(true); setError(''); setResult(null);
    try {
      const { data } = await adminTicketApi.getTicket(ticketRef);
      setResult(data);
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.error ?? 'Ticket not found.');
    } finally { setLoading(false); }
  };

  const validate = async () => {
    if (!result) return;
    setLoading(true); setError('');
    try {
      const { data } = await adminTicketApi.validateTicket(result.ticketRef);
      setResult(data);
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.error ?? 'Validation failed.');
      // re-fetch actual status in case it changed
      try { const { data } = await adminTicketApi.getTicket(result.ticketRef); setResult(data); } catch { /* ignore */ }
    } finally { setLoading(false); }
  };

  const handleSearch = () => {
    const trimmed = ref.trim().toUpperCase();
    if (trimmed) lookup(trimmed);
  };

  const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
  const minutesLeft = result ? Math.max(0, Math.round((new Date(result.validUntil).getTime() - Date.now()) / 60_000)) : 0;

  return (
    <div>
      <AdminPageHeader title="Ticket Validation" subtitle="Enter a ticket reference to look up and mark as used" />

      <div style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <Input
            size="large"
            placeholder="Ticket reference (e.g. A1B2C3D4E5)"
            value={ref}
            onChange={e => { setRef(e.target.value.toUpperCase()); setError(''); }}
            onPressEnter={handleSearch}
            maxLength={10}
            style={{ borderRadius: 10, fontFamily: 'monospace', fontSize: 15, letterSpacing: 1 }}
          />
          <Button
            type="primary" size="large" icon={<SearchOutlined />}
            onClick={handleSearch} loading={loading && !result}
            disabled={!ref.trim()}
            style={{ borderRadius: 10, background: 'linear-gradient(135deg, #1565c0, #0288d1)', border: 'none', paddingInline: 20 }}
          >
            Look Up
          </Button>
        </div>

        {error && <Alert type="error" message={error} showIcon style={{ borderRadius: 10, marginBottom: 16 }} />}

        {result && (
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(21,101,192,0.10)', border: '1.5px solid #e2e8f0' }}>
            <div style={{ background: 'linear-gradient(135deg, #0d47a1, #1565c0)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography.Text strong style={{ color: '#fff', fontSize: 16, letterSpacing: 1.5, fontFamily: 'monospace' }}>
                {result.ticketRef}
              </Typography.Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {result.status === 'Active' && (
                  <ReloadOutlined
                    spin={loading}
                    style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer' }}
                    title="Auto-refreshing every 30s"
                  />
                )}
                <Tag color={STATUS_CONFIG[result.status].color} icon={STATUS_CONFIG[result.status].icon} style={{ borderRadius: 8, fontWeight: 600 }}>
                  {result.status}
                </Tag>
              </div>
            </div>

            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Typography.Text strong style={{ fontSize: 14, color: '#0d47a1' }}>
                  {toTitleCase(result.fromStationName)}
                </Typography.Text>
                <ArrowRightOutlined style={{ color: '#94a3b8' }} />
                <Typography.Text strong style={{ fontSize: 14, color: '#0d47a1' }}>
                  {toTitleCase(result.toStationName)}
                </Typography.Text>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Total Fare',  value: `₹${result.totalFare}`,  color: '#00897b' },
                  { label: 'Passengers', value: String(result.passengers), color: '#334155' },
                  { label: 'Purchased',  value: new Date(result.purchasedAt).toLocaleTimeString('en-IN', timeOpts), color: '#475569' },
                  {
                    label: 'Valid Until',
                    value: new Date(result.validUntil).toLocaleTimeString('en-IN', timeOpts),
                    color: result.status === 'Active' && minutesLeft <= 15 ? '#e53935' : '#475569',
                    extra: result.status === 'Active' ? `${minutesLeft} min left` : undefined,
                  },
                ].map(({ label, value, color, extra }) => (
                  <div key={label} style={{ background: '#f8faff', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color }}>{value}</div>
                    {extra && <div style={{ fontSize: 11, color, marginTop: 2 }}>{extra}</div>}
                  </div>
                ))}
              </div>

              {result.status === 'Active' && (
                <Button
                  type="primary" block icon={<CheckCircleOutlined />}
                  onClick={validate} loading={loading}
                  style={{ borderRadius: 10, background: 'linear-gradient(135deg, #00897b, #00acc1)', border: 'none', height: 44, fontWeight: 700 }}
                >
                  Mark as Used
                </Button>
              )}

              {result.status === 'Used' && (
                <Alert type="success" message="Ticket successfully marked as used." showIcon style={{ borderRadius: 10 }} />
              )}

              {result.status === 'Expired' && (
                <Alert type="error" message="This ticket has expired." showIcon style={{ borderRadius: 10 }} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
