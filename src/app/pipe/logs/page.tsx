"use client";
import { RetweetOutlined, DollarCircleOutlined, BuildOutlined, SwapOutlined, DownloadOutlined } from "@ant-design/icons";
import { Table, Card, Tag, message, Tooltip, Popconfirm, Button, Modal, Descriptions, Form, Row, Col, Select, Input } from "antd";
import { useEffect, useState } from "react";
import { apiClient } from "@/utils/apiClient";
import { getCookieData } from "@/utils/common";
import TextArea from "antd/es/input/TextArea";
import { json } from "stream/consumers";

const PipeInventoryLogs = () => {
  const [loading, setLoading] = useState(false);
  const [pipesLogs, setPipesLogs] = useState<any[]>([]);
  const cookiesData = getCookieData();
  const { USER_SRNO, API_BASE_URL, UT_SRNO } = cookiesData;
  const [SearchForm] = Form.useForm();
  
  const [optVendors, setOptVendors] = useState<{ label: string; value: string }[]>([]);
  const [optGrades, setOptGrades] = useState<{ label: string; value: string }[]>([]);
  const [optThickness, setOptThickness] = useState<{ label: string; value: string }[]>([]);
  const [optOd, setOptOd] = useState<{ label: string; value: string }[]>([]);
  const [optInvType, setOptInvType] = useState<{ label: string; value: string }[]>([]);
  


    useEffect(() => {
      FetchPl();
      fetchPipes();
      }, []);


      const FetchPl = async () => {
        try {
          const response = await apiClient(`${API_BASE_URL}Pl_Common?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&TBL_SRNO=1,2,3,4,10`, "GET");
          if (response.msgId === 200) {
            if (!response.data) return;
              const { Table1,Table2,Table3,Table4,Table10} = response.data;
              setOptGrades(Table1)
              setOptOd(Table2)
              setOptThickness(Table3)

              setOptVendors(Table4)
              setOptInvType(Table10)
              
          } else {
            message.error(response.msg);
          }
        } catch (error) {
          message.error("Error fetching locations");
        }
      };


    // Fetch Mother data
      // Fetch Mother data
  const fetchPipes = async () => {
    try {
      setLoading(true);
      const query_string = `PR_SRNO=${SearchForm.getFieldValue("PR_SRNO") || ''}&GRADE_SRNO=${SearchForm.getFieldValue("S_GRADE_SRNO") || ''}&THICKNESS_SRNO=${SearchForm.getFieldValue("S_THICKNESS_SRNO") || ''}&OD_SRNO=${SearchForm.getFieldValue("S_OD_SRNO") || ''}&C_LOCATION=${SearchForm.getFieldValue("C_LOCATION") || ''}&INV_TYPE=${SearchForm.getFieldValue("INV_TYPE") || ''}&PR_LENGTH=${SearchForm.getFieldValue("PR_LENGTH") || ''}&DTP_FROM=${SearchForm.getFieldValue("DTP_FROM") || ''}&DTP_TO=${SearchForm.getFieldValue("DTP_TO") || ''}`;
      const response = await apiClient(`${API_BASE_URL}DtPipesLogs?${query_string}&USER_SRNO=${USER_SRNO}`, "GET");

      if (response.msgId === 200) {
        if (!response.data) return;
        setPipesLogs(response.data.Table);
      } else {
        message.error(response.msg);
        console.error("API Error:", response.msg);
      }
    } catch (error: any) {
      console.error("Error fetching mother Coil:", error);
      message.error(error.message);
    } finally {
      setLoading(false);
    
    }
  };
  
  const columns = [
    { title: "Grade", dataIndex: "GRADE", key: "GRADE" },
    { title: "Thickness", dataIndex: "THICKNESS", key: "THICKNESS" },
    { title: "OD", dataIndex: "OD", key: "OD" },

    { title: "Length", dataIndex: "PR_LENGTH", key: "PR_LENGTH" },
    { title: "Quantity", dataIndex: "QUANTITY", key: "QUANTITY" },
    // { title: "Weight (kg)", dataIndex: "PR_WEIGHT", key: "PR_WEIGHT" },
    { title: "Total Weight (kg)", dataIndex: "T_PR_WEIGHT", key: "T_PR_WEIGHT" },
    { title: "Location", dataIndex: "VENDOR_NAME", key: "VENDOR_NAME" },
    { title: "Status", dataIndex: "PIPE_TRN_TYPE", key: "PIPE_TRN_TYPE" },
    
    // { title: "Status", dataIndex: "status", key: "status", render: getStatusTag },
  ];

  return (
    <Card title="Pipe Inventory Logs" bordered={false} style={{ margin: 20 }}>
       {/* Add Form For Search Paramter */}
       <Form form={SearchForm} style={{ marginBottom: 16 }} onFinish={fetchPipes} >
        <Row gutter={16}> 
         
          <Col span={4}>
            <Form.Item name="S_GRADE_SRNO">
              <Select 
                    showSearch 
                    placeholder="Select Grade"
                    options={optGrades} 
                    filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
                    allowClear
                />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="S_THICKNESS_SRNO">
              <Select 
                    showSearch 
                    placeholder="Select Thickness"
                    options={optThickness} 
                    filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
                    allowClear
                />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="S_OD_SRNO">
              <Select 
                    showSearch 
                    placeholder="Select OD"
                    options={optOd} 
                    filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
                    allowClear
                />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="C_LOCATION">
              <Select 
                    showSearch 
                    placeholder="Select Location"
                    options={optVendors} 
                    filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
                    allowClear
                />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item name="PR_LENGTH">
              <Input placeholder="Enter Length" type="number" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item name="INV_TYPE">
              <Select 
                    showSearch 
                    placeholder="Type"
                    options={optInvType} 
                    filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
                    allowClear
                />
            </Form.Item>
          </Col>
          {/* Add FROM AND TO DATE */}
           <Col span={4}>
            <Form.Item  name="DTP_FROM">
              <Input type="date" placeholder="From Date" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="DTP_TO">
              <Input type="date" placeholder="To Date" />
            </Form.Item>
          </Col>

          {/* <Col span={6}>
            <Form.Item label="Processing Date" name="processingDate">
              <Input type="date" placeholder="Processing Date" />
            </Form.Item>
          </Col> */}
          <Col span={2}>
            <Button type="primary" htmlType="submit" loading={loading}>Search</Button>
          </Col>
        </Row>
      </Form>
      
      <Table dataSource={pipesLogs} columns={columns} rowKey="id" loading={loading} />
      
    </Card>
  );
};

export default PipeInventoryLogs;
