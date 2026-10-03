import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Select, InputNumber, Space, Typography, message, Tag, TimePicker, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminApi } from '../../api/admin';
import type { Line, LineTimetable } from '../../types';
import { useWindowSize } from '../../hooks/useWindowSize';

const DIRECTIONS = ['Forward', 'Backward'];
const DAY_TYPES = ['Weekday', 'Weekend'];

function fmtTime(hhmm: string) {
  return dayjs(`2000-01-01 ${hhmm}`).format('hh:mm A');
}

export default function TimetablePage() {
  const [lines, setLines] = useState<Line[]>([]);
  const [timetables, setTimetables] = useState<LineTimetable[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LineTimetable | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const { width } = useWindowSize();

  const load = () => adminApi.getTimetables().then(r => setTimetables(r.data));
  useEffect(() => { adminApi.getLines().then(r => setLines(r.data)); load(); }, []);

  const strToTime = (s: string) => dayjs(`2000-01-01 ${s}`);
  const timeToStr = (d: dayjs.Dayjs) => d.format('HH:mm');

  const openCreate = () => {
    setEditing(null); form.resetFields();
    form.setFieldsValue({
      peakFrequencyMinutes: 7, offPeakFrequencyMinutes: 12,
      peakWindows: [{ start: null, end: null }],
    });
    setOpen(true);
  };

  const openEdit = (t: LineTimetable) => {
    setEditing(t);
    form.setFieldsValue({
      ...t,
      firstDeparture: strToTime(t.firstDeparture),
      lastDeparture: strToTime(t.lastDeparture),
      peakWindows: t.peakWindows.map(w => ({
        start: strToTime(w.start),
        end: strToTime(w.end),
      })),
    });
    setOpen(true);
  };

  const save = async () => {
    const raw = await form.validateFields();
    const values = {
      ...raw,
      firstDeparture: timeToStr(raw.firstDeparture),
      lastDeparture: timeToStr(raw.lastDeparture),
      peakWindows: raw.peakWindows.map((w: { start: dayjs.Dayjs; end: dayjs.Dayjs }) => ({
        start: timeToStr(w.start),
        end: timeToStr(w.end),
      })),
    };
    if (editing) await adminApi.updateTimetable(editing.id, values);
    else await adminApi.createTimetable(values);
    setOpen(false); load(); messageApi.success('Saved');
  };

  const remove = async (id: number) => { await adminApi.deleteTimetable(id); load(); messageApi.success('Deleted'); };

  const lineMap = Object.fromEntries(lines.map(l => [l.id, l]));

  const columns = [
    {
      title: 'Line', dataIndex: 'lineId', key: 'line',
      render: (id: number, r: LineTimetable) => {
        const l = lineMap[id];
        return <Tag style={{ background: (l?.color ?? r.lineColor) + '22', border: `1px solid ${l?.color ?? r.lineColor}`, color: l?.color ?? r.lineColor }}>{r.lineName}</Tag>;
      }
    },
    {
      title: 'Direction / Day', key: 'dir',
      render: (_: unknown, r: LineTimetable) => (
        <Space size={4}>
          <Tag color="blue">{r.direction}</Tag>
          <Tag color="purple">{r.dayType}</Tag>
        </Space>
      )
    },
    {
      title: 'First / Last', key: 'times',
      render: (_: unknown, r: LineTimetable) => (
        <Typography.Text style={{ fontSize: 12 }}>{fmtTime(r.firstDeparture)} → {fmtTime(r.lastDeparture)}</Typography.Text>
      )
    },
    {
      title: 'Peak Windows', key: 'peak',
      render: (_: unknown, r: LineTimetable) => (
        <Space size={4} wrap>
          {r.peakWindows.map((w, i) => (
            <Tag key={i} color="orange" style={{ fontSize: 11 }}>
              {fmtTime(w.start)} – {fmtTime(w.end)}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: 'Frequency', key: 'freq',
      render: (_: unknown, r: LineTimetable) => (
        <Space size={4}>
          <Tag color="green">Peak: {r.peakFrequencyMinutes} min</Tag>
          <Tag color="volcano">Off-peak: {r.offPeakFrequencyMinutes} min</Tag>
        </Space>
      )
    },
    {
      title: 'Actions', key: 'actions', width: 90,
      render: (_: unknown, r: LineTimetable) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => remove(r.id)} />
        </Space>
      )
    },
  ];

  return (
    <div>
      {contextHolder}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0, color: '#1565c0' }}>Timetable Management</Typography.Title>
          <Typography.Text type="secondary">Set first/last train, peak windows and frequencies — train runs are auto-generated</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Timetable</Button>
      </div>

      <Table dataSource={timetables} columns={columns} rowKey="id" size="middle"
        scroll={{ x: true }}
        style={{ borderRadius: 12, overflow: 'hidden' }} />

      <Modal title={editing ? 'Edit Timetable' : 'Add Timetable'} open={open}
        onOk={save} onCancel={() => setOpen(false)} okText="Save" width={Math.min(580, width - 32)}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} autoComplete="off">

          <Row gutter={12}>
            <Col xs={24} sm={10}>
              <Form.Item name="lineId" label="Line" rules={[{ required: true }]}>
                <Select options={lines.map(l => ({ value: l.id, label: l.name }))} placeholder="Select line" />
              </Form.Item>
            </Col>
            <Col xs={12} sm={7}>
              <Form.Item name="direction" label="Direction" rules={[{ required: true }]}>
                <Select options={DIRECTIONS.map(d => ({ value: d, label: d }))} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={7}>
              <Form.Item name="dayType" label="Day Type" rules={[{ required: true }]}>
                <Select options={DAY_TYPES.map(d => ({ value: d, label: d }))} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={12} sm={12}>
              <Form.Item name="firstDeparture" label="First Train" rules={[{ required: true }]}>
                <TimePicker format="HH:mm" minuteStep={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={12}>
              <Form.Item name="lastDeparture" label="Last Train" rules={[{ required: true }]}>
                <TimePicker format="HH:mm" minuteStep={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Peak Windows" required>
            <Form.List name="peakWindows">
              {(fields, { add, remove: removeField }) => (
                <>
                  {fields.map(({ key, name }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item name={[name, 'start']} rules={[{ required: true, message: 'Start required' }]} style={{ margin: 0 }}>
                        <TimePicker format="HH:mm" minuteStep={1} placeholder="Start" style={{ width: 120 }} />
                      </Form.Item>
                      <Typography.Text type="secondary">to</Typography.Text>
                      <Form.Item name={[name, 'end']} rules={[{ required: true, message: 'End required' }]} style={{ margin: 0 }}>
                        <TimePicker format="HH:mm" minuteStep={1} placeholder="End" style={{ width: 120 }} />
                      </Form.Item>
                      {fields.length > 1 && (
                        <MinusCircleOutlined onClick={() => removeField(name)} style={{ color: '#ff4d4f' }} />
                      )}
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add({ start: null, end: null })} icon={<PlusOutlined />} size="small">
                    Add Peak Window
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Row gutter={12}>
            <Col xs={12} sm={12}>
              <Form.Item name="peakFrequencyMinutes" label="Peak Frequency" rules={[{ required: true }]}>
                <InputNumber min={1} max={60} style={{ width: '100%' }} addonAfter="min" />
              </Form.Item>
            </Col>
            <Col xs={12} sm={12}>
              <Form.Item name="offPeakFrequencyMinutes" label="Off-Peak Frequency" rules={[{ required: true }]}>
                <InputNumber min={1} max={60} style={{ width: '100%' }} addonAfter="min" />
              </Form.Item>
            </Col>
          </Row>

        </Form>
      </Modal>
    </div>
  );
}
