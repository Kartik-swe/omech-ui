"use client";
import { RetweetOutlined, DollarCircleOutlined, BuildOutlined, SwapOutlined, DownloadOutlined } from "@ant-design/icons";

import React, { useState, useEffect } from "react";
import { Card, Table, Row, Col, message, Button, Form, Input, Modal, Select, Tooltip, Spin, Tabs, Descriptions, Popconfirm } from "antd";
import { apiClient } from "@/utils/apiClient";
import { exportToExcel, getCookieData } from "@/utils/common";
import TextArea from "antd/es/input/TextArea";
import ModalMoveCoilProd from "@/app/components/pipe/ModalMoveCoilProd";

const { TabPane } = Tabs;

const RawMaterialsShiftHis = () => {
  const [MotherData, setMotherData] = useState<any[]>([]);
  const [SemiSlittedData, setSemiSlittedData] = useState<any[]>([]);
  const [SlittedData, setSlittedData] = useState<any[]>([]);
  const [fetchCoilsData, setFetchCoilsData] = useState<any[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isStatusLogModalVisible, setisStatusLogModalVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("MOTHER");

  const [optGrades, setOptGrades] = useState<{ label: string; value: string }[]>([]);
    const [optThickNess, setoptThickNess] = useState<{ label: string; value: string }[]>([]);
    const [optVendors, setOptVendors] = useState<{ label: string; value: string }[]>([]);
    const [optTubeMachines, setoptTubeMachines] = useState<{ label: string; value: string }[]>([]);
    const [optWorkingUsers, setOptWorkingUsers] = useState<{ label: string; value: string }[]>([]);
    const [optODs, setOptODs] = useState<{ label: string; value: string }[]>([]);
    const [optWorkingShifts, setOptWorkingShifts] = useState<{ label: string; value: string }[]>([]);
    const [optResponsibleSupervisors, setOptResponsibleSupervisors] = useState<{ label: string; value: string }[]>([]);

  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [statusLog] = Form.useForm();


  const cookiesData = getCookieData();
  const { USER_SRNO, API_BASE_URL, UT_SRNO } = cookiesData;

  // Fetch dropdown options for locations
  const FetchPlCommon = async () => {
    const response = await apiClient<Record<string, any>>(
      `${API_BASE_URL}Pl_Common?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&TBL_SRNO=1,2,3,4,8,11,12`,
      "GET"
    );
    if (response.msgId === 200) {
      if (!response.data) return;
      const { Table1,Table2, Table3, Table4,Table8,Table11,Table12 } = response.data;
      setOptGrades(Table1)
      setoptThickNess(Table3)
      setOptVendors(Table4)
      setoptTubeMachines(Table8)
      setOptWorkingUsers(Table11)
      setOptODs(Table2)
      setOptResponsibleSupervisors(Table12)

     // workingShifts 1) Morning 2 ) evening
      const workingShifts = [
        {
          label: "Morning Shift",
          value: "MORNING",
        },
        {
          label: "Evening Shift",
          value: "EVENING",
        },
      ]

      setOptWorkingShifts(workingShifts)
    } else {
      message.error(response.msg);
      console.error("API Error:", response.msg);
    }
  };

  // Fetch Mother data
  const fetchMotherCoil = async (queryString : string) => {
    try {
      setLoading(true);
      const MATERIAL_FLAG = "M"; // S for Slitted
      const response = await apiClient(`${API_BASE_URL}DtRawMaterialShift?${USER_SRNO}&MATERIAL_FLAG=${MATERIAL_FLAG}&${queryString}`, "GET");

      if (response.msgId === 200) {
        if (!response.data) return;
        setMotherData(response.data.Table);
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

  // Fetch semi-slitted data
  const fetchSemiSlitted = async (queryString : string) => {
    try {
      setLoading(true);
      const MATERIAL_FLAG ='P'
      const response = await apiClient(`${API_BASE_URL}DtRawMaterialShift?${USER_SRNO}&MATERIAL_FLAG=${MATERIAL_FLAG}&${queryString}`, "GET");


      if (response.msgId === 200) {
        if (!response.data) return;
        setSemiSlittedData(response.data.Table1);
      } else {
        message.error(response.msg);
        console.error("API Error:", response.msg);
      }
    } catch (error: any) {
      console.error("Error fetching semi-slitted Coil:", error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  // Fetch slitted data
  const fetchSlitted = async (queryString : string) => {
    try {
      // alert("dfg")
      setLoading(true);
      const MATERIAL_FLAG ='S'
      const response = await apiClient(`${API_BASE_URL}DtRawMaterialShift?${USER_SRNO}&MATERIAL_FLAG=${MATERIAL_FLAG}&${queryString}`, "GET");


      if (response.msgId === 200) {
        if (!response.data) return;
        setSlittedData(response.data.Table2);
      } else {
        message.error(response.msg);
        console.error("API Error:", response.msg);
      }
    } catch (error: any) {
      console.error("Error fetching semi-slitted Coil:", error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch slitted data
  const fetchCoils = async (MATERIAL_FLAG:string, queryString : string) => {
    try {
      // alert("dfg")
      setLoading(true);
      // const MATERIAL_FLAG ='S'
      const response = await apiClient(`${API_BASE_URL}DtRawMaterialShift?${USER_SRNO}&MATERIAL_FLAG=${MATERIAL_FLAG}&${queryString}`, "GET");


      if (response.msgId === 200) {
        if (!response.data) return;
        setFetchCoilsData(response.data.Table3);
      } else {
        message.error(response.msg);
        console.error("API Error:", response.msg);
      }
    } catch (error: any) {
      console.error("Error fetching semi-slitted Coil:", error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    FetchPlCommon();
    fetchMotherCoil('');
  }, []);

  // Handle "Shift" button click
  const handleShift = (record: any, flag: string) => {
    setSelectedMaterial({ ...record, flag });
    setIsModalVisible(true);
  };

  // Handle "Shift" button click
  const handleStatusLog = (record: any, flag: string) => {
    setSelectedMaterial({ ...record, flag });
    setisStatusLogModalVisible(true);
  };

  // Handle Row Action 
  const handleRowAction = async (SRNO: number, COIL_FLAG: string,STATUS_FLAG: string) => {
      // STATUS_FLAG = S-SELL, R- RETURN, P- PRODUCTION ]
      try {
       const response = await apiClient(`${API_BASE_URL}IuShiftStock?IU_FLAG=U&COIL_FLAG=${COIL_FLAG}&STATUS_FLAG=${STATUS_FLAG}&SRNO=${SRNO}&USER_SRNO=${USER_SRNO}`, "GET");
  
        if (response.msgId === 200) {
          message.success("Record Saved Succesfully!");
          setIsModalVisible(false);
          form.resetFields();
          // add case statement for falg and call the appropriate function to refresh the table for M, P, S
          //remove the record from the table
            switch (COIL_FLAG) {
            case 'M':
              setMotherData((prevData) => prevData.filter(item => item.MATERIAL_SRNO !== SRNO));
              break;
            case 'P':
              setSemiSlittedData((prevData) => prevData.filter(item => item.SLITTING_SRNO !== SRNO));
              break;
            case 'S':
              setSlittedData((prevData) => prevData.filter(item => item.SLITTING_SRNO !== SRNO));
              break;
            default:
              break;
            }

          // switch (COIL_FLAG) {
          //   case 'M':
          //     //fetchMotherCoil();
          //     break;
          //   case 'P':
          //     //fetchSemiSlitted();
          //     break;
          //   case 'S':
          //     //fetchSlitted();
          //     break;
          //   default:
          //     break;
          // }
          // isMotherCoil ? fetchSemiSlitted() : fetchMotherCoil(); // Refresh the appropriate table
        } else {
          message.error(response.msg);
        }
      } catch (error: any) {
        message.error(error.message);
      }
  }

  // Handle modal OK button click
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const { flag } = selectedMaterial;

      const payload = {
        IU_FLAG: "I",
        MATERIAL_SRNO: flag === 'M' ? selectedMaterial.MATERIAL_SRNO : null ,
        SLITTING_SRNO: flag==='M' ? null : selectedMaterial.SLITTING_SRNO ,
        FROM_LOCATION: selectedMaterial.FROM_LOCATION_SRNO,
        TO_LOCATION: values.TO_LOCATION,
        SHIFT_DATE: values.SHIFT_DATE,
        SHIFT_REASON: values.SHIFT_REASON,
        SHIFTING_SRNO: null,
        USER_SRNO: USER_SRNO,
      };

      const response = await apiClient(`${API_BASE_URL}IuRawMaterialShift`, "POST", payload);

      if (response.msgId === 200) {
        message.success("Shift successful!");
        setIsModalVisible(false);
        form.resetFields();
        // add case statement for falg and call the appropriate function to refresh the table for M, P, S
        switch (flag) {
          case 'M':
            fetchMotherCoil('');
            break;
          case 'P':
            fetchSemiSlitted('');
            break;
          case 'S':
            fetchSlitted('');
            break;
          default:
            break;
        }
        // isMotherCoil ? fetchSemiSlitted() : fetchMotherCoil(); // Refresh the appropriate table
      } else {
        message.error(response.msg);
      }
    } catch (error: any) {
      message.error(error.message);
    }
  };

  // Handle modal Cancel button click
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };


   // Handle modal OK button click
   const handleStatusLogOk = async () => {
    try {
      const values = await statusLog.validateFields();
      const { flag } = selectedMaterial;
      const payload = {
        MATERIAL_SRNO: selectedMaterial.MATERIAL_SRNO ,
        SLITTING_SRNO: flag==='M' ? null : selectedMaterial.SLITTING_SRNO ,
        PRE_LOG_STATUS_SRNO: selectedMaterial.LOG_STATUS_SRNO,
        DESCRIPTION: values.MACHINE_SRNO.toString(), // PASSING TUBE MILL SRNO INSETED OF DESC NOW
        REMARKS: values.REMARKS,
        STATUS_CHANGE_DATE: values.STATUS_CHANGE_DATE,
        OD_SRNO : values.OD_SRNO,
        WORKING_USER_SRNO : values.WORKING_USER,
        WORKING_SHIFT : values.WORKING_SHIFT, 
        RESPONSIBLE_SUPERVISOR_SRNO : values.RESPONSIBLE_SUPERVISOR,
        USER_SRNO: USER_SRNO,
        UT_SRNO: UT_SRNO,
        LOG_STATUS_SRNO: 0,
      };

      const response = await apiClient(`${API_BASE_URL}IuStatusLog`, "POST", payload);

      if (response.msgId === 200) {
        message.success("Issued successful!");
        setisStatusLogModalVisible(false);
        statusLog.resetFields();
        // add case statement for falg and call the appropriate function to refresh the table for M, P, S
        switch (flag) {
          case 'M':
            fetchMotherCoil('');
            break;
          case 'P':
            fetchSemiSlitted('');
            break;
          case 'S':
            fetchSlitted('');
            break;
          default:
            break;
        }
        // isMotherCoil ? fetchSemiSlitted() : fetchMotherCoil(); // Refresh the appropriate table
      } else {
      alert(response.msg)
        message.error(response.msg);
      }
    } catch (error: any) {
      alert(error)
      message.error(error.message);
    }
  };
  //  const handleStatusLogOk = async () => {
  //   try {
  //     const values = await statusLog.validateFields();
  //     const { flag } = selectedMaterial;
  //     alert(flag)
  //     const payload = {
  //       MATERIAL_SRNO: selectedMaterial.MATERIAL_SRNO ,
  //       SLITTING_SRNO: flag==='M' ? null : selectedMaterial.SLITTING_SRNO ,
  //       PRE_LOG_STATUS_SRNO: selectedMaterial.LOG_STATUS_SRNO,
  //       DESCRIPTION: values.MACHINE_SRNO.toString(), // PASSING TUBE MILL SRNO INSETED OF DESC NOW
  //       REMARKS: values.REMARKS,
  //       STATUS_CHANGE_DATE: values.STATUS_CHANGE_DATE,
  //       USER_SRNO: USER_SRNO,
  //       UT_SRNO: UT_SRNO,
  //       LOG_STATUS_SRNO: 0,
  //     };

  //     const response = await apiClient(`${API_BASE_URL}IuStatusLog`, "POST", payload);

  //     if (response.msgId === 200) {
  //       message.success("Issued successful!");
  //       setisStatusLogModalVisible(false);
  //       statusLog.resetFields();
  //       // add case statement for falg and call the appropriate function to refresh the table for M, P, S
  //       switch (flag) {
  //         case 'M':
  //           fetchMotherCoil('');
  //           break;
  //         case 'P':
  //           fetchSemiSlitted('');
  //           break;
  //         case 'S':
  //           fetchSlitted('');
  //           break;
  //         default:
  //           break;
  //       }
  //       // isMotherCoil ? fetchSemiSlitted() : fetchMotherCoil(); // Refresh the appropriate table
  //     } else {
  //     alert(response.msg)
  //       message.error(response.msg);
  //     }
  //   } catch (error: any) {
  //     alert(error)
  //     message.error(error.message);
  //   }
  // };

  // Handle modal Cancel button click
  const handleStatusLogCancel = () => {
    setisStatusLogModalVisible(false);
    statusLog.resetFields();
  };

  // Generate table columns
  const generateTableColumns = (flag: string) => {
    const baseColumns = [
      { title: "Challan No", dataIndex: "CHALLAN_NO", key: "CHALLAN_NO" },
      { title: "Material Width", dataIndex: "MATERIAL_WIDTH", key: "MATERIAL_WIDTH" },
      { title: "Material Weight", dataIndex: "MATERIAL_WEIGHT", key: "MATERIAL_WEIGHT" },
      { title: "Material Thickness", dataIndex: "MATERIAL_THICKNESS", key: "MATERIAL_THICKNESS" },
      { title: "Material Grade", dataIndex: "MATERIAL_GRADE", key: "MATERIAL_GRADE" },
      
      // { title: "is slitetd", dataIndex: "IS_RAW_SLITTED", key: "IS_RAW_SLITTED" },
    ];

    const baseColumns1 = [
      { title: "Challan No", dataIndex: "CHALLAN_NO", key: "CHALLAN_NO" },
      { title: "DC No", dataIndex: "DC_NO", key: "DC_NO" },
      { title: "Width", dataIndex: "WIDTH", key: "WIDTH" },
      { title: "Weight", dataIndex: "WEIGHT", key: "WEIGHT" },
      { title: "Thickness", dataIndex: "THICKNESS", key: "THICKNESS" },
      { title: "Grade", dataIndex: "GRADE", key: "GRADE" },
      { title: "Coil Type", dataIndex: "COIL_TYPE", key: "COIL_TYPE" },

    ];
    if (flag === 'F') {
      baseColumns1.splice(1, 0, { title: "Responsible Supervisor", dataIndex: "RESPONSIBLE_SUPERVISOR", key: "RESPONSIBLE_SUPERVISOR" });
      // baseColumns1.splice(1, 0, { title: "Shift", dataIndex: "WORKING_SHIFT", key: "WORKING_SHIFT" });
      baseColumns1.splice(1, 0, { title: "Operator", dataIndex: "WORKING_USER", key: "WORKING_USER" });
      baseColumns1.splice(1, 0, { title: "OD", dataIndex: "OD", key: "OD" });
      baseColumns1.splice(1, 0, { title: "Tube Mill", dataIndex: "STATUS_lOG_DESC", key: "STATUS_lOG_DESC" });
      baseColumns1.splice(1, 0, { title: "Issue Date", dataIndex: "STATUS_LOG_DATE_STR", key: "STATUS_LOG_DATE_STR" });
    }
    if (flag === 'M' || flag === 'P' || flag === 'S') {
      baseColumns.splice(1, 0, { title: "Location", dataIndex: "FROM_LOCATION", key: "FROM_LOCATION" });
    }
    if (flag === 'P' || flag === 'S' ) {
      baseColumns.splice(1, 0, { title: "DC No", dataIndex: "DC_NO", key: "DC_NO" });
    }
    
   
    

    const actionColumn = {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", gap: "8px" }}>
      {/* Shift */}
      <Tooltip title={record.IS_RAW_SLITTED === 'Y' ? "Material already slitted" : "Shift to another location"}>
      <Popconfirm
                     className=""
                     title="Shift to another location"
                     description="Are you sure to confirm?"
                     onConfirm={() =>  handleShift(record, flag)}
                    //  onCancel={cancel}
                     okText="Yes"
                     cancelText="No"
                   >
        <Button
          style={{
            backgroundColor: record.IS_RAW_SLITTED === 'Y' ? "#d9d9d9" : "#1890ff",
            borderColor: record.IS_RAW_SLITTED === 'Y' ? "#d9d9d9" : "#1890ff",
            color: "white",
            opacity: record.IS_RAW_SLITTED === 'Y' ? 0.5 : 1,
          }}
          // onClick={() =>}
          disabled={record.IS_RAW_SLITTED === 'Y'}
          icon={<SwapOutlined />}
        />
        </Popconfirm>
      </Tooltip>

      {/* Return */}
      <Tooltip title="Return material to supplier">
      <Popconfirm
                     className=""
                     title="Return material to supplier"
                     description="Are you sure to confirm?"
                     onConfirm={() =>   handleRowAction(flag=='M' ? record.MATERIAL_SRNO : record.SLITTING_SRNO,flag,'R')}
                    //  onCancel={cancel}
                     okText="Yes"
                     cancelText="No"
                   >
       <Button
          style={{
            backgroundColor: record.IS_RAW_SLITTED === 'Y' ? "#d9d9d9" : "#FFA500",
            borderColor: record.IS_RAW_SLITTED === 'Y' ? "#d9d9d9" : "#FFA500",
            color: "white",
            opacity: record.IS_RAW_SLITTED === 'Y' ? 0.5 : 1,
          }}
          // onClick={() => handleRowAction(flag=='M' ? record.MATERIAL_SRNO : record.SLITTING_SRNO,flag,'R')}
          disabled={record.IS_RAW_SLITTED === 'Y'}
          icon={<RetweetOutlined />}
        />
        </Popconfirm>
      </Tooltip>

      {/* Sell */}
      <Tooltip title="Sell material">
      <Popconfirm
                     className=""
                     title="Sell Material"
                     description="Are you sure to confirm?"
                     onConfirm={() =>   handleRowAction(flag=='M' ? record.MATERIAL_SRNO : record.SLITTING_SRNO,flag,'S')}
                    //  onCancel={cancel}
                     okText="Yes"
                     cancelText="No"
                   >
        <Button
          style={{
            backgroundColor: record.IS_RAW_SLITTED === 'Y' ? "#d9d9d9" : "#008000",
            borderColor: record.IS_RAW_SLITTED === 'Y' ? "#d9d9d9" : "#008000",
            color: "white",
            opacity: record.IS_RAW_SLITTED === 'Y' ? 0.5 : 1,
          }}
          // onClick={() => handleRowAction(flag=='M' ? record.MATERIAL_SRNO : record.SLITTING_SRNO,flag,'S')}
          disabled={record.IS_RAW_SLITTED === 'Y'}
          icon={<DollarCircleOutlined />}
        />
        </Popconfirm>
      </Tooltip>

      {/* Shift to Production */}
      <Tooltip title="Shift material to production">
      <Popconfirm
                     className=""
                     title="Shift material to production"
                     description="Are you sure to confirm?"
                    //  onConfirm={() =>   handleRowAction(flag=='M' ? record.MATERIAL_SRNO : record.SLITTING_SRNO,flag,'P')}
                     onConfirm={() =>   handleStatusLog(record, flag)}
                    //  onCancel={cancel}
                     okText="Yes"
                     cancelText="No"
                   >
        <Button
          style={{
            backgroundColor: record.IS_RAW_SLITTED === 'Y' ? "#d9d9d9" : "#800080",
            borderColor: record.IS_RAW_SLITTED === 'Y' ? "#d9d9d9" : "#800080",
            color: "white",
            opacity: record.IS_RAW_SLITTED === 'Y' ? 0.5 : 1,
          }}
          // onClick={() => handleRowAction(flag=='M' ? record.MATERIAL_SRNO : record.SLITTING_SRNO,flag,'P')}
          disabled={record.IS_RAW_SLITTED === 'Y'}
          icon={<BuildOutlined />}
        />
        </Popconfirm>
      </Tooltip>
    </div>
      ),
    };
   

    // Add action column to the base columns ONLY for Mother Coils AND SLITTED
    if (flag === 'M' || flag === 'S') {
      return [...baseColumns, actionColumn];
    }else if(flag === 'P'){
    return [...baseColumns];
    }
    else if(flag === 'F' || flag === 'R' || flag === 'O'){
      return [...baseColumns1];
    }
    else{
      return [...baseColumns];

    }
  };

  // Handle search form submit
  const handleSearch = () => {
    const searchFromValues = searchForm.getFieldsValue();
    const searchParam = {
      ...searchFromValues
    };
    // Handle undefined values
    Object.keys(searchParam).forEach(queryKey => {
      if (searchParam[queryKey] === undefined) {
      searchParam[queryKey] = '';
      }
    });
    // conveert it into query string USING FOREACH
    let queryString = '';
    Object.keys(searchParam).forEach(queryKey => {
      if (searchParam[queryKey]) {
        queryString += `${queryKey}=${searchParam[queryKey]}&`;
      }
    });

    if (activeTab === "SEMI_SLITTED") {
      fetchSemiSlitted(queryString);
    }else if(activeTab === "SLITTED"){
      fetchSlitted(queryString);
    }else if(activeTab === "MOTHER"){
      fetchMotherCoil(queryString);
    }else if (activeTab === "PRODUCTION"){
      fetchCoils('F', queryString);
    }else if (activeTab === "RETURNED"){
      fetchCoils('R', queryString);
    }else if (activeTab === "SOLD"){
      fetchCoils('O', queryString);
    }
  };


  // Handle tab change
  const onTabChange = (key: string) => {
    setActiveTab(key);
    // Handle undefined values
    const searchParam = searchForm.getFieldsValue();
    Object.keys(searchParam).forEach(queryKey => {
      if (searchParam[queryKey] === undefined) {
        searchParam[queryKey] = '';
      }
    });
    // conveert it into query string USING FOREACH
    let queryString = '';
    Object.keys(searchParam).forEach(queryKey => {
      if (searchParam[queryKey]) {
        queryString += `${queryKey}=${searchParam[queryKey]}&`;
      }
    });
    if (key === "SEMI_SLITTED") {
      fetchSemiSlitted(queryString);
    }else if(key === "SLITTED"){
      fetchSlitted(queryString);
    }else if(key === "MOTHER"){
      fetchMotherCoil(queryString);
    }else if (key === "PRODUCTION"){
      fetchCoils('F', queryString);
    }else if (key === "RETURNED"){
      fetchCoils('R', queryString);
    }else if (key === "SOLD"){  
      fetchCoils('O', queryString);
    }
      
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      if (activeTab == 'MOTHER') {
        exportToExcel(MotherData, "Mother Coils", generateTableColumns('M'), "Mother Coils");
      }else if (activeTab == 'SEMI_SLITTED') {
        exportToExcel(SemiSlittedData, "Semi-Slitted Coils", generateTableColumns('P'), "Semi-Slitted Coils");
        
      }else if (activeTab == 'SLITTED') {
        exportToExcel(SlittedData, "Slitted Coils", generateTableColumns('S'), "Slitted Coils");  
      }
      else if (activeTab == 'PRODUCTION') {
        exportToExcel(fetchCoilsData, "Production Coils", generateTableColumns('F'), "Production Coils");  
      }
      else if (activeTab == 'RETURNED') {
        exportToExcel(fetchCoilsData, "Return Coils", generateTableColumns('R'), "Return Coils");  
      } 
      else if (activeTab == 'SOLD') {
        exportToExcel(fetchCoilsData, "Sold Coils", generateTableColumns('O'), "Sold Coils");  
      }

    } catch (error: any) {
      console.error("Error exporting data:", error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Material Shift">
      <div>
      {/* Search Fields Inside the Tab */}
      <Form layout="inline" style={{ marginBottom: 16 }} onFinish={handleSearch} form={searchForm} 
//      hidden={activeTab === "PRODUCTION" || activeTab === "RETURNED" || activeTab === "SOLD"}
      >
        <Form.Item name="CHALLAN_NO">
          <Input placeholder="Challan No" />
        </Form.Item>
        <Form.Item name="REG_DATE_FROM">
          <Input type="date" placeholder="Date From" />
        </Form.Item>
        <Form.Item name="REG_DATE_TO">
          <Input type="date" placeholder="Date To" />
        </Form.Item>
        <Form.Item name={['C_LOCATION']} style={{ marginBottom: 8 }}
        hidden={activeTab === "PRODUCTION" || activeTab === "RETURNED" || activeTab === "SOLD"}
        >
                          <Select 
                          showSearch
                          placeholder="Select Location" 
                          options={optVendors} 
                          filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
                          allowClear
                          />
                        </Form.Item>
        
                        <Form.Item name={['GRADE_SRNO']} style={{ marginBottom: 8 }}>
                          <Select 
                          showSearch 
                          placeholder="Select Grade" 
                          options={optGrades} 
                          filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
                          allowClear
                          />
                        </Form.Item>
        
        
                        <Form.Item name={['THICNESS_SRNO']} style={{ marginBottom: 8 }}>
                          <Select 
                          showSearch 
                          placeholder="Select Thickness" 
                          options={optThickNess} 
                          filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
                          allowClear
                          />
                        </Form.Item>

                        <Form.Item name={['SLITTED_WIDTH']} style={{ marginBottom: 8 }}
        hidden={activeTab != "SLITTED"}
        >
          <Input placeholder="Width" />

                        </Form.Item>

                        <Form.Item name={['TUBE_MILL_SRNO']} style={{ marginBottom: 8 }}
                          hidden={activeTab != "PRODUCTION"} > 
                          <Select 
                          showSearch
                          placeholder="Select Tube Mill" 
                          options={optTubeMachines} 
                          filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
                          allowClear
                          />
                        </Form.Item>
                          <Form.Item name={['WORKING_USER']} style={{ marginBottom: 8 }}
                          hidden={activeTab != "PRODUCTION"} > 
                          <Select 
                          showSearch
                          placeholder="Select Operator" 
                          options={optWorkingUsers} 
                          filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
                          allowClear
                          />
                        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
        Search
          </Button>
        </Form.Item>
      </Form>

      {/* Table */}
      {/* <Spin spinning={loading}>
        <Table dataSource={filteredData[key]} columns={generateTableColumns(columnType)} pagination={false} />
      </Spin> */}
    </div>

      <Tabs activeKey={activeTab} onChange={onTabChange}
      tabBarExtraContent={
        <Button type="primary" 
        onClick={handleExport} icon={<DownloadOutlined />}
        
        >
          Export
        </Button>
      }  >
        <TabPane tab="Mother Coils" key="MOTHER">
          <Spin spinning={loading}>
            <Table dataSource={MotherData} columns={generateTableColumns('M')}  />
          </Spin>
        </TabPane>
        <TabPane tab="Semi-Slitted Coils" key="SEMI_SLITTED">
          <Spin spinning={loading}>
            <Table dataSource={SemiSlittedData} columns={generateTableColumns('P')} />
          </Spin>
        </TabPane>
        <TabPane tab="Slitted Coils" key="SLITTED">
          <Spin spinning={loading}>
            <Table dataSource={SlittedData} columns={generateTableColumns('S')}  />
          </Spin>
        </TabPane>
        <TabPane tab="Production Coils" key="PRODUCTION">
          <Spin spinning={loading}>
            <Table dataSource={fetchCoilsData} columns={generateTableColumns('F')}  />
          </Spin>
        </TabPane>
        <TabPane tab="Return Coils" key="RETURNED">
          <Spin spinning={loading}>
            <Table dataSource={fetchCoilsData} columns={generateTableColumns('R')}  />
          </Spin>
        </TabPane>
        <TabPane tab="Sold Coils" key="SOLD">
          <Spin spinning={loading}>
            <Table dataSource={fetchCoilsData} columns={generateTableColumns('O')}  />
          </Spin>
        </TabPane>
      </Tabs>

 {/* Modal for Status */}
      {false && (<ModalMoveCoilProd setisStatusLogModalVisible={setisStatusLogModalVisible} isMoOpen={true} selectedMaterial={selectedMaterial} fetchMotherCoil={fetchMotherCoil}  fetchSlitted={fetchSlitted} ></ModalMoveCoilProd>)}
  <Modal
        title="Issue Coil"
        open={isStatusLogModalVisible}
        footer={null}
        onCancel={handleStatusLogCancel}
        width={800} // Increase the modal width
      >
        {selectedMaterial && (
          <div style={{ marginBottom: 16, maxHeight: 200, overflowY: 'auto' }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Challan No">{selectedMaterial.CHALLAN_NO}</Descriptions.Item>
              <Descriptions.Item label="Material Width">{selectedMaterial.MATERIAL_WIDTH} mm</Descriptions.Item>
              <Descriptions.Item label="Material Weight">{selectedMaterial.MATERIAL_WEIGHT} kg</Descriptions.Item>
              <Descriptions.Item label="Material Thickness">{selectedMaterial.MATERIAL_THICKNESS} mm</Descriptions.Item>
              <Descriptions.Item label="Material Grade">{selectedMaterial.MATERIAL_GRADE}</Descriptions.Item>
              <Descriptions.Item label="From Location">{selectedMaterial.FROM_LOCATION}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
        <Form form={statusLog} layout="vertical" onFinish={handleStatusLogOk} >
          <Row gutter={16}>
            <Col span={12} hidden>
              <Form.Item
          label="Tube Mill"
          name="DESCRIPTION"
          rules={[{ required: false, message: "Please Enter Tube Mill" }]}
              >
          <Input placeholder="Tube Mill
          " />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tube Mill"
                name="MACHINE_SRNO"
                rules={[{ required: true, message: "Select Tube Machine" }]}
              >
                <Select 
                    showSearch 
                    placeholder="Select Tube Machine" 
                    options={optTubeMachines} 
                    filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
                    allowClear
                />
              </Form.Item>
            </Col>
                <Col span={12}>
              <Form.Item
                label="OD"
                name="OD_SRNO"
                rules={[{ required: false, message: "Select OD" }]}
              >
                <Select 
                    showSearch 
                    placeholder="Select OD" 
                    options={optODs} 
                    filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
                    allowClear
                />
              </Form.Item>
            </Col>
             <Col span={8}>
              <Form.Item
                label="Operator"
                name="WORKING_USER"
                rules={[{ required: false, message: "Select Operator" }]}
              >
                <Select 
                    showSearch 
                    placeholder="Select Operator" 
                    options={optWorkingUsers} 
                    filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
                    allowClear
                />
              </Form.Item>
            </Col>
             <Col span={8} hidden>
              <Form.Item
                label="Shift Name"
                name="WORKING_SHIFT"
                rules={[{ required: false, message: "Select shift name" }]}
              >
                <Select 
                    showSearch 
                    placeholder="Select Working Shift" 
                    options={optWorkingShifts} 
                    filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
                    allowClear
                />
              </Form.Item>
            </Col>
             <Col span={8}>
              <Form.Item
                label="Responsible Supervisor"
                name="RESPONSIBLE_SUPERVISOR"
                rules={[{ required: false, message: "Select responsible supervisor" }]}
              >
                <Select 
                    showSearch 
                    placeholder="Select Responsible Supervisor" 
                    options={optResponsibleSupervisors} 
                    filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
                    allowClear
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
          label="Issue Date"
          name="STATUS_CHANGE_DATE"
          rules={[{ required: true, message: "Please select the issue date!" }]}
              >
          <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="Remarks"
            name="REMARKS"
            rules={[{ required: false, message: "Please enter the Reamrk!" }]}
          >
            <TextArea placeholder="Remark" autoSize={{ minRows: 3, maxRows: 5 }} />
          </Form.Item>
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

      {/* Modal for shifting material */}
      <Modal
        title="Shift Material"
        open={isModalVisible}
        footer={null}
        onCancel={handleCancel}
        width={800} // Increase the modal width
      >
        {selectedMaterial && (
          <div style={{ marginBottom: 16, maxHeight: 200, overflowY: 'auto' }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Challan No">{selectedMaterial.CHALLAN_NO}</Descriptions.Item>
              <Descriptions.Item label="Material Width">{selectedMaterial.MATERIAL_WIDTH} mm</Descriptions.Item>
              <Descriptions.Item label="Material Weight">{selectedMaterial.MATERIAL_WEIGHT} kg</Descriptions.Item>
              <Descriptions.Item label="Material Thickness">{selectedMaterial.MATERIAL_THICKNESS} mm</Descriptions.Item>
              <Descriptions.Item label="Material Grade">{selectedMaterial.MATERIAL_GRADE}</Descriptions.Item>
              <Descriptions.Item label="From Location">{selectedMaterial.FROM_LOCATION}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={handleOk} >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
          label="To Location"
          name="TO_LOCATION"
          rules={[{ required: true, message: "Please select the destination location!" }]}
              >
          <Select
            showSearch
            placeholder="Select"
            options={optVendors}
            filterOption={(input:any, option:any) =>
              option?.label.toLowerCase().includes(input.toLowerCase())
            }
          />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
          label="Shift Date"
          name="SHIFT_DATE"
          rules={[{ required: true, message: "Please select the shift date!" }]}
              >
          <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="Shift Reason"
            name="SHIFT_REASON"
            rules={[{ required: false, message: "Please enter the Shift Reason!" }]}
          >
            <TextArea placeholder="Shift Reason" autoSize={{ minRows: 3, maxRows: 5 }} />
          </Form.Item>
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
    </Card>
  );
};

export default RawMaterialsShiftHis;
