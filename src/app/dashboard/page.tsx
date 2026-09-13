// src/app/dashboard/page.tsx

'use client';
import React from 'react';
import { Card, Col, Row, Statistic, Table, Timeline, Tag, Divider } from 'antd';
import { Line } from '@ant-design/plots';
import {
  UserOutlined,
  BarChartOutlined,
  AlertOutlined,
  TeamOutlined,
  LineChartOutlined,
} from '@ant-design/icons';

const DashboardPage: React.FC = () => {
  // Sample data for inventory and production trends
  const productionData = [
    { month: 'January', production: 500 },
    { month: 'February', production: 450 },
    { month: 'March', production: 600 },
    { month: 'April', production: 700 },
    { month: 'May', production: 650 },
    { month: 'June', production: 800 },
    { month: 'July', production: 750 },
  ];

  const inventoryData = [
    { key: '1', grade: '304L', size: '25mm', stock: 100, status: 'Available' },
    { key: '2', grade: '316L', size: '32mm', stock: 50, status: 'Low Stock' },
    { key: '3', grade: '410', size: '50mm', stock: 200, status: 'Available' },
  ];

  const shiftData = [
    { key: '1', staffName: 'Staff 1', machine: 'Tube Machine 1', shift: 'Morning' },
    { key: '2', staffName: 'Staff 2', machine: 'Laser Machine 1', shift: 'Afternoon' },
    { key: '3', staffName: 'Staff 3', machine: 'Tube Machine 5', shift: 'Night' },
  ];

  // Chart configuration for Production Trends
  const productionChartConfig = {
    data: productionData,
    xField: 'month',
    yField: 'production',
    xAxis: {
      label: {
        autoRotate: true,
      },
    },
    yAxis: {
      label: {
        formatter: (v: number) => `${v} units`,
      },
    },
    tooltip: {
      showMarkers: false,
    },
    smooth: true,
    lineStyle: {
      stroke: '#1890ff',
    },
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Top Row: Production and Inventory Overview */}
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Active Machines"
              value={10}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Production Rate (Today)"
              value={500}
              suffix="units"
              prefix={<LineChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Inventory Status"
              value={1500}
              suffix="items"
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Middle Row: Graphs for Production Trends & Inventory */}
      <Divider style={{ margin: '24px 0' }}>Production and Inventory Trends</Divider>
      <Row gutter={16}>
        <Col span={16}>
          <Card title="Production Trends">
            <Line {...productionChartConfig} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Inventory Overview">
            <Table
              columns={[
                { title: 'Grade', dataIndex: 'grade', key: 'grade' },
                { title: 'Size', dataIndex: 'size', key: 'size' },
                { title: 'Stock', dataIndex: 'stock', key: 'stock' },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => (
                    <Tag color={status === 'Low Stock' ? 'volcano' : 'green'}>{status}</Tag>
                  ),
                },
              ]}
              dataSource={inventoryData}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      {/* Bottom Row: Staff Information and Alerts */}
      <Divider style={{ margin: '24px 0' }}>Staff and Alerts</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Current Shifts">
            <Table
              columns={[
                { title: 'Staff Name', dataIndex: 'staffName', key: 'staffName' },
                { title: 'Machine', dataIndex: 'machine', key: 'machine' },
                { title: 'Shift', dataIndex: 'shift', key: 'shift' },
              ]}
              dataSource={shiftData}
              pagination={false}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Maintenance and Alerts">
            <Timeline>
              <Timeline.Item color="green">Laser Machine 1 - Maintenance Complete</Timeline.Item>
              <Timeline.Item color="red">
                Tube Machine 3 - Requires Maintenance
              </Timeline.Item>
              <Timeline.Item color="blue">
                Inventory Check - Grade 316L Running Low
              </Timeline.Item>
            </Timeline>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
