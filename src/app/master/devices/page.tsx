'use client';

import { useEffect, useState } from 'react';
import { Alert, Button, Card, Popconfirm, Space, Table, Tabs, Tag, Tooltip, Typography, message } from 'antd';
import { CheckOutlined, CloseOutlined, ReloadOutlined, StopOutlined, SyncOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { apiClient } from '@/utils/apiClient';

const { Text } = Typography;

interface DeviceRow {
  DEVICE_SRNO: number;
  USER_SRNO: number;
  USERNAME: string;
  FULL_NAME: string | null;
  DEVICE_NAME: string;
  DEVICE_STATUS: 'PENDING' | 'APPROVED' | 'EXPIRED' | 'REJECTED' | 'REVOKED';
  REQUESTED_AT: string;
  REQUEST_IP: string | null;
  USER_AGENT: string | null;
  EXPIRES_AT: string | null;
  LAST_SEEN_AT: string | null;
  LAST_SEEN_IP: string | null;
  ACTION_AT: string | null;
  ACTION_BY_NAME: string | null;
}

type DeviceAction = 'APPROVE' | 'RENEW' | 'REJECT' | 'REVOKE';

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'gold',
  APPROVED: 'green',
  EXPIRED: 'orange',
  REJECTED: 'default',
  REVOKED: 'red',
};

const TABS = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'EXPIRED', label: 'Expired' },
  { key: 'ALL', label: 'All' },
];

const fmt = (v: string | null) => (v ? new Date(v).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-');

const DEVICE_API = () => `${process.env.NEXT_PUBLIC_API_BASE_URL}api/device/`;

const DevicesPage = () => {
  const [tab, setTab] = useState('PENDING');
  const [rows, setRows] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notAllowed, setNotAllowed] = useState('');

  const load = async (tabKey = tab) => {
    setLoading(true);
    const status = tabKey === 'ALL' ? '' : tabKey;
    const res = await apiClient<{ Table: DeviceRow[] }>(
      `${DEVICE_API()}list${status ? `?DEVICE_STATUS=${status}` : ''}`,
      'GET'
    );
    setLoading(false);
    if (res.msgId === 200) {
      setNotAllowed('');
      setRows(res.data?.Table || []);
    } else if (res.msgId === 403) {
      setNotAllowed(res.msg);
      setRows([]);
    } else if (res.msgId !== -1) {
      message.error(res.msg || 'Failed to load devices');
    }
  };

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const act = async (row: DeviceRow, action: DeviceAction) => {
    setBusyId(row.DEVICE_SRNO);
    const res = await apiClient(`${DEVICE_API()}action`, 'POST', { DEVICE_SRNO: row.DEVICE_SRNO, ACTION: action });
    setBusyId(null);
    if (res.msgId === 200) {
      message.success(res.msg);
      load();
    } else if (res.msgId !== -1) {
      message.error(res.msg || 'Action failed');
    }
  };

  const columns: ColumnsType<DeviceRow> = [
    {
      title: 'User',
      key: 'user',
      render: (_, r) => (
        <>
          <Text strong>{r.USERNAME}</Text>
          {r.FULL_NAME ? <div style={{ fontSize: 12, color: '#888' }}>{r.FULL_NAME}</div> : null}
        </>
      ),
    },
    {
      title: 'Device',
      dataIndex: 'DEVICE_NAME',
      render: (v: string, r) => (
        <Tooltip title={r.USER_AGENT || ''}>
          <span>{v}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'DEVICE_STATUS',
      render: (v: string) => <Tag color={STATUS_COLOR[v] || 'default'}>{v}</Tag>,
    },
    { title: 'Requested', dataIndex: 'REQUESTED_AT', render: (v: string, r) => <>{fmt(v)}<div style={{ fontSize: 12, color: '#888' }}>{r.REQUEST_IP || ''}</div></> },
    { title: 'Valid until', dataIndex: 'EXPIRES_AT', render: (v: string | null) => fmt(v) },
    { title: 'Last used', dataIndex: 'LAST_SEEN_AT', render: (v: string | null, r) => <>{fmt(v)}<div style={{ fontSize: 12, color: '#888' }}>{r.LAST_SEEN_IP || ''}</div></> },
    { title: 'By', dataIndex: 'ACTION_BY_NAME', render: (v: string | null) => v || '-' },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      render: (_, r) => {
        const busy = busyId === r.DEVICE_SRNO;
        if (r.DEVICE_STATUS === 'PENDING') {
          return (
            <Space>
              <Button type="primary" size="small" icon={<CheckOutlined />} loading={busy} onClick={() => act(r, 'APPROVE')}>
                Approve
              </Button>
              <Popconfirm title="Reject this request?" onConfirm={() => act(r, 'REJECT')}>
                <Button size="small" danger icon={<CloseOutlined />} disabled={busy}>
                  Reject
                </Button>
              </Popconfirm>
            </Space>
          );
        }
        if (r.DEVICE_STATUS === 'APPROVED' || r.DEVICE_STATUS === 'EXPIRED') {
          return (
            <Space>
              <Tooltip title="Valid for 30 more days from today">
                <Button size="small" icon={<SyncOutlined />} loading={busy} onClick={() => act(r, 'RENEW')}>
                  Renew
                </Button>
              </Tooltip>
              <Popconfirm title="Revoke this device? It loses access within a minute." onConfirm={() => act(r, 'REVOKE')}>
                <Button size="small" danger icon={<StopOutlined />} disabled={busy}>
                  Revoke
                </Button>
              </Popconfirm>
            </Space>
          );
        }
        return <Text type="secondary">-</Text>;
      },
    },
  ];

  return (
    <div className="p-6">
      <Card
        title="Registered Devices"
        variant="borderless"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => load()} loading={loading}>
            Refresh
          </Button>
        }
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Phones and other devices outside the office network must be approved here before they can open Omech. Approvals last 30 days; max 2 devices per user. Office computers are not affected."
        />

        {notAllowed ? (
          <Alert type="warning" showIcon message={notAllowed} />
        ) : (
          <>
            <Tabs activeKey={tab} onChange={setTab} items={TABS} />
            <Table
              rowKey="DEVICE_SRNO"
              columns={columns}
              dataSource={rows}
              loading={loading}
              scroll={{ x: 'max-content' }}
              pagination={{ pageSize: 20, hideOnSinglePage: true }}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default DevicesPage;
