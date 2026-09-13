"use client";
import { useState, useEffect } from "react";
import { Card, Button, Modal, Form, Input, Tabs, Spin, Row, Col, message } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { apiClient } from "@/utils/apiClient";
import { getCookieData } from "@/utils/common";

const { TabPane } = Tabs;

const EPage = () => {
  const [activeTab, setActiveTab] = useState("GRADE");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [tabData, setTabData] = useState<string[]>([]);
  const [masterForm] = Form.useForm();

  const cookiesData = getCookieData();
  const { USER_SRNO, API_BASE_URL, UT_SRNO } = cookiesData;

  // Function to fetch data for each tab
  
  const fetchTabData = async (tabKey: string) => {
    setLoading(true);

    try {
      let TBL_SRNO = 0;
      if (tabKey === "GRADE") {
        TBL_SRNO = 1;
      } else if (tabKey === "THICKNESS") {
        TBL_SRNO = 3;
      } else if (tabKey === "OD") {
        TBL_SRNO = 2;
      } else {  
        TBL_SRNO = 0;
      }
      const response = await apiClient(`${API_BASE_URL}Pl_Common?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&TBL_SRNO=${TBL_SRNO}`, "GET");

      if (response.msgId === 200) {
        if (!response.data) return;
        if (tabKey === "GRADE") {
          setTabData(response.data.Table1);
        } else if (tabKey === "THICKNESS") {
          setTabData(response.data.Table3);
        } else if (tabKey === "OD") {
          setTabData(response.data.Table2);
        }     
        
      } else {
        message.error(response.msg);
        console.error("API Error:", response.msg);
      }
    } catch (error: any) {
      console.error("Error fetching Users:", error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }

    
   
  };

  // Handle tab change and load data
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    fetchTabData(key);
  };

  // Fetch initial data on mount
  useEffect(() => {
    fetchTabData(activeTab);
  }, []);

  const handleCancel = () => {
    setEditingRecord(null);
    masterForm.resetFields();
    setModalVisible(false);
  }

  const handleAdd = () => {
    setEditingRecord(null);
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    masterForm.setFieldsValue({ name: record.label }); // Set form values dynamically
    setModalVisible(true);
  };


const handleDelete = (record: any) => {
  Modal.confirm({
    title: "Are you sure you want to delete this record?",
    content: `This action cannot be undone.`,
    okText: "Yes, Delete",
    okType: "danger",
    cancelText: "Cancel",
    onOk: async () => {
      try {
        // Call API to delete the record
        const response = await apiClient(`${API_BASE_URL}DelM${activeTab}?PK_SRNO=${record.value}&USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}`,"DELETE");

        if (response.msgId === 200) {
          message.success("Record deleted successfully!");
          setTabData((prevData) => prevData.filter((item:any) => item.value !== record.value));
        } else {
          message.error(response.msg);
        }
      } catch (error) {
        console.error("Error deleting record:", error);
        message.error("Failed to delete the record.");
      }
    },
  });
};


  const handleSubmit = async (values: { name: string }) => {
    if (!values.name) return;
    const payload = {
      IU_FLAG: editingRecord ? "U" : "I",
      M_NAME : values.name,
      UOM : null,
      USER_SRNO : USER_SRNO,
      UT_SRNO : UT_SRNO,
      PK_SRNO : editingRecord ? editingRecord.value : 0
    };

    
    try {
      const response = await apiClient(`${API_BASE_URL}IuM${activeTab}`, "POST", payload); 
      if (response.msgId === 200) {
        // record saved / updated sucessfully msg
        message.success("Record saved successfully!");
        setTabData((prevData) =>
          editingRecord
        ? prevData.map((item:any) =>
            item.value === editingRecord.value ? { ...item, label: values.name } : item
          )
        : [...prevData, { value: response.data.Table[0].PK_SRNO, label: values.name }]
        );
        handleCancel();
        
      } else {
        message.success(response.msg);
      }
    } catch (err) {
      alert('Failed to submit data.');
    }

    
  };

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>
        Add New
      </Button>

      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        {["GRADE", "THICKNESS", "OD"].map((tabKey) => (
          <TabPane tab={tabKey} key={tabKey}>
            {/* show data in json */}
            {/* {JSON.stringify(tabData)} */}
            <Spin spinning={loading}>
              <Row gutter={[16, 16]}>
                {tabData.map((item:any, index) => (
                  <Col span={6} key={index}>
                    <Card
                      title={`${activeTab}: ${item.label}`}
                      actions={[
                        <EditOutlined key="edit" onClick={() => handleEdit(item)} />,
                        <DeleteOutlined key="delete" onClick={() => handleDelete(item)} />,
                      ]}
                    />
                  </Col>
                ))}
              </Row>
            </Spin>
          </TabPane>
        ))}
      </Tabs>

      {/* Add/Edit Modal */}
      <Modal
        title={editingRecord ? "Edit Record" : "Add Record"}
        open={modalVisible}
        onCancel={() => handleCancel()}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={handleSubmit}
          // init ialValues={editingRecord ? { name: editingRecord.label } : {}}
          form={masterForm}
        >
          <Form.Item name="name" label="Value" rules={[{ required: true, message: "Please enter a value!" }]}>
            <Input placeholder="Enter value" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingRecord ? "Update" : "Add"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EPage;
