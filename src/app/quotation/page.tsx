'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Card, Row, Col, Select, DatePicker, Input, Button, Table, Tag, Space, message,
  Modal, Form, Radio, InputNumber, Typography, Popconfirm, Tooltip,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, PrinterOutlined, SearchOutlined,
} from '@ant-design/icons';
import { apiClient } from '@/utils/apiClient';
import { getCookieData } from '@/utils/common';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import dayjs from 'dayjs';

const { Text } = Typography;
const { Option } = Select;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OptionType = { label: string; value: number };

interface QuotationListRow {
  QUOTATION_SRNO: number;
  QUOTATION_NO: string;
  QUOTATION_DATE: string;
  PARTY_SRNO: number | null;
  PARTY_NAME: string;
  ENQUIRY_NO: string | null;
  ENQUIRY_DATE: string | null;
  RATE_BASIS_MODE: 'K' | 'M' | 'BOTH';
  GST_PERCENT: number;
  STATUS: string;
  TOTAL_WEIGHT: number;
  TOTAL_AMOUNT_KG: number;
  TOTAL_AMOUNT_METER: number;
  ITEM_COUNT: number;
}

interface ItemRow {
  key: string;
  QUOTATION_DT_SRNO?: number;
  SR_NO: number;
  IS_NOTE: boolean;
  DESCRIPTION: string;
  OD_SRNO?: number;
  GRADE_SRNO?: number;
  THICKNESS_SRNO?: number;
  LENGTH?: number;
  QTY?: number;
  WEIGHT?: number;
  RATE_PER_KG?: number;
  RATE_PER_METER?: number;
}

