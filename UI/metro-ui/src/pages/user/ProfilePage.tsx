import { useEffect, useState } from 'react';
import { Form, Input, Button, Typography, message, Divider, Tag, Spin } from 'antd';
import {
  UserOutlined, LockOutlined, SafetyOutlined,
  CheckCircleFilled, CalendarOutlined,
} from '@ant-design/icons';
import { getProfile, updateProfile, changePassword } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { UserProfile } from '../../types';

export default function ProfilePage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [nameLoading, setNameLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [messageApi, ctx] = message.useMessage();
  const [nameForm] = Form.useForm();
  const [pwForm] = Form.useForm();

  useEffect(() => {
    getProfile()
      .then(({ data }) => {
        setProfile(data);
        nameForm.setFieldsValue({ fullName: data.fullName });
      })
      .catch(() => messageApi.error('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateName = async (values: { fullName: string }) => {
    setNameLoading(true);
    try {
      const { data } = await updateProfile(values.fullName);
      setProfile(data);
      // update auth context so navbar reflects new name
      if (user) login({ ...user, fullName: data.fullName });
      messageApi.success('Name updated successfully!');
    } catch {
      messageApi.error('Failed to update name.');
    } finally { setNameLoading(false); }
  };

  const handleChangePassword = async (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    setPwLoading(true);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      messageApi.success('Password changed successfully!');
      pwForm.resetFields();
    } catch (err: unknown) {
      messageApi.error((err as any)?.response?.data?.error ?? 'Failed to change password.');
    } finally { setPwLoading(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 80 }}><Spin size="large" /></div>;

  return (
    <div className="page-bg">
      {ctx}
      <div className="page-header">
        <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Typography.Title level={2} style={{ color: '#fff', margin: '0 0 4px', fontWeight: 800 }}>
            👤 My Profile
          </Typography.Title>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>
            Manage your account details
          </Typography.Text>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 12px 48px' }}>

        {/* Account info card */}
        <div className="glass-card fade-up" style={{ padding: 'clamp(16px,4vw,24px)', marginTop: -20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #1565c0, #0288d1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff', fontWeight: 800, flexShrink: 0 }}>
              {profile?.fullName?.[0]?.toUpperCase() ?? <UserOutlined />}
            </div>
            <div>
              <Typography.Text strong style={{ fontSize: 17, display: 'block', color: '#0d47a1' }}>
                {profile?.fullName}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>{profile?.email}</Typography.Text>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: '#f0f4ff', border: '1px solid #c7d7f8' }}>
              <CalendarOutlined style={{ color: '#1565c0', fontSize: 13 }} />
              <Typography.Text style={{ fontSize: 12, color: '#475569' }}>
                Member since {new Date(profile?.createdAt ?? '').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </Typography.Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: profile?.mfaEnabled ? '#f0fdf4' : '#fff7ed', border: `1px solid ${profile?.mfaEnabled ? '#bbf7d0' : '#fed7aa'}` }}>
              {profile?.mfaEnabled
                ? <CheckCircleFilled style={{ color: '#16a34a', fontSize: 13 }} />
                : <SafetyOutlined style={{ color: '#ea580c', fontSize: 13 }} />}
              <Typography.Text style={{ fontSize: 12, color: profile?.mfaEnabled ? '#16a34a' : '#ea580c' }}>
                2FA {profile?.mfaEnabled ? 'Enabled' : 'Disabled'}
              </Typography.Text>
            </div>
            {!profile?.mfaEnabled && (
              <button
                onClick={() => navigate('/mfa-setup')}
                style={{ padding: '6px 12px', borderRadius: 8, background: '#1565c0', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Enable 2FA
              </button>
            )}
          </div>
        </div>

        {/* Edit name */}
        <div className="glass-card fade-up" style={{ padding: 'clamp(16px,4vw,24px)', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <UserOutlined style={{ color: '#1565c0' }} />
            <Typography.Text strong style={{ fontSize: 15, color: '#1a237e' }}>Edit Name</Typography.Text>
          </div>
          <Form form={nameForm} layout="vertical" onFinish={handleUpdateName}>
            <Form.Item
              name="fullName"
              label="Full Name"
              rules={[{ required: true, message: 'Name is required' }, { max: 100 }]}
            >
              <Input size="large" prefix={<UserOutlined style={{ color: '#94a3b8' }} />} style={{ borderRadius: 8 }} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={nameLoading}
              style={{ height: 42, borderRadius: 8, fontWeight: 600, background: 'linear-gradient(135deg, #1565c0, #0288d1)', border: 'none' }}>
              Save Changes
            </Button>
          </Form>
        </div>

        {/* Change password */}
        <div className="glass-card fade-up" style={{ padding: 'clamp(16px,4vw,24px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <LockOutlined style={{ color: '#1565c0' }} />
            <Typography.Text strong style={{ fontSize: 15, color: '#1a237e' }}>Change Password</Typography.Text>
          </div>
          <Form form={pwForm} layout="vertical" onFinish={handleChangePassword}>
            <Form.Item
              name="currentPassword"
              label="Current Password"
              rules={[{ required: true, message: 'Enter your current password' }]}
            >
              <Input.Password size="large" prefix={<LockOutlined style={{ color: '#94a3b8' }} />} style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[{ required: true, min: 8, message: 'Minimum 8 characters' }]}
            >
              <Input.Password size="large" prefix={<LockOutlined style={{ color: '#94a3b8' }} />} style={{ borderRadius: 8 }} />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confirm New Password"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password size="large" prefix={<LockOutlined style={{ color: '#94a3b8' }} />} style={{ borderRadius: 8 }} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={pwLoading}
              style={{ height: 42, borderRadius: 8, fontWeight: 600, background: 'linear-gradient(135deg, #1565c0, #0288d1)', border: 'none' }}>
              Change Password
            </Button>
          </Form>
        </div>

      </div>
    </div>
  );
}
