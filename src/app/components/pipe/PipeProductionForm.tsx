import { useState } from "react";
import { Modal, Form, Input, Select, Button, Card, Row, Col, Typography, Divider } from "antd";
import { UserOutlined, BuildOutlined, FieldNumberOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;


interface PipeProductionFormProps {
    visible: boolean;
    onClose: () => void;
    coil: any;
  }
  
  const PipeProductionForm: React.FC<PipeProductionFormProps> = ({ visible, onClose ,coil}) => {
    const [form] = Form.useForm();
    const [quantity, setQuantity] = useState(1);
    const [totalWeight, setTotalWeight] = useState(coil?.weight || 0);
  
    // Auto-calculate total weight
    const handleQuantityChange = (value:any) => {
      setQuantity(value);
      setTotalWeight(value * (coil?.weight / 10)); // Example weight calculation
    };
  
    const handleFinish = (values:any) => {
      onClose();
    };
  
    return (
      <Modal
        title={<Title level={4}>Move Coil to Production</Title>}
        open={visible}
        onCancel={onClose}
        footer={null}
        width={600}
      >
        <Card bordered={false} style={{ background: "#f5f5f5", padding: 20, borderRadius: 10 }}>
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Text strong>Coil Name:</Text> <br /> {coil?.name}
            </Col>
            <Col span={12}>
              <Text strong>Width:</Text> <br /> {coil?.width} mm
            </Col>
            <Col span={12}>
              <Text strong>Weight:</Text> <br /> {coil?.weight} kg
            </Col>
          </Row>
        </Card>
  
        <Divider />
  
        <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 20 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="length" label="Pipe Length (mm)" rules={[{ required: true }]}>
                <Input type="number" placeholder="Enter length" prefix={<FieldNumberOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="od" label="Outer Diameter (OD)" rules={[{ required: true }]}>
                <Select placeholder="Select OD">
                  <Select.Option value="OD1">OD1</Select.Option>
                  <Select.Option value="OD2">OD2</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
  
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="worker" label="Processed By" rules={[{ required: true }]}>
                <Select placeholder="Select Worker" prefix={<UserOutlined />}>
                  <Select.Option value="Worker1">Worker 1</Select.Option>
                  <Select.Option value="Worker2">Worker 2</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shift" label="Working Shift" rules={[{ required: true }]}>
                <Select placeholder="Select Shift" prefix={<BuildOutlined />}>
                  <Select.Option value="Morning">Morning</Select.Option>
                  <Select.Option value="Evening">Evening</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
  
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="totalWeight" label="Total Weight (kg)">
                <Input type="number" value={totalWeight} />
              </Form.Item>
            </Col>
          </Row>
  
          <Divider />
  
          <div style={{ textAlign: "right" }}>
            <Button onClick={onClose} style={{ marginRight: 8 }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Submit</Button>
          </div>
        </Form>
      </Modal>
    );
};

export default PipeProductionForm;