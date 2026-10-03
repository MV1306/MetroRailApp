import { useState, useEffect } from 'react';
import { Button, Form, Input, Typography, message, Steps, QRCode, Spin, Popconfirm } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import { getMfaStatus, getMfaSetup, enableMfa, disableMfa } from '../../api/auth';

export default function MfaSetupPage() {
  const [step, setStep] = useState(0);
  const [setup, setSetup] = useState<{ sharedKey: string; authenticatorUri: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [alreadyEnabled, setAlreadyEnabled] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    getMfaStatus()
      .then(({ data }) => { if (data.enabled) setAlreadyEnabled(true); })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const handleStart = async () => {
    setLoading(true);
    try {
      const { data } = await getMfaSetup();
      setSetup(data);
      setStep(1);
    } catch {
      messageApi.error('Failed to load setup. Make sure you are logged in.');
    } finally { setLoading(false); }
  };

  const handleEnable = async (values: { code: string }) => {
    setLoading(true);
    try {
      await enableMfa(values.code);
      setStep(2);
    } catch {
      messageApi.error('Invalid code. Try again.');
    } finally { setLoading(false); }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      await disableMfa();
      setAlreadyEnabled(false);
    } catch {
      messageApi.error('Failed to disable MFA.');
    } finally { setLoading(false); }
  };

  if (checking) return <div style={{ textAlign: 'center', marginTop: 80 }}><Spin size="large" /></div>;

  if (alreadyEnabled) return (
    <div style={{ maxWidth: 480, margin: '48px auto', padding: '0 24px', textAlign: 'center' }}>
      {contextHolder}
      <CheckCircleFilled style={{ fontSize: 56, color: '#52c41a', marginBottom: 16 }} />
      <Typography.Title level={3} style={{ color: '#0d47a1' }}>Two-Factor Auth is Active</Typography.Title>
      <Typography.Paragraph type="secondary">
        Your account is already protected with Google Authenticator.
        Every login will require a 6-digit code from the app.
      </Typography.Paragraph>
      <Popconfirm
        title="Disable Two-Factor Authentication?"
        description="You will no longer need a code to log in. This reduces your account security."
        okText="Yes, disable"
        okButtonProps={{ danger: true }}
        cancelText="Cancel"
        onConfirm={handleDisable}
      >
        <Button danger loading={loading} style={{ height: 44, borderRadius: 10, fontWeight: 600 }}>
          Disable Two-Factor Auth
        </Button>
      </Popconfirm>
    </div>
  );

  return (
    <div style={{ maxWidth: 480, margin: '48px auto', padding: '0 24px' }}>
      {contextHolder}
      <Typography.Title level={3} style={{ color: '#0d47a1' }}>Set Up Two-Factor Authentication</Typography.Title>
      <Steps current={step} style={{ marginBottom: 32 }} items={[
        { title: 'Start' },
        { title: 'Scan QR' },
        { title: 'Done' },
      ]} />

      {step === 0 && (
        <>
          <Typography.Paragraph type="secondary">
            Protect your account with Google Authenticator. You'll need the app installed on your phone.
          </Typography.Paragraph>
          <Button type="primary" loading={loading} onClick={handleStart}
            style={{ height: 44, borderRadius: 10, fontWeight: 600 }}>
            Get Started
          </Button>
        </>
      )}

      {step === 1 && setup && (
        <>
          <Typography.Paragraph type="secondary">
            Scan this QR code with Google Authenticator, then enter the 6-digit code to confirm.
          </Typography.Paragraph>
          <div style={{ marginBottom: 24 }}>
            <QRCode value={setup.authenticatorUri} size={200} />
          </div>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 12 }}>
            Can't scan? Enter this key manually: <Typography.Text code copyable>{setup.sharedKey}</Typography.Text>
          </Typography.Text>
          <Form onFinish={handleEnable} layout="vertical">
            <Form.Item name="code" rules={[{ required: true, len: 6, message: 'Enter the 6-digit code' }]}>
              <Input.OTP length={6} size="large" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}
              style={{ height: 44, borderRadius: 10, fontWeight: 600 }}>
              Verify & Enable
            </Button>
          </Form>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <Typography.Title level={4}>MFA Enabled!</Typography.Title>
          <Typography.Paragraph type="secondary">
            Your account is now protected. You'll be asked for a code from Google Authenticator on each login.
          </Typography.Paragraph>
        </>
      )}
    </div>
  );
}
