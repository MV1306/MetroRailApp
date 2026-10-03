import { useState, useEffect } from 'react';
import { Menu, Drawer } from 'antd';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  DashboardOutlined, NodeIndexOutlined, EnvironmentOutlined,
  ApartmentOutlined, LinkOutlined, SwapOutlined, DollarOutlined,
  BankOutlined, ScheduleOutlined, MenuOutlined, TagsOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { key: '/admin',              icon: <DashboardOutlined />,  label: 'Dashboard' },
  { key: '/admin/lines',        icon: <NodeIndexOutlined />,  label: 'Lines' },
  { key: '/admin/stations',     icon: <EnvironmentOutlined />,label: 'Stations' },
  { key: '/admin/line-stations',icon: <ApartmentOutlined />,  label: 'Line Mapping' },
  { key: '/admin/connections',  icon: <LinkOutlined />,       label: 'Connections' },
  { key: '/admin/interchanges', icon: <SwapOutlined />,       label: 'Interchanges' },
  { key: '/admin/fares',        icon: <DollarOutlined />,     label: 'Fares' },
  { key: '/admin/facilities',   icon: <BankOutlined />,       label: 'Station Facilities' },
  { key: '/admin/timetable',    icon: <ScheduleOutlined />,   label: 'Timetable' },
  { key: '/admin/tickets',      icon: <TagsOutlined />,       label: 'Ticket Validation' },
];

function SideMenu({ pathname, onNavigate }: { pathname: string; onNavigate: (key: string) => void }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #1565c0, #0288d1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🚇</div>
          <span style={{ fontWeight: 800, fontSize: 14, color: '#0d47a1' }}>Admin Panel</span>
        </div>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        items={navItems}
        onClick={({ key }) => onNavigate(key)}
        style={{ flex: 1, borderRight: 0, paddingTop: 8 }}
      />
    </div>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, isAdmin } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/journey" replace />;

  const handleNavigate = (key: string) => {
    navigate(key);
    setDrawerOpen(false);
  };

  const currentLabel = navItems.find(n => n.key === pathname)?.label ?? 'Admin';

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)', background: '#f8faff' }}>

      {/* Desktop sidebar */}
      {!isMobile && (
        <div style={{ width: 220, flexShrink: 0, background: '#fff', borderRight: '1px solid #f0f0f0', position: 'sticky', top: 56, height: 'calc(100vh - 56px)', overflowY: 'auto' }}>
          <SideMenu pathname={pathname} onNavigate={handleNavigate} />
        </div>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          placement="left"
          width={240}
          styles={{ body: { padding: 0 }, header: { display: 'none' } }}
        >
          <SideMenu pathname={pathname} onNavigate={handleNavigate} />
        </Drawer>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Mobile top bar */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', background: 'linear-gradient(135deg, #0d47a1, #1565c0)', height: 48, position: 'sticky', top: 56, zIndex: 50, boxShadow: '0 2px 8px rgba(13,71,161,0.25)', flexShrink: 0 }}>
            <button
              onClick={() => setDrawerOpen(true)}
              style={{ width: 36, height: 36, borderRadius: 9, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <MenuOutlined style={{ color: '#fff', fontSize: 16 }} />
            </button>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#fff', flex: 1 }}>{currentLabel}</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Admin</span>
          </div>
        )}

        <div style={{ padding: isMobile ? '16px 12px' : 24, flex: 1 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: isMobile ? '16px 12px' : 24, minHeight: 400, boxShadow: '0 1px 8px rgba(21,101,192,0.06)' }}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
