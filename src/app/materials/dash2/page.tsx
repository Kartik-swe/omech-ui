"use client"
import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Card, Select, DatePicker, Input, Button, Radio, Table, Space, message, Form } from 'antd';
import { SearchOutlined, FileExcelOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiClient } from '@/utils/apiClient';
import { getCookieData } from '@/utils/common';
import RawInventoryDtl from '@/app/components/RawInvetoryDtl';
import { exportExcelPro, sortByDateDesc } from '@/utils/exportExcelPro';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Dashboard = () => {
  // States for data and loading
  const [DT_DATA, setDT_DATA] = useState<any>([]);
  const [loading, setLoading] = useState(true);
 // state for grade options with interface
  const [optGrades, setOptGrades] = useState<{ label: string; value: string }[]>([]);
  const [optThickNess, setoptThickNess] = useState<{ label: string; value: string }[]>([]);
  const [optVendors, setOptVendors] = useState<{ label: string; value: string }[]>([]);
  const [optStatus, setOptStatus] = useState<{ label: string; value: string }[]>([]);
  const cookiesData = getCookieData();
  const { USER_SRNO, API_BASE_URL, UT_SRNO } = cookiesData;
  const [SearchForm] = Form.useForm();

  // States for Show Modal of Raw Inventory Detail
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMaterialSrnos, setSelectedMaterialSrnos] = useState<any>(null);
  const [selectedSlittingSrnos, setSelectedSlittingSrnos] = useState<any>(null);
  const [selectedCoilTypeFlag, setSelectedCoilTypeFlag] = useState<any>(null);


  useEffect(() => {
    FetchPlCommon();
    FetchRawMaterials();
  }, []);

  //clear selected srnos
  useEffect(() => {
    if (!!!modalVisible) {
      setSelectedMaterialSrnos(null);
      setSelectedSlittingSrnos(null);
    }
  }, [modalVisible]);

  // Function to fetch common dropdown options
  const FetchPlCommon = async () => {
    const response = await apiClient<Record<string, any>>(`${API_BASE_URL}Pl_Common?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&TBL_SRNO=1,3,4,5`, 'GET');
    if (response.msgId === 200) {
      if (!response.data) { return; }
      const { Table1, Table3, Table4, Table5 } = response.data;
      setOptGrades(Table1)
      setoptThickNess(Table3)
      setOptVendors(Table4)
      setOptStatus(Table5)
    } else {
      message.error(response.msg)
      console.error('API Error:', response.msg);  // Logging the error message
    }
  };

  //  fUNCTION TO FETCH RAW MATERIALS
  const FetchRawMaterials = async () => {
    setLoading(true);
    const values = SearchForm.getFieldsValue();
    try {
      const param = `MATERIAL_FLAG=${values.MATERIAL_FLAG || ''}&F_DATE=${values.F_DATE  || ''}&TO_DATE=${values.TO_DATE || ''}&GRADE_SRNO=${values.GRADE_SRNO || ''}&THICNESS_SRNO=${values.THICNESS_SRNO || ''}&WIDTH=${values.WIDTH || ''}&STATUS_SRNO=${values.STATUS_SRNO  || ''}&C_LOCATION=${values.C_LOCATION ||''}&USER_SRNO=${USER_SRNO}`
      const response = await apiClient(`${API_BASE_URL}DtDashRawInventory?${param}`, 'GET');
      if (response.msgId === 200) {
        if (!response.data) { return; }
        setDT_DATA(response.data.Table);
      } else {
        message.error(response.msg)
        console.error('API Error:', response.msg);  // Logging the error message
      }
    } catch (error) {
      console.error('Error fetching raw materials:', error);
      message.error('Failed to fetch raw materials');
    }
    setLoading(false);
  };

  // Function to handle click of quantity
  const handleQuantityClick = (record: any) => {
    setModalVisible(true);
    setSelectedMaterialSrnos(record.MATERIAL_SRNOS);
    setSelectedSlittingSrnos(record.SLITTING_SRNOS);
    setSelectedCoilTypeFlag(record.COIL_TYPE_FLAG);
  };

  // Table columns for data
  const columns = [
    // {
    //   title: 'Challan No.',
    //   dataIndex: 'CHALLAN_NO',
    //   key: 'CHALLAN_NO',
    // },
    {
      title: 'Location',
      dataIndex: 'C_LOCATION',
      key: 'C_LOCATION',
    },
    {
      title: 'Width',
      dataIndex: 'BALANCE_WIDTH',
      key: 'BALANCE_WIDTH',
    },  
    {
      title: 'Weight',
      dataIndex: 'BALANCE_WEIGHT',
      key: 'BALANCE_WEIGHT',
    },  
    {
      title: 'Grade',
      dataIndex: 'GRADE',
      key: 'GRADE',
    },
    
    {
      title: 'Thickness',
      dataIndex: 'THICKNESS',
      key: 'THICKNESS',
    },
    {
      title: 'Status',
      dataIndex: 'STATUS_NAME',
      key: 'STATUS_NAME',
    },
    {
      title: 'Source',
      dataIndex: 'COIL_TYPE',
      key: 'COIL_TYPE',
    },
    {
      title: 'Quantity',
      key: 'QUANTITY',
      render: (text: any, record: any) => (
      <Space size="middle">
        <a onClick={() => handleQuantityClick(record)}>{record.QUANTITY}</a>
      </Space>
      ),
    }
    // {
    //   title: 'Rate / Value',
    //   key: 'rate_value',
    //   render: (text: any, record: any) => {
    //     const rate = Number(record.RATE_PER_KG) || 0;
    //     const value = Math.round(((rate * (Number(record.BALANCE_WEIGHT) || 0) * (Number(record.QUANTITY) || 0)) + Number.EPSILON) * 100) / 100;
    //     return (
    //       <span title={`Rate: ₹${rate}/kg (avg), Value: ₹${value}`}>
    //         ₹{rate}/kg · ₹{value}
    //       </span>
    //     );
    //   },
    // }
    
  ];

  // Export current RM Stock view (respects whatever filters are applied) to a formatted Excel file
  const handleExportRmStock = async () => {
    if (!DT_DATA || DT_DATA.length === 0) {
      message.warning('No data to export. Please search/filter first.');
      return;
    }
    try {
      await exportExcelPro(
        [
          {
            sheetName: 'RM Stock',
            title: 'Omech - Raw Material Stock',
            columns: [
              { header: 'Location', key: 'C_LOCATION' },
              { header: 'Grade', key: 'GRADE' },
              { header: 'Thickness', key: 'THICKNESS' },
              { header: 'Width', key: 'BALANCE_WIDTH', type: 'number' },
              { header: 'Weight (kg)', key: 'BALANCE_WEIGHT', type: 'number' },
              { header: 'Quantity', key: 'QUANTITY', type: 'number' },
              {
                header: 'Total Weight (kg)',
                key: 'TOTAL_WEIGHT',
                type: 'number',
                render: (r: any) => (r.BALANCE_WEIGHT || 0) * (r.QUANTITY || 0),
              },
              { header: 'Status', key: 'STATUS_NAME' },
              { header: 'Source', key: 'COIL_TYPE' },
              { header: 'Latest Date', key: 'LATEST_DATE' },
              // { header: 'Rate (₹/kg, avg)', key: 'RATE_PER_KG', type: 'number' },
              // {
              //   header: 'Value (₹)',
              //   key: 'VALUE',
              //   type: 'number',
              //   render: (r: any) => (Number(r.RATE_PER_KG) || 0) * (Number(r.BALANCE_WEIGHT) || 0) * (Number(r.QUANTITY) || 0),
              // },
            ],
            rows: sortByDateDesc(DT_DATA, 'LATEST_DATE'),
          },
        ],
        'RM_Stock',
        'Raw Material Stock (as per applied filters), sorted by latest date - descending'
      );
    } catch (err) {
      console.error('Export error:', err);
      message.error('Failed to export RM Stock');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Content style={{ padding: '0 20px', marginTop: 64 }}>
        <Row gutter={16} style={{ marginBottom: 20 }}>
         {modalVisible &&  <RawInventoryDtl modalVisible={modalVisible} setModalVisible={setModalVisible} selectedMaterialSrnos={selectedMaterialSrnos} selectedSlittingSrnos={selectedSlittingSrnos}  selectedCoilTypeFlag={selectedCoilTypeFlag} /> }
          <Col span={12}>
            <Card title="Filters" bordered={false}>
                <Form layout="vertical" form={SearchForm} onReset={() => SearchForm.resetFields()}>
                <Form.Item name={['MATERIAL_FLAG']} style={{ marginBottom: 8 }} initialValue={'A'}>
                  <Radio.Group onChange={FetchRawMaterials}  size='small'>
                  <Radio value={'A'} checked={true} >All</Radio>
                  <Radio value={'M'}>Mother</Radio>
                  <Radio value={'P'}>Semi Slitted</Radio>
                  <Radio value={'S'}>Slitted</Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item name={['RECEIVED_DATE_RANGE']} style={{ marginBottom: 8 }} hidden>
                  <RangePicker
                  onChange={FetchRawMaterials}
                  format="YYYY-MM-DD"
                  style={{ width: '100%' }}
                  allowClear
                  />
                </Form.Item>

                <Row gutter={8}>
                  <Col span={12}>
                    <Form.Item name={['C_LOCATION']} style={{ marginBottom: 8 }}>
                      <Select 
                        showSearch
                        onChange={FetchRawMaterials}
                        placeholder="Select Location" 
                        options={optVendors} 
                        filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
                        allowClear
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name={['GRADE_SRNO']} style={{ marginBottom: 8 }}>
                      <Select 
                        showSearch 
                        onChange={FetchRawMaterials}
                        placeholder="Select Grade" 
                        options={optGrades} 
                        filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
                        allowClear
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={8}>
                  <Col span={12}>
                    <Form.Item name={['WIDTH']} style={{ marginBottom: 8 }}>
                      <Input
                        onChange={FetchRawMaterials}
                        placeholder="Enter width"
                        style={{ width: '100%' }}
                        allowClear
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name={['THICNESS_SRNO']} style={{ marginBottom: 8 }}>
                      <Select 
                        showSearch 
                        onChange={FetchRawMaterials}
                        placeholder="Select Thickness" 
                        options={optThickNess} 
                        filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
                        allowClear
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name={['STATUS_SRNO']} style={{ marginBottom: 8 }}>
                  <Select
                    onChange={FetchRawMaterials}
                    placeholder="Select Status"
                    style={{ width: '100%' }}
                    options={optStatus} 
                    filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
                    allowClear
                  >
                  </Select>
                </Form.Item>

                <Form.Item name={['SEARCH_TEXT']} style={{ marginBottom: 8 }} hidden>
                  <Input
                  onChange={FetchRawMaterials}
                  placeholder="Search"
                  prefix={<SearchOutlined />}
                  allowClear
                  />
                </Form.Item>

                

                <Form.Item style={{ marginBottom: 8 }}>
                  <Button type="default"  style={{ width: '100%' }} onClick={() => { SearchForm.resetFields(); setDT_DATA([]); }}>
                  Clear Filters
                  </Button>
                </Form.Item>
                </Form>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Raw Materials" bordered={false} style={{ height: '100%' }}>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}>
                  <Card>
                    <div style={{ fontSize: 14, color: '#888' }}>Total Records</div>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{DT_DATA.length}</div>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <div style={{ fontSize: 14, color: '#888' }}>Total Quantity</div>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>
                      {DT_DATA.reduce((acc: number, item: any) => acc + item.QUANTITY, 0)}
                    </div>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <div style={{ fontSize: 14, color: '#888' }}>Total Weight (kg)</div>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>
                      {DT_DATA.reduce((acc: number, item: any) => acc + item.BALANCE_WEIGHT * item.QUANTITY, 0).toFixed(2)}
                    </div>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <div style={{ fontSize: 14, color: '#888' }}>Total Value (₹)</div>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>
                      {DT_DATA.reduce((acc: number, item: any) => acc + (Number(item.RATE_PER_KG) || 0) * item.BALANCE_WEIGHT * item.QUANTITY, 0).toFixed(2)}
                    </div>
                  </Card>
                </Col>
                
              </Row>
            </Card>
          </Col>
          <Col span={24} style={{ marginTop: 20 }}>
            <Card
              title="Data Overview"
              bordered={false}
              extra={
                <Button
                  icon={<FileExcelOutlined />}
                  onClick={handleExportRmStock}
                  disabled={!DT_DATA || DT_DATA.length === 0}
                >
                  Export to Excel
                </Button>
              }
            >
              {/* Displaying Table with Data */}
              <Table
                dataSource={DT_DATA}
                columns={columns}
                loading={loading}
                rowKey="name"
                pagination={{ pageSize: 10 }}
                style={{ marginTop: 20 }}
                summary={(pageData) => {
                  let totalWeight = 0;
                  pageData.forEach(({ BALANCE_WEIGHT, QUANTITY }) => {
                    totalWeight += BALANCE_WEIGHT * QUANTITY;
                    totalWeight = Number(totalWeight.toFixed(2));
                  });
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={1}>
                        <strong>Total</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        {/* <strong>{totalWeightstr} kg</strong> */}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong>{totalWeight} kg</strong>
                      </Table.Summary.Cell>
                     
                    </Table.Summary.Row>
                  );
                }}
              />
              
            </Card>
          </Col>
        </Row>
      </Layout.Content>
    </Layout>
  );
};

export default Dashboard;
