import { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Button, Card, Row, Col, Typography, Divider, Descriptions, message, Checkbox } from "antd";
import { apiClient } from "@/utils/apiClient";
import { getCookieData } from "@/utils/common";
import TextArea from "antd/es/input/TextArea";



interface PipeProductionFormProps {
    isMoOpen: boolean;
    setisStatusLogModalVisible: any;
    selectedMaterial: any;
    fetchSlitted :any
    fetchMotherCoil : any
  }
  
  const ModalMoveCoilProd: React.FC<PipeProductionFormProps> = ({ isMoOpen, setisStatusLogModalVisible ,selectedMaterial,fetchSlitted,fetchMotherCoil}) => {
    const [form] = Form.useForm();
    const cookiesData = getCookieData();
      const { USER_SRNO, API_BASE_URL, UT_SRNO } = cookiesData;
    const [isLoading, setIsLoading] = useState(false)
      const [optTubeMachines, setOptTubeMachines] = useState<{ label: string; value: string }[]>([]);
      const [optOD, setOptOD] = useState<{ label: string; value: string }[]>([]);
   
       useEffect(() => {
          FetchPlCommon();
        }, []);

       // Fetch dropdown options for locations
        const FetchPlCommon = async () => {
          const response = await apiClient<Record<string, any>>(
            `${API_BASE_URL}Pl_Common?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&TBL_SRNO=2,8`,
            "GET"
          );
          if (response.msgId === 200) {
            if (!response.data) return;
            const { Table2, Table8,  } = response.data;
            setOptOD(Table2)
            setOptTubeMachines(Table8)
          } else {
            message.error(response.msg);
            console.error("API Error:", response.msg);
          }
        };
      



    const handleIssueCoilOk = async () => {
        try {

          setIsLoading(true);


          const values = await form.validateFields();

          const { flag } = selectedMaterial;
          var IS_COIL_COMPLETED = values.IS_COIL_COMPLETED
          const payload = {
            IU_FLAG : 'I',
            MATERIAL_SRNO : selectedMaterial.MATERIAL_SRNO,
            SLITTING_SRNO : selectedMaterial.SLITTING_SRNO || 0,
            MACHINE_SRNO : values.MACHINE_SRNO,
            OD_SRNO : values.OD_SRNO,
            WORK_SHIFT_SRNO : values.WORK_SHIFT_SRNO || null,
            C_LOCATION : values.C_LOCATION || selectedMaterial.C_LOCATION,
            IS_COIL_COMPLETED : values.IS_COIL_COMPLETED || false,
            P_LENGTH : values.P_LENGTH,
            PIPE_NOS : values.PIPE_NOS,
            PG_SCRAP_WT : values.PG_SCRAP_WT,
            P_WEIGHT : values.P_WEIGHT || 0,
            REMARKS : values.REMARKS,
            TRN_DATE : values.TRN_DATE,
            TRN_BY : values.TRN_BY,
            TRN_REMARK : values.TRN_REMARK,
            UT_SRNO : UT_SRNO,
            USER_SRNO : USER_SRNO,
            PG_SRNO : 0,
          };
    
          const response = await apiClient(`${API_BASE_URL}IuPipes`, "POST", payload);
    
          if (response.msgId === 200) {
            message.success("Issued successful!");
            setisStatusLogModalVisible(false);
            form.resetFields();
            setIsLoading(false);
            if (IS_COIL_COMPLETED) {
              switch (flag) {
                case 'M':
                fetchMotherCoil('');
                break;
              case 'S':
                fetchSlitted('');
                break;
                  
                default:
                  break;
              }  
            }
            
           
          } else {
          alert(response.msg)
          
    
            message.error(response.msg);
          }
        } catch (error: any) {
          alert(error)
          message.error(error.message);
        }
      };
  
    return (
        <Modal
        title="Issue Coil"
        open={isMoOpen}
        footer={null}
        onCancel={() => setisStatusLogModalVisible(false)} // Fix: Use arrow function
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
        <Form form={form} layout="vertical" onFinish={handleIssueCoilOk} >
          <Row gutter={16}>
            <Col span={8}>
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
            <Col span={4}>
              <Form.Item
                label="OD"
                name="OD_SRNO"
                rules={[{ required: true, message: "Select OD" }]}
              >
                <Select 
                    showSearch 
                    placeholder="OD" 
                    options={optOD} 
                    filterOption={(input: any, option: any) => option?.label.toLowerCase().includes(input.toLowerCase())}
                    allowClear
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
          label="Issue Date"
          name="TRN_DATE"
          rules={[{ required: true, message: "Please select the issue date!" }]}
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
          <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
           
            <Col span={8}>
              <Form.Item
          label="Length"
          name="P_LENGTH"
          rules={[{ required: true, message: "Please Enter the length!" }]}
              >
          <Input placeholder="Enter the length"  />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
          label="Weight"
          name="P_WEIGHT"
          rules={[{ required: false, message: "Please Enter the wEIGHT!" }]}
              >
          <Input placeholder="Enter the weight"  />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
          label="NOS"
          name="PIPE_NOS"
          rules={[{ required: true, message: "Please Enter Number Of Pipe!" }]}
              >
          <Input type="Number" placeholder="NOS"  />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
          label="Total Scrap (kg)"
          name="PG_SCRAP_WT"
          rules={[{ required: false, message: "Please Enter Total Scrap!" }]}
              >
          <Input placeholder="Total Scrap"  />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
          label="Coil Completed"
          name="IS_COIL_COMPLETED"
          valuePropName="checked"
          rules={[{ required: false, message: "Please Enter Number Of Pipe!" }]}
              >
          <Checkbox>Coil Completed</Checkbox>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
          hidden
            label="Remarks"
            name="REMARKS"
            rules={[{ required: false, message: "Please enter the Reamrk!" }]}
          >
            <TextArea placeholder="Remark" autoSize={{ minRows: 3, maxRows: 5 }} />
          </Form.Item>
          {/* Submit Button */}
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isLoading}
                      style={{ width: '100%', marginTop: 20 }}
                    >
                      Submit
                    </Button>
        </Form>
      </Modal>
    );
};

export default ModalMoveCoilProd;