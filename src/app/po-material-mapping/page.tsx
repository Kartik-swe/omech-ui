'use client';

import { useState, useEffect } from 'react';
import {
  Card, Table, Button, Form, Select, Input, Space, Spin, Tabs, Tag, Tooltip, Typography, Empty, Modal, DatePicker, Row, Col, message, Checkbox, Statistic
} from 'antd';
import { SearchOutlined, SyncOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, MergeCellsOutlined } from '@ant-design/icons';
import { apiClient } from '@/utils/apiClient';
import { getCookieData } from '@/utils/common';
import RawInventoryDtl from '../components/RawInvetoryDtl';
import ScheduleClient from '../schedule/ScheduleClient';

const { Title, Text } = Typography;
const { Option } = Select;

interface PoItem {
  RowNum?: number;
  SCHEDULE_SRNO: number;
  SCHEDULE_DT_SRNO: number;
  PARTY_NAME: string;
  PO_NUMBER: string;
  SCHEDULE_DATE: string;
  ITEM_TYPE: 'PIPE' | 'COIL' | 'SHEET';
  OD?: string;
  THICKNESS: string;
  GRADE: string;
  LENGTH?: string;
  WIDTH?: string;
  ORDERED_QTY: number;
  ORDERED_WEIGHT: number;
  REMAINING_QTY: number;
  REMAINING_WEIGHT: number;
  STATUS_NAME: string;
  GRADE_SRNO?: number;
  THICKNESS_SRNO?: number;
  OD_SRNO?: number;
}



interface GroupedPoItem {
  RowNum: number;
  GRADE: string;
  GRADE_SRNO: number;
  THICKNESS: string;
  THICKNESS_SRNO: number;
  OD?: string;
  OD_SRNO?: number;
  ITEM_TYPE: 'PIPE' | 'COIL' | 'SHEET';
  PIPE_QTY: number;
  COIL_SHEET_WEIGHT: number;
  PARTY_NAME: string;
  PO_NUMBER: string;
  SCHEDULE_SRNOS: number;
  SCHEDULE_DT_SRNOS: number;
  LENGTH?: string;

}

