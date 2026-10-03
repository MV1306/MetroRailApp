import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Select, InputNumber, Space, Typography, message, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SwapOutlined } from '@ant-design/icons';
import { adminApi } from '../../api/admin';
import type { Line, Station, Interchange } from '../../types';

export default function InterchangesPage() {
  const [lines, setLines] = useState<Line[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [interchanges, setInterchanges] = useState<Interchange[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Interchange | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const load = () => adminApi.getInterchanges().then(r => setInterchanges(r.data));
  useEffect(() => {
    adminApi.getLines().then(r => setLines(r.data));
    adminApi.getStations().then(r => setStations(r.data));
    load();
  }, []);

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ transferTimeMinutes: 4 }); setOpen(true); };
  const openEdit = (i: Interchange) => { setEditing(i); form.setFieldsValue(i); setOpen(true); };

  const save = async () => {
    const values = await form.validateFields();
    if (editing) await adminApi.updateInterchange(editing.id, values);
    else await adminApi.createInterchange(values);
    setOpen(false); load(); messageApi.success('Saved');
  };

  const remove = async (id: number) => { await adminApi.deleteInterchange(id); load(); messageApi.success('Deleted'); };

  const lineMap = Object.fromEntries(lines.map(l => [l.id, l]));

  const columns = [
    { title: 'Station', dataIndex: 'stationName', key: 'stationName', render: (v: string) => <Typography.Text strong>{v}</Typography.Text> },
    {
      title: 'Lines', key: 'lines',
      render: (_: unknown, r: Interchange) => {
        const l1 = lineMap[r.line1Id]; const l2 = lineMap[r.line2Id];
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag style={{ background: l1?.color + '22', border: `1px solid ${l1?.color}`, color: l1?.color }}>{r.line1Name}</Tag>
            <SwapOutlined style={{ color: '#aaa' }} />
            <Tag style={{ background: l2?.color + '22', border: `1px solid ${l2?.color}`, color: l2?.color }}>{r.line2Name}</Tag>
          </div>
        );
      }
    },
    {
      title: 'Transfer Time', dataIndex: 'transferTimeMinutes', key: 'transferTimeMinutes',
      render: (v: number) => <Tag color="purple">{v} min</Tag>
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: Interchange) => (
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
          <Typography.Title level={4} style={{ margin: 0, color: '#1565c0' }}>Interchange Management</Typography.Title>
          <Typography.Text type="secondary">Configure line transfer points and transfer times</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ borderRadius: 8 }}>Add Interchange</Button>
      </div>
      <Table dataSource={interchanges} columns={columns} rowKey="id" size="small" scroll={{ x: true }} style={{ borderRadius: 12, overflow: 'hidden' }} />
      <Modal title={editing ? 'Edit Interchange' : 'Add Interchange'} open={open} onOk={save} onCancel={() => setOpen(false)} okText="Save">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} autoComplete="off">
          <Form.Item name="stationId" label="Station" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={stations.map(s => ({ value: s.id, label: s.name }))} />
          </Form.Item>
          <Form.Item name="line1Id" label="Line 1" rules={[{ required: true }]}>
            <Select options={lines.map(l => ({ value: l.id, label: l.name }))} />
          </Form.Item>
          <Form.Item name="line2Id" label="Line 2" rules={[{ required: true }]}>
            <Select options={lines.map(l => ({ value: l.id, label: l.name }))} />
          </Form.Item>
          <Form.Item name="transferTimeMinutes" label="Transfer Time (min)" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} addonAfter="min" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
