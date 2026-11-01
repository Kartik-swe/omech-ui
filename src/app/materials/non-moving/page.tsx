'use client';

// Non-moving stock report (read only).
// Mother coils, slit coils and pipes that have not moved for N days (default 60).
// Rows are highlighted by how long they have been idle.

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, InputNumber, Row, Select, Space, Statistic, Table, Tag, Tooltip, Typography, message } from 'antd';
import { FileExcelOutlined, SearchOutlined, WarningOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { apiClient } from '@/utils/apiClient';
import { getCookieData } from '@/utils/common';
import { exportExcelPro } from '@/utils/exportExcelPro';

const { Text } = Typography;

interface StockRow {
  ITEM_TYPE: 'M' | 'S' | 'P';
  ITEM_TYPE_NAME: string;
  MATERIAL_SRNO: number | null;
  SLITTING_SRNO: number | null;
  PR_INV_SRNO: number | null;
  CHALLAN_NO: string | null;
  ITEM_NAME: string | null;
  GRADE: string | null;
  THICKNESS: number | null;
  WIDTH: number | null;
  OD: string | null;
  PR_LENGTH: string | null;
  QUANTITY: number | null;
  WEIGHT_KG: number | null;
  RATE_PER_KG: number | null;
  STOCK_VALUE: number | null;
  STATUS_NAME: string | null;
  C_LOCATION: string | null;
  IN_DATE: string | null;
  LAST_MOVE_DATE: string | null;
  LAST_MOVE_TYPE: string | null;
  DAYS_IDLE: number | null;
}

interface TotalRow {
  ITEM_TYPE: 'M' | 'S' | 'P';
  TOTAL_ITEMS: number;
  TOTAL_QUANTITY: number;
  TOTAL_WEIGHT_KG: number;
}

// age bands used for highlighting (lower bound = the "not moved for" value)
const BANDS = [
  { key: 1, min: 0, max: 90, label: 'up to 3 months', color: '#faad14', bg: '#fffbe6', tag: 'gold' },
  { key: 2, min: 90, max: 180, label: '3 - 6 months', color: '#fa8c16', bg: '#fff2e8', tag: 'orange' },
  { key: 3, min: 180, max: 365, label: '6 - 12 months', color: '#f5222d', bg: '#fff1f0', tag: 'red' },
  { key: 4, min: 365, max: Infinity, label: 'over 1 year', color: '#a8071a', bg: '#ffccc7', tag: 'magenta' },
];

const bandOf = (days: number | null) => {
  if (days === null || days === undefined) return BANDS[3]; // no movement on record at all
  return BANDS.find((b) => days >= b.min && days < b.max) || BANDS[3];
};

const TYPE_OPTIONS = [
  { label: 'All', value: 'A' },
  { label: 'Mother coils', value: 'M' },
  { label: 'Slit coils', value: 'S' },
  { label: 'Pipes', value: 'P' },
];

const DAY_PRESETS = [30, 60, 90, 180, 365];

const kg = (v: number | null | undefined) => (Number(v) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const inr = (v: number) => '₹ ' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmtDate = (v: string | null) =>
  v ? new Date(v + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const NonMovingStockPage = () => {
  const { USER_SRNO, UT_SRNO, API_BASE_URL } = getCookieData();
  const [form] = Form.useForm();
  const [rows, setRows] = useState<StockRow[]>([]);
  const [totals, setTotals] = useState<TotalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [usedDays, setUsedDays] = useState(60);
  const [band, setBand] = useState<number | null>(null);
  const [optGrades, setOptGrades] = useState<{ label: string; value: string }[]>([]);
  const [optVendors, setOptVendors] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    loadOptions();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOptions = async () => {
    const res = await apiClient<Record<string, any>>(
      `${API_BASE_URL}Pl_Common?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&TBL_SRNO=1,4`,
      'GET'
    );
    if (res.msgId === 200 && res.data) {
      setOptGrades(res.data.Table1 || []);
      setOptVendors(res.data.Table4 || []);
    }
  };

  const load = async () => {
    const v = form.getFieldsValue();
    const days = Number(v.DAYS) >= 0 ? Number(v.DAYS) : 60;
    setLoading(true);
    const q = new URLSearchParams({
      DAYS: String(days),
      ITEM_TYPE: v.ITEM_TYPE || 'A',
      GRADE_SRNO: v.GRADE_SRNO ?? '',
      C_LOCATION: v.C_LOCATION ?? '',
      USER_SRNO: String(USER_SRNO ?? ''),
      UT_SRNO: String(UT_SRNO ?? ''),
    });
    const res = await apiClient<{ Table: StockRow[]; Table1: TotalRow[] }>(`${API_BASE_URL}DtNonMovingStock?${q}`, 'GET');
    setLoading(false);
    if (res.msgId === 200) {
      setRows(res.data?.Table || []);
      setTotals(res.data?.Table1 || []);
      setUsedDays(days);
      setBand(null);
    } else if (res.msgId !== -1) {
      message.error(res.msg || 'Failed to load report');
    }
  };

  // summary numbers
  const summary = useMemo(() => {
    const coil = rows.filter((r) => r.ITEM_TYPE !== 'P');
    const pipe = rows.filter((r) => r.ITEM_TYPE === 'P');
    const coilKg = coil.reduce((s, r) => s + (Number(r.WEIGHT_KG) || 0), 0);
    const pipeKg = pipe.reduce((s, r) => s + (Number(r.WEIGHT_KG) || 0), 0);
    const pipePcs = pipe.reduce((s, r) => s + (Number(r.QUANTITY) || 0), 0);
    const value = coil.reduce((s, r) => s + (Number(r.STOCK_VALUE) || 0), 0);
    const priced = coil.filter((r) => Number(r.RATE_PER_KG) > 0).length;
    const coilStockKg = totals.filter((t) => t.ITEM_TYPE !== 'P').reduce((s, t) => s + (Number(t.TOTAL_WEIGHT_KG) || 0), 0);
    const pipeStockPcs = totals.filter((t) => t.ITEM_TYPE === 'P').reduce((s, t) => s + (Number(t.TOTAL_QUANTITY) || 0), 0);
    return { coil, pipe, coilKg, pipeKg, pipePcs, value, priced, coilStockKg, pipeStockPcs };
  }, [rows, totals]);

  const bands = useMemo(
    () =>
      BANDS.filter((b) => b.max > usedDays).map((b) => {
        const list = rows.filter((r) => bandOf(r.DAYS_IDLE).key === b.key);
        return {
          ...b,
          from: Math.max(b.min, usedDays),
          count: list.length,
          kg: list.reduce((s, r) => s + (Number(r.WEIGHT_KG) || 0), 0),
        };
      }),
    [rows, usedDays]
  );

  const shown = band ? rows.filter((r) => bandOf(r.DAYS_IDLE).key === band) : rows;

  const sizeText = (r: StockRow) =>
    r.ITEM_TYPE === 'P'
      ? [r.ITEM_NAME, r.PR_LENGTH ? `L ${r.PR_LENGTH}` : null].filter(Boolean).join(' · ')
      : `${r.THICKNESS ?? '-'} x ${r.WIDTH ?? '-'}`;

  const columns: ColumnsType<StockRow> = [
    {
      title: 'Idle',
      dataIndex: 'DAYS_IDLE',
      width: 90,
      fixed: 'left',
      sorter: (a, b) => (a.DAYS_IDLE ?? 99999) - (b.DAYS_IDLE ?? 99999),
      defaultSortOrder: 'descend',
      render: (v: number | null) => {
        const b = bandOf(v);
        return <Tag color={b.tag} style={{ fontWeight: 600 }}>{v === null ? 'No record' : `${v} days`}</Tag>;
      },
    },
    {
      title: 'Type',
      dataIndex: 'ITEM_TYPE_NAME',
      filters: [...new Set(rows.map((r) => r.ITEM_TYPE_NAME))].map((t) => ({ text: t, value: t })),
      onFilter: (v, r) => r.ITEM_TYPE_NAME === v,
    },
    {
      title: 'Coil / Item',
      key: 'ref',
      render: (_, r) =>
        r.ITEM_TYPE === 'P' ? (
          <Text>{r.ITEM_NAME}</Text>
        ) : (
          <>
            <Text strong>{r.CHALLAN_NO || '-'}</Text>
            <div style={{ fontSize: 12, color: '#888' }}>
              {r.ITEM_TYPE === 'M' ? `Coil #${r.MATERIAL_SRNO}` : `Slit #${r.SLITTING_SRNO} of coil #${r.MATERIAL_SRNO}`}
            </div>
          </>
        ),
    },
    {
      title: 'Grade',
      dataIndex: 'GRADE',
      filters: [...new Set(rows.map((r) => r.GRADE).filter(Boolean))].map((g) => ({ text: g as string, value: g as string })),
      onFilter: (v, r) => r.GRADE === v,
    },
    { title: 'Size', key: 'size', render: (_, r) => sizeText(r) },
    {
      title: 'Qty',
      dataIndex: 'QUANTITY',
      align: 'right',
      render: (v: number | null, r) => (r.ITEM_TYPE === 'P' ? `${kg(v)} pcs` : '1'),
    },
    {
      title: 'Weight (kg)',
      dataIndex: 'WEIGHT_KG',
      align: 'right',
      sorter: (a, b) => (Number(a.WEIGHT_KG) || 0) - (Number(b.WEIGHT_KG) || 0),
      render: (v: number | null) => kg(v),
    },
    {
      title: 'Value (₹)',
      dataIndex: 'STOCK_VALUE',
      align: 'right',
      sorter: (a, b) => (Number(a.STOCK_VALUE) || 0) - (Number(b.STOCK_VALUE) || 0),
      render: (v: number | null) => (v ? kg(v) : <Text type="secondary">-</Text>),
    },
    {
      title: 'Location',
      dataIndex: 'C_LOCATION',
      filters: [...new Set(rows.map((r) => r.C_LOCATION).filter(Boolean))].map((l) => ({ text: l as string, value: l as string })),
      onFilter: (v, r) => r.C_LOCATION === v,
    },
    { title: 'Status', dataIndex: 'STATUS_NAME', render: (v: string | null) => v || '-' },
    { title: 'In stock since', dataIndex: 'IN_DATE', render: (v: string | null) => fmtDate(v) },
    {
      title: 'Last movement',
      dataIndex: 'LAST_MOVE_DATE',
      render: (v: string | null, r) => (
        <>
          {fmtDate(v)}
          {r.LAST_MOVE_TYPE ? <div style={{ fontSize: 12, color: '#888' }}>{r.LAST_MOVE_TYPE}</div> : null}
        </>
      ),
    },
  ];

  const handleExport = async () => {
    if (!shown.length) {
      message.warning('Nothing to export.');
      return;
    }
    const v = form.getFieldsValue();
    const typeLabel = TYPE_OPTIONS.find((t) => t.value === (v.ITEM_TYPE || 'A'))?.label;
    try {
      await exportExcelPro(
        [
          {
            sheetName: 'Non-moving stock',
            title: `Omech - Stock not moved for ${usedDays}+ days`,
            columns: [
              { header: 'Days idle', key: 'DAYS_IDLE', type: 'number' },
              { header: 'Type', key: 'ITEM_TYPE_NAME' },
              { header: 'Challan / Item', key: 'REF', render: (r: StockRow) => (r.ITEM_TYPE === 'P' ? r.ITEM_NAME : r.CHALLAN_NO) },
              { header: 'Coil #', key: 'MATERIAL_SRNO', type: 'number' },
              { header: 'Slit #', key: 'SLITTING_SRNO', type: 'number' },
              { header: 'Grade', key: 'GRADE' },
              { header: 'Size', key: 'SIZE', render: sizeText },
              { header: 'Qty', key: 'QUANTITY', type: 'number' },
              { header: 'Weight (kg)', key: 'WEIGHT_KG', type: 'number' },
              { header: 'Rate (₹/kg)', key: 'RATE_PER_KG', type: 'number' },
              { header: 'Value (₹)', key: 'STOCK_VALUE', type: 'number' },
              { header: 'Location', key: 'C_LOCATION' },
              { header: 'Status', key: 'STATUS_NAME' },
              { header: 'In stock since', key: 'IN_DATE' },
              { header: 'Last movement', key: 'LAST_MOVE_DATE' },
              { header: 'Last movement type', key: 'LAST_MOVE_TYPE' },
            ],
            rows: [...shown].sort((a, b) => (b.DAYS_IDLE ?? 99999) - (a.DAYS_IDLE ?? 99999)),
          },
        ],
        `Non_Moving_Stock_${usedDays}d`,
        `Type: ${typeLabel}${band ? ` · Band: ${BANDS.find((b) => b.key === band)?.label}` : ''}`
      );
    } catch (err) {
      console.error('Export error:', err);
      message.error('Export failed');
    }
  };

  const coilPct = summary.coilStockKg > 0 ? Math.round((summary.coilKg / summary.coilStockKg) * 100) : 0;
  const pipePct = summary.pipeStockPcs > 0 ? Math.round((summary.pipePcs / summary.pipeStockPcs) * 100) : 0;

  return (
    <div>
      <style>{BANDS.map((b) => `.nm-band-${b.key} > td { background: ${b.bg} !important; }`).join('\n')}</style>

      <Card
        title={<span><WarningOutlined style={{ color: '#fa8c16' }} /> Non-Moving Stock</span>}
        variant="borderless"
        styles={{ body: { padding: 12 } }}
        extra={
          <Button icon={<FileExcelOutlined />} onClick={handleExport} disabled={!shown.length}>
            Export
          </Button>
        }
      >
        <Form form={form} layout="vertical" initialValues={{ DAYS: 60, ITEM_TYPE: 'A' }} onFinish={load}>
          <Row gutter={12}>
            <Col xs={12} md={5}>
              <Form.Item label="Not moved for (days)" name="DAYS" style={{ marginBottom: 8 }}>
                <InputNumber min={0} max={3650} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={5}>
              <Form.Item label="Material" name="ITEM_TYPE" style={{ marginBottom: 8 }}>
                <Select options={TYPE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={12} md={5}>
              <Form.Item label="Grade" name="GRADE_SRNO" style={{ marginBottom: 8 }}>
                <Select allowClear showSearch options={optGrades} optionFilterProp="label" placeholder="All" />
              </Form.Item>
            </Col>
            <Col xs={12} md={5}>
              <Form.Item label="Location" name="C_LOCATION" style={{ marginBottom: 8 }}>
                <Select allowClear showSearch options={optVendors} optionFilterProp="label" placeholder="All" />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item label=" " style={{ marginBottom: 8 }}>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading} block>
                  Search
                </Button>
              </Form.Item>
            </Col>
          </Row>
          <Space size={4} wrap style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Quick:</Text>
            {DAY_PRESETS.map((d) => (
              <Tag.CheckableTag
                key={d}
                checked={usedDays === d}
                onChange={() => {
                  form.setFieldValue('DAYS', d);
                  load();
                }}
              >
                {d === 365 ? '1 year' : `${d} days`}
              </Tag.CheckableTag>
            ))}
          </Space>
        </Form>

        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} md={6}>
            <Card size="small">
              <Statistic title="Idle coils / slits" value={summary.coil.length} suffix="items" />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small">
              <Statistic title="Idle coil weight" value={(summary.coilKg / 1000).toFixed(1)} suffix="t" />
              <Text type="secondary" style={{ fontSize: 12 }}>{coilPct}% of coil stock</Text>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small">
              <Statistic title="Idle pipes" value={kg(summary.pipePcs)} suffix="pcs" />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {(summary.pipeKg / 1000).toFixed(1)} t · {pipePct}% of pipe stock
              </Text>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small">
              <Statistic title="Idle coil value" value={inr(summary.value)} />
              <Tooltip title="Only coils with a rate per kg entered are valued">
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {summary.priced} of {summary.coil.length} coils have a rate
                </Text>
              </Tooltip>
            </Card>
          </Col>
        </Row>

        <Space size={8} wrap style={{ marginBottom: 12 }}>
          {bands.map((b) => (
            <Tag
              key={b.key}
              onClick={() => setBand(band === b.key ? null : b.key)}
              style={{
                cursor: 'pointer',
                padding: '4px 10px',
                background: b.bg,
                borderColor: band === b.key ? b.color : 'transparent',
                borderWidth: 2,
                color: '#333',
              }}
            >
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: b.color, marginRight: 6 }} />
              {b.max === Infinity ? `${b.from}+ days` : `${b.from} - ${b.max - 1} days`}: <b>{b.count}</b> · {kg(b.kg)} kg
            </Tag>
          ))}
          {band && (
            <Button size="small" type="link" onClick={() => setBand(null)}>
              Show all
            </Button>
          )}
        </Space>

        {!loading && rows.length === 0 ? (
          <Alert type="success" showIcon message={`No stock has been idle for ${usedDays} days or more.`} />
        ) : (
          <Table
            rowKey={(r) => `${r.ITEM_TYPE}-${r.MATERIAL_SRNO ?? ''}-${r.SLITTING_SRNO ?? ''}-${r.PR_INV_SRNO ?? ''}`}
            columns={columns}
            dataSource={shown}
            loading={loading}
            size="small"
            scroll={{ x: 'max-content' }}
            rowClassName={(r) => `nm-band-${bandOf(r.DAYS_IDLE).key}`}
            pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: [50, 100, 500], hideOnSinglePage: true }}
            summary={(data) => {
              const w = data.reduce((s, r) => s + (Number(r.WEIGHT_KG) || 0), 0);
              const val = data.reduce((s, r) => s + (Number(r.STOCK_VALUE) || 0), 0);
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={6}>
                    <Text strong>Total ({data.length} rows on this page)</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="right"><Text strong>{kg(w)}</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={7} align="right"><Text strong>{val ? kg(val) : '-'}</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={8} colSpan={4} />
                </Table.Summary.Row>
              );
            }}
          />
        )}

        <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 12 }}>
          Last movement = latest of receipt / slitting date, status change, location shift, or a slit cut from the coil;
          for pipes, the latest pipe transaction at that location. Same stock as the Raw Material Stock and Pipe Inventory screens.
        </Text>
      </Card>
    </div>
  );
};

export default NonMovingStockPage;
