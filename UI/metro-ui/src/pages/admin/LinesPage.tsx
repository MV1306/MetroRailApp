import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Switch, Space, Typography, message, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { adminApi } from '../../api/admin';
import type { Line } from '../../types';

export default function LinesPage() {
  const [lines, setLines] = useState<Line[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Line | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const load = () => adminApi.getLines().then(r => setLines(r.data));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ isActive: true, color: '#1677ff' }); setOpen(true); };
  const openEdit = (l: Line) => { setEditing(l); form.setFieldsValue(l); setOpen(true); };

  const save = async () => {
    const values = await form.validateFields();
    if (editing) await adminApi.updateLine(editing.id, values);
    else await adminApi.createLine(values);
    setOpen(false); load(); messageApi.success('Saved');
  };

  const remove = async (id: number) => { await adminApi.deleteLine(id); load(); messageApi.success('Deleted'); };

  const columns = [
    {
      title: 'Line', key: 'line',
      render: (_: unknown, r: Line) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: r.color, boxShadow: `0 0 0 3px ${r.color}33` }} />
          <Typography.Text strong>{r.name}</Typography.Text>
        </div>
      )
    },
    { title: 'Code', dataIndex: 'code', key: 'code', render: (v: string) => <Tag>{v}</Tag> },
    {
      title: 'Color', dataIndex: 'color', key: 'color',
      render: (color: string) => (
        <Tag style={{ background: color + '22', border: `1px solid ${color}`, color }}>{color}</Tag>
      )
    },
    { title: 'Active', dataIndex: 'isActive', key: 'isActive', render: (v: boolean) => <Switch checked={v} disabled size="small" /> },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: Line) => (
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
          <Typography.Title level={4} style={{ margin: 0, color: '#1565c0' }}>Line Management</Typography.Title>
          <Typography.Text type="secondary">Manage metro lines and their properties</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ borderRadius: 8 }}>Add Line</Button>
      </div>
      <Table
        dataSource={lines} columns={columns} rowKey="id" size="small"
        scroll={{ x: true }}
        style={{ borderRadius: 12, overflow: 'hidden' }}
        onRow={r => ({ style: { background: r.color + '12' } })}
      />
      <Modal title={editing ? 'Edit Line' : 'Add Line'} open={open} onOk={save} onCancel={() => setOpen(false)} okText="Save">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} autoComplete="off">
          <Form.Item name="code" label="Code" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="color" label="Color"><Input type="color" style={{ width: 80, padding: 2, borderRadius: 6 }} /></Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
