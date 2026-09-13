// /pages/system-user-management/page.tsx
"use client"
import { useState, useEffect } from "react";
import { Table, Button, Form, Input, Tabs, Select, Modal, Card, Spin, Row, Col, message } from "antd";
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { apiClient } from "@/utils/apiClient";
import { getCookieData } from "@/utils/common";

//options for status 
const optStatuses = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false },
];


const SystemUserManagement = () => {
    const [userData, setUserData] = useState<any[]>([]);
    const [userTypeData, setUserTypeData] = useState<any[]>([]);
    const [userPerData, setUserPerData] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("USERS");
    const [loading, setLoading] = useState(false);
    const [optUserType, setOptUserType] = useState<{ label: string; value: string }[]>([]);
    const [optStatus, setOptStatus] = useState<{ label: string; value: boolean }[]>(optStatuses);
    
  
  // modal close state
  const [isModalVisible_UM, setIsModalVisible_UM] = useState(false);
  const [isModalVisible_UT, setIsModalVisible_UT] = useState(false);
  
  const [form_UM] = Form.useForm();
  const [form_UT] = Form.useForm();


  const cookiesData = getCookieData();
  const { USER_SRNO, API_BASE_URL, UT_SRNO } = cookiesData;

  const { TabPane } = Tabs;
  const [Tbl_Users, setTbl_Users] = useState([]);
  // const [editingUser, setEditingUser] = useState<any>(null); // To store the user currently being edited
  
  const [userToDelete, setUserToDelete] = useState<any>(null); // To store the user to delete

  useEffect(() => {
    fetchUsers();
    FetchPlCommon();
    // Fn_Dt_User_Master();
  }, []);

  // Coloumn for User types tables
  const Col_Tbl_UserTypes = [
    { title: 'User Type', dataIndex: 'USER_TYPE_NAME' },
    { title: 'Description', dataIndex: 'USER_TYPE_DESC' },
    {
      title: 'Action',
      key: 'action',
      render: (_:any, record:any) => (
        <span>
          {/* Edit Button */}
          <Button 
            onClick={() => handleEdit(record, 'USER_TYPE')} 
            icon={<EditOutlined />} 
            style={{ marginRight: 10 }} 
          />
          {/* Delete Button */}
          <Button 
            onClick={() => showDeleteConfirm(record)} 
            icon={<DeleteOutlined />} 
            style={{ color: 'red' }} 
          />
        </span>
      )
    }
  ];


  const Col_Tbl_Users = [
    { title: 'User Name', dataIndex: 'USERNAME' },
    { title: 'First Name', dataIndex: 'F_NAME' },
    { title: 'Last Name', dataIndex: 'L_NAME' },
    { title: 'Contact No.', dataIndex: 'CONTACT_NO' },
    { title: 'Email', dataIndex: 'EMAIL' },
    { title: 'Role', dataIndex: 'USER_TYPE_NAME' },
    { title: 'Status', dataIndex: 'STATUS' },
    {
      title: 'Action',
      key: 'action',
      render: (_:any, record:any) => (
        <span>
          {/* Edit Button */}
          <Button 
            onClick={() => {
              handleEdit(record, 'USER');
            }} 
            icon={<EditOutlined />} 
            style={{ marginRight: 10 }} 
          />
          {/* Delete Button */}
          <Button 
            onClick={() => showDeleteConfirm(record)} 
            icon={<DeleteOutlined />} 
            style={{ color: 'red' }} 
          />
        </span>
      )
    }
  ];

  // Function to handle edit operation
  const handleEdit = (record: any, type: string) => {
    if (type === 'USER') {
      // setEditingUser(record); // Set the user to be edited
      setIsModalVisible_UM(true); // Show the modal for editing
      form_UM.setFieldsValue(record)
    } else if (type === 'USER_TYPE') {
      // setEditingUser(record); // Set the user to be edited
      
      form_UT.setFieldsValue(record)
      setIsModalVisible_UT(true); // Show the modal for editing
    }
  };

  // Function of Common PL
  const FetchPlCommon = async () => {
    try {
      const response = await apiClient(`${API_BASE_URL}Pl_Common?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&TBL_SRNO=7`, "GET");

      if (response.msgId === 200) {
        if (!response.data) return;
        setOptUserType(response.data.Table7);
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

  const fetchUsers = async () => {
    try {
      const response = await apiClient(`${API_BASE_URL}DtUsers?USER_SRNO=${USER_SRNO}`, "GET");

      if (response.msgId === 200) {
        if (!response.data) return;
        setUserData(response.data.Table);
        
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

  // Function to fetch User Type data
  const fetchUserType = async () => {
    try {
      const response = await apiClient(`${API_BASE_URL}DtUserTypes?UT_SRNO=${UT_SRNO}`, "GET");

      if (response.msgId === 200) {
        if (!response.data) return;
        setUserTypeData(response.data.Table);
      } else {
        message.error(response.msg);
        console.error("API Error:", response.msg);
      }
    } catch (error: any) {
      console.error("Error fetching User Type:", error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const Fn_Iu_User_Master_Type = async (values: any) => {
    const payload = {
      "IU_FLAG" : values.USER_TYPE_SRNO  > 0 ? 'U' : 'I',
      "USER_TYPE_NAME" : values.USER_TYPE_NAME,
      "USER_TYPE_DESC" : values.USER_TYPE_DESC,
      "USER_SRNO" : USER_SRNO.toString(),
      "USER_TYPE_SRNO" : (values.USER_TYPE_SRNO || 0).toString() ,
    }
    // payload to the apiClient as querystring
    const queryString = new URLSearchParams(payload).toString();

    try {
      const response = await apiClient(`${API_BASE_URL}IuUserType?${queryString}`, "GET");
      if (response.msgId === 200) {
        message.success("User Type Added!");
        handleCancel_UT()
        fetchUserType(); // Refresh the list after submit
      } else {
        message.success(response.msg);
      }
    } catch (err) {
      alert('Failed to submit data.');
    }
  };

  const Fn_Iu_User_Master = async (values: any) => {
    const payload = {
      "IU_FLAG" : values.USER_SRNO  > 0 ? 'U' : 'I',
      "USERNAME" : values.USERNAME ,
      "F_NAME" : values.F_NAME ,
      "L_NAME" : values.L_NAME ,
      "USER_TYPE" : values.USER_TYPE_SRNO ,
      "PASSWORD" : values.PASSWORD ,
      "EMAIL" : values.EMAIL ,
      "CONTACT_NO" : values.CONTACT_NO ,
      "IS_ACTIVE" : values.IS_ACTIVE ? 1 : 0 ,
      "USER_SRNO" : USER_SRNO,
      "USER_SRNO_PK" : values.USER_SRNO || 0 ,

    }

    try {
      const response = await apiClient(`${API_BASE_URL}IuUser`, "POST", payload);
      if (response.msgId === 200) {
        message.success("User Added!");
        handleCancel_UM()
        fetchUsers(); // Refresh the list after submit
      } else {
        message.success(response.msg);
      }
    } catch (err) {
      alert('Failed to submit data.');
    }
  };



  // Handler for Delete (Show confirmation modal)
  const showDeleteConfirm = (user: any) => {
    setUserToDelete(user); // Set the user to be deleted
  };

  // Handle actual delete operation
  const handleDelete = async () => {
    try {
      // Call the API to delete the user
      const response = await apiClient(`${API_BASE_URL}IuUser`, "POST", {
        USER_SRNO: userToDelete.USER_SRNO,
        IU_FLAG: 'D', // Deletion flag
      });

      if (response.msgId === 1) {
        alert('User deleted successfully!');
        fetchUsers(); // Refresh the list after deletion
      } else {
        alert(response.msg); // Show error message
      }
    } catch (err) {
      alert('Failed to delete data.');
    }
    // setIsModalVisible(false); // Close the modal after deletion
  };


  const handleCancel_UM = () => {
    setIsModalVisible_UM(false);
    form_UM.resetFields();
  }
  const handleCancel_UT = () => {
    setIsModalVisible_UT(false);
    form_UT.resetFields();
  }

  // Handle tab change
  const onTabChange = (key: string) => {
    setActiveTab(key);
    if (key === "USERS") {
    fetchUsers()
    }else if(key === "USER_TYPES"){
      fetchUserType()
    }
  };

  // function to handle the new add button
  const handleNewAdd = () => {
    if (activeTab === "USERS") {
      setIsModalVisible_UM(true);
    } else if (activeTab === "USER_TYPES") {
      setIsModalVisible_UT(true);
    }
  };
  return (
    <>
  <Card title="User Management"
  extra={
    <Button type="primary" onClick={() => handleNewAdd()} hidden={activeTab === "USER_PERMISSIONS"} >
      {activeTab === "USERS" ? "Add User" : activeTab === "USER_TYPES" ? "Add User Type" : ""}
    </Button>
  }
  >
  <Tabs activeKey={activeTab} onChange={onTabChange}>
    <TabPane tab="USERS" key="USERS">
      <Spin spinning={loading}>
        <Table dataSource={userData} columns={Col_Tbl_Users} pagination={false} />
      </Spin>
    </TabPane>
    <TabPane tab="USER TYPE" key="USER_TYPES">
      <Spin spinning={loading}>
        <Table dataSource={userTypeData} columns={Col_Tbl_UserTypes} pagination={false} />
      </Spin>
    </TabPane>
    <TabPane tab="USER PERMISSIONS" key="USER_PERMISSIONS">
      <Spin spinning={loading}>
        <Table dataSource={userPerData} columns={Col_Tbl_Users} pagination={false} />
      </Spin>
    </TabPane>
  </Tabs>
  </Card>

  

    {/* Modal For the add/Edit user  user data */}
    <Modal
        title="Add User"
        open={isModalVisible_UM}
        onCancel={handleCancel_UM}
        // onOk={handleOk}
        footer={false}
      >
        <Form form={form_UM} layout="vertical"
          onFinish={(values) => {
            Fn_Iu_User_Master(values);
          }}
          >
            {/* User Srno in Hidden */}
            <Form.Item hidden name={"USER_SRNO"} initialValue={0}>
              <Input></Input>
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="USERNAME"
                  label="Username"
                  rules={[{ required: true, message: "Please enter username" }]}
                >
                  <Input placeholder="Enter Username" />
                </Form.Item>
              </Col>

              <Col span={12}>
              <Form.Item
                  name="USER_TYPE_SRNO"
                  label="User Type"
                  rules={[{ required: true, message: "Please select user type" }]}
                >
                  <Select placeholder="Select User Type"
                  options={optUserType}
                  >
                  </Select>
                </Form.Item>
              
              </Col>
            </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="F_NAME"
                label="First Name"
                rules={[{ required: true, message: "Please enter first name" }]}
              >
                <Input placeholder="Enter First Name" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="L_NAME"
                label="Last Name"
                rules={[{ required: true, message: "Please enter last name" }]}
              >
                <Input placeholder="Enter Last Name" />
              </Form.Item>
            </Col>
          </Row>

          {!!!(form_UM.getFieldValue('USER_SRNO') > 0) && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="PASSWORD"
                label="Password"
                rules={[{ required: true, message: "Please enter password" }]}
              >
                <Input.Password placeholder="Enter Password" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="C_PASSWORD"
                label="Confirm Password"
                dependencies={['PASSWORD']}
                rules={[
                  { required: true, message: "Please confirm password" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('PASSWORD') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Confirm Password" />
              </Form.Item>
            </Col>
          </Row>
          )}

<Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="EMAIL"
                label="Email"
                rules={[
                  { required: true, message: "Please enter email" },
                  { type: "email", message: "Enter a valid email" },
                ]}
              >
                <Input placeholder="Enter Email" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="CONTACT_NO"
                label="Contact No"
                rules={[
                  { required: true, message: "Please enter contact number" },
                  { pattern: /^[0-9]{10}$/, message: "Enter a valid 10-digit number" },
                ]}
              >
                <Input placeholder="Enter Contact No" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="IS_ACTIVE"
                label="Active Status"
                rules={[{ required: true, message: "Please select status" }]}
              >
                <Select placeholder="Select Status"
                  options={optStatus} 
                >
                  {/* <Option value="1">Active</Option>
                  <Option value="0">Inactive</Option> */}
                </Select>
              </Form.Item>
            </Col>
          </Row>
            <footer>
            <Button type="primary" htmlType="submit">Submit</Button>
            <Button type="default" onClick={() => handleCancel_UM() } style={{ marginLeft: 10 }}>Reset</Button>
            </footer>
        </Form>
      </Modal>


{/* Modal For the Add Edit User Type */}
<Modal
    footer={false}
        title="Add User Type"
        open={isModalVisible_UT}
        onCancel={handleCancel_UT}
        // onOk={handleOk}
      >
        <Form form={form_UT} layout="vertical"  onFinish={(values) => {
            Fn_Iu_User_Master_Type(values);
          }}>

             {/* User Srno in Hidden */}
             <Form.Item hidden name={"USER_TYPE_SRNO"} initialValue={0}>
              <Input></Input>
            </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="USER_TYPE_NAME"
                label="User Type"
                rules={[{ required: true, message: "Please enter user type" }]}
              >
                <Input placeholder="Enter User Type" />
              </Form.Item>
              <Form.Item
                name="USER_TYPE_DESC"
                label="User Type"
                rules={[{ required: true, message: "Please enter user type" }]}
              >
                <Input placeholder="Enter User Type" />
              </Form.Item>
            </Col>
          </Row>
          <footer>
            <Button type="primary" htmlType="submit">Submit</Button>
            <Button type="default" onClick={() => handleCancel_UM() } style={{ marginLeft: 10 }}>Reset</Button>
            </footer>
        </Form>
      </Modal>

{/* Modal For the Add Edit User Permission */}

</>

);

};

export default SystemUserManagement;
