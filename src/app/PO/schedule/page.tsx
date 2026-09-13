// schedule/page.tsx
'use client';
import { PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined, CloseOutlined, MergeCellsOutlined, FileExcelOutlined } from '@ant-design/icons';
import ScheduleModal from "@/app/components/schedule";
import { Button, Card, Col, Form, Input, message, Popconfirm, Row, Select, Table, Tooltip, DatePicker, Tag, Progress} from "antd";
const { Option } = Select;
const { RangePicker } = DatePicker;
import { useEffect, useState } from "react";

import { getCookieData } from '@/utils/common';
import { apiClient } from '@/utils/apiClient';
import { exportExcelPro, sortByDateDesc } from '@/utils/exportExcelPro';
// top
import DispatchModal from "@/app/components/dispatchSchedule";

type OptionType = {
  value: string | number;
  label: string;
};

export default function SchedulePage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editScheduleSrno, setEditScheduleSrno] = useState<number | null>(null);
const [form] = Form.useForm();
const [isDispatchOpen, setIsDispatchOpen] = useState(false);
const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'PIPE' | 'COIL' | 'SHEET' | null>('PIPE');
  const [optPartyName, setOptPartyName] = useState<OptionType[]>([]);


     const { API_BASE_URL, USER_SRNO, UT_SRNO } = getCookieData();
        const [loading, setLoading] = useState(false);
        const [schedules, setSchedules] = useState<any[]>([]);
    
        useEffect(() => {
          FetchPlCommon()
            form.setFieldsValue({ ITEM_TYPE: 'PIPE' });
            fetchSchedules();

        }, []);
        // Default itemType

        useEffect(() => {
            if (!isModalOpen) {
                fetchSchedules();
            }
        }, [isModalOpen]);
    


         const FetchPlCommon = async () => {
    const response = await apiClient(`${API_BASE_URL}Pl_Common?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&TBL_SRNO=13`, 'GET');
    if (response.msgId === 200 && response.data) {
      const {  Table13 } = response.data;
      setOptPartyName(Table13); 
    } else {
      message.error(response.msg);
    }
  };

        const fetchSchedules = async () => {
  setLoading(true);
  try {
    const values = form.getFieldsValue();
    const { ENTRY_DATE, DELIVERY_DATE, ...rest } = values;

    const filters: any = {
      ...rest,
    };

    if (ENTRY_DATE && ENTRY_DATE.length === 2) {
      filters.ENTRY_DATE_FROM = ENTRY_DATE[0]?.format('YYYY-MM-DD');
      filters.ENTRY_DATE_TO = ENTRY_DATE[1]?.format('YYYY-MM-DD');
    }

    if (DELIVERY_DATE && DELIVERY_DATE.length === 2) {
      filters.DELIVERY_DATE_FROM = DELIVERY_DATE[0]?.format('YYYY-MM-DD');
      filters.DELIVERY_DATE_TO = DELIVERY_DATE[1]?.format('YYYY-MM-DD');
    }

    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );

    const stringFilters = Object.fromEntries(
      Object.entries(cleanedFilters).map(([k, v]) => [k, String(v)])
    );

    const queryParams = new URLSearchParams(stringFilters).toString();
    const res = await apiClient(`${API_BASE_URL}DtSchedule?${queryParams}`, 'GET');
    setSchedules(res.data.Table || []);
  } catch (err) {
    message.error('Failed to load schedules.');
  } finally {
    setLoading(false);
  }
};


    
        const handleDelete = async (SCHEDULE_SRNO: any) => {
            try {
                const res = await apiClient(`${API_BASE_URL}DelSchedule?SCHEDULE_SRNO=${SCHEDULE_SRNO}&USER_SRNO=${USER_SRNO}`, 'DELETE');
                if (res.msgId === 200) {
                    message.success('Schedule deleted');
                    fetchSchedules();
                } else {
                    message.error(res.msg);
                }
            } catch (err) {
                message.error('Failed to delete schedule.');
            }
        };
    
       const handleEdit = (SCHEDULE_SRNO: number) => {
  setEditScheduleSrno(SCHEDULE_SRNO);
  setIsModalOpen(true);
};
    
        const columns = [
          {
                title: 'Party Name',
                dataIndex: 'PARTY_NAME',
            },
            {
                title: 'PO Number',
                dataIndex: 'PO_NUMBER',
            },
            {
                title: 'PO Date',
                dataIndex: 'SCHEDULE_DATE',
            },
           {
  title: 'Est. Delivery',
  dataIndex: 'ESTIMATED_DELIVERY_DATE',
  render: (date:any,record:any) => {
    const isUrgent = record.IS_URGENT_DELIVERY === 'Y';
    return (
       <Tag color={isUrgent ? 'red' : 'default'}>
        {record.ESTIMATED_DELIVERY_DATE}
      </Tag>
    );
  },
},

             {
    title: 'Total Ordered',
    children: [
      {
        title: 'Qty',
        dataIndex: 'T_ORDER_QTY',
        key: 't_order_qty',
        align: 'center',
        width: 80,
      },
      {
        title: 'Wt (kg)',
        dataIndex: 'T_ORDER_WEIGHT',
        key: 't_order_weight',
        align: 'center',
        width: 100,
      },
    ],
  },
             {
    title: 'Dispatched',
    children: [
      {
        title: 'Qty',
        dataIndex: 'T_DISPATCHED_QTY',
        key: 't_dispatched_qty',
        align: 'center',
        width: 80,
      },
      {
        title: 'Wt (kg)',
        dataIndex: 'T_DISPATCHED_WEIGHT',
        key: 't_dispatched_weight',
        align: 'center',
        width: 100,
      },
    ],
  },
             {
    title: 'Pending',
    hidden: true,
    children: [
      {
        title: 'Qty',
        dataIndex: 'T_PENDING_QTY',
        key: 't_pending_qty',
        align: 'center',
        width: 80,
      },
      {
        title: 'Wt (kg)',
        dataIndex: 'T_PENDING_WEIGHT',
        key: 't_pending_weight',
        align: 'center',
        width: 100,
      },
    ],
  },
       
             {
    title: 'Status',
    dataIndex: 'STATUS_NAME',
    key: 'STATUS_NAME',
    render: (text: string, record: any) => {
        let color = '';
        const completionColor = record.COMPLETION_PERCENTAGE === 100 ? 'green' : record.COMPLETION_PERCENTAGE >= 75 ? 'blue' : record.COMPLETION_PERCENTAGE >= 50 ? 'orange' : 'red';

        switch (record.STATUS_SRNO) {
            case 11:
                color = 'orange'; // Pending
                break;
            case 12:
                color = 'green'; // Completed
                break;
            case 13:
                color = 'red'; // Closed
                break;
            default:
                color = 'default';
        }

        return <>
        <Tag color={color}>{text}</Tag>
        <Tooltip title={`${record.COMPLETION_PERCENTAGE}% Dispatched`}>
          <Progress
            percent={parseFloat(record.COMPLETION_PERCENTAGE)}
            strokeColor={color}
            size="small"
            status={record.COMPLETION_PERCENTAGE === 100 ? 'success' : 'active'}
          />
        </Tooltip>
        </>
    }
},
// {
//   title: 'Completion',
//   dataIndex: 'COMPLETION_PERCENTAGE',
//   key: 'completion_percentage',
//   align: 'center',
//   width: 150,
//   render: (text: string, record: any) => {
//     const color = record.COMPLETION_PERCENTAGE === 100 ? 'green' : record.COMPLETION_PERCENTAGE >= 75 ? 'blue' : record.COMPLETION_PERCENTAGE >= 50 ? 'orange' : 'red';
//     return (
//       <Tooltip title={`${record.COMPLETION_PERCENTAGE}% Dispatched`}>
//         <Progress
//           percent={parseFloat(record.COMPLETION_PERCENTAGE)}
//           strokeColor={color}
//           size="small"
//           status={record.COMPLETION_PERCENTAGE === 100 ? 'success' : 'active'}
//         />
//       </Tooltip>
//     );
//   }
// },


            {
                title: 'Actions',
                render: (_: any, record: any) => (
                    <>
                        <Tooltip title="Edit">
                            <Button icon={<EditOutlined />} onClick={() => handleEdit(record.SCHEDULE_SRNO)} />
                        </Tooltip>
                        <Popconfirm
                            title="Are you sure to delete?"
                            onConfirm={() => handleDelete(record.SCHEDULE_SRNO)}
                        >
                            <Tooltip title="Delete">
                                <Button danger icon={<DeleteOutlined />} style={{ marginLeft: 8 }} />
                            </Tooltip>
                        </Popconfirm>
                         <Tooltip title="Dispatch">
                    <Button
                        icon={<PlusOutlined />}
                        style={{ marginLeft: 8 }}
                        onClick={() => {
                            setSelectedSchedule(record.SCHEDULE_SRNO);
                            setIsDispatchOpen(true);
                            setSelectedItemType(record.ITEM_TYPE); 
                        }}
                    />
                </Tooltip>
                    </>
                ),
            },
        ];

        // Export the full PO / schedule list (respecting the currently applied search filters) to Excel
        const handleExportPos = async () => {
          if (!schedules || schedules.length === 0) {
            message.warning('No POs to export. Please search first.');
            return;
          }
          try {
            await exportExcelPro(
              [
                {
                  sheetName: 'Purchase Orders',
                  title: 'Omech - Purchase Orders (Complete Details)',
                  columns: [
                    { header: 'PO Number', key: 'PO_NUMBER' },
                    { header: 'Item Type', key: 'ITEM_TYPE' },
                    { header: 'Party Name', key: 'PARTY_NAME' },
                    { header: 'PO Date', key: 'SCHEDULE_DATE' },
                    { header: 'Est. Delivery Date', key: 'ESTIMATED_DELIVERY_DATE' },
                    {
                      header: 'Urgent Delivery',
                      key: 'IS_URGENT_DELIVERY',
                      render: (r: any) => (r.IS_URGENT_DELIVERY === 'Y' ? 'Yes' : 'No'),
                    },
                    { header: 'Ordered Qty', key: 'T_ORDER_QTY', type: 'number' },
                    { header: 'Ordered Weight (kg)', key: 'T_ORDER_WEIGHT', type: 'number' },
                    { header: 'Dispatched Qty', key: 'T_DISPATCHED_QTY', type: 'number' },
                    { header: 'Dispatched Weight (kg)', key: 'T_DISPATCHED_WEIGHT', type: 'number' },
                    { header: 'Pending Qty', key: 'T_PENDING_QTY', type: 'number' },
                    { header: 'Pending Weight (kg)', key: 'T_PENDING_WEIGHT', type: 'number' },
                    { header: 'Completion %', key: 'COMPLETION_PERCENTAGE', type: 'number' },
                    { header: 'Status', key: 'STATUS_NAME' },
                  ],
                  rows: sortByDateDesc(schedules, 'SCHEDULE_DATE'),
                },
              ],
              'Purchase_Orders',
              'Purchase Orders (as per applied filters), sorted by PO Date - descending'
            );
          } catch (err) {
            console.error('Export error:', err);
            message.error('Failed to export Purchase Orders');
          }
        };

  return (
    <>
    <Card title="Purchases Ordered" bordered={false} style={{ margin: 20 }}
    extra={<>
                  <Button icon={<FileExcelOutlined />} onClick={handleExportPos} style={{ marginRight: 8 }}>
                    Export to Excel
                  </Button>
                  <Button type="primary" onClick={() => setIsModalOpen(true)}>
                    Add PO
                  </Button>
                  </>
                }
                >
                      {/* 🔍 Search Filters */}
<Form
  form={form}
  layout="vertical"
  onFinish={fetchSchedules}
  style={{ marginBottom: 24 }}
   initialValues={{
    STATUS_SRNO: "11",
  }}
>
  <Row gutter={16}>
    <Col span={2}>
      <Form.Item label="Item Type" name="ITEM_TYPE">
        <Select >
          <Option value="PIPE">PIPE</Option>
          <Option value="COIL">COIL</Option>
          <Option value="SHEET">SHEET</Option>
        </Select>
      </Form.Item>
    </Col>
     <Col span={6}>   
      <Form.Item name="PARTY_SRNO" label="Party" rules={[{ required: false, message: 'Please select a party' }]} style={{ minWidth: 200 }}>
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

    <Form.Item label="Party Name" name="PARTY_NAME" hidden>
      <Input placeholder="Party Name" />
    </Form.Item>
  </Col>

    <Col span={5}>
      <Form.Item label="PO Entry Date" name="ENTRY_DATE">
        <RangePicker />
      </Form.Item>
    </Col>
    <Col span={5}>
      <Form.Item label="Est. Delivery Date" name="DELIVERY_DATE">
        <RangePicker />
      </Form.Item>
    </Col>
    <Col span={2}>
      <Form.Item label="Status" name="STATUS_SRNO">
        <Select allowClear  placeholder="Select Status">
          <Option value="11"  >Pending</Option>
          <Option value="12">Completed</Option>
          <Option value="13">Closed</Option>
        </Select>
      </Form.Item>
    </Col>
    <Col span={2}>  
      <Form.Item label=" " colon={false}>
        <Button type="primary" htmlType="submit">
          Search
        </Button>
      </Form.Item>
    </Col>
    <Col span={2}>
      <Form.Item label=" " colon={false}>
        <Button
          onClick={() => {
            form.resetFields();
            form.setFieldsValue({ ITEM_TYPE: 'PIPE' }); // reset to default
            fetchSchedules(); // Unfiltered
          }}
        >
          Reset
        </Button>
      </Form.Item>
    </Col>
  </Row>
</Form>

                   {/* <Table
                   
                columns={columns}
                dataSource={schedules}
                loading={loading}
                rowKey="SCHEDULE_DT_SRNO"
                bordered
            /> */}
            <Table
  columns={columns}
  dataSource={schedules}
  loading={loading}
  rowKey="SCHEDULE_DT_SRNO"
  bordered
  summary={(pageData) => {
  const totalOrderQty = pageData.reduce(
    (sum, row) => sum + (Number(row.T_ORDER_QTY) || 0),
    0
  );

  const totalOrderWt = pageData.reduce(
    (sum, row) => sum + (Number(row.T_ORDER_WEIGHT) || 0),
    0
  );

  const totalDispatchQty = pageData.reduce(
    (sum, row) => sum + (Number(row.T_DISPATCHED_QTY) || 0),
    0
  );

  const totalDispatchWt = pageData.reduce(
    (sum, row) => sum + (Number(row.T_DISPATCHED_WEIGHT) || 0),
    0
  );

  return (
    <Table.Summary.Row>
      <Table.Summary.Cell index={0} colSpan={4}>
        <strong>Total</strong>
      </Table.Summary.Cell>

      <Table.Summary.Cell index={4}>
        <strong>{totalOrderQty.toFixed(2)}</strong>
      </Table.Summary.Cell>

      <Table.Summary.Cell index={5}>
        <strong>{totalOrderWt.toFixed(2)}</strong>
      </Table.Summary.Cell>

      <Table.Summary.Cell index={6}>
        <strong>{totalDispatchQty.toFixed(2)}</strong>
      </Table.Summary.Cell>

      <Table.Summary.Cell index={7}>
        <strong>{totalDispatchWt.toFixed(2)}</strong>
      </Table.Summary.Cell>

      <Table.Summary.Cell index={8} />
      <Table.Summary.Cell index={9} />
    </Table.Summary.Row>
  );
}}
/>
                </Card>
                    <ScheduleModal
  isMoOpen={isModalOpen}
  setIsMoOpen={(open) => {
    setIsModalOpen(open);
    if (!open) setEditScheduleSrno(null); // Reset on close
  }}
  SCHEDULE_SRNO={editScheduleSrno}
/>
{isDispatchOpen && selectedSchedule && (
  <DispatchModal
    isOpen={isDispatchOpen}
    setIsOpen={(open:any) => {
      setIsDispatchOpen(open);
      if (!open) setSelectedSchedule(null);
    }}
    itemType={selectedItemType}
    setItemType={setSelectedItemType}
    SCHEDULE_SRNO={selectedSchedule}
/>
)}




 </>
  )
}