const PoMaterialMapping = () => {
  const { USER_SRNO, API_BASE_URL, UT_SRNO } = getCookieData();
  const [searchForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedPo, setSelectedPo] = useState<PoItem | null>(null);
  const [groupedPoItems, setGroupedPoItems] = useState<GroupedPoItem[]>([]);
  const [groupedPoItemsLength, setGroupedPoItemsLength] = useState<GroupedPoItem[]>([]);

  
  // States for raw inventory detail modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMaterialSrnos, setSelectedMaterialSrnos] = useState<string | null>(null);
  const [selectedSlittingSrnos, setSelectedSlittingSrnos] = useState<string | null>(null);
  const [selectedCoilTypeFlag, setSelectedCoilTypeFlag] = useState<string | null>(null);
  
  // States for dropdown options
  const [optGrades, setOptGrades] = useState<{ label: string; value: string }[]>([]);
  const [optThickness, setOptThickness] = useState<{ label: string; value: string }[]>([]);
  const [optOD, setOptOD] = useState<{ label: string; value: string }[]>([]);
  const [optPartyNames, setOptPartyNames] = useState<{ label: string; value: string }[]>([]);
  const [isLengthModal, setIsLengthModal] = useState(false);


  useEffect(() => {
    fetchCommonData();
    handleSearch();
  }, []);

  // Clear selected material details when modal is closed
  useEffect(() => {
    if (!modalVisible) {
      setSelectedMaterialSrnos(null);
      setSelectedSlittingSrnos(null);
      setSelectedCoilTypeFlag(null);
    }
  }, [modalVisible]);

const fetchCommonData = async () => {
  try {
    const response = await apiClient<Record<string, any>>(
         `${API_BASE_URL}Pl_Common?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&TBL_SRNO=1,2,3,13`,
         "GET"
       );
       if (response.msgId === 200) {
         if (!response.data) return;
         const { Table1, Table2,Table3, Table13 } = response.data;
         setOptGrades(Table1)
         setOptOD(Table2)
         setOptThickness(Table3)
         setOptPartyNames(Table13)
       } else {
         message.error(response.msg);
         console.error("API Error:", response.msg);
       }

   
  } catch (error) {
    console.error("Error:", error);
    message.error("Failed to fetch dropdown options");
  }
};

const handleSearch = async () => {
  // Clear previous search results and reset view state
  setGroupedPoItems([]);
  setSelectedPo(null); // Clear selected PO to hide Material Mapping section
  await handleGroupPOs();
};
 
  const handleGroupPOs = async () => {
    // Get current form values
    const formValues = searchForm.getFieldsValue();
    const hasFilters = Object.values(formValues).some(value => 
      value !== undefined && value !== null && value !== '' && 
      (!Array.isArray(value) || value.length > 0)
    );

    // If no filters are selected either, show warning
    // if (!hasFilters) {
    //   message.warning('Please specify search filters');
    //   return;
    // }
    
    // Clear selected PO to hide Material Mapping section
    setSelectedPo(null);
    
    
    setLoading(true);
    try {
      // e.g. SCHEDULE_SRNOS = '1,2,3'
      const SCHEDULE_SRNOS = '';
      
      const values = searchForm.getFieldsValue();
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
      const res = await apiClient(`${API_BASE_URL}DispPoAutoMap?SCHEDULE_SRNOS=${SCHEDULE_SRNOS}&${queryParams}`, 'GET');
      setGroupedPoItems(res.data.Table || []);      
      setLoading(false);
  
      message.success('POs Item fetch successfully');
    } catch (error) {
      console.error(error);
      message.error('Error grouping POs');
      setLoading(false);
    }
  };
  
  const handleGroupedPoSelect = async (record: GroupedPoItem) => {
    setLoading(true);
    try {
      // Create a virtual PO item to display in the UI
      const virtualPo: PoItem = {
        RowNum: record.RowNum,
        SCHEDULE_SRNO: record.SCHEDULE_SRNOS || 0,
        SCHEDULE_DT_SRNO: record.SCHEDULE_DT_SRNOS || 0,
        PARTY_NAME: record.PARTY_NAME,
        PO_NUMBER: record.PO_NUMBER,
        SCHEDULE_DATE: '',
        ITEM_TYPE: record.ITEM_TYPE,
        THICKNESS: record.THICKNESS,
        GRADE: record.GRADE,
        OD: record.OD,
        LENGTH: record.LENGTH?.includes(',') ? undefined : record.LENGTH,
        ORDERED_QTY: record.PIPE_QTY,
        ORDERED_WEIGHT: record.COIL_SHEET_WEIGHT,
        REMAINING_QTY: record.PIPE_QTY,
        REMAINING_WEIGHT: record.COIL_SHEET_WEIGHT,
        STATUS_NAME: 'Grouped',
        GRADE_SRNO: record.GRADE_SRNO,
        THICKNESS_SRNO: record.THICKNESS_SRNO,
        OD_SRNO: record.OD_SRNO
      };
      // Close the length modal if it's open
      if (isLengthModal) {
        setIsLengthModal(false);
      }
      setSelectedPo(virtualPo);
      setLoading(false);
      
      // Scroll to the ScheduleClient section
      setTimeout(() => {
        const scheduleClientElement = document.querySelector('.material-mapping-section');
        if (scheduleClientElement) {
          scheduleClientElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Error fetching materials:', error);
      message.error('Failed to fetch materials for grouped POs');
      setLoading(false);
    }
  };


const handleLengthDetail = async (record: GroupedPoItem) => {
  setLoading(true);
  try {
    // Get length details for the selected PO group
    //string? SCHEDULE_SRNOS, int? GRADE_SRNO, int? THICKNESS_SRNO, int? OD_SRNO, string? 
      const query = `SCHEDULE_SRNOS=${record.SCHEDULE_SRNOS}&SCHEDULE_DT_SRNOS=${record.SCHEDULE_DT_SRNOS}&GRADE_SRNO=${record.GRADE_SRNO}&THICKNESS_SRNO=${record.THICKNESS_SRNO}&OD_SRNO=${record.OD_SRNO}&IS_GROUPBY_LENGTH=1`

      const res = await apiClient(`${API_BASE_URL}DispPoAutoMap?${query}`, 'GET');



    if (res.data && res.data.Table) {
      // Update the modal data and show modal
        setGroupedPoItemsLength(res.data.Table);
      setIsLengthModal(true);
    } else {
      message.warning('No length details found');
    }
  } catch (error) {
    console.error('Error fetching length details:', error);
    message.error('Failed to fetch length details');
  } finally {
    setLoading(false);
  }
};

 
  // Grouped PO Items table columns
  const groupedPoColumns = [
      {
      title: 'SRNO',
      dataIndex: 'RowNum',
      key: 'RowNum',
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
      title: 'OD',
      dataIndex: 'OD',
      key: 'OD',
    },
    // {
    //   title: 'Item Type',
    //   dataIndex: 'ITEM_TYPE',
    //   key: 'ITEM_TYPE',
    // },
    {
      title: 'Pipe Qty',
      dataIndex: 'PIPE_QTY',
      key: 'PIPE_QTY',
    },
    {
      title: 'Pending Wt',
      dataIndex: 'COIL_SHEET_WEIGHT',
      key: 'COIL_SHEET_WEIGHT',
    },
    {
      title: 'Lengths',
      dataIndex: 'LENGTH',
      key: 'LENGTH',
      render: (_: any, record: GroupedPoItem) => (
        !isLengthModal ? (
          <a onClick={() => {
            if (!isLengthModal) {
              handleLengthDetail(record);
            }
          }}>
            {record.LENGTH}
          </a>
        ) : (
          <span>{record.LENGTH}</span>
        )
      ),
    },
    {
      title: 'Party Names',
      key: 'PARTY_NAME',
      render: (_: any, record: GroupedPoItem) => (
        <span>{record.PARTY_NAME}</span>
      ),
    },
    {
      title: 'PO Numbers',
      key: 'PO_NUMBER',
      render: (_: any, record: GroupedPoItem) => (
        <span>{record.PO_NUMBER}</span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: GroupedPoItem) => (
        <Button type="primary" onClick={() => handleGroupedPoSelect(record)}>
          Check Materials
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span>PO Material Mapping</span>
          </div>
        } 
        variant="borderless"
      >
        {/* Search Filters */}
        <Form
          form={searchForm}
          layout="vertical"
          // onFinish={fetchSchedules}
          // style={{ marginBottom: 24 }}
        >
          <Row gutter={16}>
            <Col hidden>
              <Form.Item label="Item Type" name="ITEM_TYPE">
                <Select 
                  style={{ width: 150 }} 
                  defaultValue="PIPE"
                  // showSearch
                  // filterOption={(input, option) =>
                  //   (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                  // }
                >
                  <Option value="PIPE">PIPE</Option>
                  <Option value="COIL">COIL</Option>
                  <Option value="SHEET">SHEET</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={3}>

              <Form.Item label="Grade" name="GRADE_SRNO">
                <Select 
                  allowClear 
                  showSearch
                  placeholder="Select Grade"
                  options={optGrades}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label="Thickness" name="THICKNESS_SRNO">
                <Select 
                  allowClear 
                  showSearch
                  placeholder="Select Thickness"
                  options={optThickness}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col span={3}>

              <Form.Item label="OD" name="OD_SRNO">
                <Select 
                  allowClear 
                  showSearch
                  placeholder="Select OD"
                  options={optOD}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
                      
            <Col span={3}>
              <Form.Item label="Party Name" name="PARTY_SRNO">
                 <Select 
                  allowClear 
                  showSearch
                  placeholder="Select Party Name"
                  options={optPartyNames}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col span={3}>

              <Form.Item label="PO Number" name="PO_NUMBER">
                <Input placeholder="PO Number" />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item label="PO Entry Date" name="ENTRY_DATE">
                <DatePicker.RangePicker />
              </Form.Item>
            </Col>
           
            <Col span={2}>

             {/* <Space> */}
 <Form.Item label=" ">


  <Button
    type="primary"
    // icon={<SearchOutlined />}
    onClick={() => handleSearch()}
    loading={loading}
  >
    Search
  </Button> 
</Form.Item>
{/* </Space> */}

            </Col>
            <Col span={1}>

              <Form.Item label=" " colon={false}>
                <Button
                  icon={<SyncOutlined />}
                  onClick={() => {
                    // Reset form fields
                    searchForm.resetFields();
                    searchForm.setFieldsValue({ ITEM_TYPE: 'PIPE' });
                    
                    // Clear all data
                    setGroupedPoItems([]);
                    setGroupedPoItemsLength([]);
                    setSelectedPo(null);
                    
                    // Close any open modals
                    setIsLengthModal(false);
                    setModalVisible(false);
                  }}
                  loading={loading}
                >
                  Reset
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
        
        {/* Summary Section */}
        {groupedPoItems.length > 0 && (
          <Card style={{ marginBottom: 16 }} bordered={false}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic 
                  title="Total PO Items" 
                  value={groupedPoItems.length} 
                  prefix={<InfoCircleOutlined />} 
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="Total Pipe Quantity" 
                  value={groupedPoItems.reduce((sum, item) => sum + (item.PIPE_QTY || 0), 0)} 
                  prefix={<InfoCircleOutlined />} 
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="Total Pending Weight (kg)" 
                  value={groupedPoItems.reduce((sum, item) => sum + (item.COIL_SHEET_WEIGHT || 0), 0).toFixed(2)} 
                  prefix={<InfoCircleOutlined />} 
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="Unique Grades" 
                  value={new Set(groupedPoItems.map(item => item.GRADE)).size} 
                  prefix={<InfoCircleOutlined />} 
                />
              </Col>
            </Row>
          </Card>
        )}
        
        {/* PO Items Table or Grouped PO Items Table */}
        { (
          <Table
          title={() => (
             <div>
                <Title level={4}>POs Items</Title>
                {/* {JSON.stringify(groupedPoItems)} */}
              </div>
            )}
            columns={groupedPoColumns}
            dataSource={groupedPoItems}
            rowKey={(record) => record.RowNum}
            loading={loading}
            // pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            footer={() => (
              <div>
                <Row gutter={16}>
                  <Col span={8}>
                    <Text strong>Grade Distribution: </Text>
                    {Array.from(new Set(groupedPoItems.map(item => item.GRADE)))
                      .sort((a, b) => a.localeCompare(b))
                      .map(grade => (
                        <Tag color="blue" key={grade}>{grade}</Tag>
                    ))}
                  </Col>
                  <Col span={8}>
                    <Text strong>Thickness Distribution: </Text>
                    {Array.from(new Set(groupedPoItems.map(item => item.THICKNESS)))
                      .sort((a, b) => parseFloat(a) - parseFloat(b))
                      .map(thickness => (
                        <Tag color="green" key={thickness}>{thickness}</Tag>
                    ))}
                  </Col>
                  <Col span={8}>
                    <Text strong>OD Distribution: </Text>
                    {Array.from(new Set(groupedPoItems.map(item => item.OD).filter(Boolean)))
                      .sort((a:any, b:any) => parseFloat(a) - parseFloat(b))
                      .map(od => (
                        <Tag color="purple" key={od}>{od}</Tag>
                    ))}
                  </Col>
                </Row>
              </div>
            )}
          />
        )}

        {/* Material Mapping Section */}
        {selectedPo && (
            <Card
              className="material-mapping-section"
              title={
                <div>
                  <Title level={4}>Material Mapping for PO: {selectedPo.PO_NUMBER}</Title>
                  <Text>Party: {selectedPo.PARTY_NAME} | Material: {selectedPo.ITEM_TYPE === 'PIPE' ? 
                    `${selectedPo.OD} OD x ${selectedPo.THICKNESS} THK x ${selectedPo.GRADE} x ${selectedPo.LENGTH} L` : 
                    `${selectedPo.THICKNESS} THK x ${selectedPo.GRADE} x ${selectedPo.WIDTH} W`
                  }</Text>
                </div>
              }
            >
          <ScheduleClient 
            GRADE_SRNO={selectedPo?.GRADE_SRNO?.toString() || ""}
            OD_SRNO={selectedPo?.OD_SRNO?.toString() || ""}
            THICKNESS_SRNO={selectedPo?.THICKNESS_SRNO?.toString() || ""}
            PR_LENGTH={selectedPo?.LENGTH ? parseFloat(selectedPo.LENGTH) : 0}
            PR_QUANTITY={selectedPo?.REMAINING_QTY || 0}
            autoSearch={true}
          />
          </Card>
        )

        }
        

        {/* Raw Inventory Detail Modal */}
        {modalVisible && (
          <RawInventoryDtl
            modalVisible={modalVisible}
            setModalVisible={setModalVisible}
            selectedMaterialSrnos={selectedMaterialSrnos || ''}
            selectedSlittingSrnos={selectedSlittingSrnos || ''}
            selectedCoilTypeFlag={selectedCoilTypeFlag || ''}
          />
        )}
      </Card>
        {isLengthModal && (
          <Card>
            <Modal
              title="Length Details"
              open={isLengthModal}
              onCancel={() => setIsLengthModal(false)}
              width={1000}
              footer={null}
            >
              <>
              {/* Summary Section for Modal */}
              {groupedPoItemsLength.length > 0 && (
                <Card style={{ marginBottom: 16 }} bordered={false}>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Statistic 
                        title="Total Length Items" 
                        value={groupedPoItemsLength.length} 
                        prefix={<InfoCircleOutlined />} 
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic 
                        title="Total Pipe Quantity" 
                        value={groupedPoItemsLength.reduce((sum, item) => sum + (item.PIPE_QTY || 0), 0)} 
                        prefix={<InfoCircleOutlined />} 
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic 
                        title="Total Pending Weight (kg)" 
                        value={groupedPoItemsLength.reduce((sum, item) => sum + (item.COIL_SHEET_WEIGHT || 0), 0).toFixed(2)} 
                        prefix={<InfoCircleOutlined />} 
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic 
                        title="Unique Lengths" 
                        value={new Set(groupedPoItemsLength.map(item => item.LENGTH).filter(Boolean)).size} 
                        prefix={<InfoCircleOutlined />} 
                      />
                    </Col>
                  </Row>
                </Card>
              )}
              
              <Table
              title={() => (
                 <div>
                <Title level={4}>Length-wise PO Items</Title>
              </div>
            )}
            columns={[
              ...groupedPoColumns.filter(col => col.key !== 'action'),
              {
                title: 'Action',
                key: 'action',
                render: (_: any, record: GroupedPoItem) => (
                  <Button type="primary" onClick={() => handleGroupedPoSelect(record)}>
                    Check Materials
                  </Button>
                ),
              }
            ]}
            dataSource={groupedPoItemsLength}
            rowKey={(record) => record.RowNum}
            loading={loading}
            // pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            footer={() => (
              <div>
                <Row gutter={16}>
                  <Col span={8}>
                    <Text strong>Grade Distribution: </Text>
                    {Array.from(new Set(groupedPoItemsLength.map(item => item.GRADE)))
                      .sort((a, b) => a.localeCompare(b))
                      .map(grade => (
                        <Tag color="blue" key={grade}>{grade}</Tag>
                    ))}
                  </Col>
                  <Col span={8}>
                    <Text strong>Thickness Distribution: </Text>
                    {Array.from(new Set(groupedPoItemsLength.map(item => item.THICKNESS)))
                      .sort((a, b) => parseFloat(a) - parseFloat(b))
                      .map(thickness => (
                        <Tag color="green" key={thickness}>{thickness}</Tag>
                    ))}
                  </Col>
                  <Col span={8}>
                    <Text strong>Length Distribution: </Text>
                    {Array.from(new Set(groupedPoItemsLength.map(item => item.LENGTH).filter(Boolean)))
                      .sort((a:any, b:any) => parseFloat(a) - parseFloat(b))
                      .map(length => (
                        <Tag color="purple" key={length}>{length}</Tag>
                    ))}
                  </Col>
                </Row>
              </div>
            )}
          />
          </>
        </Modal>

      </Card>
      )}

    </div>
  );
};

export default PoMaterialMapping;