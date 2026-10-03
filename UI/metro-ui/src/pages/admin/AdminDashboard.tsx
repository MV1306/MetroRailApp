import { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Statistic } from 'antd';
import {
  NodeIndexOutlined, EnvironmentOutlined, LinkOutlined,
  SwapOutlined, CheckCircleOutlined, DollarOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { adminApi } from '../../api/admin';
import type { DashboardStats } from '../../types';

const statCards = (s: DashboardStats) => [
  { label: 'Lines',           value: s.totalLines,       icon: <NodeIndexOutlined />,     color: '#1677ff', bg: '#e6f0ff' },
  { label: 'Stations',        value: s.totalStations,    icon: <EnvironmentOutlined />,   color: '#52c41a', bg: '#f6ffed' },
  { label: 'Connections',     value: s.totalConnections, icon: <LinkOutlined />,          color: '#fa8c16', bg: '#fff7e6' },
  { label: 'Interchanges',    value: s.totalInterchanges,icon: <SwapOutlined />,          color: '#722ed1', bg: '#f9f0ff' },
  { label: 'Active Stations', value: s.activeStations,   icon: <CheckCircleOutlined />,   color: '#13c2c2', bg: '#e6fffb' },
  { label: 'Fare Rules',      value: s.totalFareRules,   icon: <DollarOutlined />,        color: '#eb2f96', bg: '#fff0f6' },
];

const BAR_COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1', '#13c2c2', '#eb2f96'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => { adminApi.getDashboard().then(r => setStats(r.data)); }, []);
  if (!stats) return null;

  const cards = statCards(stats);
  const chartData = cards.map(c => ({ label: c.label, value: c.value }));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={4} style={{ margin: 0, color: '#1565c0' }}>Metro Management Dashboard</Typography.Title>
        <Typography.Text type="secondary">Real-time overview of the Chennai Metro network</Typography.Text>
      </div>

      {/* Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
        {cards.map(c => (
          <Col xs={12} sm={8} md={4} key={c.label}>
            <Card style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', background: c.bg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: c.color + '22', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: c.color,
                }}>
                  {c.icon}
                </div>
                <Statistic title={<span style={{ fontSize: 12 }}>{c.label}</span>} value={c.value} valueStyle={{ color: c.color, fontSize: 22 }} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Chart */}
      <Card title={<Typography.Text strong>Network Overview</Typography.Text>}
        style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barSize={40}>
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