const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Same weight formula already used elsewhere in this app (IU_SCHEDULE) so
// the auto-suggestion stays consistent with PO items - always editable after.
const suggestWeight = (odVal: number | undefined, thickVal: number | undefined, lengthMm: number | undefined, qty: number | undefined) => {
  if (!odVal || !thickVal || !lengthMm || !qty) return undefined;
  const perPiece = (odVal - thickVal) * thickVal * lengthMm * 0.00002485;
  return round2(perPiece * qty);
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'default',
  SENT: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const QuotationPage = () => {
  const { USER_SRNO, API_BASE_URL, UT_SRNO } = getCookieData();

  const [loading, setLoading] = useState(false);
  const [quotations, setQuotations] = useState<QuotationListRow[]>([]);

  const [optParty, setOptParty] = useState<OptionType[]>([]);
  const [optGrades, setOptGrades] = useState<OptionType[]>([]);
  const [optOD, setOptOD] = useState<OptionType[]>([]);
  const [optThickness, setOptThickness] = useState<OptionType[]>([]);

  // list filters
  const [searchNo, setSearchNo] = useState('');
  const [filterParty, setFilterParty] = useState<number | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  // editor modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSrno, setEditingSrno] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [rateBasisMode, setRateBasisMode] = useState<'K' | 'M' | 'BOTH'>('K');
  const [items, setItems] = useState<ItemRow[]>([]);

  useEffect(() => {
    fetchCommonData();
    fetchQuotations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchNo) params.append('QUOTATION_NO', searchNo);
      if (filterParty) params.append('PARTY_SRNO', String(filterParty));
      if (filterStatus) params.append('STATUS', filterStatus);
      const res = await apiClient(`${API_BASE_URL}DtQuotation?${params.toString()}`, 'GET');
      if (res.msgId === 200 && res.data) {
        setQuotations(res.data.Table || []);
      } else {
        setQuotations([]);
      }
    } catch (err) {
      console.error('Error fetching quotations:', err);
      message.error('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Editor
  // -------------------------------------------------------------------------

  const blankItem = (srNo: number): ItemRow => ({ key: `new-${Date.now()}-${srNo}`, SR_NO: srNo, IS_NOTE: false, DESCRIPTION: '' });

  const openAdd = () => {
    setEditingSrno(null);
    setRateBasisMode('K');
    setItems([blankItem(1)]);
    form.resetFields();
    form.setFieldsValue({
      QUOTATION_DATE: null,
      RATE_BASIS_MODE: 'K',
      GST_PERCENT: 18,
      RATE_TERMS: 'EX WORK AURANGABAD',
      PAYMENT_TERMS: '30 % ADVANCE ALONG WITH PO BALANCE BEFORE DISPATCH',
      DELIVERY_TERMS: '3-4 WEEK AFTER RECEIPTS OF ADVANCE PAYMENT ALONG WITH PO',
      VALIDITY: '2 DAY',
      STATUS: 'DRAFT',
    });
    setModalOpen(true);
  };

  const openEdit = async (row: QuotationListRow) => {
    setEditingSrno(row.QUOTATION_SRNO);
    setModalOpen(true);
    try {
      const res = await apiClient(`${API_BASE_URL}DtQuotationDtl?QUOTATION_SRNO=${row.QUOTATION_SRNO}`, 'GET');
      if (res.msgId === 200 && res.data) {
        const master = res.data.Table?.[0];
        const details = res.data.Table1 || [];
        if (master) {
          form.setFieldsValue({
            ...master,
            QUOTATION_DATE: master.QUOTATION_DATE ? dayjs(master.QUOTATION_DATE) : null,
            ENQUIRY_DATE: master.ENQUIRY_DATE ? dayjs(master.ENQUIRY_DATE) : null,
          });
          setRateBasisMode(master.RATE_BASIS_MODE || 'K');
        }
        setItems(
          details.length
            ? details.map((d: any, idx: number) => ({
                key: `existing-${d.QUOTATION_DT_SRNO}`,
                QUOTATION_DT_SRNO: d.QUOTATION_DT_SRNO,
                SR_NO: d.SR_NO ?? idx + 1,
                IS_NOTE: !!d.IS_NOTE,
                DESCRIPTION: d.DESCRIPTION,
                OD_SRNO: d.OD_SRNO,
                GRADE_SRNO: d.GRADE_SRNO,
                THICKNESS_SRNO: d.THICKNESS_SRNO,
                LENGTH: d.LENGTH,
                QTY: d.QTY,
                WEIGHT: d.WEIGHT,
                RATE_PER_KG: d.RATE_PER_KG,
                RATE_PER_METER: d.RATE_PER_METER,
              }))
            : [blankItem(1)]
        );
      }
    } catch (err) {
      console.error('Error loading quotation detail:', err);
      message.error('Failed to load quotation');
    }
  };

  // Local, dependency-free date parsing to avoid pulling in a date library
  // just for this - antd's DatePicker just needs something with .format()

  const updateItem = (key: string, patch: Partial<ItemRow>) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.key !== key) return it;
        const merged = { ...it, ...patch };
        // Auto-suggest weight whenever the relevant fields are present - still editable after
        if (!merged.IS_NOTE && ('OD_SRNO' in patch || 'THICKNESS_SRNO' in patch || 'LENGTH' in patch || 'QTY' in patch)) {
          const odVal = optOD.find((o) => o.value === merged.OD_SRNO);
          const thickVal = optThickness.find((t) => t.value === merged.THICKNESS_SRNO);
          const suggested = suggestWeight(
            odVal ? Number(odVal.label) : undefined,
            thickVal ? Number(thickVal.label) : undefined,
            merged.LENGTH,
            merged.QTY
          );
          if (suggested !== undefined) merged.WEIGHT = suggested;
        }
        return merged;
      })
    );
  };

  const addItemRow = () => setItems((prev) => [...prev, blankItem(prev.length + 1)]);
  const addNoteRow = () => setItems((prev) => [...prev, { ...blankItem(prev.length + 1), IS_NOTE: true }]);
  const removeItemRow = (key: string) => setItems((prev) => prev.filter((it) => it.key !== key).map((it, idx) => ({ ...it, SR_NO: idx + 1 })));

  const amountFor = (item: ItemRow) => ({
    kg: item.RATE_PER_KG && item.WEIGHT ? round2(item.RATE_PER_KG * item.WEIGHT) : 0,
    meter: item.RATE_PER_METER && item.LENGTH && item.QTY ? round2(item.RATE_PER_METER * (item.LENGTH / 1000) * item.QTY) : 0,
  });

  const totals = useMemo(() => {
    const real = items.filter((i) => !i.IS_NOTE);
    return {
      weight: round2(real.reduce((s, i) => s + (i.WEIGHT || 0), 0)),
      amountKg: round2(real.reduce((s, i) => s + amountFor(i).kg, 0)),
      amountMeter: round2(real.reduce((s, i) => s + amountFor(i).meter, 0)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const handlePartySelect = async (partySrno: number) => {
    try {
      const res = await apiClient(`${API_BASE_URL}DtMPartyDtl?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&PARTY_SRNO=${partySrno}`, 'GET');
      if (res.msgId === 200 && res.data?.Table?.[0]) {
        const p = res.data.Table[0];
        form.setFieldsValue({
          PARTY_NAME: p.PARTY_NAME,
          PARTY_ADDRESS: p.ADDRESS,
          PARTY_GST_NO: p.GST_NO,
        });
      }
    } catch (err) {
      console.error('Error fetching party detail:', err);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (items.filter((i) => !i.IS_NOTE).length === 0) {
        message.warning('Add at least one item line.');
        return;
      }
      setSaving(true);
      const payload = {
        IU_FLAG: editingSrno ? 'U' : 'I',
        QUOTATION_NO: values.QUOTATION_NO,
        QUOTATION_DATE: values.QUOTATION_DATE?.format('YYYY-MM-DD'),
        PARTY_SRNO: values.PARTY_SRNO || null,
        PARTY_NAME: values.PARTY_NAME || null,
        PARTY_ADDRESS: values.PARTY_ADDRESS || null,
        PARTY_GST_NO: values.PARTY_GST_NO || null,
        ENQUIRY_NO: values.ENQUIRY_NO || null,
        ENQUIRY_DATE: values.ENQUIRY_DATE ? values.ENQUIRY_DATE.format('YYYY-MM-DD') : null,
        RATE_BASIS_MODE: rateBasisMode,
        GST_PERCENT: values.GST_PERCENT,
        PAYMENT_TERMS: values.PAYMENT_TERMS || null,
        RATE_TERMS: values.RATE_TERMS || null,
        DELIVERY_TERMS: values.DELIVERY_TERMS || null,
        VALIDITY: values.VALIDITY || null,
        STATUS: values.STATUS || 'DRAFT',
        DETAIL_JSON: items.map((it) => ({
          QUOTATION_DT_SRNO: it.QUOTATION_DT_SRNO || null,
          SR_NO: it.SR_NO,
          IS_NOTE: it.IS_NOTE,
          DESCRIPTION: it.DESCRIPTION || null,
          OD_SRNO: it.IS_NOTE ? null : it.OD_SRNO || null,
          GRADE_SRNO: it.IS_NOTE ? null : it.GRADE_SRNO || null,
          THICKNESS_SRNO: it.IS_NOTE ? null : it.THICKNESS_SRNO || null,
          LENGTH: it.IS_NOTE ? null : it.LENGTH || null,
          QTY: it.IS_NOTE ? null : it.QTY || null,
          WEIGHT: it.IS_NOTE ? null : it.WEIGHT || null,
          RATE_PER_KG: it.IS_NOTE ? null : it.RATE_PER_KG || null,
          RATE_PER_METER: it.IS_NOTE ? null : it.RATE_PER_METER || null,
        })),
        UT_SRNO,
        USER_SRNO,
        QUOTATION_SRNO: editingSrno,
      };
      const res = await apiClient(`${API_BASE_URL}IuQuotation`, 'POST', payload);
      if (res.msgId === 200) {
        message.success(editingSrno ? 'Quotation updated' : 'Quotation created');
        setModalOpen(false);
        fetchQuotations();
      } else {
        message.error(res.msg || 'Failed to save quotation');
      }
    } catch (err: any) {
      if (err?.errorFields) return; // antd validation error, already shown inline
      console.error('Error saving quotation:', err);
      message.error('Failed to save quotation');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: QuotationListRow) => {
    try {
      const res = await apiClient(`${API_BASE_URL}DelQuotation?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&QUOTATION_SRNO=${row.QUOTATION_SRNO}`, 'DELETE');
      if (res.msgId === 200) {
        message.success('Quotation deleted');
        fetchQuotations();
      } else {
        message.error(res.msg || 'Failed to delete');
      }
    } catch (err) {
      console.error('Error deleting quotation:', err);
      message.error('Failed to delete quotation');
    }
  };

  // -------------------------------------------------------------------------
  // Table columns
  // -------------------------------------------------------------------------

  const listColumns = [
    { title: 'Quotation No', dataIndex: 'QUOTATION_NO', key: 'QUOTATION_NO' },
    { title: 'Date', dataIndex: 'QUOTATION_DATE', key: 'QUOTATION_DATE', render: (v: string) => (v ? dayjs(v).format('DD/MM/YYYY') : '') },
    { title: 'Party', dataIndex: 'PARTY_NAME', key: 'PARTY_NAME' },
    { title: 'Items', dataIndex: 'ITEM_COUNT', key: 'ITEM_COUNT', width: 70 },
    {
      title: 'Basis',
      dataIndex: 'RATE_BASIS_MODE',
      key: 'RATE_BASIS_MODE',
      render: (v: string) => (v === 'BOTH' ? 'Kg & Metre' : v === 'M' ? 'Per Metre' : 'Per Kg'),
    },
    { title: 'Weight (kg)', dataIndex: 'TOTAL_WEIGHT', key: 'TOTAL_WEIGHT', render: (v: number) => round2(v || 0) },
    {
      title: 'Amount (₹)',
      key: 'amount',
      render: (_: any, r: QuotationListRow) =>
        r.RATE_BASIS_MODE === 'BOTH'
          ? `Kg: ${round2(r.TOTAL_AMOUNT_KG || 0)} / M: ${round2(r.TOTAL_AMOUNT_METER || 0)}`
          : r.RATE_BASIS_MODE === 'M'
          ? round2(r.TOTAL_AMOUNT_METER || 0)
          : round2(r.TOTAL_AMOUNT_KG || 0),
    },
    {
      title: 'Status',
      dataIndex: 'STATUS',
      key: 'STATUS',
      render: (v: string) => <Tag color={STATUS_COLORS[v] || 'default'}>{v}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, r: QuotationListRow) => (
        <Space>
          <Tooltip title="Edit">
            <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
          </Tooltip>
          <Tooltip title="Print / Preview">
            <Button
              icon={<PrinterOutlined />}
              size="small"
              onClick={() => window.open(`/quotation/${r.QUOTATION_SRNO}/print`, '_blank')}
            />
          </Tooltip>
          <Popconfirm title="Delete this quotation?" onConfirm={() => handleDelete(r)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const itemColumns = [
    { title: 'Sr', dataIndex: 'SR_NO', key: 'SR_NO', width: 50 },
    {
      title: 'Description',
      key: 'DESCRIPTION',
      width: 220,
      render: (_: any, r: ItemRow) => (
        <Input.TextArea
          autoSize
          value={r.DESCRIPTION}
          placeholder={r.IS_NOTE ? 'Note text (e.g. mill TC / PMI test remark)' : 'Item description'}
          onChange={(e) => updateItem(r.key, { DESCRIPTION: e.target.value })}
        />
      ),
    },
    ...([
          {
            title: 'OD',
            key: 'OD_SRNO',
            width: 100,
            render: (_: any, r: ItemRow) =>
              r.IS_NOTE ? null : (
                <Select
                  size="small"
                  style={{ width: '100%' }}
                  allowClear
                  showSearch
                  options={optOD}
                  value={r.OD_SRNO}
                  onChange={(v) => updateItem(r.key, { OD_SRNO: v })}
                  filterOption={(input, option) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
                />
              ),
          },
          {
            title: 'Grade',
            key: 'GRADE_SRNO',
            width: 100,
            render: (_: any, r: ItemRow) =>
              r.IS_NOTE ? null : (
                <Select
                  size="small"
                  style={{ width: '100%' }}
                  allowClear
                  showSearch
                  options={optGrades}
                  value={r.GRADE_SRNO}
                  onChange={(v) => updateItem(r.key, { GRADE_SRNO: v })}
                  filterOption={(input, option) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
                />
              ),
          },
          {
            title: 'Thickness',
            key: 'THICKNESS_SRNO',
            width: 100,
            render: (_: any, r: ItemRow) =>
              r.IS_NOTE ? null : (
                <Select
                  size="small"
                  style={{ width: '100%' }}
                  allowClear
                  showSearch
                  options={optThickness}
                  value={r.THICKNESS_SRNO}
                  onChange={(v) => updateItem(r.key, { THICKNESS_SRNO: v })}
                  filterOption={(input, option) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
                />
              ),
          },
          {
            title: 'Length (mm)',
            key: 'LENGTH',
            width: 100,
            render: (_: any, r: ItemRow) =>
              r.IS_NOTE ? null : (
                <InputNumber size="small" style={{ width: '100%' }} value={r.LENGTH} onChange={(v) => updateItem(r.key, { LENGTH: v ?? undefined })} />
              ),
          },
          {
            title: 'Qty (NOS)',
            key: 'QTY',
            width: 90,
            render: (_: any, r: ItemRow) =>
              r.IS_NOTE ? null : (
                <InputNumber size="small" style={{ width: '100%' }} value={r.QTY} onChange={(v) => updateItem(r.key, { QTY: v ?? undefined })} />
              ),
          },
          {
            title: 'Weight (kg)',
            key: 'WEIGHT',
            width: 100,
            render: (_: any, r: ItemRow) =>
              r.IS_NOTE ? null : (
                <Tooltip title="Auto-suggested from OD/Thickness/Length/Qty - fully editable">
                  <InputNumber size="small" style={{ width: '100%' }} value={r.WEIGHT} onChange={(v) => updateItem(r.key, { WEIGHT: v ?? undefined })} />
                </Tooltip>
              ),
          },
          ...(rateBasisMode === 'K' || rateBasisMode === 'BOTH'
            ? [
                {
                  title: 'Rate/Kg',
                  key: 'RATE_PER_KG',
                  width: 90,
                  render: (_: any, r: ItemRow) =>
                    r.IS_NOTE ? null : (
                      <InputNumber size="small" style={{ width: '100%' }} value={r.RATE_PER_KG} onChange={(v) => updateItem(r.key, { RATE_PER_KG: v ?? undefined })} />
                    ),
                },
                {
                  title: 'Amount (Kg)',
                  key: 'AMOUNT_KG',
                  width: 100,
                  render: (_: any, r: ItemRow) => (r.IS_NOTE ? null : amountFor(r).kg),
                },
              ]
            : []),
          ...(rateBasisMode === 'M' || rateBasisMode === 'BOTH'
            ? [
                {
                  title: 'Rate/Metre',
                  key: 'RATE_PER_METER',
                  width: 90,
                  render: (_: any, r: ItemRow) =>
                    r.IS_NOTE ? null : (
                      <InputNumber size="small" style={{ width: '100%' }} value={r.RATE_PER_METER} onChange={(v) => updateItem(r.key, { RATE_PER_METER: v ?? undefined })} />
                    ),
                },
                {
                  title: 'Amount (Metre)',
                  key: 'AMOUNT_METER',
                  width: 100,
                  render: (_: any, r: ItemRow) => (r.IS_NOTE ? null : amountFor(r).meter),
                },
              ]
            : []),
        ]),
    {
      title: '',
      key: 'remove',
      width: 40,
      render: (_: any, r: ItemRow) => <Button icon={<DeleteOutlined />} size="small" danger onClick={() => removeItemRow(r.key)} />,
    },
  ];

  return (
    <ProtectedRoute>
      <div style={{ padding: 20 }}>
        <Card
          title="Quotations"
          variant="borderless"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
              New Quotation
            </Button>
          }
        >
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Input
                placeholder="Search Quotation No"
                value={searchNo}
                onChange={(e) => setSearchNo(e.target.value)}
                onPressEnter={fetchQuotations}
                suffix={<SearchOutlined onClick={fetchQuotations} style={{ cursor: 'pointer' }} />}
              />
            </Col>
            <Col span={5}>
              <Select
                allowClear
                showSearch
                placeholder="All Customers"
                style={{ width: '100%' }}
                options={optParty}
                value={filterParty}
                onChange={(v) => setFilterParty(v)}
                filterOption={(input, option) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
              />
            </Col>
            <Col span={5}>
              <Select allowClear placeholder="All Status" style={{ width: '100%' }} value={filterStatus} onChange={setFilterStatus}>
                <Option value="DRAFT">Draft</Option>
                <Option value="SENT">Sent</Option>
                <Option value="APPROVED">Approved</Option>
                <Option value="REJECTED">Rejected</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Button onClick={fetchQuotations}>Search</Button>
            </Col>
          </Row>

          <Table columns={listColumns} dataSource={quotations} rowKey="QUOTATION_SRNO" loading={loading} pagination={{ pageSize: 15 }} />
        </Card>

        <Modal
          title={editingSrno ? 'Edit Quotation' : 'New Quotation'}
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={handleSave}
          confirmLoading={saving}
          width={1200}
          okText="Save"
        >
          <Form layout="vertical" form={form}>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item name="QUOTATION_NO" label="Quotation No" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="e.g. OCPL/26-27/56" />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item name="QUOTATION_DATE" label="Date" rules={[{ required: true, message: 'Required' }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={7}>
                <Form.Item label="Customer (pick to auto-fill)">
                  <Select
                    allowClear
                    showSearch
                    placeholder="Select customer"
                    options={optParty}
                    onChange={(v) => v && handlePartySelect(v)}
                    filterOption={(input, option) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
                  />
                </Form.Item>
                <Form.Item name="PARTY_SRNO" hidden><Input /></Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="STATUS" label="Status">
                  <Select>
                    <Option value="DRAFT">Draft</Option>
                    <Option value="SENT">Sent</Option>
                    <Option value="APPROVED">Approved</Option>
                    <Option value="REJECTED">Rejected</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={9}>
                <Form.Item name="PARTY_NAME" label="Party Name" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="Party name (editable)" />
                </Form.Item>
              </Col>
              <Col span={9}>
                <Form.Item name="PARTY_ADDRESS" label="Party Address">
                  <Input.TextArea rows={1} autoSize placeholder="Party address (editable)" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="PARTY_GST_NO" label="Party GST No">
                  <Input placeholder="GST No (editable)" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={6}>
                <Form.Item name="ENQUIRY_NO" label="Enquiry No">
                  <Input placeholder="e.g. mail" />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item name="ENQUIRY_DATE" label="Enquiry Date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item name="GST_PERCENT" label="GST %">
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Rate Basis">
                  <Radio.Group value={rateBasisMode} onChange={(e) => setRateBasisMode(e.target.value)}>
                    <Radio.Button value="K">Per Kg</Radio.Button>
                    <Radio.Button value="M">Per Metre</Radio.Button>
                    <Radio.Button value="BOTH">Both</Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>

            <Space style={{ marginBottom: 8 }}>
              <Button size="small" icon={<PlusOutlined />} onClick={addItemRow}>Add Item</Button>
              <Button size="small" onClick={addNoteRow}>Add Note Row</Button>
            </Space>
            <Table
              columns={itemColumns}
              dataSource={items}
              rowKey="key"
              pagination={false}
              size="small"
              rowClassName={(r) => (r.IS_NOTE ? 'quotation-note-row' : '')}
              style={{ marginBottom: 16 }}
            />
            <style jsx global>{`
              .quotation-note-row { background-color: #fffbcc; }
            `}</style>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}><Text strong>Total Weight: </Text>{totals.weight} kg</Col>
              {(rateBasisMode === 'K' || rateBasisMode === 'BOTH') && (
                <Col span={8}><Text strong>Total Amount (Kg basis): </Text>₹{totals.amountKg}</Col>
              )}
              {(rateBasisMode === 'M' || rateBasisMode === 'BOTH') && (
                <Col span={8}><Text strong>Total Amount (Metre basis): </Text>₹{totals.amountMeter}</Col>
              )}
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="RATE_TERMS" label="Rate Terms">
                  <Input placeholder="e.g. EX WORK AURANGABAD" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="PAYMENT_TERMS" label="Payment Terms">
                  <Input placeholder="e.g. 30% advance..." />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="DELIVERY_TERMS" label="Delivery">
                  <Input placeholder="e.g. 3-4 weeks after advance" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="VALIDITY" label="Validity">
              <Input placeholder="e.g. 2 Day" style={{ maxWidth: 200 }} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ProtectedRoute>
  );
};

export default QuotationPage;
