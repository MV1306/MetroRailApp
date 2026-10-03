import { useState } from 'react';
import { Form, Input, Button, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login, register } from '../api/auth';

export default function LoginPage() {
  const { login: setUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { data } = await login(values.email, values.password);
      setUser(data);
      navigate(data.role === 'Admin' ? '/admin' : '/');
    } catch {
      messageApi.error('Invalid email or password');
    } finally { setLoading(false); }
  };

  const handleRegister = async (values: { fullName: string; email: string; password: string }) => {
    setLoading(true);
    try {
      const { data } = await register(values.fullName, values.email, values.password);
      setUser(data);
      navigate('/');
    } catch {
      messageApi.error('Registration failed. Try a different email.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {contextHolder}

      {/* Left panel */}
      <div style={{
        flex: 1, display: 'none',
        background: 'linear-gradient(145deg, #0d47a1 0%, #1565c0 40%, #0288d1 100%)',
        padding: '48px', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }} className="login-left">
        {/* Decorative blobs */}
        {[
          { w: 300, h: 300, top: -80, right: -60 },
          { w: 200, h: 200, bottom: 60, left: -40 },
          { w: 120, h: 120, top: '40%', left: '30%' },
        ].map((b, i) => (
          <div key={i} style={{
            position: 'absolute', width: b.w, height: b.h, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
            top: b.top, bottom: (b as any).bottom, left: b.left, right: b.right,
          }} />
        ))}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🚇</div>
          <Typography.Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 800 }}>Chennai Metro</Typography.Title>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>Your city. Your metro.</Typography.Text>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {[
            { icon: '🗺️', text: 'Plan journeys across all metro lines' },
            { icon: '💰', text: 'Calculate fares instantly' },
            { icon: '📍', text: 'Explore stations and facilities' },
            { icon: '🕐', text: 'Live train departure times' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{f.icon}</div>
              <Typography.Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>{f.text}</Typography.Text>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        width: '100%', maxWidth: 480,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: 'clamp(24px, 5vw, 48px) clamp(20px, 5vw, 40px)',
        background: '#fff',
        boxShadow: '-8px 0 40px rgba(21,101,192,0.08)',
        minHeight: '100vh',
      }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
          <Typography.Title level={2} style={{ margin: 0, color: '#0d47a1', fontWeight: 800 }}>
            {tab === 'login' ? 'Welcome back' : 'Create account'}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 14 }}>
            {tab === 'login' ? 'Sign in to your Chennai Metro account' : 'Join Chennai Metro today'}
          </Typography.Text>
        </div>

        {/* Tab toggle */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 28 }}>
          {(['login', 'register'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
              background: tab === t ? '#fff' : 'transparent',
              color: tab === t ? '#1565c0' : '#64748b',
              boxShadow: tab === t ? '0 2px 8px rgba(21,101,192,0.12)' : 'none',
            }}>
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {tab === 'login' ? (
          <Form layout="vertical" onFinish={handleLogin} autoComplete="off">
            <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}>
              <Input
                prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                placeholder="Email address" size="large"
                style={{ borderRadius: 10, height: 48 }}
              />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: 'Password is required' }]}>
              <Input.Password
                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                placeholder="Password" size="large"
                style={{ borderRadius: 10, height: 48 }}
              />
            </Form.Item>
            <Button
              type="primary" htmlType="submit" block size="large" loading={loading}
              icon={<ArrowRightOutlined />}
              style={{ height: 48, borderRadius: 10, fontWeight: 700, fontSize: 15, background: 'linear-gradient(135deg, #1565c0, #0288d1)', border: 'none', boxShadow: '0 4px 16px rgba(21,101,192,0.35)', marginTop: 4 }}
            >
              Sign In
            </Button>
          </Form>
        ) : (
          <Form layout="vertical" onFinish={handleRegister} autoComplete="off">
            <Form.Item name="fullName" rules={[{ required: true, message: 'Full name is required' }]}>
              <Input
                prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                placeholder="Full name" size="large"
                style={{ borderRadius: 10, height: 48 }}
              />
            </Form.Item>
            <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}>
              <Input
                prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                placeholder="Email address" size="large"
                style={{ borderRadius: 10, height: 48 }}
              />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, min: 6, message: 'Min 6 characters' }]}>
              <Input.Password
                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                placeholder="Password (min 6 chars)" size="large"
                style={{ borderRadius: 10, height: 48 }}
              />
            </Form.Item>
            <Button
              type="primary" htmlType="submit" block size="large" loading={loading}
              icon={<ArrowRightOutlined />}
              style={{ height: 48, borderRadius: 10, fontWeight: 700, fontSize: 15, background: 'linear-gradient(135deg, #1565c0, #0288d1)', border: 'none', boxShadow: '0 4px 16px rgba(21,101,192,0.35)', marginTop: 4 }}
            >
              Create Account
            </Button>
          </Form>
        )}

        <Divider style={{ margin: '24px 0' }} />
        <Typography.Text type="secondary" style={{ textAlign: 'center', display: 'block', fontSize: 13 }}>
          By continuing, you agree to Chennai Metro's terms of service.
        </Typography.Text>
      </div>

      <style>{`
        @media (min-width: 768px) { .login-left { display: flex !important; } }
      `}</style>
    </div>
  );
}
