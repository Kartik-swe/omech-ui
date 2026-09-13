"use client";
import { RetweetOutlined, DollarCircleOutlined, BuildOutlined, SwapOutlined, DownloadOutlined, CheckOutlined, PlusOutlined, MinusOutlined } from "@ant-design/icons";
import { Table, Card, Tag, message, Tooltip, Popconfirm, Button, Modal, Descriptions, Form, Row, Col, Select, Input, Space, DatePicker } from "antd";
import { useEffect, useState } from "react";
import { apiClient } from "@/utils/apiClient";
import { getCookieData } from "@/utils/common";
import TextArea from "antd/es/input/TextArea";
import { json } from "stream/consumers";

const PipeInventory = () => {
  const [loading, setLoading] = useState(false);
  const [pipes, setPipes] = useState<any[]>([]);
  const cookiesData = getCookieData();
  const { USER_SRNO, API_BASE_URL, UT_SRNO } = cookiesData;
  const [Shiftform] = Form.useForm();
  const [SearchForm] = Form.useForm();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [optVendors, setOptVendors] = useState<{ label: string; value: string }[]>([]);
  const [optGrades, setOptGrades] = useState<{ label: string; value: string }[]>([]);
  const [optThickness, setOptThickness] = useState<{ label: string; value: string }[]>([]);
  const [optOd, setOptOd] = useState<{ label: string; value: string }[]>([]);
  const [optPipes, setOptPipes] = useState<{ label: string; value: string }[]>([]);
  const { TextArea } = Input;

  // State for Add Pipe Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [machineType, setMachineType] = useState<'Tube' | 'Laser'>('Tube'); // Default to 'Tube'
  const [optTubeMachines, setOptTubeMachines] = useState([]);
  const [staffOpt, setStaffOpt] = useState([]);
  const [shiftsOpt, setShiftsOpt] = useState([]);
  // const [optOd, setOptOd] = useState([]);
  // const [optThickness, setOptThickness] = useState([]);
  // const [optGrades, setOptGrades] = useState([]);
  const [productOpt, setProductOpt] = useState([]);
 
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null);
  const [editType, setEditType] = useState<"ADD" | "MINUS" | null>(null);
  const [quantity, setQuantity] = useState<number>(0);

  // new code
  const handleStartEdit = (record: any, type: "ADD" | "MINUS") => {
    setSelectedMaterial({ ...record,FLAG: type });
    setEditingRowKey(record.PR_INV_SRNO); // Use your actual row key
    setEditType(type);
    setQuantity(0); // Reset quantity
  };
  const handleDone = async (record: any) => {
  

    const payload = {
      IU_FLAG: "I",
      FLAG: editType,
      PR_INV_SRNO: record.PR_INV_SRNO,
      PR_SRNO: record.PR_SRNO,
      PIPE_NOS: quantity,
      USER_SRNO: USER_SRNO,
      UT_SRNO: UT_SRNO,
    };

    const response = await apiClient(`${API_BASE_URL}IuPipesInvPr`, "POST", payload);
    
    if (response.msgId === 200) {
      fetchPipes()
      message.success("Pipes Updadted successful!");
    } else {
      message.error(response.msg);
    }

    // Call your backend API or function here
    setEditingRowKey(null);
    setEditType(null);
    setQuantity(0);
    setLoading(false)
  };

  // new code end

    useEffect(() => {
      fetchLocationOptions();
      fetchPipes();
      }, []);

      const fetchLocationOptions = async () => {
        try {
          const response = await apiClient(`${API_BASE_URL}Pl_Common?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&TBL_SRNO=1,2,3,4,8,9`, "GET");
          if (response.msgId === 200) {
            if (!response.data) return;
              const { Table1,Table2,Table3,Table4,Table8,Table9 } = response.data;
              setOptGrades(Table1)
              setOptOd(Table2)
              setOptThickness(Table3)

              setOptVendors(Table4)
              setOptPipes(Table9)
              setOptTubeMachines(Table8)
              
          } else {
            message.error(response.msg);
          }
        } catch (error) {
          message.error("Error fetching locations");
        }
      };

      
      // Handle "Shift" button click
  const handleShift = (record: any,FLAG: string) => {
    setSelectedMaterial({ ...record,FLAG });
    setIsModalVisible(true);
  };
  // Handle modal OK button click
    const handleOk = async () => {
      try {
        const values = await Shiftform.validateFields();
        const { FLAG } = selectedMaterial;
  
        const payload = {
          IU_FLAG: "I",
          ACTION_FLAG: FLAG,
          PR_INV_SRNO: selectedMaterial.PR_INV_SRNO,
          PR_SRNO:  selectedMaterial.PR_SRNO,
          WORK_SHIFT_SRNO : null,
          FROM_LOCATION: selectedMaterial.C_LOCATION || null,
          FROM_LOCATION_SRNO: selectedMaterial.C_LOCATION_SRNO || null,
          TO_LOCATION: values.TO_LOCATION || null,
          PIPE_NOS: values.PIPE_NOS,
          CUSTOMER_NAME: values.CUSTOMER_NAME || null,
          INVOICE_NUMBER: values.INVOICE_NUMBER || null,
          LEASRE_MACHINE_NUMBER: values.LEASRE_MACHINE_NUMBER || null,
          TRN_DATE: values.TRN_DATE || null,
          TRN_BY: values.TRN_BY || USER_SRNO,
          TRN_REMARK: values.TRN_REMARK || null,
          USER_SRNO: USER_SRNO,
        };

        const response = await apiClient(`${API_BASE_URL}IuPipeShiftAction`, "POST", payload);
        // const response = await apiClient(`${API_BASE_URL}IuPipeShiftLocation`, "POST", payload);
  
        if (response.msgId === 200) {
          message.success("Shift successful!");
          setIsModalVisible(false);
          Shiftform.resetFields();
          // Optionally, you can refresh the table data here

          fetchPipes();
        } else {
        alert(response.msg)
          message.error(response.msg);
        }
      } catch (error: any) {
        alert(error)
        message.error(error.message);
      }
    };
  
    // Handle modal Cancel button click
    const handleCancel = () => {
      setIsModalVisible(false);
      Shiftform.resetFields();
    };

    // Fetch Mother data
  const fetchPipes = async () => {
    try {
      setLoading(true);
      const query_string = `PR_SRNO=${SearchForm.getFieldValue("PR_SRNO") || ''}&GRADE_SRNO=${SearchForm.getFieldValue("S_GRADE_SRNO") || ''}&THICKNESS_SRNO=${SearchForm.getFieldValue("S_THICKNESS_SRNO") || ''}&OD_SRNO=${SearchForm.getFieldValue("S_OD_SRNO") || ''}&C_LOCATION=${SearchForm.getFieldValue("C_LOCATION") || ''}&PR_LENGTH=${SearchForm.getFieldValue("PR_LENGTH") || ''}`;
      const response = await apiClient(`${API_BASE_URL}DtPipes?${query_string}&USER_SRNO=${USER_SRNO}`, "GET");

      if (response.msgId === 200) {
        if (!response.data) return;
        setPipes(response.data.Table);
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

  // const [pipes] = useState([
  //   {
  //     id: 1,
  //     challanNo: "CH12345",
  //     machineName: "Tube Machine A",
  //     processingDate: "2025-03-22",
  //     od: "50",
  //     grade: "A",
  //     thickness: "3mm",
  //     quantity: 50,
  //     weight: 1200,
  //     status: "Completed",
  //   },
  //   {
  //     id: 2,
  //     challanNo: "CH12346",
  //     machineName: "Laser Cutter B",
  //     processingDate: "2025-03-21",
  //     od: "60",
  //     grade: "B",
  //     thickness: "2.5mm",
  //     quantity: 40,
  //     weight: 1000,
  //     status: "In Progress",
  //   },
  //   {
  //     id: 3,
  //     challanNo: "CH12347",
  //     machineName: "Tube Machine C",
  //     processingDate: "2025-03-20",
  //     od: "40",
  //     grade: "C",
  //     thickness: "4mm",
  //     quantity: 60,
  //     weight: 1400,
  //     status: "Pending",
  //   },
  // ]);


// Haandle Pipe log Finish
const handleAddLog = async (values: any) => {
  try {
    const payload1 = {
      IU_FLAG : 'I',
      MATERIAL_SRNO : null,
      SLITTING_SRNO : null,
      MACHINE_SRNO : values.MACHINE_SRNO,
      GRADE_SRNO : values.GRADE_SRNO,
      THICKNESS_SRNO : values.THICKNESS_SRNO,
      OD_SRNO : values.OD_SRNO,
      WORK_SHIFT_SRNO : values.WORK_SHIFT_SRNO || null,
      C_LOCATION : values.C_LOCATION,
      IS_COIL_COMPLETED : false,
      P_LENGTH : values.P_LENGTH,
      PIPE_NOS : values.PIPE_NOS,
      PG_SCRAP_WT : null,
      P_WEIGHT : 0,
      REMARKS : null,
      TRN_DATE : values.TRN_DATE || null,
      TRN_BY : values.TRN_BY,
      TRN_REMARK : values.TRN_REMARK,
      UT_SRNO : UT_SRNO,
      USER_SRNO : USER_SRNO,
      PG_SRNO : null,
    };


    // Call the API
    const response = await apiClient(`${API_BASE_URL}IuPipes`, "POST", payload1);
    
    // Handle the API response
    if (response.msgId == 200 || response.msgId == 0) {
      message.success('Log added successfully!');
      setIsModalOpen(false); // Close modal after success
      fetchPipes();
    } else {
      throw new Error(response.msg || 'Failed to add log');
    }
  } catch (error: any) {
    console.error('Error adding log:', error);
    message.error(error.message || 'Something went wrong!');
  }
};

 
  const columns = [
    { title: "Grade", dataIndex: "GRADE", key: "GRADE" },
    { title: "Thickness", dataIndex: "THICKNESS", key: "THICKNESS" },
    { title: "OD", dataIndex: "OD", key: "OD" },

    { title: "Length", dataIndex: "PR_LENGTH", key: "PR_LENGTH" },
    { title: "Quantity", dataIndex: "AVAILABLE_QUANTITY", key: "AVAILABLE_QUANTITY" },
    // { title: "Weight (kg)", dataIndex: "PR_WEIGHT", key: "PR_WEIGHT" },
    { title: "Total Weight (kg)", dataIndex: "T_PR_WEIGHT", key: "T_PR_WEIGHT" },
    { title: "Location", dataIndex: "VENDOR_NAME", key: "VENDOR_NAME" },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => {
        const isEditing = editingRowKey === record.PR_INV_SRNO;
        return (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {isEditing ? (
              <>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  placeholder="Enter quantity"
                  style={{ width: "100px" }}
                  size="small"
                />
                <Button
                loading={loading}
                  icon={<CheckOutlined />}
                  type="primary"
                  size="small"
                  onClick={() => handleDone(record)}
                >
                  {editType === "ADD" ? "Add" : "Minus"} 
                </Button>
              </>
            ) : (
              <>
                <Tooltip title="Add Quantity">
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => handleStartEdit(record, "ADD")}
                    size="small"
                    type="primary"
                  />
                </Tooltip>
                <Tooltip title="Minus Quantity">
                  <Button
                    icon={<MinusOutlined />}
                    onClick={() => handleStartEdit(record, "MINUS")}
                    size="small"
                    style={{ backgroundColor: "#ff4d4f", borderColor: "#ff4d4f", color: "white" }}
                  />
                </Tooltip>
                <Tooltip title="Shift">
                  <Button
                    icon={<SwapOutlined />}
                //    onClick={() => handleShift(record)}
                onClick={() =>  handleShift(record, "SHIFT")}
                    size="small"
                    style={{ backgroundColor: "#1890ff", borderColor: "#1890ff", color: "white" }}
                  />
                </Tooltip>
              </>
            )}
          </div>
        );
      },
    },
  
    // {title: "Actions",
    //   key: "actions",
    //   render: (_: any, record: any) => (
    //     <div style={{ display: "flex", gap: "8px" }}>
    //   {/* Shift */}
    //   <Tooltip title="Shift to another location">
    //   <Popconfirm
    //                  className=""
    //                  title="Shift to another location"
    //                  description="Are you sure to confirm?"
    //                 onConfirm={() =>  handleShift(record, "LOCATION")}
    //                 //  onCancel={cancel}
    //                  okText="Yes"
    //                  cancelText="No"
    //                >
    //     <Button
    //       style={{
    //         backgroundColor: record.IS_RAW_SLITTED === 'Y' ? "#d9d9d9" : "#1890ff",
    //         borderColor: record.IS_RAW_SLITTED === 'Y' ? "#d9d9d9" : "#1890ff",
    //         color: "white",
    //         opacity: record.IS_RAW_SLITTED === 'Y' ? 0.5 : 1,
    //       }}
    //       // onClick={() =>}
    //       disabled={record.IS_RAW_SLITTED === 'Y'}
    //       icon={<SwapOutlined />}
    //     />
    //     </Popconfirm>
    //   </Tooltip>

    

    //   {/* Sell */}
    //   <Tooltip title="Sell Pipes">
    //   <Popconfirm
    //                  className=""
    //                  title="Sell Pipes"
    //                  description="Are you sure to confirm?"
    //                  onConfirm={() =>  handleShift(record, "SELL")}

    //                 //  onCancel={cancel}
    //                  okText="Yes"
    //                  cancelText="No"
    //                >
    //     <Button
    //       style={{
    //         backgroundColor: record.IS_RAW_SLITTED === 'Y' ? "#d9d9d9" : "#008000",
    //         borderColor: record.IS_RAW_SLITTED === 'Y' ? "#d9d9d9" : "#008000",
    //         color: "white",
    //         opacity: record.IS_RAW_SLITTED === 'Y' ? 0.5 : 1,
    //       }}
    //       // onClick={() => handleRowAction(FLAG=='M' ? record.MATERIAL_SRNO : record.SLITTING_SRNO,FLAG,'S')}
    //       disabled={record.IS_RAW_SLITTED === 'Y'}
    //       icon={<DollarCircleOutlined />}
    //     />
    //     </Popconfirm>
    //   </Tooltip>

    //   {/* Shift to Production */}
    //   <Tooltip title="Shift Pipes to Cutting">
    //   <Popconfirm
    //                  className=""
    //                  title="Shift Pipes to Cutting"
    //                  description="Are you sure to confirm?"
    //                  onConfirm={() =>  handleShift(record, "CUTTING")}
    //                 // onConfirm={() =>   handleStatusLog(record, FLAG)}
    //                 //  onCancel={cancel}
    //                  okText="Yes"
    //                  cancelText="No"
    //                >
    //     <Button
    //       style={{
    //         backgroundColor: record.IS_RAW_SLITTED === 'Y' ? "#d9d9d9" : "#800080",
    //         borderColor: record.IS_RAW_SLITTED === 'Y' ? "#d9d9d9" : "#800080",
    //         color: "white",
    //         opacity: record.IS_RAW_SLITTED === 'Y' ? 0.5 : 1,
    //       }}
    //       // onClick={() => handleRowAction(FLAG=='M' ? record.MATERIAL_SRNO : record.SLITTING_SRNO,FLAG,'P')}
    //       disabled={record.IS_RAW_SLITTED === 'Y'}
    //       icon={<BuildOutlined />}
    //     />
    //     </Popconfirm>
    //   </Tooltip>
    // </div>
    //   ),}
    // { title: "Status", dataIndex: "status", key: "status", render: getStatusTag },
  ];

  return (
    <Card title="Produced Pipe Inventory" bordered={false} style={{ margin: 20 }}
    extra={
                  <Button type="primary" onClick={() => setIsModalOpen(true)}>
                    Add Inventory
                  </Button>
                }
                >
      {/* Add Form For Search Paramter */}
      <Form form={SearchForm} style={{ marginBottom: 16 }} onFinish={fetchPipes} >
        <Row gutter={16}> 
          <Col span={10} hidden>
            <Form.Item  name="PR_SRNO" >
              <Select 
                    showSearch 
                    placeholder="Select Pipe" 
                    options={optPipes} 
                    filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
                    allowClear
                />
            </Form.Item>
          </Col>
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
          <Col span={5}>
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
          <Col span={4}>
            <Form.Item name="PR_LENGTH">
              <Input placeholder="Enter Length" type="number" />
            </Form.Item>
          </Col>
          {/* <Col span={6}>
            <Form.Item label="Processing Date" name="processingDate">
              <Input type="date" placeholder="Processing Date" />
            </Form.Item>
          </Col> */}
          <Col span={2}>
            <Button type="primary" htmlType="submit">Search</Button>
          </Col>
        </Row>
      </Form>
      
      {/* Table for Pipe Inventory */}
      <Table dataSource={pipes} columns={columns} rowKey="id" />
      {/* Modal for shifting material */}
      { isModalVisible && ( 
      <Modal
        title="Shift Pipes"
        open={isModalVisible}
        footer={null}
        onCancel={handleCancel}
        width={800} // Increase the modal width
      >
        {selectedMaterial && (
          <div style={{ marginBottom: 16, maxHeight: 200, overflowY: 'auto' }}>
            {/* {JSON.stringify(selectedMaterial)} */}
          <Descriptions bordered column={1} size="small">

              <Descriptions.Item label="Pipe Details">{selectedMaterial.PR_NAME}</Descriptions.Item>
            </Descriptions>

          <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="From Location">{selectedMaterial.C_LOCATION}</Descriptions.Item>
              <Descriptions.Item label="Pipe Length">{selectedMaterial.PR_LENGTH}</Descriptions.Item>
              <Descriptions.Item label="Pipe Weight">{selectedMaterial.PR_WEIGHT} kg</Descriptions.Item>
              <Descriptions.Item label="Quanity">{selectedMaterial.AVAILABLE_QUANTITY}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
          <Form form={Shiftform} layout="vertical" onFinish={handleOk}  >
            <Row gutter={16}>
              {selectedMaterial.FLAG === "SHIFT" && (
                <>
                                
                <Col span={6}>
                  <Form.Item
                    label="To Location"
                    name="TO_LOCATION"
                    rules={[{ required: true, message: "Please select the destination location!" }]}
                  >
                    <Select
                      showSearch
                      placeholder="Select"
                      options={optVendors}
                      filterOption={(input: any, option: any) =>
                        option?.label.toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </Form.Item>
                </Col>
              </>
              )}
              
               {/* Adding LEASRE_MACHINE_NUMBER for FLAG CUTTING   */}

               {selectedMaterial.FLAG === "CUTTING" && (
                <Col span={6}>
                  <Form.Item
                    label="Machine Number"
                    name="LEASRE_MACHINE_NUMBER"
                    rules={[{ required: true, message: "Please enter the machine number!" }]}
                  >
                    <Input placeholder="Enter machine number" />
                  </Form.Item>
                </Col>
              )}

              <Col span={6} hidden>
                <Form.Item
                  label="Issue Date"
                  name="TRN_DATE"
                  rules={[{ required: false, message: "Please select the issue date!" }]}
                >
                  <Input type="date" />
                </Form.Item>
              </Col>
              <Col span={6} hidden>
                <Form.Item
                  label="Issue By"
                  name="TRN_BY"
                  rules={[{ required: false, message: "Please select the issue date!" }]}
                >
                  <Select
                      showSearch
                      placeholder="Select"
                      options={optVendors}
                      filterOption={(input: any, option: any) =>
                        option?.label.toLowerCase().includes(input.toLowerCase())
                      }
                    />
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item
                  label="NOS"
                  name="PIPE_NOS"
                  rules={[{ required: true, message: 'Please Enter the quantity' },
                                {
                                  validator: (_, value) => {
                                   
                                    if (value > 0) {
                                      if (value > selectedMaterial.AVAILABLE_QUANTITY) {
                                        return Promise.reject(new Error('Quantity cannot be greater than available quantity'));
                                      }
                                      else{
                                        return Promise.resolve();
                                      }
                                    }
                                  },
                                },
                              ]}

                  
                >
                  <Input type="number" placeholder="Enter quantity" />

                </Form.Item>
              </Col>

              {/* Adding CUSTOMER_NAME and INVOICE_NUMBER for FLAG SELL   */}
              {selectedMaterial.FLAG === "SELL" && (
                <>
                  <Col span={12}>
                    <Form.Item
                      label="Customer Name"
                      name="CUSTOMER_NAME"
                      rules={[{ required: false, message: "Please enter the customer name!" }]}
                    >
                      <Input placeholder="Enter customer name" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Invoice Number"
                      name="INVOICE_NUMBER"
                      rules={[{ required: false, message: "Please enter the invoice number!" }]}
                    >
                      <Input placeholder="Enter invoice number" />
                    </Form.Item>
                  </Col>
                </>
              )}

             


              <Col span={24} hidden>
                <Form.Item
                  label="Remarks"
                  name="TRN_REMARK"
                  rules={[{ required: false, message: "Please enter remarks!" }]}
                >
                  <TextArea rows={4} placeholder="Enter remarks" />
                </Form.Item>
              </Col>
            </Row>

            {/* Submit Button */}
            <Button
              type="primary"
              htmlType="submit"
              // loading={loading}
              style={{ width: '100%', marginTop: 20 }}
            >
              Shift
            </Button>
          </Form>
      </Modal>
      )}


      {/* Add Pipe MOdal */}
      <Modal
        title="Add Production Log"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form onFinish={handleAddLog}>
  <Form.Item label="Pipe Srno" hidden name="PIPE_SRNO">
    <input type="hidden"  />
  </Form.Item>
  <Form.Item label="Machine Type" hidden  >
    <Select
      defaultValue="Tube"
      onChange={(value) => setMachineType(value as 'Tube' | 'Laser')}
    >
      <Select.Option value="Tube">Tube Machine</Select.Option>
      <Select.Option value="Laser">Laser Machine</Select.Option>
    </Select>
  </Form.Item>

  <Form.Item hidden
    label="Machine"
    name="MACHINE_SRNO"
    rules={[{ required: false, message: 'Please select a machine!' }]}
  >
    <Select
      placeholder="Select machine"
      options={optTubeMachines} // Assuming you have a list of tube machines
      filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
    />
  </Form.Item>

  <Form.Item
  hidden
    label="Staff"
    name="TRN_BY"
    rules={[{ required: false, message: 'Please select staff!' }]}
  >
    <Select placeholder="Select staff" options={staffOpt} />
  </Form.Item>

  <Form.Item
  hidden
    label="Shift"
    name="SHIFT_SRNO"
    rules={[{ required: false, message: 'Please select a shift!' }]}
  >
    <Select placeholder="Select shift" options={shiftsOpt} />
  </Form.Item>

  <Form.Item
  hidden
    label="Date"
    name="TRN_DATE"
    rules={[{ required: false, message: 'Please select date!' }]}
  >
    <DatePicker />
  </Form.Item>

  <Form.Item
    label="Location"
    name="C_LOCATION"
    rules={[{ required: true, message: 'Please select location!' }]}
  >
    <Select showSearch placeholder="Select location" options={optVendors} filterOption={(input: any, option: any) =>
                    option?.label.toLowerCase().includes(input.toLowerCase())
                  } allowClear></Select>
  </Form.Item>

  

  {machineType === 'Tube' && (
    <>
     <Form.Item
        label="Grade"
        name="GRADE_SRNO"
        rules={[{ required: true, message: 'Please select grade!' }]}
      >
        <Select placeholder="Select grade" options={optGrades} />
      </Form.Item>

     
      <Form.Item
        label="Thickness"
        name="THICKNESS_SRNO"
        rules={[{ required: true, message: 'Please select thickness!' }]}
      >
        <Select placeholder="Select thickness" options={optThickness} />
      </Form.Item>

      <Form.Item
        label="OD"
        name="OD_SRNO"
        rules={[{ required: true, message: 'Please select OD!' }]}
      >
        <Select placeholder="Select OD" options={optOd} />
      </Form.Item>


    </>
  )}

  {machineType === 'Laser' && (
    <>
    <Form.Item
      label="Product"
      name="PRODUCT_SRNO"
      rules={[{ required: true, message: 'Please select a product!' }]}
    >
      <Select placeholder="Select product" options={productOpt} />
    </Form.Item>

</>
  )}



<Form.Item
label="Length"
name="P_LENGTH"
rules={[{ required: true, message: 'Please select a Length!' }]}
>
<Input placeholder="Enter Length" />
</Form.Item>
 
<Form.Item
    label="Quantity"
    name="PIPE_NOS"
    rules={[{ required: true, message: 'Please enter quantity!' }]}
  >
    <Input type="number" placeholder="Enter quantity" />
  </Form.Item>
  {/* <Form.Item
    label="Status"
    name="STATUS_SRNO"
    rules={[{ required: true, message: 'Please select a status!' }]}
  >
    <Select placeholder="Select status" options={statusOpt} />
  </Form.Item>

  <Form.Item
    label="Pipe Type"
    name="PIPE_TYPE"
    rules={[{ required: true, message: 'Please select pipe type!' }]}
  >
    <Select placeholder="Select pipe type" options={pipeTypeOpt} />
  </Form.Item> */}

  <Form.Item>
    <Space>
      <Button type="primary" htmlType="submit">
        Add Log
      </Button>
      <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
    </Space>
  </Form.Item>
</Form>

      </Modal>
    </Card>
  );
};

export default PipeInventory;
