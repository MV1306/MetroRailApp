import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Typography, message, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { adminApi } from '../../api/admin';
import type { Station, StationGate } from '../../types';

export default function GatesPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [gates, setGates] = useState<StationGate[]>([]);
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StationGate | null>(null);
  const [coords, setCoords] = useState('');
  const [coordsError, setCoordsError] = useState('');
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    adminApi.getStations().then(r => setStations(r.data));
  }, []);

  const loadGates = async (stationId: number) => {
    const r = await adminApi.getGates(stationId);
    setGates(r.data);
  };

  const onStationChange = (id: number) => {
    setSelectedStation(id);
    loadGates(id);
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

  const openCreate = () => {
    setEditing(null); setCoords(''); setCoordsError('');
    form.resetFields();
    form.setFieldsValue({ stationId: selectedStation, accessibles: [''] });
    setOpen(true);
  };

  const openEdit = (g: StationGate) => {
    setEditing(g); setCoords(`${g.latitude}, ${g.longitude}`); setCoordsError('');
    form.setFieldsValue({ ...g, accessibles: g.accessibles.length > 0 ? g.accessibles : [''] });
    setOpen(true);
  };

  const save = async () => {
    if (coordsError) return;
    const values = await form.validateFields();
    // filter out blank entries
    values.accessibles = (values.accessibles as string[]).filter(a => a?.trim());
    if (editing) await adminApi.updateGate(editing.id, values);
    else await adminApi.createGate(values);
    setOpen(false);
    if (selectedStation) loadGates(selectedStation);
    messageApi.success('Saved');
  };

  const remove = async (id: number) => {
    await adminApi.deleteGate(id);
    if (selectedStation) loadGates(selectedStation);
    messageApi.success('Deleted');
  };

  const columns = [
    {
      title: 'Gate', dataIndex: 'gateNumber', key: 'gateNumber', width: 90,
      render: (v: string) => <Tag color="blue" style={{ fontWeight: 700, fontSize: 13 }}>{v}</Tag>
    },
    {
      title: 'Coordinates', key: 'coords', width: 200,
      render: (_: unknown, r: StationGate) => (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {r.latitude.toFixed(6)}, {r.longitude.toFixed(6)}
        </Typography.Text>
      )
    },
    {
      title: 'Description', dataIndex: 'description', key: 'description',
      render: (v?: string) => v || <Typography.Text type="secondary">—</Typography.Text>
    },
    {
      title: 'Accessible Places', dataIndex: 'accessibles', key: 'accessibles',
      render: (items: string[]) => (
        <Space size={4} wrap>
          {items.length > 0
            ? items.map((a, i) => <Tag key={i} color="geekblue">{a}</Tag>)
            : <Typography.Text type="secondary">—</Typography.Text>}
        </Space>
      )
    },
    {
      title: 'Actions', key: 'actions', width: 90,
      render: (_: unknown, record: StationGate) => (
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
          <Typography.Title level={4} style={{ margin: 0, color: '#1565c0' }}>Gate Management</Typography.Title>
          <Typography.Text type="secondary">Manage entry/exit gates and accessible places per station</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={!selectedStation}>
          Add Gate
        </Button>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Typography.Text strong>Station:</Typography.Text>
        <Select
          showSearch placeholder="Select a station"
          style={{ width: 280 }}
          options={stations.map(s => ({ value: s.id, label: `${s.code} — ${s.name}` }))}
          filterOption={(input, opt) => (opt?.label as string).toLowerCase().includes(input.toLowerCase())}
          onChange={onStationChange}
          value={selectedStation}
        />
        {selectedStation && (
          <Typography.Text type="secondary">{gates.length} gate(s) found</Typography.Text>
        )}
      </div>

      <Table
        dataSource={gates} columns={columns} rowKey="id" size="middle"
        locale={{ emptyText: selectedStation ? 'No gates for this station' : 'Select a station to view gates' }}
        style={{ borderRadius: 12, overflow: 'hidden' }}
      />

      <Modal
        title={editing ? `Edit Gate ${editing.gateNumber}` : 'Add Gate'}
        open={open} onOk={save} onCancel={() => setOpen(false)} okText="Save" width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="stationId" hidden><Input /></Form.Item>
          <Form.Item name="latitude" hidden><Input /></Form.Item>
          <Form.Item name="longitude" hidden><Input /></Form.Item>

          <Form.Item name="gateNumber" label="Gate Number" rules={[{ required: true }]}>
            <Input placeholder="e.g. E1, E2, W1" />
          </Form.Item>

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

          <Form.Item name="description" label="Description">
            <Input placeholder="e.g. Towards Bus Stand" />
          </Form.Item>

          <Form.Item label="Accessible Places">
            <Form.List name="accessibles">
              {(fields, { add, remove: removeField }) => (
                <>
                  {fields.map(({ key, name, ...rest }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 6 }} align="baseline">
                      <Form.Item {...rest} name={name} style={{ margin: 0, flex: 1, minWidth: 360 }}>
                        <Input placeholder="e.g. Thiruvotriyur Bus Depot" />
                      </Form.Item>
                      {fields.length > 1 && (
                        <MinusCircleOutlined onClick={() => removeField(name)} style={{ color: '#ff4d4f' }} />
                      )}
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} size="small">
                    Add Place
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
