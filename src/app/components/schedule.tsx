// Full updated ScheduleModal.tsx supporting Pipe, Coil, Sheet

'use client';
import dayjs from 'dayjs';
import { useEffect, useState, useRef } from 'react';
import {
  Form, Input, Button, DatePicker, Select, Table,
  Tooltip, Empty, message, Popconfirm, Modal
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined,
  SaveOutlined, CloseOutlined
} from '@ant-design/icons';
import { apiClient } from '@/utils/apiClient';
import { getCookieData } from '@/utils/common';

const { TextArea } = Input;

export interface ScheduleProps {
  isMoOpen: boolean;
  setIsMoOpen: (isOpen: boolean) => void;
  SCHEDULE_SRNO?: number | null;
}

type OptionType = {
  value: string | number;
  label: string;
};

type ScheduleItem = {
  key: number;
  SCHEDULE_DT_SRNO: string | number | null;
  OD_SRNO?: string | number | null;
  THICKNESS_SRNO?: string | number | null;
  GRADE_SRNO?: string | number | null;
  LENGTH?: string;
  QUANTITY?: string;
  WIDTH?: string;
  WEIGHT_KG?: string;
  BREADTH?: string;
  STATUS_SRNO?: string | number | null;
  isInvalid?: boolean;
};

export default function ScheduleModal({ isMoOpen, setIsMoOpen, SCHEDULE_SRNO }: ScheduleProps) {
  const cookiesData = getCookieData();
  const { USER_SRNO, API_BASE_URL, UT_SRNO } = cookiesData;
  const [form] = Form.useForm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [editingKey, setEditingKey] = useState<number | null>(null);
  const [editCache, setEditCache] = useState<ScheduleItem | null>(null);
  const [itemType, setItemType] = useState<'PIPE' | 'COIL' | 'SHEET'>('PIPE');

  const [optPartyName, setOptPartyName] = useState<OptionType[]>([]);
  const [odOptions, setOdOptions] = useState<OptionType[]>([]);
  const [thicknessOptions, setThicknessOptions] = useState<OptionType[]>([]);
  const [gradeOptions, setGradeOptions] = useState<OptionType[]>([]);

  const handleItemTypeChange = (value: 'PIPE' | 'COIL' | 'SHEET') => {
    setItemType(value);
    setItems([]);
    setEditingKey(null);
    form.setFieldsValue({ ITEM_TYPE: value });
  };

  const addItem = () => {
    const key = Date.now();
    let newItem: ScheduleItem = { key, SCHEDULE_DT_SRNO: null, STATUS_SRNO: null, isInvalid: false };
    if (itemType === 'PIPE') {
      Object.assign(newItem, { OD_SRNO: null, THICKNESS_SRNO: null, GRADE_SRNO: null, LENGTH: '', QUANTITY: '' });
    } else if (itemType === 'COIL') {
      Object.assign(newItem, { THICKNESS_SRNO: null, GRADE_SRNO: null, WIDTH: '', WEIGHT_KG: '' });
    } else {
      Object.assign(newItem, { THICKNESS_SRNO: null, GRADE_SRNO: null, LENGTH: '', BREADTH: '', WEIGHT_KG: '' });
    }
    setItems(prev => [...prev, newItem]);
    setEditingKey(key);
    setEditCache(newItem);
  };

  const removeItem = (key: number) => {
    if (editingKey === key) {
      setEditingKey(null);
      setEditCache(null);
    }
    setItems(prev => prev.filter(item => item.key !== key));
  };

  const editItem = (item: ScheduleItem) => {
    setEditingKey(item.key);
    setEditCache({ ...item });
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditCache(null);
  };

  const handleEditChange = (field: keyof ScheduleItem, value: any) => {
    if (!editCache) return;
    setEditCache({ ...editCache, [field]: value });
  };

  const saveEdit = () => {
    if (!editCache) return;

    if (itemType === 'PIPE') {
      if (!editCache.OD_SRNO || !editCache.THICKNESS_SRNO || !editCache.GRADE_SRNO || !editCache.LENGTH || !editCache.QUANTITY) {
        message.error('Please fill all pipe fields'); return;
      }
    } else if (itemType === 'COIL') {
      if (!editCache.THICKNESS_SRNO || !editCache.GRADE_SRNO || !editCache.WIDTH || !editCache.WEIGHT_KG) {
        message.error('Please fill all coil fields'); return;
      }
    } else {
      if (!editCache.THICKNESS_SRNO || !editCache.GRADE_SRNO || !editCache.LENGTH || !editCache.BREADTH || !editCache.WEIGHT_KG) {
        message.error('Please fill all sheet fields'); return;
      }
    }

    setItems(prev => prev.map(item => (item.key === editCache.key ? editCache : item)));
    setEditingKey(null);
    setEditCache(null);
  };

  const handleCancel = () => {
    setIsMoOpen(false);
    form.resetFields();
    setItems([]);
    setEditingKey(null);
    setEditCache(null);
    setItemType('PIPE');
  };

  const FetchPlCommon = async () => {
    const response = await apiClient(`${API_BASE_URL}Pl_Common?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&TBL_SRNO=1,2,3,13`, 'GET');
    if (response.msgId === 200 && response.data) {
      console.log('Pl_Common response:', response.data);
      const { Table1, Table2, Table3, Table13 } = response.data;
      setGradeOptions(Table1);
      setOdOptions(Table2);
      setThicknessOptions(Table3);
      setOptPartyName(Table13); 
    } else {
      message.error(response.msg);
    }
  };

  const fetchSchedule = async () => {
    if (!SCHEDULE_SRNO) return;
    try {
      const response = await apiClient(`${API_BASE_URL}dispSchedule?SCHEDULE_SRNO=${SCHEDULE_SRNO}&USER_SRNO=${USER_SRNO}`, 'GET');
      if (response.msgId === 200) {
        const { Table: masterData, Table1: detailData } = response.data;
        if (masterData?.length) {
          const master = masterData[0];
          form.setFieldsValue({
            PARTY_NAME: master.PARTY_NAME,
            PARTY_SRNO: master.PARTY_SRNO,
            PO_NUMBER: master.PO_NUMBER,
            SCHEDULE_DATE: master.SCHEDULE_DATE ? dayjs(master.SCHEDULE_DATE) : null,
            ESTIMATED_DELIVERY_DATE: master.ESTIMATED_DELIVERY_DATE ? dayjs(master.ESTIMATED_DELIVERY_DATE) : null,
            REMARKS: master.REMARKS,
            ITEM_TYPE: master.ITEM_TYPE || 'PIPE',
          });
          setItemType(master.ITEM_TYPE || 'PIPE');
        }
        if (detailData?.length) {
          const detailItems = detailData.map((item: any, idx: number) => ({ key: Date.now() + idx, ...item }));
          setItems(detailItems);
        }
      } else message.error(response.msg);
    } catch (error) {
      message.error("Error loading schedule for edit.");
    }
  };

  useEffect(() => {
    if (isMoOpen) {
      FetchPlCommon();
      fetchSchedule();
    }
  }, [isMoOpen, SCHEDULE_SRNO]);

  // CSV Import
      const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;
  
          const reader = new FileReader();
          reader.onload = (event) => {
              const text = event.target?.result as string;
              if (!text) return;
              // Simple CSV parsing (expects header row)
              const lines = text.split('\n').filter(Boolean);
              if (lines.length < 2) {
                  message.error('CSV must have header and at least one row.');
                  return;
              }
              const header = lines[0].split(',').map(h => h.trim().toUpperCase());
              const requiredHeaders = ['OD', 'THICKNESS', 'GRADE', 'LENGTH', 'NOS'];
              const missing = requiredHeaders.filter(h => !header.includes(h));
              if (missing.length) {
                  message.error(`Missing columns: ${missing.join(', ')}`);
                  return;
              }
              const newItems: ScheduleItem[] = lines.slice(1).map((line, idx) => {
                  const values = line.split(',').map(v => v.trim());
                  const obj: any = {};
                  header.forEach((h, i) => { obj[h] = values[i]; });
  
                  const od = odOptions.find(opt => opt.label === obj['OD']);
                  const thickness = thicknessOptions.find(opt => opt.label === obj['THICKNESS']);
                  const grade = gradeOptions.find(opt => opt.label === obj['GRADE']);
  
                  const isInvalid = !(od && thickness && grade); // check if any is missing
  
                  return {
                      key: Date.now() + idx,
                      SCHEDULE_DT_SRNO: null,
                      OD_SRNO: od?.value || null,
                      THICKNESS_SRNO: thickness?.value || null,
                      GRADE_SRNO: grade?.value || null,
                      LENGTH: obj['LENGTH'] || '',
                      QUANTITY: obj['NOS'] || '',
                      STATUS_SRNO: null,
                      isInvalid,
                  };
              });
  
              setItems(prev => [...prev, ...newItems]);
              message.success('CSV imported!');
          };
          reader.readAsText(file);
          // Reset input value so same file can be uploaded again
          e.target.value = '';
      };

  const onFinish = async (values: Record<string, any>) => {
    if (editingKey !== null) {
      message.warning('Please save or cancel the current edit before submitting.');
      return;
    }

    const payload = {
      ...values,
      ITEM_TYPE: itemType,
      IU_FLAG: SCHEDULE_SRNO ? 'U' : 'I',
      SCHEDULE_SRNO: SCHEDULE_SRNO || undefined,
      DETAIL_JSON: items,
      USER_SRNO,
      UT_SRNO,
    };

    try {
      const response = await apiClient(`${API_BASE_URL}IuSchedule`, 'POST', payload);
      if (response.msgId === 200) {
        message.success('PO submitted successfully!');
        form.resetFields();
        setItems([]);
        setIsMoOpen(false);
      } else {
        message.error(response.msg);
      }
    } catch (error) {
      message.error('Failed to submit PO.');
    }
  };

  // Table columns switch
  const getDynamicColumns = () => {
    const gradeSelect = (
      <Select style={{ width: '100%' }} placeholder="Select Grade">
        {gradeOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
      </Select>
    );

    const commonColumns = [
      {
        title: '#', dataIndex: 'index', width: 50, align: 'center' as const,
        render: (_: any, __: ScheduleItem, idx: number) => idx + 1,
      },
    ];

    let specificColumns: any[] = [];
    if (itemType === 'PIPE') {
      specificColumns = [
        { title: 'OD', dataIndex: 'OD_SRNO', render: renderSelect('OD_SRNO', odOptions) },
        { title: 'Thickness', dataIndex: 'THICKNESS_SRNO', render: renderSelect('THICKNESS_SRNO', thicknessOptions) },
        { title: 'Grade', dataIndex: 'GRADE_SRNO', render: renderSelect('GRADE_SRNO', gradeOptions) },
        { title: 'Length', dataIndex: 'LENGTH', render: renderInput('LENGTH') },
        { title: 'Quantity', dataIndex: 'QUANTITY', render: renderInput('QUANTITY') },
      ];
    } else if (itemType === 'COIL') {
      specificColumns = [
        { title: 'Grade', dataIndex: 'GRADE_SRNO', render: renderSelect('GRADE_SRNO', gradeOptions) },
        { title: 'Thickness', dataIndex: 'THICKNESS_SRNO', render: renderSelect('THICKNESS_SRNO', thicknessOptions) },
        { title: 'Width', dataIndex: 'WIDTH', render: renderInput('WIDTH') },
        { title: 'Weight (kg)', dataIndex: 'WEIGHT_KG', render: renderInput('WEIGHT_KG') },
      ];
    } else {
      specificColumns = [
        { title: 'Grade', dataIndex: 'GRADE_SRNO', render: renderSelect('GRADE_SRNO', gradeOptions) },
        { title: 'Thickness', dataIndex: 'THICKNESS_SRNO', render: renderSelect('THICKNESS_SRNO', thicknessOptions) },
        { title: 'Length', dataIndex: 'LENGTH', render: renderInput('LENGTH') },
        { title: 'Breadth', dataIndex: 'BREADTH', render: renderInput('BREADTH') },
        { title: 'Weight (kg)', dataIndex: 'WEIGHT_KG', render: renderInput('WEIGHT_KG') },
      ];
    }

    const actionCol = {
      title: 'Action', render: (_: any, record: ScheduleItem) => {
        if (editingKey === record.key) {
          return <>
            <Tooltip title="Save"><Button type="primary" icon={<SaveOutlined />} onClick={saveEdit} style={{ marginRight: 8 }} /></Tooltip>
            <Tooltip title="Cancel"><Button icon={<CloseOutlined />} onClick={cancelEdit} /></Tooltip>
          </>;
        }
        return <>
          <Tooltip title="Edit"><Button icon={<EditOutlined />} onClick={() => editingKey === null && editItem(record)} disabled={editingKey !== null} /></Tooltip>
          <Tooltip title="Delete"><Popconfirm title="Confirm delete?" onConfirm={() => removeItem(record.key)}><Button danger icon={<DeleteOutlined />} /></Popconfirm></Tooltip>
        </>;
      }
    };

    return [...commonColumns, ...specificColumns, actionCol];
  };

  const renderInput = (field: keyof ScheduleItem) => (_: any, record: ScheduleItem) =>
    editingKey === record.key && editCache ? (
      <Input
        value={editCache[field] != null ? String(editCache[field]) : ''}
        onChange={e => handleEditChange(field, e.target.value)}
        placeholder={`Enter ${field}`}
      />
    ) : (record[field] || '-');

  const renderSelect = (field: keyof ScheduleItem, options: OptionType[]) => (_: any, record: ScheduleItem) =>
    editingKey === record.key && editCache ? (
      <Select
        value={editCache[field]}
        onChange={val => handleEditChange(field, val)}
        style={{ width: '100%' }}
        placeholder={`Select ${field}`}
      >
        {options.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
      </Select>
    ) : (options.find(opt => opt.value === record[field])?.label || '-');

  return (
    <Modal open={isMoOpen} width={1000} title="Add PO" onCancel={handleCancel} footer={null}>
      <Form layout="vertical" form={form} onFinish={onFinish} style={{ padding: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <Form.Item name="ITEM_TYPE" label="Item Type" style={{ minWidth: 200 }}>
            <Select
              onChange={handleItemTypeChange}
              value={itemType}
              disabled={items.length > 0}
            >
              <Select.Option value="PIPE">Pipe</Select.Option>
              <Select.Option value="COIL">Coil</Select.Option>
              <Select.Option value="SHEET">Sheet</Select.Option>
            </Select>
          </Form.Item>
           <Form.Item name="PARTY_SRNO" label="Party" rules={[{ required: true, message: 'Please select a party' }]} style={{ minWidth: 200 }}>
                        <Select
                            showSearch
                            placeholder="Select Party Name"
                            options={optPartyName}
                            filterOption={(input: any, option: any) =>
                                option?.label.toLowerCase().includes(input.toLowerCase())
                            }
                            allowClear
                        />
                    </Form.Item>
          <Form.Item name="PARTY_NAME" label="Party Name" hidden rules={[{ required: false }]} style={{ minWidth: 200 }}>
            <Input />
          </Form.Item>
          <Form.Item name="PO_NUMBER" label="PO Number" rules={[{ required: true }]} style={{ minWidth: 200 }}>
            <Input />
          </Form.Item>
          <Form.Item name="SCHEDULE_DATE" label="PO Date" rules={[{ required: true }]} style={{ minWidth: 200 }}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="ESTIMATED_DELIVERY_DATE" label="Estimated Delivery Date" style={{ minWidth: 200 }}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <Form.Item name="REMARKS" label="Remarks">
          <TextArea rows={2} />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button icon={<PlusOutlined />} onClick={addItem} type="dashed" disabled={editingKey !== null}>Add PO Item</Button>
          {itemType === 'PIPE' && (
           <label htmlFor="csv-upload" style={{ marginLeft: 12 }}>
                          <input
                              id="csv-upload"
                              type="file"
                              accept=".csv"
                              style={{ display: 'none' }}
                              onChange={handleCSVImport}
                              disabled={editingKey !== null}
                          />
                          <Button
                              icon={<PlusOutlined />}
                              type="default"
                              disabled={editingKey !== null}
                              style={{ marginLeft: 8 }}
                              onClick={() => {
                                  // trigger file input
                                  document.getElementById('csv-upload')?.click();
                              }}
                          >
                              Import CSV
                          </Button>
                      </label>
          )}
        </div>

        <Table
          columns={getDynamicColumns()}
          dataSource={items}
          pagination={false}
          rowKey="key"
          style={{ marginBottom: 24 }}
          scroll={{ x: true }}
          locale={{ emptyText: <Empty description="No PO items. Click 'Add PO Item' to begin." /> }}
        />

        <Form.Item style={{ textAlign: 'right' }}>
          <Button type="primary" htmlType="submit" disabled={editingKey !== null}>Submit PO</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
