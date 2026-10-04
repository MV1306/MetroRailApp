import { useState, useEffect } from 'react';
import { Avatar, Dropdown } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeOutlined, CompassOutlined, EnvironmentOutlined,
  DollarOutlined, GlobalOutlined, SettingOutlined,
  LogoutOutlined, UserOutlined, TagsOutlined, SafetyOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';

const NAV = [
  { key: '/',           label: 'Home',      icon: <HomeOutlined />,        adminHidden: false },
  { key: '/journey',    label: 'Journey',   icon: <CompassOutlined />,     adminHidden: true },
  { key: '/stations',   label: 'Stations',  icon: <EnvironmentOutlined />, adminHidden: false },
  { key: '/fare',       label: 'Fare',      icon: <DollarOutlined />,      adminHidden: false },
  { key: '/map',        label: 'Map',       icon: <GlobalOutlined />,      adminHidden: false },
  { key: '/tickets',    label: 'Tickets',   icon: <TagsOutlined />,        adminHidden: true },
  { key: '/timetable',  label: 'Timetable', icon: <ScheduleOutlined />,    adminHidden: false },
];

export function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (key: string) =>
    key === '/' ? pathname === '/' : pathname.startsWith(key);

  const userMenuItems = [
    ...(isAdmin ? [{ key: 'admin', label: 'Admin Panel', icon: <SettingOutlined /> }] : []),
    { key: 'profile', label: 'My Profile', icon: <UserOutlined /> },
    { key: 'mfa-setup', label: 'Two-Factor Auth', icon: <SafetyOutlined /> },
    { key: 'logout', label: 'Sign Out', icon: <LogoutOutlined />, danger: true },
  ];

  const handleUserMenu = ({ key }: { key: string }) => {
    if (key === 'admin') navigate('/admin');
    if (key === 'profile') navigate('/profile');
    if (key === 'mfa-setup') navigate('/mfa-setup');
    if (key === 'logout') { logout(); navigate('/'); }
  };

  return (
    <>
      {/* ── Top bar ──────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(13,71,161,0.97)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: scrolled ? '1px solid rgba(21,101,192,0.12)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: scrolled ? '0 2px 20px rgba(21,101,192,0.10)' : 'none',
        transition: 'all 0.3s ease',
        padding: '0 16px',
        height: 56,
        display: 'flex', alignItems: 'center',
      }}>
        {/* Logo */}
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: scrolled ? 'linear-gradient(135deg, #1565c0, #0288d1)' : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: scrolled ? 'none' : '1px solid rgba(255,255,255,0.25)', flexShrink: 0 }}>
            🚇
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.3, color: scrolled ? '#0d47a1' : '#fff' }}>
            Chennai Metro
          </span>
        </div>

        {/* Desktop nav links */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {NAV.filter(item => !(isAdmin && item.adminHidden)).map(item => {
            const active = isActive(item.key);
            return (
              <button key={item.key} onClick={() => navigate(item.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: active ? 700 : 500, background: active ? (scrolled ? '#1565c018' : 'rgba(255,255,255,0.18)') : 'transparent', color: active ? (scrolled ? '#1565c0' : '#fff') : (scrolled ? '#475569' : 'rgba(255,255,255,0.78)'), transition: 'all 0.15s', position: 'relative' }}>
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                {item.label}
                {active && <span style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 18, height: 3, borderRadius: 2, background: scrolled ? '#1565c0' : '#fff' }} />}
              </button>
            );
          })}
        </div>

        {/* User avatar — always visible */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          {user ? (
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }} placement="bottomRight" trigger={['click']}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', padding: '4px 8px', borderRadius: 9, background: scrolled ? '#f1f5f9' : 'rgba(255,255,255,0.12)', border: scrolled ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.2)' }}>
                <Avatar size={26} style={{ background: 'linear-gradient(135deg, #1565c0, #0288d1)', fontSize: 11, flexShrink: 0 }}>
                  {user.fullName?.[0]?.toUpperCase() ?? <UserOutlined />}
                </Avatar>
                <span className="desktop-nav" style={{ fontSize: 13, fontWeight: 600, color: scrolled ? '#1e293b' : '#fff', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.fullName}
                </span>
              </div>
            </Dropdown>
          ) : (
            <button onClick={() => navigate('/login')}
              style={{ padding: '8px 16px', borderRadius: 9, border: scrolled ? '1.5px solid #1565c0' : '1.5px solid rgba(255,255,255,0.4)', background: scrolled ? '#1565c0' : 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* ── Bottom tab bar (mobile only) ─────────────────────── */}
      <div className="bottom-nav">
        {NAV.filter(item => !(isAdmin && item.adminHidden)).map(item => {
          const active = isActive(item.key);
          return (
            <button key={item.key} className={`bottom-nav-item${active ? ' active' : ''}`}
              onClick={() => navigate(item.key)}
              style={{ color: active ? '#1565c0' : '#94a3b8' }}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
