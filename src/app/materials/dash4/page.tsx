"use client"
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { Form, Input, Button, InputNumber, DatePicker, Modal, message, Row, Col, Select, notification, Space } from 'antd';
import { PlusCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { apiClient } from '@/utils/apiClient';
import { getCookieData, getSelectedText } from '@/utils/common';
import RawMaterialsStatus from '@/app/components/rawMaterialsStatus';

//MAIN COMPONENT
const RawMaterialDashboard = () => {
  // Define the interface for raw material and slitting data
  interface RawMaterial {
    key: number;
    CHALLAN_NO: string;
    RECEIVED_DATE: string;
    MATERIAL_GRADE: string;
    MATERIAL_GRADE_SRNO: number;
    MATERIAL_C_LOCATION: string;
    MATERIAL_C_LOCATION_SRNO: number;
    MATERIAL_THICKNESS: string;
    MATERIAL_THICKNESS_SRNO: number;
    MATERIAL_WIDTH: number;
    MATERIAL_WEIGHT: number;
    remainingWeight: number;
    remainingWidth: number;
    MATERIAL_SRNO: number;
    MATERIAL_SCRAP: Number;
    SLIT_MATERIAL_SCRAP: Number
  }
  // interface for slitting data
  interface SlitMaterial {
    key: number;
    DC_NO: string;
    IS_SLITTED: Boolean;
    MATERIAL_SRNO: number;
    SLITTING_DATE: string;
    SLITTING_LEVEL: Number;
    SLITTING_SHIFT_TO: string;
    SLITTING_SHIFT_TO_SRNO: string;
    SLITTING_GRADE: string;
    SLITTING_THICKNESS: string;
    SLITTING_WIDTH: number;
    SLITTING_WEIGHT: number;
    remainingWeight: number;
    remainingWidth: number;
    SLITTING_SRNO_FK: number;
    SLITTING_SRNO: number;
    SLITTING_SCRAP: number;
    children?: SlitMaterial[];
  }
  // Define the state for raw materials and slitting data
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [slittingData, setslittingData] = useState<SlitMaterial[]>([]);
  const [form] = Form.useForm();
  const [slitForm] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [isRawMaterialEdit, setIsRawMaterialEdit] = useState(false);
  const [isSlitMaterialEdit, setIsSlitMaterialEdit] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | SlitMaterial | null>(null);
  // state for grade options with interface
  const [optGrades, setOptGrades] = useState<{ label: string; value: string }[]>([]);
  const [optThickNess, setoptThickNess] = useState<{ label: string; value: string }[]>([]);
  const [optVendors, setOptVendors] = useState<{ label: string; value: string }[]>([]);
  const cookiesData = getCookieData();
  const { USER_SRNO, API_BASE_URL, UT_SRNO } = cookiesData;

  // useEffect to fetch common dropdown options and raw materials
  React.useEffect(() => {
    FetchPlCommon();
    FetchRawMaterials();
  }, []);

  React.useEffect(() => {
    if (isRawMaterialEdit) {
      if (selectedMaterial && 'RECEIVED_DATE' in selectedMaterial) {
        form.setFieldsValue({
          ...selectedMaterial,
          RECEIVED_DATE: dayjs(selectedMaterial.RECEIVED_DATE), // Format date if required
        });
      }
    }
  }, [isRawMaterialEdit]);
  React.useEffect(() => {
    if (isSlitMaterialEdit) {
      if (selectedMaterial && 'SLITTING_DATE' in selectedMaterial) {
        slitForm.setFieldsValue({
          ...selectedMaterial,
          SLITTING_DATE: dayjs(selectedMaterial.SLITTING_DATE), // Format date if required
        });
      }
    }
  }, [isSlitMaterialEdit]);
  // Function to fetch common dropdown options
  const FetchPlCommon = async () => {
    const response = await apiClient<Record<string, any>>(`${API_BASE_URL}Pl_Common?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&TBL_SRNO=1,3,4`, 'GET');
    if (response.msgId === 200) {
      if (!response.data) { return; }
      const { Table1, Table3, Table4 } = response.data;
      setOptGrades(Table1)
      setoptThickNess(Table3)
      setOptVendors(Table4)
    } else {
      message.error(response.msg)
      console.error('API Error:', response.msg);  // Logging the error message
    }
  };

  // Function to update slitted status
  const updateSlittedStatus = async (id: number) => {
    try {
      const response = await apiClient(`${API_BASE_URL}UpdateIsSlitted?USER_SRNO=${USER_SRNO}&SLITTING_SRNO=${id}`, 'GET');
      if (response.msgId === 200) {
        message.success('Slitted Done!');
        // Find the record by SLITTING_SRNO and set IS_SLITTED to true
        const updatedData = [...slittingData]; // Assuming slittingData is a state
        const record = updatedData.find((item) => item.SLITTING_SRNO === id);
        if (record) {
          record.IS_SLITTED = true;
          setslittingData(updatedData); // Update state to re-render table
        }

      } else {
        message.error(`Error: ${response.msg}`);
      }
    } catch (error) {
      console.error('Error adding raw material:', error);
      message.error('Failed to add raw material');
    }
  };


  //  fUNCTION TO FETCH RAW MATERIALS
  const FetchRawMaterials = async () => {
    try {
      const response = await apiClient(`${API_BASE_URL}DtRawMaterial`, 'GET');
      if (response.msgId === 200) {
        if (!response.data) { return; }
        const RAW_MATERIALS_DATA = response.data.Table.map((material: any, index: number) => ({
          key: material.MATERIAL_SRNO,
          CHALLAN_NO: material.CHALLAN_NO,
          RECEIVED_DATE: material.RECEIVED_DATE,
          MATERIAL_GRADE: material.MATERIAL_GRADE,
          MATERIAL_C_LOCATION: material.MATERIAL_C_LOCATION,
          MATERIAL_THICKNESS: material.MATERIAL_THICKNESS,
          MATERIAL_WIDTH: material.MATERIAL_WIDTH,
          MATERIAL_WEIGHT: material.MATERIAL_WEIGHT,
          MATERIAL_SCRAP: material.MATERIAL_SCRAP,
          SLIT_MATERIAL_SCRAP: material.SLIT_MATERIAL_SCRAP,
          // remainingWeight: material.WEIGHT,
          // remainingWidth: material.MATERIAL_WIDTH,
          MATERIAL_SRNO: material.MATERIAL_SRNO,
          MATERIAL_THICKNESS_SRNO : material.MATERIAL_THICKNESS_SRNO,
          MATERIAL_GRADE_SRNO : material.MATERIAL_GRADE_SRNO,
          MATERIAL_C_LOCATION_SRNO : material.MATERIAL_C_LOCATION_SRNO,
          MATERIAL_STATUS : material.MATERIAL_STATUS,
        }));

        setslittingData(response.data.Table1)
        setRawMaterials(RAW_MATERIALS_DATA);
      } else {
        message.error(response.msg)
        console.error('API Error:', response.msg);  // Logging the error message
      }
    } catch (error: any) {
      console.error('Error fetching raw materials:', error);
      message.error(error.message);
    }
  };
  // Function to handle reset rawmateril
  const handleResetRawMaterial = () =>{
    form.resetFields();
    setIsRawMaterialEdit(false)
    setSelectedMaterial(null)
  }

  // Adjusted function to handle adding raw material with API request
  const handleAddRawMaterial = async (values: any) => {
    let MATERIAL_STATUS_SRNO = 0;
    
    try {
      if (selectedMaterial && selectedMaterial.MATERIAL_SRNO > 0 && 'CHALLAN_NO' in selectedMaterial) {
        if (Number(values.MATERIAL_WIDTH) == Number(selectedMaterial?.remainingWidth) + Number(selectedMaterial?.MATERIAL_SCRAP)) {
          MATERIAL_STATUS_SRNO = 4; // New
        } else if (Number(values.MATERIAL_WIDTH) > Number(selectedMaterial?.remainingWidth) + Number(selectedMaterial?.MATERIAL_SCRAP)) {
          MATERIAL_STATUS_SRNO = 5; // IN SLITTING PROCESS
        } else if (Number(selectedMaterial?.remainingWidth) == 0 && Number(values.MATERIAL_WIDTH) > 0) {
          MATERIAL_STATUS_SRNO = 10; // COMPLETED
        }
      } else {
        MATERIAL_STATUS_SRNO = 4; // New
      }
      
      const payload = {
        IU_FLAG: values.MATERIAL_SRNO > 0 ? 'U': 'I', // For insert
        MATERIAL_SRNO: values.MATERIAL_SRNO || null, // To be generated by the database
        MATERIAL_C_LOCATION: values.MATERIAL_C_LOCATION_SRNO || null , // Example: replace with actual vendor ID
        MATERIAL_GRADE: values.MATERIAL_GRADE_SRNO || 0,
        MATERIAL_WIDTH: values.MATERIAL_WIDTH || 0,
        MATERIAL_THICKNESS: values.MATERIAL_THICKNESS_SRNO || 0,
        MATERIAL_WEIGHT: values.MATERIAL_WEIGHT || 0,
        CHALLAN_NO: values.CHALLAN_NO || null,
        RECEIVED_DATE: values.RECEIVED_DATE.format('YYYY-MM-DD') || null,
        MATERIAL_SCRAP: values.MATERIAL_SCRAP || null,
        MATERIAL_STATUS_SRNO: MATERIAL_STATUS_SRNO, //New
        USER_SRNO: 1, // Example: replace with actual user ID
        // MATERIAL_SRNO: 0, // Example: replace with actual user ID
      }
      const response = await apiClient(`${API_BASE_URL}IuRawMaterial`, 'POST', payload);
      if (response.msgId === 200) {
        if (values.MATERIAL_SRNO > 0) {
          message.success('Raw material Updated successfully!');
          setRawMaterials(rawMaterials.map((material) =>
            material.MATERIAL_SRNO === values.MATERIAL_SRNO
              ? {
            ...material,
            CHALLAN_NO: values.CHALLAN_NO,
            RECEIVED_DATE: values.RECEIVED_DATE.format('YYYY-MM-DD'),
            MATERIAL_GRADE: getSelectedText(values.MATERIAL_GRADE_SRNO, optGrades),
            MATERIAL_C_LOCATION: getSelectedText(values.MATERIAL_C_LOCATION_SRNO, optVendors),
            MATERIAL_THICKNESS: getSelectedText(values.MATERIAL_THICKNESS_SRNO, optThickNess),
            MATERIAL_WIDTH: values.MATERIAL_WIDTH,
            MATERIAL_WEIGHT: values.MATERIAL_WEIGHT,
            MATERIAL_THICKNESS_SRNO: values.MATERIAL_THICKNESS_SRNO,
            MATERIAL_GRADE_SRNO: values.MATERIAL_GRADE_SRNO,
            MATERIAL_C_LOCATION_SRNO: values.MATERIAL_C_LOCATION_SRNO,
          }
              : material
          ));
        } else {
          message.success('Raw material Added successfully!');
          setRawMaterials([...rawMaterials, {
            key: rawMaterials.length + 1,
            CHALLAN_NO: values.CHALLAN_NO,
            RECEIVED_DATE: values.RECEIVED_DATE.format('YYYY-MM-DD'),
            MATERIAL_GRADE: getSelectedText(values.MATERIAL_GRADE_SRNO, optGrades),
            MATERIAL_C_LOCATION: getSelectedText(values.MATERIAL_C_LOCATION_SRNO, optVendors),
            MATERIAL_THICKNESS: getSelectedText(values.MATERIAL_THICKNESS_SRNO, optThickNess),
            MATERIAL_WIDTH: values.MATERIAL_WIDTH,
            MATERIAL_WEIGHT: values.MATERIAL_WEIGHT,
            remainingWeight: 0,
            remainingWidth: 0,
            MATERIAL_SCRAP: 0,
            SLIT_MATERIAL_SCRAP: 0,
            MATERIAL_SRNO: response.data.Table[0].MATERIAL_SRNO, 
            MATERIAL_THICKNESS_SRNO: values.MATERIAL_THICKNESS_SRNO,
            MATERIAL_GRADE_SRNO: values.MATERIAL_GRADE_SRNO,
            MATERIAL_C_LOCATION_SRNO: values.MATERIAL_C_LOCATION_SRNO,
          }]);
        }
        handleResetRawMaterial();
      } else {
        message.error(`Error: ${response.msg}`);
      }
    } catch (error) {
      console.error('Error adding raw material:', error);
      message.error('Failed to add raw material');
    }
  };

  // Adjusted function to handle slitting operation with API request
  const handleSlitMaterial = async (values: any) => {
    if (!selectedMaterial) return;
    try {
      debugger
      if (values.SLITTING_SRNO > 0) {
        let SLITTING_STATUS_SRNO = 0;
        if ('DC_NO' in selectedMaterial) {
          if (Number(values.SLITTING_WIDTH) == Number(selectedMaterial?.remainingWidth) + Number(selectedMaterial?.SLITTING_SCRAP)) {
            SLITTING_STATUS_SRNO = 4; // New
          } else if (Number(values.SLITTING_WIDTH) > Number(selectedMaterial?.remainingWidth) + Number(selectedMaterial?.SLITTING_SCRAP)) {
            SLITTING_STATUS_SRNO = 5; // IN SLITTING PROCESS
          } else if (Number(selectedMaterial?.remainingWidth) == 0 && Number(values.SLITTING_WIDTH) > 0) {
            SLITTING_STATUS_SRNO = 10; // COMPLETED
          }
        }
        const payload = {
          IU_FLAG: 'U', // For insert
        MATERIAL_SRNO: values.MATERIAL_SRNO, 
        SLITTING_SRNO: values.SLITTING_SRNO, 
        SLITTING_SRNO_FK: values.SLITTING_SRNO_FK, 
        C_LOCATION: values.SLITTING_SHIFT_TO_SRNO,
        SLITTING_LEVEL: values.SLITTING_LEVEL,
        SLITTING_DATE: values.SLITTING_DATE.format('YYYY-MM-DD'),
        SLITTING_WIDTH: values.SLITTING_WIDTH,
        SLITTING_WEIGHT: values.SLITTING_WEIGHT,
        DC_NO: values.DC_NO,
        STATUS_SRNO: SLITTING_STATUS_SRNO,
        SLITTING_SCRAP: values.SLITTING_SCRAP,
        USER_SRNO: USER_SRNO,
        }
        const response = await apiClient(`${API_BASE_URL}IuRawSlit`, 'POST', payload);
        if (response.msgId === 200) {
          message.success('Material slit Updated successfully!');
          slitForm.resetFields();
          FetchRawMaterials();
          setModalVisible(false);
          setIsSlitMaterialEdit(false)
          setSelectedMaterial(null)
        } else {
          message.error(response.msg);
        }
      }else{
      
      const payload = {
        IU_FLAG: 'I', // For insert
        MATERIAL_SRNO: selectedMaterial.MATERIAL_SRNO, 
        SLITTING_SRNO_FK: values.SLITTING_SRNO_FK, 
        SLITTING_LEVEL: values.SLITTING_LEVEL,
        SLITTING_DATE: values.SLITTING_DATE.format('YYYY-MM-DD'),
        DC_NO: values.DC_NO,
        C_LOCATION: values.SLITTING_SHIFT_TO_SRNO,
        SCRAP: values.SLITTING_SCRAP,
        STATUS_SRNO: 4,
        USER_SRNO: USER_SRNO,
        SlitDetails: values.SLITTING_DTL,
      }
      const response = await apiClient(`${API_BASE_URL}IuRawSlitArr`, 'POST', payload);
      if (response.msgId === 200) {
        message.success('Material slitted successfully!');
        slitForm.resetFields();
        FetchRawMaterials();
        setModalVisible(false);
      } else {
        message.error(response.msg);
      }
    }
    } catch (error) {
      console.error('Error slitting raw material:', error);
      message.error('Failed to slit material');
    }
  };

  // function setSlitingLevvel
  const setSlitingLevvel = (record: any) => {
    slitForm.setFieldsValue({
      MATERIAL_SRNO: record.MATERIAL_SRNO,
      SLITTING_SRNO_FK: record.SLITTING_SRNO,
      SLITTING_LEVEL: record.SLITTING_LEVEL + 1,
    });
  };
// get location from material
  const getLocation = (material: any) =>
    'MATERIAL_C_LOCATION' in material
      ? material.MATERIAL_C_LOCATION
      : ('C_LOCATION' in material
        ? material.C_LOCATION
        : 'N/A');

        const getValueFromText = (text:any, options :any) => {
          const option = options.find((opt:any) => opt.text === text);
          return option ? option.value : null;
        };

return (
    <div style={{ padding: '20px' }}>
      {/* <h1>Raw Material Dashboard</h1> */}

      <Form
        form={form}
        layout="horizontal"
        onFinish={handleAddRawMaterial}
        onReset={handleResetRawMaterial}
        style={{ marginBottom: '20px' }}
        >
        {/* {JSON.stringify(selectedMaterial)} */}
         {/* Hidden Controls */}
         <Form.Item name="MATERIAL_SRNO" initialValue={0} hidden>
            <Input />
          </Form.Item>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="CHALLAN_NO" label="Challan No" rules={[{ required: true, message: 'Please enter challan number' }]}>
              <Input placeholder="Enter Challan No" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="RECEIVED_DATE" label="Date" rules={[{ required: true, message: 'Please select date' }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="MATERIAL_GRADE_SRNO" label="Grade" rules={[{ required: true, message: 'Please select grade' }]}>
              <Select showSearch placeholder="Select Grade" options={optGrades} filterOption={(input: any, option: any) =>
                option?.label.toLowerCase().includes(input.toLowerCase())
              }></Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="MATERIAL_C_LOCATION_SRNO" label="Shift To" rules={[{ required: true, message: 'Please select Shift to' }]}>
              <Select
                showSearch
                placeholder="Select"
                options={optVendors}
                filterOption={(input: any, option: any) =>
                  option?.label.toLowerCase().includes(input.toLowerCase())
                }
              ></Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={5}>
            <Form.Item name="MATERIAL_THICKNESS_SRNO" label="Thickness (mm)" rules={[{ required: true, message: 'Select Thickness' }]}>
              <Select showSearch placeholder="Select Thickness" options={optThickNess} filterOption={(input: any, option: any) =>
                option?.label.toLowerCase().includes(input.toLowerCase())
              }></Select>
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item name="MATERIAL_WIDTH" label="Width (mm)"
             rules={[{ required: true, message: 'Please Enter Width' },
              {
                validator: (_, value) => {
                 
                  if (value > 0) {
                    
                  const MATERIAL_SCRAP = Number(form.getFieldValue('MATERIAL_SCRAP')) || 0;
                  if (!(selectedMaterial && ('MATERIAL_SCRAP' in selectedMaterial) && ('MATERIAL_WIDTH' in selectedMaterial ))) {
                    return Promise.resolve();
                  }
                  const slittedWidth = Number(selectedMaterial.MATERIAL_WIDTH) - Number(selectedMaterial.remainingWidth) - Number(selectedMaterial.MATERIAL_SCRAP);

                  return value < Number(slittedWidth + MATERIAL_SCRAP)
                    ? Promise.reject(
                        `Width cannot be less than the sum of used width (${slittedWidth}) and scrap (${MATERIAL_SCRAP}) = ${Number(slittedWidth + MATERIAL_SCRAP)}.`
                      )
                    : Promise.resolve();
                  }
                  else{
                    return Promise.resolve();
                  }
                },
              },
            ]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="Enter Width" 
               onChange={(value: any) => {
                if (!selectedMaterial || !isRawMaterialEdit) return;
                debugger
                const calculatedWeight = selectedMaterial && 'MATERIAL_WIDTH' in selectedMaterial
                  ? ((value / Number(selectedMaterial.MATERIAL_WIDTH)) * Number(selectedMaterial.MATERIAL_WEIGHT)).toFixed(2)
                  : ((value / Number(selectedMaterial.SLITTING_WIDTH)) * Number(selectedMaterial.SLITTING_WEIGHT)).toFixed(2);

                // Update only the current weight field
                // slittingDetails[name] = {
                //   ...slittingDetails[name],
                //   SLITTING_WEIGHT: parseFloat(calculatedWeight),
                // };
                form.setFieldsValue({ MATERIAL_WEIGHT: parseFloat(calculatedWeight) });
              }}
              />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item name="MATERIAL_WEIGHT" label="Weight (kg)" rules={[{ required: true, message: 'Please enter weight' }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="Enter Weight" 
              disabled={!!(isRawMaterialEdit && selectedMaterial && ('IS_SEMI_SLITTED' in selectedMaterial) && selectedMaterial.IS_SEMI_SLITTED)} />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item name="MATERIAL_SCRAP" label="Scrap (mm)" rules={[{ required: false, message: 'Please enter scrap' }]} 
            hidden={!(isRawMaterialEdit && selectedMaterial && ('IS_SEMI_SLITTED' in selectedMaterial) && selectedMaterial.IS_SEMI_SLITTED)}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="Enter scrap" 
              />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Button type="primary" htmlType="submit">{isRawMaterialEdit ? 'Update' : "Add"}  Material</Button>
          </Col>
          <Col span={1}>
            <Button type="primary" htmlType="reset">Reset</Button>
          </Col>
        </Row>
        <Row>

        </Row>
      </Form>

      <RawMaterialsStatus mainTableData={rawMaterials} slittingData={slittingData} setSlitingLevvel={setSlitingLevvel} setSelectedMaterial={setSelectedMaterial} setModalVisible={setModalVisible} updateSlittedStatus={updateSlittedStatus} setIsRawMaterialEdit={setIsRawMaterialEdit} setIsSlitMaterialEdit={setIsSlitMaterialEdit} />
      <Modal
        title={isSlitMaterialEdit ? 'Edit Slit Material' : 'Slit Material'}
        open={modalVisible}
        onCancel={() => {
          setSelectedMaterial(null)
          setIsSlitMaterialEdit(false)
          slitForm.resetFields();
          setModalVisible(false);
          handleResetRawMaterial()
        }}
        footer={null}
        bodyStyle={{ padding: '24px 32px' }}
        centered
      >
        {/* Display selected material details only at the time slitting */} 
        {!isSlitMaterialEdit &&  ( 
          <>
            {selectedMaterial && 'CHALLAN_NO' in selectedMaterial && (
              <div style={{ marginBottom: 16 }}>
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <strong>Challan No:</strong> {selectedMaterial.CHALLAN_NO}
                  </Col>
                  <Col span={12}>
                    <strong>Material Width:</strong> {selectedMaterial.MATERIAL_WIDTH} mm
                  </Col>
                  <Col span={12}>
                    <strong>Material Weight:</strong> {selectedMaterial.MATERIAL_WEIGHT} kg
                  </Col>
                  <Col span={12}>
                    <strong>Material Thickness:</strong> {selectedMaterial.MATERIAL_THICKNESS} mm
                  </Col>
                  <Col span={12}>
                    <strong>Material Grade:</strong> {selectedMaterial.MATERIAL_GRADE}
                  </Col>
                  <Col span={12}>
                    <strong>Current Location:</strong> {getLocation(selectedMaterial)}
                  </Col>
                </Row>
              </div>
            )}
            {selectedMaterial && 'DC_NO' in selectedMaterial && (
              <div style={{ marginBottom: 16 }}>
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <strong>DC No:</strong> {selectedMaterial.DC_NO}
                  </Col>
                  <Col span={12}>
                    <strong>Material Width:</strong> {selectedMaterial.SLITTING_WIDTH} mm
                  </Col>
                  <Col span={12}>
                    <strong>Material Weight:</strong> {selectedMaterial.SLITTING_WEIGHT} kg
                  </Col>
                  <Col span={12}>
                    <strong>Current Location:</strong> {getLocation(selectedMaterial)}
                  </Col>
                </Row>
              </div>
            )}
       
        </>
        )}
        {/* {selectedMaterial in json} */}
        {/* {selectedMaterial && 'DC_NO' in selectedMaterial && selectedMaterial.SLITTING_WIDTH -selectedMaterial.remainingWidth - selectedMaterial.SLITTING_SCRAP } */}
        <Form
          layout="vertical"
          form={slitForm}
          initialValues={{
            SLITTING_LEVEL: 1,
            MATERIAL_SRNO: 0,
            SLITTING_DTL: [{ SLITTING_WIDTH:'' , SLITTING_WEIGHT: '', nos: '' }], // Minimum 1 field
          }}
          onFinish={handleSlitMaterial}
        >
          {/* Hidden Controls */}
          <Form.Item name="MATERIAL_SRNO" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="SLITTING_SRNO" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="SLITTING_SRNO_FK" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="SLITTING_LEVEL" hidden>
            <Input />
          </Form.Item>


          {/* <Form.Item
          name="SLITTING_DATE"
          label="Date"
          rules={[{ required: true, message: 'Please select date' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            // disabledDate={(current) => current && current < Date.now()}
          />
        </Form.Item> */}

          {/* Date Picker */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="SLITTING_DATE"
                label="Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                // disabledDate={(current) => current && current < Date.now()}
                />
              </Form.Item>



            </Col>
            <Col span={12}>

              <Form.Item
                name="SLITTING_SHIFT_TO_SRNO"
                label="Shift To"
                rules={[{ required: true, message: 'Please enter DC number' }]}
              >
                <Select
                  showSearch
                  placeholder="Select"
                  options={optVendors}
                  filterOption={(input: any, option: any) =>
                    option?.label.toLowerCase().includes(input.toLowerCase())
                  }
                ></Select>
              </Form.Item>

            </Col>
          </Row>
          {/* Other Fields */}




          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="DC_NO"
                label="DC No"
                rules={[{ required: true, message: 'Please enter DC number' }]}
              >
                <Input placeholder="Enter DC No" />
              </Form.Item>
            </Col>
            <Col span={12}>

              <Form.Item
                name="SLITTING_SCRAP"
                label="Scrap"
                rules={[{ required: false, message: 'Please Enter Scrap' }]}
              >
                <Input placeholder="Enter Scrap" />
              </Form.Item>
            </Col>
          </Row>
          {isSlitMaterialEdit && selectedMaterial && 'DC_NO' in selectedMaterial && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="SLITTING_WIDTH"
                label="Width"
                rules={[{ required: true, message: 'Please Enter Width' },
                  {
                    validator: (_, value) => {
                      // const slittedWidth = selectedMaterial?.SLITTING_WIDTH - selectedMaterial.remainingWidth - selectedMaterial.SLITTING_SCRAP;
                      // return  value < Number(slittedWidth - selectedMaterial.SLITTING_SCRAP)
                      //   ? Promise.reject(`Width cannot less of used width (${slittedWidth}) + Scrap (${selectedMaterial?.SLITTING_SCRAP}) = ${Number(slittedWidth + selectedMaterial.SLITTING_SCRAP)} `)
                      //   : Promise.resolve();
                      if (value > 0) {
                      const SLITTING_SCRAP = Number(slitForm.getFieldValue('SLITTING_SCRAP')) || 0;
                      const slittedWidth = selectedMaterial?.SLITTING_WIDTH - selectedMaterial.remainingWidth - selectedMaterial.SLITTING_SCRAP;

                      return value < Number(slittedWidth + SLITTING_SCRAP)
                        ? Promise.reject(
                            `Width cannot be less than the sum of used width (${slittedWidth}) and scrap (${SLITTING_SCRAP}) = ${Number(slittedWidth + SLITTING_SCRAP)}.`
                          )
                        : Promise.resolve();
                      }
                      else{
                        return Promise.resolve();
                      }
                    },
                  },
                ]}
              >
                <Input placeholder="Width (mm)" 
                  // add onchange to handle auto caluted weight
                  onChange={(event: any) => {
                    const value = parseFloat(event.target.value); 
                    const calculatedWeight = ((value / selectedMaterial?.SLITTING_WIDTH) * selectedMaterial?.SLITTING_WEIGHT).toFixed(2);
                    if (!isNaN(parseFloat(calculatedWeight))) {
                      slitForm.setFieldsValue({ SLITTING_WEIGHT: parseFloat(calculatedWeight) });
                    }
                  }}
                />
              </Form.Item>
              {/* show selectedMaterial in json string */}
              {/* {JSON.stringify(selectedMaterial)} */}

            </Col>
            <Col span={12}>

              <Form.Item
                name="SLITTING_WEIGHT"
                label="Weight"
                rules={[{ required: true, message: 'Please Enter Weight' }]}
              >
                <Input
                disabled={!!(isSlitMaterialEdit && selectedMaterial && ('IS_SEMI_SLITTED' in selectedMaterial) && selectedMaterial.IS_SEMI_SLITTED)}

                placeholder="Weight (KG)" type='Number' />
              </Form.Item>
            </Col>
          </Row>
          )}

          {/* Dynamic Fields for Width and Nos */}
          {!isSlitMaterialEdit && (
          <Form.List name="SLITTING_DTL">
            {(fields, { add, remove }) => (
              <div>
                {fields.map(({ key, name, fieldKey, ...restField }) => (
                  <Space
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                    align="baseline"
                  >
                    {/* Width Field */}
                    <Form.Item
                      {...restField}
                      name={[name, 'SLITTING_WIDTH']}
                      fieldKey={[fieldKey ?? key, 'SLITTING_WIDTH']}

                      rules={[
                        { required: true, message: 'Enter width (mm)' },
                        {
                          type: 'number',
                          min: 0,
                          message: 'Width must be greater than or equal to 0',
                        },
                        {
                          validator: (_, value) =>
                            value > Number(selectedMaterial?.remainingWidth)
                              ? Promise.reject(`Width cannot exceed total width of ${selectedMaterial?.remainingWidth} mm`)
                              : Promise.resolve(),
                        },
                      ]}
                      style={{ flex: 1 }}
                    >
                      <InputNumber
                        min={0}
                        placeholder="Width (mm)"
                        style={{ width: '100%' }}
                        onChange={(value: any) => {
                          const slittingDetails = slitForm.getFieldValue('SLITTING_DTL') || [];
                          if (!selectedMaterial) return;
                        
                          const calculatedWeight = selectedMaterial && 'MATERIAL_WIDTH' in selectedMaterial
                            ? ((value / Number(selectedMaterial.MATERIAL_WIDTH)) * Number(selectedMaterial.MATERIAL_WEIGHT)).toFixed(2)
                            : ((value / Number(selectedMaterial.SLITTING_WIDTH)) * Number(selectedMaterial.SLITTING_WEIGHT)).toFixed(2);

                          // Update only the current weight field
                          slittingDetails[name] = {
                            ...slittingDetails[name],
                            SLITTING_WEIGHT: parseFloat(calculatedWeight),
                          };
                          slitForm.setFieldsValue({ SLITTING_DTL: slittingDetails });
                        }}
                      />
                    </Form.Item>

                    {/* Weight Field (Read-only, Validation Not Required) */}
                    <Form.Item
                      {...restField}
                      name={[name, 'SLITTING_WEIGHT']}
                      fieldKey={[fieldKey ?? key, 'SLITTING_WEIGHT']}
                      style={{ flex: 1 }}
                    >
                      <InputNumber
                        min={0}
                        placeholder="Weight (KG)"
                        style={{ width: '100%' }}
                        readOnly
                      />
                    </Form.Item>

                    {/* Nos Field */}
                    <Form.Item
                      {...restField}
                      name={[name, 'nos']}
                      fieldKey={[fieldKey ?? key, 'nos']}
                      rules={[{ required: true, message: 'Enter nos' },
                        {
                          validator: (_, value) => {
                            const SLITTING_WIDTH = slitForm.getFieldValue('SLITTING_DTL')[name].SLITTING_WIDTH || 0;
                            return value*SLITTING_WIDTH > Number(selectedMaterial?.remainingWidth)
                              ? Promise.reject(`Width cannot exceed total width of ${selectedMaterial?.remainingWidth} mm`)
                              : Promise.resolve();
                          },
                        },
                      ]}
                      style={{ flex: 1 }}
                    >
                      <InputNumber
                        min={0}
                        placeholder="Nos"
                        onChange={(value: any) => {
                          const slittingDetails = slitForm.getFieldValue('SLITTING_DTL')[name].SLITTING_WIDTH || 0;
                        }
                        }
                        style={{ width: '100%' }}
                      />
                    </Form.Item>

                    {/* Remove Icon */}
                    {fields.length > 1 && (
                  <MinusCircleOutlined
                      onClick={() => remove(name)}
                      style={{
                        color: "red",
                        fontSize: "16px",
                        cursor: "pointer",
                      }}
                    />
                  )}
                  </Space>
                ))}

                {/* Add Button */}
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusCircleOutlined />}
                  style={{ marginTop: 16 }}
                >
                  Add Width and Nos
                </Button>
              </div>
            )}
          </Form.List>
          )}
          {/* Submit Button */}
          <Button
            type="primary"
            htmlType="submit"
            // loading={loading}
            style={{ width: '100%', marginTop: 20 }}
          >
            {isSlitMaterialEdit ? 'Update' : "Submit"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default RawMaterialDashboard;
