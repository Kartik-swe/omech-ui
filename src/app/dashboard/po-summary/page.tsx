"use client";
import React, { useState, useMemo, useEffect } from 'react';
import {
  Card, Table, Row, Col, Statistic, Tag, Typography, Input, Space, DatePicker, Button, Divider, Progress, Radio, Empty
} from 'antd';
import type { TableProps } from 'antd';
import {
  ShoppingCartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  FileExcelOutlined,
  DashboardOutlined,
  BarChartOutlined,
  TeamOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dynamic from 'next/dynamic';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Dynamically import charts for SSR compatibility
const Column = dynamic(() => import('@ant-design/charts').then((mod) => mod.Column), { ssr: false });

/**
 * ============================================================================== 
 * AUTHOR      : AI Assistant (Aligned with USP_DT_PO_FLOW_ANALYSIS)
 * PURPOSE     : PO FLOW ANALYSIS DASHBOARD 
 * OBJECTIVE   : Ordered Qty -> Dispatched Qty -> Rejected Qty -> Pending Qty Analysis 
 * ============================================================================== 
 */

const dummyData = [
  { key: '1', PO_NUMBER: 'PO/24/001', PARTY_NAME: 'ABC Steel Corp', ORDER_QTY: 500, DISPATCH_QTY: 450, REJECTED_QTY: 10, PENDING_QTY: 40, FULFILLMENT_PERCENT: 90.00, SCHEDULE_DATE: '2024-01-15', ESTIMATED_DELIVERY_DATE: '2024-01-20', OD: '100mm', GRADE: 'A', THICKNESS: '2.0mm', LENGTH: '6m', ITEM_TYPE: 'PIPE' },
  { key: '2', PO_NUMBER: 'PO/24/002', PARTY_NAME: 'XYZ Fabrication', ORDER_QTY: 200, DISPATCH_QTY: 200, REJECTED_QTY: 0, PENDING_QTY: 0, FULFILLMENT_PERCENT: 100.00, SCHEDULE_DATE: '2024-02-05', ESTIMATED_DELIVERY_DATE: '2024-02-10', OD: 'N/A', GRADE: 'B', THICKNESS: '1.5mm', LENGTH: '2m', ITEM_TYPE: 'SHEET' },
  { key: '3', PO_NUMBER: 'PO/24/003', PARTY_NAME: 'PQR Industries', ORDER_QTY: 1000, DISPATCH_QTY: 0, REJECTED_QTY: 100, PENDING_QTY: 900, FULFILLMENT_PERCENT: 0.00, SCHEDULE_DATE: '2024-03-10', ESTIMATED_DELIVERY_DATE: '2024-03-15', OD: '50mm', GRADE: 'A', THICKNESS: '0.5mm', LENGTH: 'Coil', ITEM_TYPE: 'COIL' },
  { key: '4', PO_NUMBER: 'PO/24/004', PARTY_NAME: 'Global Metals', ORDER_QTY: 350, DISPATCH_QTY: 150, REJECTED_QTY: 5, PENDING_QTY: 195, FULFILLMENT_PERCENT: 42.86, SCHEDULE_DATE: '2024-04-12', ESTIMATED_DELIVERY_DATE: '2024-04-20', OD: '75mm', GRADE: 'C', THICKNESS: '3.0mm', LENGTH: '6m', ITEM_TYPE: 'PIPE' },
  { key: '5', PO_NUMBER: 'PO/24/005', PARTY_NAME: 'Precision Eng', ORDER_QTY: 800, DISPATCH_QTY: 800, REJECTED_QTY: 0, PENDING_QTY: 0, FULFILLMENT_PERCENT: 100.00, SCHEDULE_DATE: '2024-05-15', ESTIMATED_DELIVERY_DATE: '2024-05-20', OD: '100mm', GRADE: 'A', THICKNESS: '2.0mm', LENGTH: '6m', ITEM_TYPE: 'PIPE' },
  { key: '6', PO_NUMBER: 'PO/24/006', PARTY_NAME: 'Apex Builders', ORDER_QTY: 150, DISPATCH_QTY: 150, REJECTED_QTY: 0, PENDING_QTY: 0, FULFILLMENT_PERCENT: 100.00, SCHEDULE_DATE: '2024-05-18', ESTIMATED_DELIVERY_DATE: '2024-05-22', OD: '12mm', GRADE: 'B', THICKNESS: '1.0mm', LENGTH: '3m', ITEM_TYPE: 'PIPE' },
  { key: '7', PO_NUMBER: 'PO/24/007', PARTY_NAME: 'Quality Castings', ORDER_QTY: 2000, DISPATCH_QTY: 1800, REJECTED_QTY: 50, PENDING_QTY: 150, FULFILLMENT_PERCENT: 90.00, SCHEDULE_DATE: '2024-05-20', ESTIMATED_DELIVERY_DATE: '2024-05-30', OD: '150mm', GRADE: 'D', THICKNESS: '4.0mm', LENGTH: 'Coil', ITEM_TYPE: 'COIL' },
  { key: '8', PO_NUMBER: 'PO/24/008', PARTY_NAME: 'Modern Infra', ORDER_QTY: 300, DISPATCH_QTY: 300, REJECTED_QTY: 0, PENDING_QTY: 0, FULFILLMENT_PERCENT: 100.00, SCHEDULE_DATE: '2024-05-22', ESTIMATED_DELIVERY_DATE: '2024-05-25', OD: '2mm', GRADE: 'A', THICKNESS: '0.1mm', LENGTH: '100m', ITEM_TYPE: 'PIPE' },
  { key: '9', PO_NUMBER: 'PO/24/009', PARTY_NAME: 'ABC Steel Corp', ORDER_QTY: 600, DISPATCH_QTY: 600, REJECTED_QTY: 0, PENDING_QTY: 0, FULFILLMENT_PERCENT: 100.00, SCHEDULE_DATE: '2024-06-10', ESTIMATED_DELIVERY_DATE: '2024-06-15', OD: '100mm', GRADE: 'A', THICKNESS: '2.0mm', LENGTH: '6m', ITEM_TYPE: 'PIPE' },
  { key: '10', PO_NUMBER: 'PO/24/010', PARTY_NAME: 'XYZ Fabrication', ORDER_QTY: 300, DISPATCH_QTY: 100, REJECTED_QTY: 20, PENDING_QTY: 180, FULFILLMENT_PERCENT: 33.33, SCHEDULE_DATE: '2024-07-12', ESTIMATED_DELIVERY_DATE: '2024-07-20', OD: 'N/A', GRADE: 'B', THICKNESS: '1.5mm', LENGTH: '2m', ITEM_TYPE: 'SHEET' },
];

export default function POFlowAnalysis() {
  const [searchText, setSearchText] = useState('');
  const [timeRange, setTimeRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [analysisType, setAnalysisType] = useState<string>('GRADE');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  // Filter Data (Simulating SQL WHERE Clause)
  const filteredData = useMemo(() => {
    return dummyData.filter(item => {
      const matchesSearch = item.PO_NUMBER.toLowerCase().includes(searchText.toLowerCase()) || 
                           item.PARTY_NAME.toLowerCase().includes(searchText.toLowerCase());
      let matchesTime = true;
      if (timeRange && timeRange[0] && timeRange[1]) {
        const itemDate = dayjs(item.SCHEDULE_DATE);
        matchesTime = itemDate.isAfter(timeRange[0].startOf('day')) && itemDate.isBefore(timeRange[1].endOf('day'));
      }
      return matchesSearch && matchesTime;
    });
  }, [searchText, timeRange]);

  // Aggregate Analysis Data (Simulating SQL RESULT 3)
  const chartData = useMemo(() => {
    const results: Record<string, { ORDER_QTY: number; DISPATCH_QTY: number; REJECTED_QTY: number }> = {};
    
    filteredData.forEach(item => {
      const key = String(item[analysisType as keyof typeof dummyData[0]]);
      if (key === 'N/A' || key === 'undefined' || key === 'null') return;
      
      if (!results[key]) results[key] = { ORDER_QTY: 0, DISPATCH_QTY: 0, REJECTED_QTY: 0 };
      results[key].ORDER_QTY += (item.ORDER_QTY as number);
      results[key].DISPATCH_QTY += (item.DISPATCH_QTY as number);
      results[key].REJECTED_QTY += (item.REJECTED_QTY as number);
    });

    return Object.entries(results).flatMap(([name, values]) => [
      { name, type: 'Ordered', value: values.ORDER_QTY },
      { name, type: 'Dispatched', value: values.DISPATCH_QTY },
      { name, type: 'Rejected', value: values.REJECTED_QTY },
    ]);
  }, [filteredData, analysisType]);

  // Summary Stats (Simulating SQL RESULT 2)
  const stats = useMemo(() => ({
    totalOrder: filteredData.reduce((acc, i) => acc + i.ORDER_QTY, 0),
    totalDispatch: filteredData.reduce((acc, i) => acc + i.DISPATCH_QTY, 0),
    totalRejected: filteredData.reduce((acc, i) => acc + i.REJECTED_QTY, 0),
    totalPending: filteredData.reduce((acc, i) => acc + i.PENDING_QTY, 0),
  }), [filteredData]);

  const columns: TableProps<(typeof dummyData)[0]>['columns'] = [
    { title: 'SR#', key: 'SRNO', fixed: 'left', width: 60, render: (_, __, index) => index + 1 },
    { title: 'PO Number', dataIndex: 'PO_NUMBER', key: 'PO_NUMBER', fixed: 'left', width: 130, render: (t) => <Text strong>{t}</Text> },
    { title: 'Party Name', dataIndex: 'PARTY_NAME', key: 'PARTY_NAME', width: 200 },
    { 
      title: 'Specifications', 
      children: [
        { title: 'Grade', dataIndex: 'GRADE', key: 'GRADE' },
        { title: 'OD', dataIndex: 'OD', key: 'OD' },
        { title: 'Thick', dataIndex: 'THICKNESS', key: 'THICKNESS' },
        { title: 'Length', dataIndex: 'LENGTH', key: 'LENGTH' },
      ]
    },
    { 
      title: 'PO Flow Metrics', 
      children: [
        { title: 'Ordered', dataIndex: 'ORDER_QTY', key: 'ORDER_QTY', render: (v) => v.toLocaleString() },
        { title: 'Dispatched', dataIndex: 'DISPATCH_QTY', key: 'DISPATCH_QTY', render: (v) => <Text type="success">{v.toLocaleString()}</Text> },
        { title: 'Rejected', dataIndex: 'REJECTED_QTY', key: 'REJECTED_QTY', render: (v) => <Text type="danger">{v.toLocaleString()}</Text> },
        { title: 'Pending', dataIndex: 'PENDING_QTY', key: 'PENDING_QTY', render: (v) => <Text type="warning">{v.toLocaleString()}</Text> },
      ]
    },
    { 
      title: 'Fulfillment %', 
      dataIndex: 'FULFILLMENT_PERCENT',
      key: 'fulfillment', 
      width: 150,
      render: (v) => <Progress percent={v} size="small" status={v === 100 ? 'success' : 'active'} />
    },
    { title: 'Schedule Date', dataIndex: 'SCHEDULE_DATE', key: 'SCHEDULE_DATE', render: (d) => dayjs(d).format('DD-MM-YYYY') },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col><Title level={2}><DashboardOutlined /> PO Flow Analysis (USP_DT_PO_FLOW_ANALYSIS)</Title></Col>
        <Col><Button type="primary" icon={<FileExcelOutlined />}>Export CSV</Button></Col>
      </Row>

      {/* Summary Cards (SQL RESULT 2) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic title="Total Ordered" value={stats.totalOrder} prefix={<ShoppingCartOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic title="Total Dispatched" value={stats.totalDispatch} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic title="Total Rejected" value={stats.totalRejected} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic title="Total Pending" value={stats.totalPending} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      {/* Controls (SQL Parameters) */}
      <Card bordered={false} className="shadow-sm" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Text strong>@FROM_DATE / @TO_DATE:</Text>
            <RangePicker style={{ width: '100%', marginTop: 8 }} onChange={dates => setTimeRange(dates as any)} format="DD-MM-YYYY" />
          </Col>
          <Col xs={24} sm={8}>
            <Text strong>@ANALYSIS_TYPE:</Text>
            <div style={{ marginTop: 8 }}>
              <Radio.Group value={analysisType} onChange={e => setAnalysisType(e.target.value)} buttonStyle="solid">
                <Radio.Button value="GRADE">GRADE</Radio.Button>
                <Radio.Button value="OD">OD</Radio.Button>
                <Radio.Button value="THICKNESS">THICKNESS</Radio.Button>
                <Radio.Button value="LENGTH">LENGTH</Radio.Button>
                <Radio.Button value="PARTY_NAME">PARTY</Radio.Button>
              </Radio.Group>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <Text strong>@SEARCH (PO / Party):</Text>
            <Input placeholder="Search..." prefix={<SearchOutlined />} style={{ marginTop: 8 }} value={searchText} onChange={e => setSearchText(e.target.value)} allowClear />
          </Col>
        </Row>
      </Card>

      {/* Visual Analysis (SQL RESULT 3) */}
      <Card title={<span><BarChartOutlined /> Chart Analysis: Ordered vs Dispatched vs Rejected</span>} bordered={false} className="shadow-sm" style={{ marginBottom: 24 }}>
        {isClient && chartData.length > 0 ? (
          <div style={{ height: 400 }}>
            <Column 
              data={chartData} 
              xField="name" 
              yField="value" 
              seriesField="type" 
              isGroup={true}
              color={['#1890ff', '#52c41a', '#f5222d']}
              columnStyle={{ radius: [4, 4, 0, 0] }}
              label={{ position: 'top', style: { fill: '#000', opacity: 0.6 }, formatter: (v: any) => v.value.toLocaleString() }}
            />
          </div>
        ) : <Empty description="No data matches current filters" />}
      </Card>

      {/* Detailed Flow Report (SQL RESULT 1) */}
      <Card title={<span><TeamOutlined /> Detailed PO Flow Records</span>} bordered={false} className="shadow-sm">
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          pagination={{ pageSize: 10 }} 
          scroll={{ x: 1300 }} 
          size="middle" 
          bordered
        />
      </Card>
    </div>
  );
}
