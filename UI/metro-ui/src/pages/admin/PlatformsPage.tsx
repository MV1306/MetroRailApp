import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, Space, Typography, message, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { adminApi } from '../../api/admin';
import type { Station, Line, LineStation, Platform } from '../../types';

export default function PlatformsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [allLines, setAllLines] = useState<Line[]>([]);
  const [stationLines, setStationLines] = useState<Line[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Platform | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    Promise.all([adminApi.getStations(), adminApi.getLines()]).then(([s, l]) => {
      setStations(s.data);
      setAllLines(l.data);
    });
  }, []);

  const onStationChange = async (stationId: number) => {
    setSelectedStation(stationId);
    // fetch lines for this station via line-stations
    const lineStationsRes = await Promise.all(
      allLines.map(l => adminApi.getLineStations(l.id))
    );
    const lineIds = new Set<number>();
    lineStationsRes.forEach((res, i) => {
      if ((res.data as LineStation[]).some((ls: LineStation) => ls.stationId === stationId))
        lineIds.add(allLines[i].id);
    });
    setStationLines(allLines.filter(l => lineIds.has(l.id)));
    const r = await adminApi.getPlatforms(stationId);
    setPlatforms(r.data);
  };

  const loadPlatforms = async () => {
    if (selectedStation) {
      const r = await adminApi.getPlatforms(selectedStation);
      setPlatforms(r.data);
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ stationId: selectedStation, isActive: true });
    setOpen(true);
  };

  const openEdit = (p: Platform) => {
    setEditing(p);
    form.setFieldsValue(p);
    setOpen(true);
  };

  const save = async () => {
    const values = await form.validateFields();
    if (editing) await adminApi.updatePlatform(editing.id, values);
    else await adminApi.createPlatform(values);
    setOpen(false);
    await loadPlatforms();
    messageApi.success('Saved');
  };

  const remove = async (id: number) => {
    await adminApi.deletePlatform(id);
    await loadPlatforms();
    messageApi.success('Deleted');
  };

  // Group platforms by line for display
  const lineMap = Object.fromEntries(allLines.map(l => [l.id, l]));
  const grouped = platforms.reduce<Record<number, Platform[]>>((acc, p) => {
    if (!acc[p.lineId]) acc[p.lineId] = [];
    acc[p.lineId].push(p);
    return acc;
  }, {});

  const columns = [
    {
      title: 'Platform', dataIndex: 'platformNumber', key: 'platformNumber', width: 120,
      render: (v: string) => <Tag color="blue" style={{ fontWeight: 700, fontSize: 13 }}>Platform No {v}</Tag>
    },
    {
      title: 'Towards', dataIndex: 'towardsDestination', key: 'towardsDestination',
      render: (v: string) => <Typography.Text>Towards {v}</Typography.Text>
    },
    {
      title: 'Active', dataIndex: 'isActive', key: 'isActive', width: 80,
      render: (v: boolean) => <Switch checked={v} disabled size="small" />
    },
    {
      title: 'Actions', key: 'actions', width: 90,
      render: (_: unknown, record: Platform) => (
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
          <Typography.Title level={4} style={{ margin: 0, color: '#1565c0' }}>Platform Management</Typography.Title>
          <Typography.Text type="secondary">Manage platforms per station, assigned to lines</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={!selectedStation}>
          Add Platform
        </Button>
      </div>

      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Typography.Text strong>Station:</Typography.Text>
        <Select
          showSearch placeholder="Select a station"
          style={{ width: 300 }}
          options={stations.map(s => ({ value: s.id, label: `${s.code} — ${s.name}` }))}
          filterOption={(input, opt) => (opt?.label as string).toLowerCase().includes(input.toLowerCase())}
          onChange={onStationChange}
          value={selectedStation}
        />
        {selectedStation && (
          <Typography.Text type="secondary">{platforms.length} platform(s) found</Typography.Text>
        )}
      </div>

      {selectedStation && Object.keys(grouped).length === 0 && (
        <Typography.Text type="secondary">No platforms configured for this station.</Typography.Text>
      )}

      {Object.entries(grouped).map(([lineId, linePlatforms]) => {
        const line = lineMap[Number(lineId)];
        return (
          <div key={lineId} style={{ marginBottom: 24 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
              padding: '8px 14px', borderRadius: 8,
              background: (line?.color ?? '#1677ff') + '18',
              borderLeft: `4px solid ${line?.color ?? '#1677ff'}`
            }}>
              <Typography.Text strong style={{ color: line?.color, fontSize: 15 }}>
                {line?.name ?? `Line ${lineId}`}
              </Typography.Text>
              <Tag color={line?.color}>{line?.code}</Tag>
            </div>
            <Table
              dataSource={linePlatforms} columns={columns} rowKey="id"
              size="small" pagination={false}
              style={{ borderRadius: 8, overflow: 'hidden' }}
            />
          </div>
        );
      })}

      {!selectedStation && (
        <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>
          Select a station to view and manage its platforms
        </div>
      )}

      <Modal
        title={editing ? `Edit Platform ${editing.platformNumber}` : 'Add Platform'}
        open={open} onOk={save} onCancel={() => setOpen(false)} okText="Save"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="stationId" hidden><Input /></Form.Item>
          <Form.Item name="lineId" label="Line" rules={[{ required: true }]}>
            <Select
              placeholder="Select line"
              options={stationLines.map(l => ({ value: l.id, label: l.name }))}
            />
          </Form.Item>
          <Form.Item name="platformNumber" label="Platform Number" rules={[{ required: true }]}>
            <Input placeholder="e.g. 1, 2, 3" />
          </Form.Item>
          <Form.Item name="towardsDestination" label="Towards Destination" rules={[{ required: true }]}>
            <Input placeholder="e.g. Chennai Airport" />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
