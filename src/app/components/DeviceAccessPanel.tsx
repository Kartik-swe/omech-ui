'use client';

import { useState } from 'react';
import { Alert, Button, Card, Form, Input, Result, Typography } from 'antd';
import { MobileOutlined, ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { DeviceStatusInfo, requestDeviceAccess, suggestDeviceName } from '@/utils/device';

const { Paragraph, Text } = Typography;

interface Props {
  status: DeviceStatusInfo;
  /** Re-check status with the server (e.g. after an admin approved this device). */
  onRecheck: () => Promise<void> | void;
  /** Username typed on the login form, to pre-fill the request. */
  initialUsername?: string;
  /** Go back to the normal login form. */
  onBack?: () => void;
}

const reasonText: Record<string, string> = {
  NONE: 'You are outside the office network. To use Omech on this device, register it once - an admin then approves it.',
  EXPIRED: 'The approval for this device has expired (approvals last 30 days). Ask an admin to renew it, or send a new request.',
  REJECTED: 'The request for this device was rejected. You can send a new request, or contact your admin.',
  REVOKED: 'Access for this device was revoked. You can send a new request, or contact your admin.',
};

/**
 * Shown on the login page when the browser is NOT on an allowed IP and has no
 * approved device. Offices on allowed IPs never see this.
 */
const DeviceAccessPanel = ({ status, onRecheck, initialUsername, onBack }: Props) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const recheck = async () => {
    setChecking(true);
    try {
      await onRecheck();
    } finally {
      setChecking(false);
    }
  };

  const onFinish = async (values: { username: string; password: string; deviceName: string }) => {
    setSubmitting(true);
    setError('');
    const res = await requestDeviceAccess(values.username.trim(), values.password, values.deviceName.trim());
    setSubmitting(false);
    if (res.ok) {
      form.resetFields();
      await onRecheck(); // now shows "waiting for approval"
    } else {
      setError(res.msg);
    }
  };

  if (status.DEVICE_STATUS === 'PENDING') {
    return (
      <Card className="w-full max-w-md shadow-lg rounded-lg">
        <Result
          icon={<ClockCircleOutlined style={{ color: '#faad14' }} />}
          title="Waiting for admin approval"
          subTitle={
            <>
              Your request for <Text strong>{status.DEVICE_NAME || 'this device'}</Text> has been sent.
              Once an admin approves it, tap the button below to continue to login.
            </>
          }
          extra={
            <>
              <Button type="primary" icon={<ReloadOutlined />} loading={checking} onClick={recheck}>
                Check again
              </Button>
              {onBack && <Button type="link" onClick={onBack}>Back to login</Button>}
            </>
          }
        />
      </Card>
    );
  }

  return (
    <Card
      className="w-full max-w-md shadow-lg rounded-lg"
      title={<span><MobileOutlined /> Register this device</span>}
    >
      <Paragraph type="secondary">{reasonText[status.DEVICE_STATUS] || reasonText.NONE}</Paragraph>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ username: initialUsername || '', deviceName: suggestDeviceName() }}
      >
        <Form.Item label="Username" name="username" rules={[{ required: true, message: 'Please enter your username' }]}>
          <Input autoComplete="username" />
        </Form.Item>
        <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Please enter your password' }]}>
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Form.Item
          label="Device name"
          name="deviceName"
          tooltip="So the admin knows which device this is, e.g. 'Ramesh - iPhone'"
          rules={[
            { required: true, message: 'Please name this device' },
            { max: 100, message: 'Max 100 characters' },
          ]}
        >
          <Input placeholder="e.g. Ramesh - iPhone" />
        </Form.Item>

        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

        <Form.Item style={{ marginBottom: 8 }}>
          <Button type="primary" htmlType="submit" loading={submitting} block>
            Request access
          </Button>
        </Form.Item>
      </Form>

      <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
        Each user can register up to 2 devices. Clearing browser data or switching browser means registering again.
      </Paragraph>
      {onBack && (
        <Button type="link" onClick={onBack} style={{ paddingLeft: 0 }}>
          Back to login
        </Button>
      )}
    </Card>
  );
};

export default DeviceAccessPanel;
