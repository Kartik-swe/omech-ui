"use client";
import React, { useState, useEffect } from 'react';
import {
  Tabs, Card, Table, Row, Col, Button, Select, DatePicker, Statistic,
  Tag, Modal, Progress, Tooltip, Timeline, Input, Space, Divider,
  Typography, Alert, Dropdown, Menu, Grid, Empty,
  notification,
  Form,
  message
} from 'antd';
import { Column, Pie } from '@ant-design/charts';
import {
  DownloadOutlined, PrinterOutlined, FilePdfOutlined, FileExcelOutlined,
  FilterOutlined, InfoCircleOutlined, WarningOutlined, BellOutlined,
  SearchOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { apiClient } from '@/utils/apiClient';
import { getCookieData } from '@/utils/common';

const { TabPane } = Tabs;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

const sampleOrders = [
  { key: 1, po: 'PO001', ITEM_TYPE: 'PIPE', qty: 400, weight: 960, status: 'Pending', grade: 'A', party: 'ABC Ltd', date: '2025-07-01' },
  { key: 2, po: 'PO002', ITEM_TYPE: 'SHEET', qty: 0, weight: 1200, status: 'Dispatched', grade: 'B', party: 'XYZ Corp', date: '2025-07-02' },
  { key: 3, po: 'PO003', ITEM_TYPE: 'COIL', qty: 0, weight: 3000, status: 'Rejected', grade: 'C', party: 'Metal Co', date: '2025-07-03' },
  { key: 4, po: 'PO004', ITEM_TYPE: 'PIPE', qty: 600, weight: 1480, status: 'Dispatched', grade: 'A', party: 'ABC Ltd', date: '2025-07-04' },
  { key: 5, po: 'PO005', ITEM_TYPE: 'PIPE', qty: 0, weight: 10, status: 'Rejected', grade: 'D', party: 'Other', date: '2025-07-05' },
];

const openNotification = (msg: string) => {
  const key = `open${Date.now()}`;
  notification.destroy();
  notification.info({
    message: '✅ Action Done',
    description: msg,
    key,
    placement: 'bottomRight',
    duration: 2,
  });
};

export default function Dashboard() {
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [orders, setOrders] = useState<any[]>(sampleOrders);
  const [loading, setLoading] = useState(false);
  const [SearchForm] = Form.useForm();
  const cookiesData = getCookieData();
    const { USER_SRNO, API_BASE_URL, UT_SRNO } = cookiesData;
  const screens = useBreakpoint();

  const filteredData = sampleOrders.filter(po =>
    (selectedType === 'ALL' || po.ITEM_TYPE === selectedType) &&
    (po.po.toLowerCase().includes(searchText.toLowerCase()) ||
      po.party.toLowerCase().includes(searchText.toLowerCase()))
  );

  const poColumns = [
    { title: 'PO Number', dataIndex: 'po' },
    { title: 'Type', dataIndex: 'ITEM_TYPE' },
    { title: 'Party', dataIndex: 'party' },
    { title: 'Grade', dataIndex: 'grade' },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status:any) => (
        <Tag
          icon={
            status === 'Pending' ? <WarningOutlined /> :
            status === 'Rejected' ? <InfoCircleOutlined /> :
            <CheckCircleOutlined />
          }
          color={
            ({ Pending: 'orange', Dispatched: 'green', Rejected: 'red' } as any)[status]
          }
        >
          {status}
        </Tag>
      )
    },
    { title: 'Qty', dataIndex: 'qty' },
    { title: 'Weight (kg)', dataIndex: 'weight' },
  ];

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('dashboard_filters') || '{}');
    if (saved.selectedType) setSelectedType(saved.selectedType);
    if (saved.searchText) setSearchText(saved.searchText);
  }, []);

  useEffect(() => {
    localStorage.setItem('dashboard_filters', JSON.stringify({ selectedType, searchText }));
  }, [selectedType, searchText]);


  const getPosDashboard = async () => {
  setLoading(true);
  const values = SearchForm.getFieldsValue();
  const { ITEM_TYPE, TXT_SEARCH, dateRange } = values;

  const fromDate = dateRange?.[0]?.format('YYYY-MM-DD') || '';
  const toDate = dateRange?.[1]?.format('YYYY-MM-DD') || '';

  try {
    const query = new URLSearchParams({
      USER_SRNO: USER_SRNO.toString(),
      UT_SRNO: UT_SRNO.toString(),
      ITEM_TYPE: ITEM_TYPE || 'ALL',
      TXT_SEARCH: TXT_SEARCH || '',
      FROM_DATE: fromDate,
      TO_DATE: toDate
    }).toString();

    const response = await apiClient(`${API_BASE_URL}DsPo?${query}`, 'GET');

    if (response.msgId === 200 && response.data) {
      setOrders(response.data);
    } else {
      message.error(response.msg || 'Failed to load purchase orders');
    }
  } catch (err) {
    console.error(err);
    message.error('API call failed');
  } finally {
    setLoading(false);
  }
};




  const totalWeight = filteredData.reduce((sum, o) => sum + o.weight, 0);
  const dispatchedWeight = filteredData.filter(o => o.status === 'Dispatched').reduce((sum, o) => sum + o.weight, 0);
  const rejectedWeight = filteredData.filter(o => o.status === 'Rejected').reduce((sum, o) => sum + o.weight, 0);

  const weightByType = ['PIPE', 'SHEET', 'COIL'].map(ITEM_TYPE => ({
    ITEM_TYPE,
    weight: filteredData.filter(o => o.ITEM_TYPE === ITEM_TYPE).reduce((sum, o) => sum + o.weight, 0)
  }));

  const poWeightData = filteredData.map(o => ({ po: o.po, weight: o.weight }));
  const poTypeDistribution = ['PIPE', 'SHEET', 'COIL'].map(ITEM_TYPE => ({ ITEM_TYPE, count: filteredData.filter(o => o.ITEM_TYPE === ITEM_TYPE).length }));

  return (
    <div className="p-4">
      <Title level={3}>📊 Purchase Order Dashboard</Title>

      <Card className="mb-4" bordered>
       <Form form={SearchForm} layout="inline" onFinish={getPosDashboard}>
  <Row gutter={16} align="middle">
    <Col span={6}>
      <Form.Item name="dateRange">
        <RangePicker style={{ width: '100%' }} />
      </Form.Item>
    </Col>

    <Col span={6}>
      <Form.Item name="ITEM_TYPE" initialValue="ALL">
        <Select
          style={{ width: '100%' }}
          options={['ALL', 'PIPE', 'SHEET', 'COIL'].map(ITEM_TYPE => ({ label: ITEM_TYPE, value: ITEM_TYPE }))}
        />
      </Form.Item>
    </Col>

    <Col span={8}>
      <Form.Item name="TXT_SEARCH">
        <Input placeholder="Search PO / Party" prefix={<SearchOutlined />} allowClear />
      </Form.Item>
    </Col>

    <Col span={4}>
      <Button type="primary" icon={<FilterOutlined />} htmlType="submit" block>
        Apply Filters
      </Button>
    </Col>
  </Row>
</Form>


      </Card>

      <Row gutter={16} className="mb-4">
        <Col span={6}><Card title="Total Weight (kg)" bordered><Statistic value={totalWeight} /></Card></Col>
        <Col span={6}><Card title="Dispatched Weight (kg)" bordered><Statistic value={dispatchedWeight} valueStyle={{ color: 'green' }} /></Card></Col>
        <Col span={6}><Card title="Rejected Weight (kg)" bordered><Statistic value={rejectedWeight} valueStyle={{ color: 'red' }} /></Card></Col>
        <Col span={6}><Card title="Type-wise Weights" bordered>
          {weightByType.map(w => (<div key={w.ITEM_TYPE}><Text strong>{w.ITEM_TYPE}</Text>: {w.weight} kg</div>))}
        </Card></Col>
      </Row>

      <Tabs defaultActiveKey="1">
        <TabPane tab="Overview" key="1">
          <Row gutter={16}>
            {['Pending', 'Dispatched', 'Rejected'].map(status => {
              const percent = Math.round(filteredData.filter(o => o.status === status).length / filteredData.length * 100 || 0);
              return (
                <Col span={8} key={status}>
                  <Card title={`${status} Orders`} bordered>
                    <Progress percent={percent} status={status === 'Rejected' ? 'exception' : 'active'} />
                  </Card>
                </Col>
              );
            })}
          </Row>

          <Row gutter={16} className="mt-4">
            <Col span={12}><Card title="PO Weight Distribution"><Column data={poWeightData} xField="po" yField="weight" /></Card></Col>
            <Col span={12}><Card title="PO Type Distribution">
              <Pie 
              data={poTypeDistribution} 
              angleField="count" 
              colorField="ITEM_TYPE"  
              label={{
    content: '{name}: {value}',
  }}  
                    />
                    </Card>
                  </Col>
          </Row>
        </TabPane>

        <TabPane tab="Reports" key="2">
          <Card title="All Filtered POs" bordered>
            {filteredData.length > 0 ? (
              <Table columns={poColumns} dataSource={filteredData} pagination={{ pageSize: 5 }} rowKey="key" />
            ) : (
              <Empty description="No POs match your filters" />
            )}
          </Card>
        </TabPane>

        <TabPane tab="Rejects" key="3">
          <Card title="Daily Rejections"><Empty description="No Rejection Chart" /></Card>
        </TabPane>

        <TabPane tab="Timeline" key="4">
          <Card title="PO Activity Log">
            <Timeline mode="left">
              <Timeline.Item label="2025-07-01">PO001 created</Timeline.Item>
              <Timeline.Item label="2025-07-02">PO002 dispatched</Timeline.Item>
              <Timeline.Item label="2025-07-03">PO003 rejected</Timeline.Item>
              <Timeline.Item label="2025-07-04">PO004 dispatched</Timeline.Item>
              <Timeline.Item label="2025-07-05">PO005 delayed</Timeline.Item>
            </Timeline>
          </Card>
        </TabPane>
      </Tabs>

      <Modal title="🖨 Print Preview" open={showPrintPreview} onCancel={() => setShowPrintPreview(false)} footer={null}>
        <p>This is a preview for printing your PO report.</p>
        <Button type="primary" icon={<PrinterOutlined />}>Print Now</Button>
      </Modal>
    </div>
  );
}
