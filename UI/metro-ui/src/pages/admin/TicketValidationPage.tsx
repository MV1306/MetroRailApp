import { useState, useEffect, useRef } from 'react';
import { Input, Button, Typography, Tag, Alert, Tabs } from 'antd';
import {
  CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined,
  SearchOutlined, ArrowRightOutlined, ReloadOutlined, QrcodeOutlined,
} from '@ant-design/icons';
import { Html5Qrcode } from 'html5-qrcode';
import { adminTicketApi } from '../../api/metro';
import type { Ticket } from '../../types';
import { toTitleCase } from '../../utils';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

const STATUS_CONFIG = {
  Active:  { color: 'success', icon: <ClockCircleOutlined /> },
  Used:    { color: 'default', icon: <CheckCircleOutlined /> },
  Expired: { color: 'error',   icon: <CloseCircleOutlined /> },
} as const;

const QR_REGION_ID = 'qr-reader-region';

function QrScanner({ onScan }: { onScan: (ref: string) => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [active, setActive] = useState(false);
  const [camError, setCamError] = useState('');
  const scannedRef = useRef(false);

  const start = async () => {
    setCamError('');
    scannedRef.current = false;
    try {
      const scanner = new Html5Qrcode(QR_REGION_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (text) => {
          if (scannedRef.current) return;
          scannedRef.current = true;
          stop().then(() => onScan(text.trim().toUpperCase()));
        },
        () => { /* ignore scan errors */ }
      );
      setActive(true);
    } catch {
      setCamError('Camera access denied or not available. Use manual entry instead.');
    }
  };

  const stop = async () => {
    try {
      if (scannerRef.current?.isScanning) await scannerRef.current.stop();
    } catch { /* ignore */ }
    setActive(false);
  };

  useEffect(() => () => { stop(); }, []);

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Scanner viewport — always rendered so html5-qrcode can attach to it */}
      <div
        id={QR_REGION_ID}
        style={{
          width: '100%', maxWidth: 340, margin: '0 auto 16px',
          borderRadius: 14, overflow: 'hidden',
          border: active ? '2px solid #1565c0' : '2px dashed #e2e8f0',
          minHeight: active ? 260 : 0,
          transition: 'min-height 0.3s',
          background: '#f8faff',
        }}
      />

      {camError && (
        <Alert type="error" message={camError} showIcon style={{ borderRadius: 10, marginBottom: 12, textAlign: 'left' }} />
      )}

      {!active ? (
        <Button
          type="primary" icon={<QrcodeOutlined />} size="large"
          onClick={start}
          style={{ borderRadius: 10, background: 'linear-gradient(135deg, #1565c0, #0288d1)', border: 'none', height: 46, fontWeight: 700, paddingInline: 28 }}
        >
          Start Camera Scan
        </Button>
      ) : (
        <>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
            Point the camera at the ticket QR code
          </Typography.Text>
          <Button danger onClick={stop} style={{ borderRadius: 10 }}>Stop Camera</Button>
        </>
      )}
    </div>
  );
}

function TicketResult({ result, loading, error, onValidate }: {
  result: Ticket; loading: boolean; error: string; onValidate: () => void;
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
  const minutesLeft = Math.max(0, Math.round((new Date(result.validUntil).getTime() - Date.now()) / 60_000));

  return (
    <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(21,101,192,0.10)', border: '1.5px solid #e2e8f0', marginTop: 20 }}>
      <div style={{ background: 'linear-gradient(135deg, #0d47a1, #1565c0)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Text strong style={{ color: '#fff', fontSize: 16, letterSpacing: 1.5, fontFamily: 'monospace' }}>
          {result.ticketRef}
        </Typography.Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {result.status === 'Active' && (
            <ReloadOutlined spin={loading} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }} title="Auto-refreshing every 30s" />
          )}
          <Tag color={STATUS_CONFIG[result.status].color} icon={STATUS_CONFIG[result.status].icon} style={{ borderRadius: 8, fontWeight: 600 }}>
            {result.status}
          </Tag>
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Typography.Text strong style={{ fontSize: 14, color: '#0d47a1' }}>{toTitleCase(result.fromStationName)}</Typography.Text>
          <ArrowRightOutlined style={{ color: '#94a3b8' }} />
          <Typography.Text strong style={{ fontSize: 14, color: '#0d47a1' }}>{toTitleCase(result.toStationName)}</Typography.Text>
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

        {error && <Alert type="error" message={error} showIcon style={{ borderRadius: 10, marginBottom: 12 }} />}

        {result.status === 'Active' && (
          <Button
            type="primary" block icon={<CheckCircleOutlined />}
            onClick={onValidate} loading={loading}
            style={{ borderRadius: 10, background: 'linear-gradient(135deg, #00897b, #00acc1)', border: 'none', height: 44, fontWeight: 700 }}
          >
            Mark as Used
          </Button>
        )}
        {result.status === 'Used'    && <Alert type="success" message="Ticket successfully marked as used." showIcon style={{ borderRadius: 10 }} />}
        {result.status === 'Expired' && <Alert type="error"   message="This ticket has expired."           showIcon style={{ borderRadius: 10 }} />}
      </div>
    </div>
  );
}

export default function TicketValidationPage() {
  const [ref, setRef]         = useState('');
  const [result, setResult]   = useState<Ticket | null>(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const pollRef               = useRef<ReturnType<typeof setInterval> | null>(null);

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
      try { const { data } = await adminTicketApi.getTicket(result.ticketRef); setResult(data); } catch { /* ignore */ }
    } finally { setLoading(false); }
  };

  const handleSearch = () => {
    const trimmed = ref.trim().toUpperCase();
    if (trimmed) lookup(trimmed);
  };

  return (
    <div>
      <AdminPageHeader title="Ticket Validation" subtitle="Scan a QR code or enter a ticket reference to validate" />

      <div style={{ maxWidth: 480 }}>
        <Tabs
          defaultActiveKey="scan"
          items={[
            {
              key: 'scan',
              label: <span><QrcodeOutlined /> Scan QR</span>,
              children: (
                <QrScanner onScan={(scannedRef) => {
                  setRef(scannedRef);
                  lookup(scannedRef);
                }} />
              ),
            },
            {
              key: 'manual',
              label: <span><SearchOutlined /> Manual Entry</span>,
              children: (
                <div style={{ display: 'flex', gap: 8 }}>
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
              ),
            },
          ]}
        />

        {!result && error && <Alert type="error" message={error} showIcon style={{ borderRadius: 10, marginTop: 12 }} />}

        {result && (
          <TicketResult result={result} loading={loading} error={error} onValidate={validate} />
        )}
      </div>
    </div>
  );
}
