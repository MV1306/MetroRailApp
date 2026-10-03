import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Select, InputNumber, Space, Typography, message, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { adminApi } from '../../api/admin';
import type { Line, Station, LineStation } from '../../types';

export default function LineStationsPage() {
  const [lines, setLines] = useState<Line[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [lineStations, setLineStations] = useState<LineStation[]>([]);
  const [selectedLine, setSelectedLine] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LineStation | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    adminApi.getLines().then(r => setLines(r.data));
    adminApi.getStations().then(r => setStations(r.data));
  }, []);

  useEffect(() => {
    if (selectedLine) adminApi.getLineStations(selectedLine).then(r => setLineStations(r.data));
    else setLineStations([]);
  }, [selectedLine]);

  const selectedLineData = lines.find(l => l.id === selectedLine);

  const openCreate = () => {
    setEditing(null); form.resetFields();
    form.setFieldsValue({ lineId: selectedLine, sequenceNo: lineStations.length + 1 });
    setOpen(true);
  };
  const openEdit = (ls: LineStation) => { setEditing(ls); form.setFieldsValue(ls); setOpen(true); };

  const save = async () => {
    const values = await form.validateFields();
    if (editing) await adminApi.updateLineStation(editing.id, values);
    else await adminApi.createLineStation(values);
    setOpen(false);
    if (selectedLine) adminApi.getLineStations(selectedLine).then(r => setLineStations(r.data));
    messageApi.success('Saved');
  };

  const remove = async (id: number) => {
    await adminApi.deleteLineStation(id);
    if (selectedLine) adminApi.getLineStations(selectedLine).then(r => setLineStations(r.data));
    messageApi.success('Deleted');
  };

  const columns = [
    {
      title: 'Seq', dataIndex: 'sequenceNo', key: 'sequenceNo', width: 60,
      render: (v: number) => (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: selectedLineData?.color ?? '#1677ff',
          color: '#fff', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 12, fontWeight: 700,
        }}>{v}</div>
      )
    },
    { title: 'Station', dataIndex: 'stationName', key: 'stationName', render: (v: string) => <Typography.Text strong>{v}</Typography.Text> },
    {
      title: 'Line', dataIndex: 'lineName', key: 'lineName',
      render: (v: string, r: LineStation) => {
        const line = lines.find(l => l.id === r.lineId);
        return <Tag style={{ background: line?.color + '22', border: `1px solid ${line?.color}`, color: line?.color }}>{v}</Tag>;
      }
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: LineStation) => (
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
          <Typography.Title level={4} style={{ margin: 0, color: '#1565c0' }}>Line-Station Mapping</Typography.Title>
          <Typography.Text type="secondary">Map stations to lines with sequence order</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ borderRadius: 8 }}>Add Mapping</Button>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <Select
          placeholder="Select Line" style={{ width: '100%', maxWidth: 220 }} size="large"
          value={selectedLine || undefined} onChange={setSelectedLine}
          options={lines.map(l => ({ value: l.id, label: l.name }))}
        />
        {selectedLineData && (
          <Tag style={{ background: selectedLineData.color + '22', border: `1px solid ${selectedLineData.color}`, color: selectedLineData.color, fontSize: 13, padding: '4px 12px' }}>
            {lineStations.length} stations
          </Tag>
        )}
      </div>
      <Table dataSource={lineStations} columns={columns} rowKey="id" size="small" scroll={{ x: true }} style={{ borderRadius: 12, overflow: 'hidden' }} />
      <Modal title={editing ? 'Edit Mapping' : 'Add Mapping'} open={open} onOk={save} onCancel={() => setOpen(false)} okText="Save">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} autoComplete="off">
          <Form.Item name="lineId" label="Line" rules={[{ required: true }]}>
            <Select options={lines.map(l => ({ value: l.id, label: l.name }))} />
          </Form.Item>
          <Form.Item name="stationId" label="Station" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={stations.map(s => ({ value: s.id, label: s.name }))} />
          </Form.Item>
          <Form.Item name="sequenceNo" label="Sequence No" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
