"use client";
import { useState, useEffect } from "react";
import { Card, Button, Modal, Form, Input, Tabs, Spin, Row, Col, message, Table, InputNumber, Select } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { apiClient } from "@/utils/apiClient";
import { getCookieData } from "@/utils/common";
import ProtectedRoute from "@/app/components/ProtectedRoute";

const { TabPane } = Tabs;

interface ThresholdRecord {
  THRESHOLD_SRNO?: number;
  GRADE: string;
  GRADE_SRNO: number;
  THICKNESS: string;
  THICKNESS_SRNO: number;
  OD: string;
  OD_SRNO: number;
  MIN_THRESHOLD: number;
  CREATED_BY?: number;
  CREATED_DATE?: string;
  UPDATED_BY?: number;
  UPDATED_DATE?: string;
}

const ThresholdMasterPage = () => {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ThresholdRecord | null>(null);
  const [thresholdData, setThresholdData] = useState<ThresholdRecord[]>([]);
  const [thresholdForm] = Form.useForm();
  
  // Options for dropdowns
  const [gradeOptions, setGradeOptions] = useState<any[]>([]);
  const [thicknessOptions, setThicknessOptions] = useState<any[]>([]);
  const [odOptions, setOdOptions] = useState<any[]>([]);

  const cookiesData = getCookieData();
  const { USER_SRNO, API_BASE_URL, UT_SRNO } = cookiesData;

  // Function to fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      // Fetch Grade options (TBL_SRNO = 1)
      const gradeResponse = await apiClient(
        `${API_BASE_URL}Pl_Common?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&TBL_SRNO=1`, 
        "GET"
      );
      
      if (gradeResponse.msgId === 200 && gradeResponse.data?.Table1) {
        setGradeOptions(gradeResponse.data.Table1.map((item: any) => ({
          value: item.value,
          label: item.label
        })));
      }

      // Fetch Thickness options (TBL_SRNO = 3)
      const thicknessResponse = await apiClient(
        `${API_BASE_URL}Pl_Common?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&TBL_SRNO=3`, 
        "GET"
      );
      
      if (thicknessResponse.msgId === 200 && thicknessResponse.data?.Table3) {
        setThicknessOptions(thicknessResponse.data.Table3.map((item: any) => ({
          value: item.value,
          label: item.label
        })));
      }

      // Fetch OD options (TBL_SRNO = 2)
      const odResponse = await apiClient(
        `${API_BASE_URL}Pl_Common?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&TBL_SRNO=2`, 
        "GET"
      );
      
      if (odResponse.msgId === 200 && odResponse.data?.Table2) {
        setOdOptions(odResponse.data.Table2.map((item: any) => ({
          value: item.value,
          label: item.label
        })));
      }
    } catch (error: any) {
      console.error("Error fetching dropdown data:", error);
      message.error("Failed to load dropdown data");
    }
  };

  // Function to fetch threshold data
  const fetchThresholdData = async () => {
    setLoading(true);

    try {
      // Call the DT_THRESHOLD_MASTER stored procedure
      debugger
      const response = await apiClient(
        `${API_BASE_URL}DtThresholdMaster?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}`, 
        "GET"
      );
      
      if (response.msgId === 200 && response.data?.Table) {
        setThresholdData(response.data.Table);
      } else {
        message.error("Failed to load threshold data");
      }
    } catch (error: any) {
      console.error("Error fetching threshold data:", error);
      message.error("Failed to load threshold data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial data on mount
  useEffect(() => {
    fetchDropdownData();
    fetchThresholdData();
  }, []);

  const handleCancel = () => {
    setEditingRecord(null);
    thresholdForm.resetFields();
    setModalVisible(false);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    thresholdForm.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: ThresholdRecord) => {
    setEditingRecord(record);
    thresholdForm.setFieldsValue({
      GRADE_SRNO: record.GRADE_SRNO,
      THICKNESS_SRNO: record.THICKNESS_SRNO,
      OD_SRNO: record.OD_SRNO,
      MIN_THRESHOLD: record.MIN_THRESHOLD
    });
    setModalVisible(true);
  };

  const handleDelete = (record: ThresholdRecord) => {
    Modal.confirm({
      title: "Are you sure you want to delete this threshold record?",
      content: `This action cannot be undone.`,
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          // Call the DEL_THRESHOLD_MASTER stored procedure
          const response = await apiClient(
            `${API_BASE_URL}DelThresholdMaster`, 
            "DELETE",
            {
              THRESHOLD_SRNO: record.THRESHOLD_SRNO,
              USER_SRNO: USER_SRNO
            }
          );
          
          if (response.msgId === 200) {
            // Refresh the data after successful deletion
            fetchThresholdData();
            message.success("Threshold record deleted successfully");
          } else {
            message.error(response.msg || "Failed to delete threshold record");
          }
        } catch (error: any) {
          console.error("Error deleting threshold record:", error);
          message.error("Failed to delete threshold record");
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        USER_SRNO,
        ...(editingRecord ? { THRESHOLD_SRNO: editingRecord.THRESHOLD_SRNO } : {})
      };

      // Call the IU_THRESHOLD_MASTER stored procedure
      const response = await apiClient(
        `${API_BASE_URL}IuThresholdMaster`, 
        "POST",
        payload
      );

      if (response.msgId === 200) {
        // Refresh the data after successful submission
        fetchThresholdData();
        message.success(editingRecord ? "Threshold record updated successfully" : "Threshold record added successfully");
        handleCancel();
      } else {
        message.error(response.msg || "Failed to save threshold record");
      }

      handleCancel();
    } catch (error: any) {
      console.error("Error saving threshold record:", error);
      message.error("Failed to save threshold record");
    }
  };

  const columns = [
    {
      title: "Grade",
      dataIndex: "GRADE",
      key: "GRADE",
    },
    {
      title: "Thickness",
      dataIndex: "THICKNESS",
      key: "THICKNESS",
    },
    {
      title: "OD",
      dataIndex: "OD",
      key: "OD",
    },
    {
      title: "Min Threshold (kg)",
      dataIndex: "MIN_THRESHOLD",
      key: "MIN_THRESHOLD",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: ThresholdRecord) => (
        <>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          />
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record)}
          />
        </>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <div style={{ padding: "20px" }}>
        <Card 
          title="Threshold Master" 
          extra={
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
            >
              Add New Threshold
            </Button>
          }
        >
          <Spin spinning={loading}>
            <Table 
              dataSource={thresholdData} 
              columns={columns} 
              rowKey="THRESHOLD_SRNO"
              pagination={{ pageSize: 10 }}
            />
          </Spin>
        </Card>

        <Modal
          title={editingRecord ? "Edit Threshold" : "Add New Threshold"}
          open={modalVisible}
          onCancel={handleCancel}
          footer={null}
        >
          <Form
            form={thresholdForm}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="GRADE_SRNO"
                  label="Grade"
                  rules={[{ required: true, message: "Please select a grade" }]}
                >
                  <Select
                    placeholder="Select Grade"
                    options={gradeOptions}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="THICKNESS_SRNO"
                  label="Thickness"
                  rules={[{ required: true, message: "Please select a thickness" }]}
                >
                  <Select
                    placeholder="Select Thickness"
                    options={thicknessOptions}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="OD_SRNO"
                  label="OD"
                  rules={[{ required: true, message: "Please select an OD" }]}
                >
                  <Select
                    placeholder="Select OD"
                    options={odOptions}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="MIN_THRESHOLD"
                  label="Min Threshold (kg)"
                  rules={[{ required: true, message: "Please enter minimum threshold" }]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    placeholder="Enter minimum threshold"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row justify="end">
              <Button type="default" onClick={handleCancel} style={{ marginRight: 8 }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingRecord ? "Update" : "Save"}
              </Button>
            </Row>
          </Form>
        </Modal>
      </div>
    </ProtectedRoute>
  );
};

export default ThresholdMasterPage;