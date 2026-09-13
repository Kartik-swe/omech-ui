"use client";
import { useState, useEffect } from "react";
import { Card, Button, Modal, Form, Input, Tabs, Spin, Row, Col, message } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { apiClient } from "@/utils/apiClient";
import { getCookieData } from "@/utils/common";

const { TabPane } = Tabs;

const EPage = () => {
  const [activeTab, setActiveTab] = useState("PARTY");
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
      if (tabKey === "PARTY") {
        TBL_SRNO = 13;
      } else {  
        TBL_SRNO = 0;
      }
      const response = await apiClient(`${API_BASE_URL}Pl_Common?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&TBL_SRNO=${TBL_SRNO}`, "GET");

      if (response.msgId === 200) {
        if (!response.data) return;
        if (tabKey === "PARTY") {
            
          setTabData(response.data.Table13);
        }     
        
      } else {
        message.error(response.msg);
        console.error("API Error:", response.msg);
      }
    } catch (error: any) {
      console.error("Error fetching PARTY:", error);
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
    masterForm.resetFields();
    setModalVisible(true);
  };

  const handleEdit = async (record: any) => {
    setEditingRecord(record);
    setModalVisible(true);
    // The list only carries {value, label}; fetch the full record (address/GST/etc.) for editing
    try {
      const response = await apiClient(`${API_BASE_URL}DtMPartyDtl?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&PARTY_SRNO=${record.value}`, "GET");
      if (response.msgId === 200 && response.data?.Table?.[0]) {
        const dtl = response.data.Table[0];
        masterForm.setFieldsValue({
          name: dtl.PARTY_NAME,
          ADDRESS: dtl.ADDRESS,
          GST_NO: dtl.GST_NO,
          STATE: dtl.STATE,
          EMAIL: dtl.EMAIL,
          PHONE: dtl.PHONE,
          CONTACT_PERSON: dtl.CONTACT_PERSON,
        });
      } else {
        // Fall back to just the name if the detail fetch fails for any reason
        masterForm.setFieldsValue({ name: record.label });
      }
    } catch (error) {
      console.error("Error fetching party details:", error);
      masterForm.setFieldsValue({ name: record.label });
    }
  };


const handleDelete = (record: any) => {
    console.log("Deleting record:", record);
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


  const handleSubmit = async (values: any) => {
    if (!values.name) return;
    const payload = {
      IU_FLAG: editingRecord ? "U" : "I",
      M_NAME : values.name,
      ADDRESS : values.ADDRESS || null,
      GST_NO : values.GST_NO || null,
      STATE : values.STATE || null,
      EMAIL : values.EMAIL || null,
      PHONE : values.PHONE || null,
      CONTACT_PERSON : values.CONTACT_PERSON || null,
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
        {["PARTY"].map((tabKey) => (
          <TabPane tab={tabKey} key={tabKey}>
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
        width={600}
      >
        <Form
          layout="vertical"
          onFinish={handleSubmit}
          // init ialValues={editingRecord ? { name: editingRecord.label } : {}}
          form={masterForm}
        >
          <Form.Item name="name" label="Party Name" rules={[{ required: true, message: "Please enter a value!" }]}>
            <Input placeholder="Enter party name" />
          </Form.Item>
          <Form.Item name="ADDRESS" label="Address">
            <Input.TextArea rows={2} placeholder="Enter address" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="STATE" label="State">
                <Input placeholder="Enter state" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="GST_NO" label="GST No">
                <Input placeholder="Enter GST number" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="PHONE" label="Phone">
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="EMAIL" label="Email">
                <Input placeholder="Enter email" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="CONTACT_PERSON" label="Contact Person">
            <Input placeholder="Enter contact person name" />
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
