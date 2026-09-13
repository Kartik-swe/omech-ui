'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Card, Row, Col, Select, DatePicker, Input, Button, Table, Tabs, Statistic,
  Typography, Tag, Tooltip, Empty, Spin, message,
} from 'antd';
import {
  SyncOutlined, ArrowUpOutlined, ArrowDownOutlined, TrophyOutlined,
  FallOutlined, RiseOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { apiClient } from '@/utils/apiClient';
import { getCookieData } from '@/utils/common';
import ProtectedRoute from '@/app/components/ProtectedRoute';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// ---------------------------------------------------------------------------
// Types - these mirror the result sets returned by DT_PO_ANALYSIS exactly,
// in order (Table, Table1, Table2, ... Table10). All grouping/ranking logic
// lives in that stored procedure now; this page only renders what it gets
// back, plus trivial presentational reshaping (top/bottom slicing, pivoting
// flat rows into a chart-friendly shape).
// ---------------------------------------------------------------------------

interface SummaryRow {
  TOTAL_QTY: number;
  TOTAL_WEIGHT: number;
  DISTINCT_CUSTOMERS: number;
  DISTINCT_SIZES: number;
}

interface DispatchDetailRow {
  DISPATCH_SRNO: number;
  DC_NO: string;
  DISPATCH_DATE: string;
  PO_NUMBER: string;
  PO_ENTRY_DATE: string;
  PARTY_NAME: string;
  OD: string | null;
  GRADE: string;
  THICKNESS: string;
  LENGTH: number | null;
  DISPATCH_QTY: number;
  DISPATCH_WEIGHT: number;
}

interface CompletionRow {
  SCHEDULE_SRNO: number;
  PARTY_NAME: string;
  ITEM_TYPE: string;
  PO_NUMBER: string;
  SCHEDULE_DATE: string;
  STATUS_NAME: string;
  STATUS_SRNO: number;
  COMPLETION_PERCENTAGE: number;
  LAST_DISPATCH_DATE: string;
}

interface SizeTotalRow {
  SIZE_KEY: string;
  OD: string | null;
  GRADE: string;
  THICKNESS: string;
  QTY: number;
  WEIGHT: number;
  DISPATCH_COUNT: number;
}

interface SizeMonthTrendRow {
  DISPATCH_MONTH: string;
  DISPATCH_MONTH_LABEL: string;
  QTY: number;
  WEIGHT: number;
}

interface GradeMonthRow {
  DISPATCH_MONTH: string;
  DISPATCH_MONTH_LABEL: string;
  GRADE: string;
  WEIGHT: number;
  QTY: number;
}

interface CustomerTrendRow {
  PARTY_NAME: string;
  CURR_QTY: number;
  CURR_WEIGHT: number;
  PREV_QTY: number;
  PREV_WEIGHT: number;
  WEIGHT_CHANGE_PCT: number;
  IS_NEW: number;
}

interface NameTotalRow {
  PARTY_NAME?: string;
  GRADE?: string;
  SIZE_KEY?: string;
  QTY: number;
  WEIGHT: number;
}

type OptionType = { label: string; value: number };

const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const CHART_COLORS = [
  '#1F4E78', '#2E86AB', '#3AA6B9', '#6FBF73', '#F2B134', '#ED6A5A',
  '#8E7CC3', '#4C9F70', '#C97B84', '#5B85AA',
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const PoAnalysisPage = () => {
  const { USER_SRNO, API_BASE_URL, UT_SRNO } = getCookieData();

  const [loading, setLoading] = useState(false);

  // dropdown options
  const [optGrades, setOptGrades] = useState<OptionType[]>([]);
  const [optOD, setOptOD] = useState<OptionType[]>([]);
  const [optThickness, setOptThickness] = useState<OptionType[]>([]);
  const [optParty, setOptParty] = useState<OptionType[]>([]);

  // filters
  const [partySrno, setPartySrno] = useState<number | undefined>();
  const [gradeSrno, setGradeSrno] = useState<number | undefined>();
  const [odSrno, setOdSrno] = useState<number | undefined>();
  const [thicknessSrno, setThicknessSrno] = useState<number | undefined>();
  const [poNumber, setPoNumber] = useState<string>('');
  const [debouncedPoNumber, setDebouncedPoNumber] = useState<string>('');
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);

  const dateFrom: string | null = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : null;
  const dateTo: string | null = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : null;

  // server-driven result sets
  const [summary, setSummary] = useState<SummaryRow | null>(null);
  const [dispatchDetails, setDispatchDetails] = useState<DispatchDetailRow[]>([]);
  const [highestCompletion, setHighestCompletion] = useState<CompletionRow[]>([]);
  const [lowestCompletion, setLowestCompletion] = useState<CompletionRow[]>([]);
  const [sizeTotals, setSizeTotals] = useState<SizeTotalRow[]>([]);
  const [sizeMonthTrendRaw, setSizeMonthTrendRaw] = useState<SizeMonthTrendRow[]>([]);
  const [gradeMonthRaw, setGradeMonthRaw] = useState<GradeMonthRow[]>([]);
  const [customerTrend, setCustomerTrend] = useState<CustomerTrendRow[]>([]);
  const [customerTotals, setCustomerTotals] = useState<NameTotalRow[]>([]);
  const [sizeExtremesRaw, setSizeExtremesRaw] = useState<NameTotalRow[]>([]);
  const [gradeExtremesRaw, setGradeExtremesRaw] = useState<NameTotalRow[]>([]);

  const isSizeSelected = !!(odSrno && gradeSrno && thicknessSrno);
  const periodLabel = dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'All Time';

  // -------------------------------------------------------------------------
  // Dropdown options (loaded once)
  // -------------------------------------------------------------------------

  useEffect(() => {
    fetchCommonData();
  }, []);

  const fetchCommonData = async () => {
    try {
      const response = await apiClient<Record<string, any>>(
        `${API_BASE_URL}Pl_Common?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&TBL_SRNO=1,2,3,13`,
        'GET'
      );
      if (response.msgId === 200 && response.data) {
        const { Table1, Table2, Table3, Table13 } = response.data;
        setOptGrades(Table1 || []);
        setOptOD(Table2 || []);
        setOptThickness(Table3 || []);
        setOptParty(Table13 || []);
      }
    } catch (err) {
      console.error('Error fetching dropdown options:', err);
    }
  };

  // -------------------------------------------------------------------------
  // Debounce free-text PO Number so we don't fire a request per keystroke.
  // Every other filter (Select/DatePicker) triggers a request immediately -
  // there's no reason to wait since those changes are already discrete.
  // -------------------------------------------------------------------------

  useEffect(() => {
    const t = setTimeout(() => setDebouncedPoNumber(poNumber.trim()), 500);
    return () => clearTimeout(t);
  }, [poNumber]);

  // -------------------------------------------------------------------------
  // The single source of truth: one call to DT_PO_ANALYSIS per filter
  // combination. Fires automatically whenever any filter changes, and is
  // also what the Refresh button calls.
  // -------------------------------------------------------------------------

  const requestSeq = useRef(0);

  const fetchAnalysis = async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (partySrno) params.append('PARTY_SRNO', String(partySrno));
      if (gradeSrno) params.append('GRADE_SRNO', String(gradeSrno));
      if (odSrno) params.append('OD_SRNO', String(odSrno));
      if (thicknessSrno) params.append('THICKNESS_SRNO', String(thicknessSrno));
      if (dateFrom) params.append('DATE_FROM', dateFrom);
      if (dateTo) params.append('DATE_TO', dateTo);
      if (debouncedPoNumber) params.append('PO_NUMBER', debouncedPoNumber);

      const res = await apiClient(`${API_BASE_URL}DtPoAnalysis?${params.toString()}`, 'GET');

      // Ignore stale responses if a newer request has since been fired
      if (seq !== requestSeq.current) return;

      if (res.msgId === 200 && res.data) {
        const d = res.data;
        setSummary((d.Table && d.Table[0]) || null);
        setDispatchDetails(d.Table1 || []);
        setHighestCompletion(d.Table2 || []);
        setLowestCompletion(d.Table3 || []);
        setSizeTotals(d.Table4 || []);
        setSizeMonthTrendRaw(d.Table5 || []);
        setGradeMonthRaw(d.Table6 || []);
        setCustomerTrend(d.Table7 || []);
        setCustomerTotals(d.Table8 || []);
        setSizeExtremesRaw(d.Table9 || []);
        setGradeExtremesRaw(d.Table10 || []);
      } else if (res.msgId === 204) {
        setSummary(null);
        setDispatchDetails([]);
        setHighestCompletion([]);
        setLowestCompletion([]);
        setSizeTotals([]);
        setSizeMonthTrendRaw([]);
        setGradeMonthRaw([]);
        setCustomerTrend([]);
        setCustomerTotals([]);
        setSizeExtremesRaw([]);
        setGradeExtremesRaw([]);
      } else {
        message.error(res.msg || 'Failed to load PO analysis data');
      }
    } catch (err) {
      console.error('Error fetching PO analysis:', err);
      message.error('Failed to load PO analysis data');
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partySrno, gradeSrno, odSrno, thicknessSrno, dateFrom, dateTo, debouncedPoNumber]);

  // -------------------------------------------------------------------------
  // Presentational-only reshaping (no filtering/aggregation - that's all
  // done server-side already)
  // -------------------------------------------------------------------------

  // Pivot the flat (month, grade, weight) rows into one row per month with a
  // column per grade, for the stacked/grouped bar chart.
  const gradeMonthlyChart = useMemo(() => {
    const grades = Array.from(new Set(gradeMonthRaw.map((r) => r.GRADE)));
    const monthMap = new Map<string, any>();
    gradeMonthRaw.forEach((r) => {
      if (!monthMap.has(r.DISPATCH_MONTH)) {
        monthMap.set(r.DISPATCH_MONTH, { monthKey: r.DISPATCH_MONTH, month: r.DISPATCH_MONTH_LABEL });
      }
      monthMap.get(r.DISPATCH_MONTH)[r.GRADE] = round2(r.WEIGHT);
    });
    const rows = Array.from(monthMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    return { rows, grades };
  }, [gradeMonthRaw]);

  const sizeMonthTrend = useMemo(
    () =>
      sizeMonthTrendRaw.map((r) => ({
        month: r.DISPATCH_MONTH_LABEL,
        Qty: round2(r.QTY),
        'Weight (kg)': round2(r.WEIGHT),
      })),
    [sizeMonthTrendRaw]
  );

  const salesByCustomer = useMemo(
    () => customerTotals.map((r) => ({ customer: r.PARTY_NAME as string, 'Weight (kg)': round2(r.WEIGHT) })),
    [customerTotals]
  );

  const customerRankingTop = useMemo(() => customerTotals.slice(0, 10), [customerTotals]);
  const customerRankingBottom = useMemo(() => [...customerTotals].slice(-10).reverse(), [customerTotals]);

  const sizeExtremesTop = useMemo(
    () => sizeExtremesRaw.slice(0, 10).map((r) => ({ name: r.SIZE_KEY as string, 'Weight (kg)': round2(r.WEIGHT) })),
    [sizeExtremesRaw]
  );
  const sizeExtremesBottom = useMemo(
    () => [...sizeExtremesRaw].slice(-10).reverse().map((r) => ({ name: r.SIZE_KEY as string, 'Weight (kg)': round2(r.WEIGHT) })),
    [sizeExtremesRaw]
  );
  const gradeExtremesTop = useMemo(
    () => gradeExtremesRaw.slice(0, 10).map((r) => ({ name: r.GRADE as string, 'Weight (kg)': round2(r.WEIGHT) })),
    [gradeExtremesRaw]
  );
  const gradeExtremesBottom = useMemo(
    () => [...gradeExtremesRaw].slice(-10).reverse().map((r) => ({ name: r.GRADE as string, 'Weight (kg)': round2(r.WEIGHT) })),
    [gradeExtremesRaw]
  );

  // -------------------------------------------------------------------------
  // Table column defs
  // -------------------------------------------------------------------------

  const sizeColumns = [
    { title: 'Size (OD / Grade / Thickness)', dataIndex: 'SIZE_KEY', key: 'SIZE_KEY' },
    { title: 'Dispatched Qty', dataIndex: 'QTY', key: 'QTY', render: (v: number) => round2(v), sorter: (a: any, b: any) => a.QTY - b.QTY },
    { title: 'Dispatched Weight (kg)', dataIndex: 'WEIGHT', key: 'WEIGHT', render: (v: number) => round2(v), sorter: (a: any, b: any) => a.WEIGHT - b.WEIGHT, defaultSortOrder: 'descend' as const },
    {
      title: (
        <Tooltip title="How many separate dispatch transactions (DC entries) make up this size's total — e.g. 3 means this size went out on 3 different DCs, possibly across different lengths/POs, all combined here.">
          No. of Dispatches <InfoCircleOutlined />
        </Tooltip>
      ),
      dataIndex: 'DISPATCH_COUNT',
      key: 'DISPATCH_COUNT',
    },
  ];

  const completionColumns = [
    { title: 'PO Number', dataIndex: 'PO_NUMBER', key: 'PO_NUMBER' },
    { title: 'Party', dataIndex: 'PARTY_NAME', key: 'PARTY_NAME' },
    { title: 'Item Type', dataIndex: 'ITEM_TYPE', key: 'ITEM_TYPE' },
    { title: 'PO Entry Date', dataIndex: 'SCHEDULE_DATE', key: 'SCHEDULE_DATE' },
    { title: 'Last Dispatch Date', dataIndex: 'LAST_DISPATCH_DATE', key: 'LAST_DISPATCH_DATE' },
    { title: 'Status', dataIndex: 'STATUS_NAME', key: 'STATUS_NAME', render: (v: string) => <Tag>{v}</Tag> },
    {
      title: 'Completion %',
      dataIndex: 'COMPLETION_PERCENTAGE',
      key: 'COMPLETION_PERCENTAGE',
      render: (v: number) => (
        <Tag color={v === 100 ? 'green' : v >= 75 ? 'blue' : v >= 50 ? 'orange' : 'red'}>{v}%</Tag>
      ),
    },
  ];

  const dispatchDetailColumns = [
    { title: 'PO Number', dataIndex: 'PO_NUMBER', key: 'PO_NUMBER' },
    { title: 'PO Entry Date', dataIndex: 'PO_ENTRY_DATE', key: 'PO_ENTRY_DATE' },
    { title: 'Dispatch Date', dataIndex: 'DISPATCH_DATE', key: 'DISPATCH_DATE' },
    { title: 'DC No', dataIndex: 'DC_NO', key: 'DC_NO' },
    { title: 'Customer', dataIndex: 'PARTY_NAME', key: 'PARTY_NAME' },
    {
      title: 'Size (OD / Grade / Thickness)',
      key: 'size',
      render: (_: any, r: DispatchDetailRow) => `${r.OD ?? '-'} / ${r.GRADE} / ${r.THICKNESS}`,
    },
    { title: 'Length', dataIndex: 'LENGTH', key: 'LENGTH' },
    { title: 'Qty', dataIndex: 'DISPATCH_QTY', key: 'DISPATCH_QTY', render: (v: number) => round2(v) },
    { title: 'Weight (kg)', dataIndex: 'DISPATCH_WEIGHT', key: 'DISPATCH_WEIGHT', render: (v: number) => round2(v) },
  ];

  const trendColumns = [
    { title: 'Customer', dataIndex: 'PARTY_NAME', key: 'PARTY_NAME' },
    { title: 'Previous Period Wt (kg)', dataIndex: 'PREV_WEIGHT', key: 'PREV_WEIGHT', render: (v: number) => round2(v) },
    { title: 'This Period Wt (kg)', dataIndex: 'CURR_WEIGHT', key: 'CURR_WEIGHT', render: (v: number) => round2(v) },
    { title: 'This Period Qty', dataIndex: 'CURR_QTY', key: 'CURR_QTY', render: (v: number) => round2(v) },
    {
      title: '% Change (Weight)',
      dataIndex: 'WEIGHT_CHANGE_PCT',
      key: 'WEIGHT_CHANGE_PCT',
      sorter: (a: any, b: any) => a.WEIGHT_CHANGE_PCT - b.WEIGHT_CHANGE_PCT,
      defaultSortOrder: 'descend' as const,
      render: (v: number, record: any) =>
        record.IS_NEW ? (
          <Tag color="blue">New</Tag>
        ) : (
          <Tag icon={v >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} color={v >= 0 ? 'green' : 'red'}>
            {v >= 0 ? '+' : ''}
            {v}%
          </Tag>
        ),
    },
  ];

  const rankingColumns = [
    { title: 'Rank', key: 'rank', render: (_: any, __: any, idx: number) => idx + 1, width: 70 },
    { title: 'Customer', dataIndex: 'PARTY_NAME', key: 'PARTY_NAME' },
    { title: 'Total Qty', dataIndex: 'QTY', key: 'QTY', render: (v: number) => round2(v) },
    { title: 'Total Weight (kg)', dataIndex: 'WEIGHT', key: 'WEIGHT', render: (v: number) => round2(v) },
  ];

  const resetFilters = () => {
    setPartySrno(undefined);
    setGradeSrno(undefined);
    setOdSrno(undefined);
    setThicknessSrno(undefined);
    setPoNumber('');
    setDebouncedPoNumber('');
    setDateRange(null);
  };

  return (
    <ProtectedRoute>
      <div style={{ padding: 20 }}>
        <Card
          title="PO Analysis"
          variant="borderless"
          extra={
            <Button icon={<SyncOutlined />} onClick={fetchAnalysis} loading={loading}>
              Refresh
            </Button>
          }
        >
          {/* Filters */}
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={4}>
              <Text strong>Customer</Text>
              <Select
                allowClear
                showSearch
                placeholder="All Customers"
                style={{ width: '100%', marginTop: 4 }}
                options={optParty}
                value={partySrno}
                onChange={setPartySrno}
                filterOption={(input, option) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
              />
            </Col>
            <Col span={3}>
              <Text strong>OD</Text>
              <Select
                allowClear
                showSearch
                placeholder="All OD"
                style={{ width: '100%', marginTop: 4 }}
                options={optOD}
                value={odSrno}
                onChange={setOdSrno}
                filterOption={(input, option) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
              />
            </Col>
            <Col span={3}>
              <Text strong>Grade</Text>
              <Select
                allowClear
                showSearch
                placeholder="All Grades"
                style={{ width: '100%', marginTop: 4 }}
                options={optGrades}
                value={gradeSrno}
                onChange={setGradeSrno}
                filterOption={(input, option) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
              />
            </Col>
            <Col span={3}>
              <Text strong>Thickness</Text>
              <Select
                allowClear
                showSearch
                placeholder="All Thickness"
                style={{ width: '100%', marginTop: 4 }}
                options={optThickness}
                value={thicknessSrno}
                onChange={setThicknessSrno}
                filterOption={(input, option) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
              />
            </Col>
            <Col span={4}>
              <Text strong>PO Number</Text>
              <Input
                placeholder="Search PO Number"
                style={{ marginTop: 4 }}
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={5}>
              <Tooltip title="Filters PO Entry Date on the Completion Leaderboard, and Dispatch Date everywhere else. Leave empty to show all data from the beginning.">
                <Text strong>Date Range (From - To) <InfoCircleOutlined /></Text>
              </Tooltip>
              <RangePicker
                style={{ width: '100%', marginTop: 4 }}
                value={dateRange as any}
                onChange={(vals) => setDateRange(vals && vals[0] && vals[1] ? [vals[0], vals[1]] : null)}
                allowClear
              />
            </Col>
            <Col span={2} style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button onClick={resetFilters} style={{ marginTop: 4 }}>Reset</Button>
            </Col>
          </Row>

          <Spin spinning={loading}>
            {/* Summary Cards */}
            <Row gutter={16} style={{ marginBottom: 20 }}>
              <Col span={6}>
                <Card><Statistic title="Dispatched Qty (filtered)" value={summary ? round2(summary.TOTAL_QTY) : 0} /></Card>
              </Col>
              <Col span={6}>
                <Card><Statistic title="Dispatched Weight (kg, filtered)" value={summary ? round2(summary.TOTAL_WEIGHT) : 0} /></Card>
              </Col>
              <Col span={6}>
                <Card><Statistic title="Distinct Customers" value={summary?.DISTINCT_CUSTOMERS ?? 0} /></Card>
              </Col>
              <Col span={6}>
                <Card><Statistic title="Distinct Sizes" value={summary?.DISTINCT_SIZES ?? 0} /></Card>
              </Col>
            </Row>

            <Tabs
              defaultActiveKey="completion"
              items={[
                {
                  key: 'completion',
                  label: 'Completion Leaderboard',
                  children: (
                    <>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Card
                            title={<><TrophyOutlined style={{ color: '#52c41a' }} /> Highest Completion %</>}
                            size="small"
                          >
                            <Table
                              columns={completionColumns}
                              dataSource={highestCompletion}
                              rowKey="SCHEDULE_SRNO"
                              size="small"
                              pagination={false}
                            />
                          </Card>
                        </Col>
                        <Col span={12}>
                          <Card
                            title={<><FallOutlined style={{ color: '#f5222d' }} /> Lowest Completion %</>}
                            size="small"
                          >
                            <Table
                              columns={completionColumns}
                              dataSource={lowestCompletion}
                              rowKey="SCHEDULE_SRNO"
                              size="small"
                              pagination={false}
                            />
                          </Card>
                        </Col>
                      </Row>
                      <Text type="secondary">
                        Scoped by the Customer filter and the Date Range (as PO Entry Date). Shows every PO when no range is set.
                        &quot;Last Dispatch Date&quot; is shown alongside &quot;PO Entry Date&quot; to help identify the right PO.
                      </Text>
                    </>
                  ),
                },
                {
                  key: 'dispatchDetails',
                  label: 'Dispatch Details',
                  children: (
                    <Card title={`Dispatch-level Detail (${periodLabel})`} size="small">
                      <Text type="secondary">
                        Every dispatch event, with PO Entry Date and Dispatch Date side by side, for tracing a specific PO or shipment.
                        Respects all filters above. Capped at the 1000 most recent matching rows.
                      </Text>
                      <Table
                        columns={dispatchDetailColumns}
                        dataSource={dispatchDetails}
                        rowKey="DISPATCH_SRNO"
                        size="small"
                        style={{ marginTop: 12 }}
                        pagination={{ pageSize: 15 }}
                      />
                    </Card>
                  ),
                },
                {
                  key: 'sizewise',
                  label: 'Size-wise Analysis',
                  children: (
                    <>
                      <Card title="Top Sizes by Dispatched Quantity" size="small" style={{ marginBottom: 16 }}>
                        <Text type="secondary">
                          Lengths are combined - grouped by OD / Grade / Thickness only. Respects the Customer filter and Date Range above.
                        </Text>
                        <Table
                          columns={sizeColumns}
                          dataSource={sizeTotals}
                          rowKey="SIZE_KEY"
                          size="small"
                          style={{ marginTop: 12 }}
                          pagination={{ pageSize: 10 }}
                        />
                      </Card>

                      <Card title="Month-wise Trend for a Selected Size" size="small">
                        {!isSizeSelected ? (
                          <Empty description="Select OD, Grade and Thickness above to see the month-wise dispatch trend for that specific size." />
                        ) : sizeMonthTrend.length === 0 ? (
                          <Empty description="No dispatch history found for this size." />
                        ) : (
                          <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={sizeMonthTrend}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <RTooltip />
                              <Legend />
                              <Line type="monotone" dataKey="Weight (kg)" stroke="#1F4E78" strokeWidth={2} />
                              <Line type="monotone" dataKey="Qty" stroke="#F2B134" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </Card>
                    </>
                  ),
                },
                {
                  key: 'gradewise',
                  label: 'Grade-wise Analysis',
                  children: (
                    <Card title="Grade-wise Dispatch by Month (Top 6 Grades)" size="small">
                      <Text type="secondary">Respects the Customer filter and Date Range above; clear OD/Grade/Thickness filters to compare across all grades.</Text>
                      {gradeMonthlyChart.rows.length === 0 ? (
                        <Empty description="No dispatch history found." style={{ marginTop: 16 }} />
                      ) : (
                        <ResponsiveContainer width="100%" height={360}>
                          <BarChart data={gradeMonthlyChart.rows} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <RTooltip />
                            <Legend />
                            {gradeMonthlyChart.grades.map((g, idx) => (
                              <Bar key={g} dataKey={g} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </Card>
                  ),
                },
                {
                  key: 'customerwise',
                  label: 'Customer Analysis',
                  children: (
                    <>
                      <Card
                        title={<><RiseOutlined /> Customer Sales Trend (Selected Period vs Previous Equal Period)</>}
                        size="small"
                        style={{ marginBottom: 16 }}
                      >
                        {!dateFrom || !dateTo ? (
                          <Empty description="Select a Date Range above to compare that period against the immediately preceding period of the same length." />
                        ) : (
                          <Table
                            columns={trendColumns}
                            dataSource={customerTrend}
                            rowKey="PARTY_NAME"
                            size="small"
                            pagination={{ pageSize: 10 }}
                          />
                        )}
                      </Card>

                      <Card title={`Sales by Customer - ${periodLabel}`} size="small" style={{ marginBottom: 16 }}>
                        {salesByCustomer.length === 0 ? (
                          <Empty description="No dispatches found for the selected period." />
                        ) : (
                          <ResponsiveContainer width="100%" height={340}>
                            <BarChart data={salesByCustomer} margin={{ top: 16, right: 16, left: 0, bottom: 60 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="customer" angle={-30} textAnchor="end" interval={0} height={80} />
                              <YAxis />
                              <RTooltip />
                              <Bar dataKey="Weight (kg)" fill="#2E86AB" />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </Card>

                      <Card title="Overall Customer Ranking (Most vs Least Material)" size="small">
                        <Row gutter={16}>
                          <Col span={12}>
                            <Title level={5}>Top 10 Customers</Title>
                            <Table
                              columns={rankingColumns}
                              dataSource={customerRankingTop}
                              rowKey="PARTY_NAME"
                              size="small"
                              pagination={false}
                            />
                          </Col>
                          <Col span={12}>
                            <Title level={5}>Bottom 10 Customers</Title>
                            <Table
                              columns={rankingColumns}
                              dataSource={customerRankingBottom}
                              rowKey="PARTY_NAME"
                              size="small"
                              pagination={false}
                            />
                          </Col>
                        </Row>
                      </Card>
                    </>
                  ),
                },
                {
                  key: 'extremes',
                  label: 'Size & Grade Extremes',
                  children: (
                    <>
                      <Card title="Sizes: Most vs Least Dispatched (by Weight)" size="small" style={{ marginBottom: 16 }}>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Title level={5}>Top 10 Sizes</Title>
                            <ResponsiveContainer width="100%" height={320}>
                              <BarChart data={sizeExtremesTop} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={140} />
                                <RTooltip />
                                <Bar dataKey="Weight (kg)" fill="#4C9F70" />
                              </BarChart>
                            </ResponsiveContainer>
                          </Col>
                          <Col span={12}>
                            <Title level={5}>Bottom 10 Sizes</Title>
                            <ResponsiveContainer width="100%" height={320}>
                              <BarChart data={sizeExtremesBottom} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={140} />
                                <RTooltip />
                                <Bar dataKey="Weight (kg)" fill="#ED6A5A" />
                              </BarChart>
                            </ResponsiveContainer>
                          </Col>
                        </Row>
                      </Card>

                      <Card title="Grades: Most vs Least Dispatched (by Weight)" size="small">
                        <Row gutter={16}>
                          <Col span={12}>
                            <Title level={5}>Top 10 Grades</Title>
                            <ResponsiveContainer width="100%" height={320}>
                              <BarChart data={gradeExtremesTop} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={140} />
                                <RTooltip />
                                <Bar dataKey="Weight (kg)" fill="#4C9F70" />
                              </BarChart>
                            </ResponsiveContainer>
                          </Col>
                          <Col span={12}>
                            <Title level={5}>Bottom 10 Grades</Title>
                            <ResponsiveContainer width="100%" height={320}>
                              <BarChart data={gradeExtremesBottom} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={140} />
                                <RTooltip />
                                <Bar dataKey="Weight (kg)" fill="#ED6A5A" />
                              </BarChart>
                            </ResponsiveContainer>
                          </Col>
                        </Row>
                      </Card>
                    </>
                  ),
                },
              ]}
            />
          </Spin>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default PoAnalysisPage;
