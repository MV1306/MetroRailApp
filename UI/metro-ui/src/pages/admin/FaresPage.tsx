import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, InputNumber, Space, Typography, message, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { adminApi } from '../../api/admin';
import type { FareRule } from '../../types';

const fareColors = ['#52c41a', '#1677ff', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2'];

export default function FaresPage() {
  const [fares, setFares] = useState<FareRule[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FareRule | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const load = () => adminApi.getFares().then(r => setFares(r.data));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); form.resetFields(); setOpen(true); };
  const openEdit = (f: FareRule) => { setEditing(f); form.setFieldsValue(f); setOpen(true); };

  const save = async () => {
    const values = await form.validateFields();
    if (editing) await adminApi.updateFare(editing.id, values);
    else await adminApi.createFare(values);
    setOpen(false); load(); messageApi.success('Saved');
  };

  const remove = async (id: number) => { await adminApi.deleteFare(id); load(); messageApi.success('Deleted'); };

  const columns = [
    {
      title: 'Distance Range', key: 'range',
      render: (_: unknown, r: FareRule, i: number) => {
        const color = fareColors[i % fareColors.length];
        return (
          <Tag style={{ background: color + '18', border: `1px solid ${color}`, color, fontWeight: 600, fontSize: 13, padding: '3px 10px' }}>
            {r.minDistanceKm} – {r.maxDistanceKm} km
          </Tag>
        );
      }
    },
    {
      title: 'Fare', dataIndex: 'fare', key: 'fare',
      render: (v: number, _: FareRule, i: number) => {
        const color = fareColors[i % fareColors.length];
        return (
          <Typography.Text strong style={{ fontSize: 18, color }}>₹{v}</Typography.Text>
        );
      }
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: FareRule) => (
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
          <Typography.Title level={4} style={{ margin: 0, color: '#1565c0' }}>Fare Management</Typography.Title>
          <Typography.Text type="secondary">Distance-based fare slabs — stored in DB, not hardcoded</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ borderRadius: 8 }}>Add Fare Rule</Button>
      </div>
      <Table
        dataSource={fares} columns={columns} rowKey="id" size="middle"
        scroll={{ x: true }}
        style={{ borderRadius: 12, overflow: 'hidden' }}
        onRow={(_, i) => {
          const color = fareColors[(i ?? 0) % fareColors.length];
          return { style: { background: color + '0a' } };
        }}
      />
      <Modal title={editing ? 'Edit Fare Rule' : 'Add Fare Rule'} open={open} onOk={save} onCancel={() => setOpen(false)} okText="Save">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} autoComplete="off">
          <Form.Item name="minDistanceKm" label="Min Distance (km)" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} addonAfter="km" />
          </Form.Item>
          <Form.Item name="maxDistanceKm" label="Max Distance (km)" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} addonAfter="km" />
          </Form.Item>
          <Form.Item name="fare" label="Fare (₹)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} addonBefore="₹" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
