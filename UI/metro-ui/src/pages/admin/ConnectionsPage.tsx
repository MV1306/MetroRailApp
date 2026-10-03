import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Select, InputNumber, Space, Typography, message, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { adminApi } from '../../api/admin';
import type { Station, StationConnection } from '../../types';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
}

export default function ConnectionsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [connections, setConnections] = useState<StationConnection[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StationConnection | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const stationMap = Object.fromEntries(stations.map(s => [s.id, s]));
  const load = () => adminApi.getConnections().then(r => setConnections(r.data));
  useEffect(() => { adminApi.getStations().then(r => setStations(r.data)); load(); }, []);

  const recalcDistance = (fromId: number, toId: number) => {
    const from = stationMap[fromId]; const to = stationMap[toId];
    if (from && to) form.setFieldValue('distanceKm', haversineKm(from.latitude, from.longitude, to.latitude, to.longitude));
  };

  const openCreate = () => { setEditing(null); form.resetFields(); setOpen(true); };
  const openEdit = (c: StationConnection) => { setEditing(c); form.setFieldsValue(c); setOpen(true); };

  const save = async () => {
    const values = await form.validateFields();
    if (editing) await adminApi.updateConnection(editing.id, values);
    else await adminApi.createConnection(values);
    setOpen(false); load(); messageApi.success('Saved');
  };

  const remove = async (id: number) => { await adminApi.deleteConnection(id); load(); messageApi.success('Deleted'); };

  const columns = [
    {
      title: 'Route', key: 'route',
      render: (_: unknown, r: StationConnection) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Typography.Text strong style={{ fontSize: 13 }}>{r.fromStationName}</Typography.Text>
          <ArrowRightOutlined style={{ color: '#aaa', fontSize: 11 }} />
          <Typography.Text strong style={{ fontSize: 13 }}>{r.toStationName}</Typography.Text>
        </div>
      )
    },
    {
      title: 'Distance', dataIndex: 'distanceKm', key: 'distanceKm',
      render: (v: number) => <Tag color="blue">{v} km</Tag>
    },
    {
      title: 'Travel Time', dataIndex: 'travelTimeMinutes', key: 'travelTimeMinutes',
      render: (v: number) => <Tag color="orange">{v} min</Tag>
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: StationConnection) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => remove(record.id)} />
        </Space>
      )
    },
  ];

  return (
    <div>
      {contextHolder}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0, color: '#1565c0' }}>Station Connections</Typography.Title>
          <Typography.Text type="secondary">Graph edges that power the route engine</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ borderRadius: 8 }}>Add Connection</Button>
      </div>
      <Table dataSource={connections} columns={columns} rowKey="id" size="small" scroll={{ x: true }} style={{ borderRadius: 12, overflow: 'hidden' }} />
      <Modal title={editing ? 'Edit Connection' : 'Add Connection'} open={open} onOk={save} onCancel={() => setOpen(false)} okText="Save">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} autoComplete="off">
          <Form.Item name="fromStationId" label="From Station" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={stations.map(s => ({ value: s.id, label: s.name }))}
              onChange={v => recalcDistance(v, form.getFieldValue('toStationId'))} />
          </Form.Item>
          <Form.Item name="toStationId" label="To Station" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={stations.map(s => ({ value: s.id, label: s.name }))}
              onChange={v => recalcDistance(form.getFieldValue('fromStationId'), v)} />
          </Form.Item>
          <Form.Item name="distanceKm" label="Distance (km)" extra="Auto-calculated. Adjust if needed." rules={[{ required: true }]}>
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} addonAfter="km" />
          </Form.Item>
          <Form.Item name="travelTimeMinutes" label="Travel Time (min)" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} addonAfter="min" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
