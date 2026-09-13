"use client";
import { useEffect, useState } from "react";
import { Card, Form, Input, Row, Col, Button, message, Spin, Typography } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { apiClient } from "@/utils/apiClient";
import { getCookieData } from "@/utils/common";
import ProtectedRoute from "@/app/components/ProtectedRoute";

const { Title, Text } = Typography;

const CompanyProfilePage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const logoPathWatch = Form.useWatch('LOGO_PATH', form);

  const cookiesData = getCookieData();
  const { USER_SRNO, API_BASE_URL, UT_SRNO } = cookiesData;

  useEffect(() => {
    fetchCompanyMaster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCompanyMaster = async () => {
    setLoading(true);
    try {
      const response = await apiClient(`${API_BASE_URL}DtCompanyMaster?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}`, "GET");
      if (response.msgId === 200 && response.data?.Table?.[0]) {
        form.setFieldsValue(response.data.Table[0]);
      }
      // msgId 204 just means no profile saved yet - leave the form blank, that's expected the first time
    } catch (error) {
      console.error("Error fetching company profile:", error);
      message.error("Failed to load company profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      const payload = { ...values, USER_SRNO, UT_SRNO };
      const response = await apiClient(`${API_BASE_URL}IuCompanyMaster`, "POST", payload);
      if (response.msgId === 200) {
        message.success("Company profile saved successfully!");
      } else {
        message.error(response.msg || "Failed to save company profile");
      }
    } catch (error) {
      console.error("Error saving company profile:", error);
      message.error("Failed to save company profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div style={{ padding: 20 }}>
        <Card
          title="Company Profile"
          variant="borderless"
          extra={<Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => form.submit()}>Save</Button>}
        >
          <Text type="secondary">
            This is Omech&apos;s own letterhead information - there is only ever one profile, and it&apos;s used as the
            company details on generated Quotations.
          </Text>
          <Spin spinning={loading}>
            <Form layout="vertical" form={form} onFinish={handleSubmit} style={{ marginTop: 20 }}>
              <Form.Item name="COMPANY_NAME" label="Company Name" rules={[{ required: true, message: "Please enter the company name" }]}>
                <Input placeholder="e.g. Omech Components Pvt. Ltd." />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="ADDRESS_LINE1" label="Address Line 1">
                    <Input placeholder="e.g. A-35, FIVE STAR M.I.D.C." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="ADDRESS_LINE2" label="Address Line 2">
                    <Input placeholder="e.g. Shendra, Aurangabad-431 201" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="CITY" label="City">
                    <Input placeholder="City" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="STATE" label="State">
                    <Input placeholder="State" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="PINCODE" label="Pincode">
                    <Input placeholder="Pincode" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="PHONE" label="Phone (Tele)">
                    <Input placeholder="e.g. (0240) 2622200" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="MOBILE" label="Mobile">
                    <Input placeholder="e.g. 9975051768/9921650716" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="GST_NO" label="GST No">
                    <Input placeholder="e.g. 27AAACO3622P1Z7" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="EMAIL" label="Email(s)" tooltip="Multiple emails can be separated by a comma">
                <Input placeholder="e.g. sales@omechcompo.com, accounts@omechcompo.com" />
              </Form.Item>

              <Row gutter={16} align="middle">
                <Col span={18}>
                  <Form.Item
                    name="LOGO_PATH"
                    label="Logo Path"
                    tooltip="Path or URL to the logo image - e.g. a file already in the app's /public folder, like /Omech_Components_Logo.png. Shown on generated Quotations."
                  >
                    <Input placeholder="e.g. /Omech_Components_Logo.png" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  {logoPathWatch ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoPathWatch}
                      alt="Logo preview"
                      style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain', border: '1px solid #f0f0f0', padding: 4 }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <Text type="secondary">No logo set</Text>
                  )}
                </Col>
              </Row>

              <Title level={5} style={{ marginTop: 8 }}>Bank Details (optional - for future invoicing)</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="BANK_NAME" label="Bank Name">
                    <Input placeholder="Bank name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="BANK_BRANCH" label="Branch">
                    <Input placeholder="Branch" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="BANK_ACCOUNT_NO" label="Account No">
                    <Input placeholder="Account number" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="BANK_IFSC" label="IFSC Code">
                    <Input placeholder="IFSC code" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Spin>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default CompanyProfilePage;
