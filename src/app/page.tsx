// src/app/dashboard/page.tsx

'use client';
import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Table, Timeline, Tag, Typography, Space, Spin, DatePicker, Select, Button } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  UserOutlined,
  BarChartOutlined,
  AlertOutlined,
  TeamOutlined,
  LineChartOutlined,
  DashboardOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { apiClient } from '@/utils/apiClient';
import { getCookieData } from '@/utils/common';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

// Helper function to get color by index with a consistent palette
const getColorByIndex = (index: number): string => {
  const palette = [
    'var(--primary)', 
    'var(--secondary)', 
    'var(--success)', 
    'var(--warning)', 
    'var(--error)', 
    'var(--info)'
  ];
  return palette[index % palette.length];
};

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [productionData, setProductionData] = useState<any[]>([
    { date: '2023-01', value: 500, type: 'Production' },
    { date: '2023-02', value: 450, type: 'Production' },
    { date: '2023-03', value: 600, type: 'Production' },
    { date: '2023-04', value: 700, type: 'Production' },
    { date: '2023-05', value: 650, type: 'Production' },
    { date: '2023-06', value: 800, type: 'Production' },
    { date: '2023-07', value: 750, type: 'Production' },
    { date: '2023-01', value: 450, type: 'Target' },
    { date: '2023-02', value: 450, type: 'Target' },
    { date: '2023-03', value: 500, type: 'Target' },
    { date: '2023-04', value: 500, type: 'Target' },
    { date: '2023-05', value: 550, type: 'Target' },
    { date: '2023-06', value: 550, type: 'Target' },
    { date: '2023-07', value: 600, type: 'Target' },
  ]);

  const [inventoryData, setInventoryData] = useState<any[]>([
    { key: '1', grade: '304L', size: '2.0mm', stock: 45, status: 'In Stock', name: '304L', value: 45 },
    { key: '2', grade: '316L', size: '1.5mm', stock: 20, status: 'Low Stock', name: '316L', value: 20 },
    { key: '3', grade: '409', size: '3.0mm', stock: 15, status: 'Low Stock', name: '409', value: 15 },
    { key: '4', grade: '441', size: '2.5mm', stock: 20, status: 'In Stock', name: '441', value: 20 },
  ]);

  const [shiftData, setShiftData] = useState({
    currentShift: 'Morning Shift',
    activities: [
      {
        key: '1',
        time: '10:30 AM',
        activity: 'Production started',
        machine: 'Machine A',
        user: 'John Doe',
        type: 'production'
      },
      {
        key: '2',
        time: '11:45 AM',
        activity: 'Maintenance check',
        machine: 'Machine B',
        user: 'Jane Smith',
        type: 'maintenance'
      },
      {
        key: '3',
        time: '01:15 PM',
        activity: 'Inventory updated',
        machine: '',
        user: 'Mike Johnson',
        type: 'inventory'
      },
    ],
    timeline: [
      {
        title: 'Shift Start',
        time: '8:00 AM',
        description: 'Morning shift started with 12 workers',
        status: 'success'
      },
      {
        title: 'Production Goal Set',
        time: '8:30 AM',
        description: 'Daily target: 500 units',
        status: 'info'
      },
      {
        title: 'Machine Maintenance',
        time: '10:15 AM',
        description: 'Emergency maintenance on Machine C',
        status: 'error'
      },
      {
        title: 'Production Milestone',
        time: '12:30 PM',
        description: '250 units completed (50% of daily target)',
        status: 'success'
      },
    ]
  });
  
  const [summaryStats, setSummaryStats] = useState({
    activeMachines: 10,
    productionRate: 500,
    productionChange: 15,
    inventoryItems: 1500,
    lowStockItems: 3
  });
  
  const cookiesData = getCookieData();
  const { USER_SRNO, API_BASE_URL, UT_SRNO } = cookiesData;
  
  useEffect(() => {
    if (!USER_SRNO) {
      router.replace('/logout');
    }else{
      router.replace('/materials');
    }
  }, [USER_SRNO, router]);
  
  useEffect(() => {
    // In a real implementation, you would fetch data from your API
    fetchDashboardData();
  }, []);
  
  // Function to fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Simulate API call with a delay
      setTimeout(() => {
        // In a real implementation, you would make an actual API call
        // const response = await apiClient(`${API_BASE_URL}DtDashboard?USER_SRNO=${USER_SRNO}`, 'GET');
        // if (response.msgId === 200 && response.data) {
        //   setProductionData(response.data.productionTrends);
        //   setInventoryData(response.data.inventoryItems);
        //   setShiftData(response.data.currentShifts);
        //   setSummaryStats(response.data.summaryStats);
        // }
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  // No longer need a separate chart config as we'll use Recharts directly in JSX

  return (
    <div style={{ padding: 24 }}>
      <div className="dashboard-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4}>
            <DashboardOutlined /> Dashboard Overview
          </Title>
          <Text type="secondary">Welcome to the  system dashboard</Text>
        </div>
        <DatePicker.RangePicker 
          style={{ width: 300 }}
          onChange={(dates) => {
            // In a real implementation, you would fetch data based on date range
            // fetchDashboardData(dates[0], dates[1]);
          }}
        />
      </div>
      
      <Spin spinning={loading}>
        {/* Top Row: Production and Inventory Overview */}
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={8}>
            <Card 
              className="dashboard-stat-card" 
              hoverable
              style={{ height: '100%' }}
            >
              <Statistic
                title={<Text strong>Active Machines</Text>}
                value={summaryStats.activeMachines}
                prefix={<BarChartOutlined style={{ fontSize: 24, color: 'var(--primary)' }} />}
                valueStyle={{ color: 'var(--primary)', fontSize: 28 }}
              />
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>All machines operational</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card 
              className="dashboard-stat-card" 
              hoverable
              style={{ height: '100%' }}
            >
              <Statistic
                title={<Text strong>Production Rate (Today)</Text>}
                value={summaryStats.productionRate}
                suffix="units"
                prefix={<LineChartOutlined style={{ fontSize: 24, color: 'var(--secondary)' }} />}
                valueStyle={{ color: 'var(--secondary)', fontSize: 28 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                {summaryStats.productionChange > 0 ? (
                  <ArrowUpOutlined style={{ color: 'var(--success)' }} />
                ) : (
                  <ArrowDownOutlined style={{ color: 'var(--error)' }} />
                )}
                <Text type="secondary" style={{ marginLeft: 4 }}>
                  {Math.abs(summaryStats.productionChange)}% from yesterday
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card 
              className="dashboard-stat-card" 
              hoverable
              style={{ height: '100%' }}
            >
              <Statistic
                title={<Text strong>Inventory Status</Text>}
                value={summaryStats.inventoryItems}
                suffix="items"
                prefix={<AlertOutlined style={{ fontSize: 24, color: 'var(--warning)' }} />}
                valueStyle={{ color: 'var(--warning)', fontSize: 28 }}
              />
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                {summaryStats.lowStockItems} items low in stock
              </Text>
            </Card>
          </Col>
        </Row>

      {/* Middle Row: Graphs for Production Trends & Inventory */}
      <div className="section-header" style={{ margin: '32px 0 16px' }}>
        <Space>
          <BarChartOutlined style={{ fontSize: 20, color: 'var(--primary)' }} />
          <Title level={5} style={{ margin: 0 }}>Production and Inventory Trends</Title>
        </Space>
      </div>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card 
            title={<Space><LineChartOutlined /> Production Trends</Space>}
            className="chart-card"
            hoverable
            extra={<Select 
              defaultValue="week" 
              style={{ width: 120 }}
              options={[
                { value: 'day', label: 'Daily' },
                { value: 'week', label: 'Weekly' },
                { value: 'month', label: 'Monthly' },
              ]}
              onChange={(value) => {
                // In a real implementation, you would update chart data based on selection
                // updateProductionChartData(value);
              }}
            />}
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={productionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  }}
                />
                <YAxis tickFormatter={(value) => `${value} units`} />
                <Tooltip formatter={(value) => [`${value} units`, 'Production']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--primary)" 
                  strokeWidth={2}
                  name="Production"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            title={<Space><InfoCircleOutlined /> Inventory Overview</Space>}
            className="table-card"
            hoverable
            extra={<Select 
              defaultValue="all" 
              style={{ width: 120 }}
              options={[
                { value: 'all', label: 'All Items' },
                { value: 'raw', label: 'Raw Materials' },
                { value: 'finished', label: 'Finished Goods' },
              ]}
              onChange={(value) => {
                // In a real implementation, you would update chart data based on selection
                // updateInventoryChartData(value);
              }}
            />}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={inventoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {inventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColorByIndex(index)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} units`, 'Stock']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Bottom Row: Staff Information and Alerts */}
      <div className="section-header" style={{ margin: '32px 0 16px' }}>
        <Space>
          <TeamOutlined style={{ fontSize: 20, color: 'var(--primary)' }} />
          <Title level={5} style={{ margin: 0 }}>Staff and Alerts</Title>
        </Space>
      </div>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card 
            title={<Space><UserOutlined /> Recent Activity</Space>}
            className="table-card"
            hoverable
            extra={<Tag color="processing">{shiftData.currentShift}</Tag>}
          >
            <Table
              columns={[
                { 
                  title: 'Time', 
                  dataIndex: 'time', 
                  key: 'time',
                  width: 100
                },
                { 
                  title: 'Activity', 
                  dataIndex: 'activity', 
                  key: 'activity',
                  render: (text, record) => (
                    <Space>
                      {record.type === 'production' && <LineChartOutlined style={{ color: 'var(--primary)' }} />}
                      {record.type === 'maintenance' && <ToolOutlined style={{ color: 'var(--warning)' }} />}
                      {record.type === 'inventory' && <InfoCircleOutlined style={{ color: 'var(--info)' }} />}
                      {text}
                    </Space>
                  )
                },
                { 
                  title: 'Machine', 
                  dataIndex: 'machine', 
                  key: 'machine' 
                },
                { 
                  title: 'User', 
                  dataIndex: 'user', 
                  key: 'user',
                  render: (text) => (
                    <Space>
                      <UserOutlined /> {text}
                    </Space>
                  )
                },
              ]}
              dataSource={shiftData.activities}
              pagination={false}
              size="small"
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title={<Space><ToolOutlined /> Maintenance and Alerts</Space>}
            className="timeline-card"
            hoverable
            extra={<Button type="link" size="small">View All</Button>}
          >
            <Timeline
              items={shiftData.timeline.map((item, index) => ({
                key: index,
                color: item.status === 'success' ? 'green' : item.status === 'error' ? 'red' : 'blue',
                dot: item.status === 'success' ? <CheckCircleOutlined /> : 
                     item.status === 'error' ? <ExclamationCircleOutlined /> : 
                     <InfoCircleOutlined />,
                children: (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text strong>{item.title}</Text>
                      <Text type="secondary">{item.time}</Text>
                    </div>
                    <Text type="secondary">{item.description}</Text>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>
      </Row>
      </Spin>
    </div>
  );
};

export default DashboardPage;
