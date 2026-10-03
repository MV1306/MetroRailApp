import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Switch, Space, Typography, message, Row, Col, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { adminApi } from '../../api/admin';
import type { Line, Station } from '../../types';
import { useWindowSize } from '../../hooks/useWindowSize';

function toHex(color: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.fillStyle = color;
  return ctx.fillStyle;
}

function lineGradient(colors: string[]): string {
  if (colors.length === 0) return 'transparent';
  const hexes = colors.map(toHex);
  if (hexes.length === 1) return hexes[0] + '40';
  const stops = hexes.map((c, i) => `${c}40 ${(i / (hexes.length - 1)) * 100}%`);
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Station | null>(null);
  const [coords, setCoords] = useState('');
  const [coordsError, setCoordsError] = useState('');
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const { width } = useWindowSize();

  const [lineMap, setLineMap] = useState<Record<number, Line[]>>({}); // stationId → lines

  const load = async () => {
    const [stationsRes, linesRes] = await Promise.all([
      adminApi.getStations(),
      adminApi.getLines(),
    ]);
    setStations(stationsRes.data);

    // For each line, fetch its stations and build stationId → Line[] map
    const map: Record<number, Line[]> = {};
    await Promise.all(
      linesRes.data.map(async line => {
        const ls = await adminApi.getLineStations(line.id);
        ls.data.forEach(({ stationId }) => {
          if (!map[stationId]) map[stationId] = [];
          map[stationId].push(line);
        });
      })
    );
    setLineMap(map);
  };

  useEffect(() => { load(); }, []);

  const defaultValues = {
    isActive: true, hasParking: true, hasLift: true,
    hasEscalator: true, hasToilet: true, isAccessible: true,
    latitude: 0, longitude: 0
  };

  const openCreate = () => {
    setEditing(null); setCoords(''); setCoordsError('');
    form.resetFields(); form.setFieldsValue(defaultValues); setOpen(true);
  };

  const openEdit = (s: Station) => {
    setEditing(s); setCoords(`${s.latitude}, ${s.longitude}`); setCoordsError('');
    form.setFieldsValue(s); setOpen(true);
  };

  const handleCoords = (val: string) => {
    setCoords(val);
    const parts = val.split(',').map(p => p.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        form.setFieldsValue({ latitude: lat, longitude: lng });
        setCoordsError('');
      } else {
        setCoordsError('Invalid coordinates');
      }
    } else {
      setCoordsError('Enter as: latitude, longitude');
    }
  };

  const save = async () => {
    if (coordsError) return;
    const values = await form.validateFields();
    if (editing) await adminApi.updateStation(editing.id, values);
    else await adminApi.createStation(values);
    setOpen(false); load(); messageApi.success('Saved');
  };

  const remove = async (id: number) => { await adminApi.deleteStation(id); load(); messageApi.success('Deleted'); };

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 80 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Lines', key: 'lines',
      render: (_: unknown, record: Station) => (
        <Space size={4}>
          {(lineMap[record.id] ?? []).map(l => (
            <Tag key={l.id} color={l.color}>{l.name}</Tag>
          ))}
        </Space>
      )
    },
    { title: 'Active', dataIndex: 'isActive', key: 'isActive', render: (v: boolean) => <Switch checked={v} disabled size="small" /> },
    { title: 'Parking', dataIndex: 'hasParking', key: 'hasParking', render: (v: boolean) => <Switch checked={v} disabled size="small" /> },
    { title: 'Lift', dataIndex: 'hasLift', key: 'hasLift', render: (v: boolean) => <Switch checked={v} disabled size="small" /> },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: Station) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => remove(record.id)} />
        </Space>
      )
    },
  ];

  const facilityFields = [
    { name: 'isActive', label: 'Active' },
    { name: 'hasParking', label: 'Parking' },
    { name: 'hasLift', label: 'Lift' },
    { name: 'hasEscalator', label: 'Escalator' },
    { name: 'hasToilet', label: 'Toilet' },
    { name: 'isAccessible', label: 'Accessible' },
  ];

  return (
    <div>
      {contextHolder}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>Station Management</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Station</Button>
      </div>
      <Table
        dataSource={stations}
        columns={columns}
        rowKey="id"
        size="small"
        scroll={{ x: true }}
        rowClassName={() => 'station-row'}
        onRow={record => ({
          style: { background: lineGradient((lineMap[record.id] ?? []).map(l => l.color)) }
        })}
      />
      <Modal title={editing ? 'Edit Station' : 'Add Station'} open={open} onOk={save} onCancel={() => setOpen(false)} okText="Save" width={Math.min(680, width - 32)}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} autoComplete="off">
          <Row gutter={16}>
            <Col xs={24} sm={12}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="code" label="Code" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Form.Item
            label="Coordinates"
            validateStatus={coordsError ? 'error' : ''}
            help={coordsError || `Lat: ${form.getFieldValue('latitude') || '—'}  Lng: ${form.getFieldValue('longitude') || '—'}`}
          >
            <Input
              placeholder="13.184311, 80.309123"
              value={coords}
              onChange={e => handleCoords(e.target.value)}
            />
          </Form.Item>
          {/* Hidden fields to hold parsed values */}
          <Form.Item name="latitude" hidden><Input /></Form.Item>
          <Form.Item name="longitude" hidden><Input /></Form.Item>
          <Form.Item name="address" label="Address"><Input /></Form.Item>
          <Form.Item name="nearbyLandmarks" label="Nearby Landmarks"><Input /></Form.Item>
          <Row gutter={16}>
            {facilityFields.map(f => (
              <Col xs={12} sm={8} key={f.name}>
                <Form.Item name={f.name} label={f.label} valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
