import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, Space, Typography, message, Tag, Tabs } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { adminApi } from '../../api/admin';
import type { Station, Line, LineStation, StationGate, Platform } from '../../types';

export default function StationFacilitiesPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [allLines, setAllLines] = useState<Line[]>([]);
  const [stationLines, setStationLines] = useState<Line[]>([]);
  const [selectedStation, setSelectedStation] = useState<number | null>(null);

  const [gates, setGates] = useState<StationGate[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  const [gateOpen, setGateOpen] = useState(false);
  const [editingGate, setEditingGate] = useState<StationGate | null>(null);
  const [coords, setCoords] = useState('');
  const [coordsError, setCoordsError] = useState('');
  const [gateForm] = Form.useForm();

  const [platformOpen, setPlatformOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [platformForm] = Form.useForm();
  const [terminalStations, setTerminalStations] = useState<string[]>([]);

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    Promise.all([adminApi.getStations(), adminApi.getLines()]).then(([s, l]) => {
      setStations(s.data);
      setAllLines(l.data);
    });
  }, []);

  const onStationChange = async (stationId: number) => {
    setSelectedStation(stationId);
    const [gatesRes, lineStationsRes] = await Promise.all([
      adminApi.getGates(stationId),
      Promise.all(allLines.map(l => adminApi.getLineStations(l.id))),
    ]);
    setGates(gatesRes.data);

    const lineIds = new Set<number>();
    lineStationsRes.forEach((res, i) => {
      if ((res.data as LineStation[]).some((ls: LineStation) => ls.stationId === stationId))
        lineIds.add(allLines[i].id);
    });
    const lines = allLines.filter(l => lineIds.has(l.id));
    setStationLines(lines);

    const platformsRes = await adminApi.getPlatforms(stationId);
    setPlatforms(platformsRes.data);
  };

  const reloadGates = async () => { if (selectedStation) setGates((await adminApi.getGates(selectedStation)).data); };
  const reloadPlatforms = async () => { if (selectedStation) setPlatforms((await adminApi.getPlatforms(selectedStation)).data); };

  // ── Gates ──────────────────────────────────────────────────────────────────
  const handleCoords = (val: string) => {
    setCoords(val);
    const parts = val.split(',').map(p => p.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]), lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) { gateForm.setFieldsValue({ latitude: lat, longitude: lng }); setCoordsError(''); }
      else setCoordsError('Invalid coordinates');
    } else setCoordsError('Enter as: latitude, longitude');
  };

  const openCreateGate = () => {
    setEditingGate(null); setCoords(''); setCoordsError('');
    gateForm.resetFields();
    gateForm.setFieldsValue({ stationId: selectedStation, accessibles: [''] });
    setGateOpen(true);
  };

  const openEditGate = (g: StationGate) => {
    setEditingGate(g); setCoords(`${g.latitude}, ${g.longitude}`); setCoordsError('');
    gateForm.setFieldsValue({ ...g, accessibles: g.accessibles.length > 0 ? g.accessibles : [''] });
    setGateOpen(true);
  };

  const saveGate = async () => {
    if (coordsError) return;
    const values = await gateForm.validateFields();
    values.accessibles = (values.accessibles as string[]).filter((a: string) => a?.trim());
    if (editingGate) await adminApi.updateGate(editingGate.id, values);
    else await adminApi.createGate(values);
    setGateOpen(false); await reloadGates(); messageApi.success('Gate saved');
  };

  const removeGate = async (id: number) => { await adminApi.deleteGate(id); await reloadGates(); messageApi.success('Gate deleted'); };

  const gateColumns = [
    { title: 'Gate', dataIndex: 'gateNumber', key: 'gateNumber', width: 90,
      render: (v: string) => <Tag color="blue" style={{ fontWeight: 700, fontSize: 13 }}>{v}</Tag> },
    { title: 'Coordinates', key: 'coords', width: 190,
      render: (_: unknown, r: StationGate) => (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{r.latitude.toFixed(6)}, {r.longitude.toFixed(6)}</Typography.Text>
      ) },
    { title: 'Description', dataIndex: 'description', key: 'description',
      render: (v?: string) => v || <Typography.Text type="secondary">—</Typography.Text> },
    { title: 'Accessible Places', dataIndex: 'accessibles', key: 'accessibles',
      render: (items: string[]) => (
        <Space size={4} wrap>
          {items.length > 0 ? items.map((a, i) => <Tag key={i} color="geekblue">{a}</Tag>)
            : <Typography.Text type="secondary">—</Typography.Text>}
        </Space>
      ) },
    { title: 'Actions', key: 'actions', width: 90,
      render: (_: unknown, r: StationGate) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEditGate(r)} />
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => removeGate(r.id)} />
        </Space>
      ) },
  ];

  // ── Platforms ──────────────────────────────────────────────────────────────
  const openCreatePlatform = () => {
    setEditingPlatform(null);
    setTerminalStations([]);
    platformForm.resetFields();
    platformForm.setFieldsValue({ stationId: selectedStation, isActive: true });
    setPlatformOpen(true);
  };

  const openEditPlatform = (p: Platform) => {
    setEditingPlatform(p);
    platformForm.setFieldsValue(p);
    // load terminals for the already-selected line
    loadTerminals(p.lineId);
    setPlatformOpen(true);
  };

  const loadTerminals = async (lineId: number) => {
    const res = await adminApi.getLineStations(lineId);
    const sorted = [...res.data].sort((a, b) => a.sequenceNo - b.sequenceNo);
    if (sorted.length === 0) { setTerminalStations([]); return; }
    const first = sorted[0].stationName;
    const last = sorted[sorted.length - 1].stationName;
    setTerminalStations(first === last ? [first] : [first, last]);
    // clear destination if it no longer matches
    const current = platformForm.getFieldValue('towardsDestination');
    if (current && current !== first && current !== last)
      platformForm.setFieldValue('towardsDestination', undefined);
  };

  const onLineChange = (lineId: number) => {
    platformForm.setFieldValue('towardsDestination', undefined);
    loadTerminals(lineId);
  };

  const savePlatform = async () => {
    const values = await platformForm.validateFields();
    if (editingPlatform) await adminApi.updatePlatform(editingPlatform.id, values);
    else await adminApi.createPlatform(values);
    setPlatformOpen(false); await reloadPlatforms(); messageApi.success('Platform saved');
  };

  const removePlatform = async (id: number) => { await adminApi.deletePlatform(id); await reloadPlatforms(); messageApi.success('Platform deleted'); };

  const lineMap = Object.fromEntries(allLines.map(l => [l.id, l]));
  const grouped = platforms.reduce<Record<number, Platform[]>>((acc, p) => {
    if (!acc[p.lineId]) acc[p.lineId] = [];
    acc[p.lineId].push(p);
    return acc;
  }, {});

  const platformColumns = [
    { title: 'Platform', dataIndex: 'platformNumber', key: 'platformNumber', width: 130,
      render: (v: string) => <Tag color="volcano" style={{ fontWeight: 700, fontSize: 13 }}>Platform No {v}</Tag> },
    { title: 'Towards', dataIndex: 'towardsDestination', key: 'towardsDestination',
      render: (v: string) => <Typography.Text>Towards {v}</Typography.Text> },
    { title: 'Active', dataIndex: 'isActive', key: 'isActive', width: 80,
      render: (v: boolean) => <Switch checked={v} disabled size="small" /> },
    { title: 'Actions', key: 'actions', width: 90,
      render: (_: unknown, r: Platform) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEditPlatform(r)} />
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => removePlatform(r.id)} />
        </Space>
      ) },
  ];

  const empty = (
    <div style={{ textAlign: 'center', padding: 48, color: '#bbb' }}>
      Select a station above to get started
    </div>
  );

  const tabItems = [
    {
      key: 'gates',
      label: `Gates (${gates.length})`,
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateGate} disabled={!selectedStation}>
              Add Gate
            </Button>
          </div>
          <Table dataSource={gates} columns={gateColumns} rowKey="id" size="middle"
            locale={{ emptyText: selectedStation ? 'No gates for this station' : 'Select a station first' }}
            style={{ borderRadius: 10, overflow: 'hidden' }} />
        </>
      ),
    },
    {
      key: 'platforms',
      label: `Platforms (${platforms.length})`,
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreatePlatform} disabled={!selectedStation}>
              Add Platform
            </Button>
          </div>
          {selectedStation && Object.keys(grouped).length === 0 && (
            <Typography.Text type="secondary">No platforms configured for this station.</Typography.Text>
          )}
          {Object.entries(grouped).map(([lineId, linePlatforms]) => {
            const line = lineMap[Number(lineId)];
            return (
              <div key={lineId} style={{ marginBottom: 20 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
                  padding: '7px 14px', borderRadius: 8,
                  background: (line?.color ?? '#1677ff') + '18',
                  borderLeft: `4px solid ${line?.color ?? '#1677ff'}`
                }}>
                  <Typography.Text strong style={{ color: line?.color, fontSize: 14 }}>
                    {line?.name ?? `Line ${lineId}`}
                  </Typography.Text>
                  <Tag color={line?.color}>{line?.code}</Tag>
                </div>
                <Table dataSource={linePlatforms} columns={platformColumns} rowKey="id"
                  size="small" pagination={false} style={{ borderRadius: 8, overflow: 'hidden' }} />
              </div>
            );
          })}
          {!selectedStation && empty}
        </>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      <div style={{ marginBottom: 20 }}>
        <Typography.Title level={4} style={{ margin: 0, color: '#1565c0' }}>Station Facilities</Typography.Title>
        <Typography.Text type="secondary">Manage gates and platforms for a station</Typography.Text>
      </div>

      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Typography.Text strong>Station:</Typography.Text>
        <Select
          showSearch placeholder="Select a station"
          style={{ width: 320 }}
          options={stations.map(s => ({ value: s.id, label: `${s.code} — ${s.name}` }))}
          filterOption={(input, opt) => (opt?.label as string).toLowerCase().includes(input.toLowerCase())}
          onChange={onStationChange}
          value={selectedStation}
        />
      </div>

      <Tabs items={tabItems} />

      {/* Gate Modal */}
      <Modal title={editingGate ? `Edit Gate ${editingGate.gateNumber}` : 'Add Gate'}
        open={gateOpen} onOk={saveGate} onCancel={() => setGateOpen(false)} okText="Save" width={520}>
        <Form form={gateForm} layout="vertical" style={{ marginTop: 16 }} autoComplete="off">
          <Form.Item name="stationId" hidden><Input /></Form.Item>
          <Form.Item name="latitude" hidden><Input /></Form.Item>
          <Form.Item name="longitude" hidden><Input /></Form.Item>
          <Form.Item name="gateNumber" label="Gate Number" rules={[{ required: true }]}>
            <Input placeholder="e.g. E1, E2, W1" />
          </Form.Item>
          <Form.Item label="Coordinates" validateStatus={coordsError ? 'error' : ''}
            help={coordsError || `Lat: ${gateForm.getFieldValue('latitude') || '—'}  Lng: ${gateForm.getFieldValue('longitude') || '—'}`}>
            <Input placeholder="13.184311, 80.309123" value={coords} onChange={e => handleCoords(e.target.value)} />
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
                      <Form.Item {...rest} name={name} style={{ margin: 0, minWidth: 360 }}>
                        <Input placeholder="e.g. Thiruvotriyur Bus Depot" />
                      </Form.Item>
                      {fields.length > 1 && (
                        <MinusCircleOutlined onClick={() => removeField(name)} style={{ color: '#ff4d4f' }} />
                      )}
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} size="small">Add Place</Button>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>

      {/* Platform Modal */}
      <Modal title={editingPlatform ? `Edit Platform ${editingPlatform.platformNumber}` : 'Add Platform'}
        open={platformOpen} onOk={savePlatform} onCancel={() => setPlatformOpen(false)} okText="Save">
        <Form form={platformForm} layout="vertical" style={{ marginTop: 16 }} autoComplete="off">
          <Form.Item name="stationId" hidden><Input /></Form.Item>
          <Form.Item name="lineId" label="Line" rules={[{ required: true }]}>
            <Select placeholder="Select line" options={stationLines.map(l => ({ value: l.id, label: l.name }))} onChange={onLineChange} />
          </Form.Item>
          <Form.Item name="platformNumber" label="Platform Number" rules={[{ required: true }]}>
            <Input placeholder="e.g. 1, 2" />
          </Form.Item>
          <Form.Item name="towardsDestination" label="Towards Destination" rules={[{ required: true }]}>
            <Select
              placeholder={terminalStations.length ? 'Select terminal station' : 'Select a line first'}
              disabled={terminalStations.length === 0}
              options={terminalStations.map(s => ({ value: s, label: s }))}
            />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
