"use client";
import { Card, Row, Col, Button } from "antd";
import { SettingOutlined, DashboardOutlined } from "@ant-design/icons";
import Link from "next/link";
import ProtectedRoute from "@/app/components/ProtectedRoute";

const ThresholdIndexPage = () => {
  return (
    <ProtectedRoute>
      <div style={{ padding: "20px" }}>
        <h1 style={{ marginBottom: "20px" }}>Threshold Management</h1>
        <Row gutter={16}>
          <Col span={12}>
            <Card
              title="Threshold Master"
              extra={<SettingOutlined style={{ fontSize: "24px" }} />}
              style={{ height: "100%" }}
            >
              <p>Set minimum threshold limits for materials based on Grade, Thickness, and OD parameters.</p>
              <p>This module helps you define the minimum stock levels that should be maintained for each material specification.</p>
              <div style={{ marginTop: "20px" }}>
                <Link href="/threshold/master">
                  <Button type="primary">Go to Threshold Master</Button>
                </Link>
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card
              title="Threshold Monitoring"
              extra={<DashboardOutlined style={{ fontSize: "24px" }} />}
              style={{ height: "100%" }}
            >
              <p>Monitor available slitted weight against threshold records.</p>
              <p>This dashboard shows you which materials are below, near, or above their threshold limits to help with inventory planning.</p>
              <div style={{ marginTop: "20px" }}>
                <Link href="/threshold/display">
                  <Button type="primary">Go to Threshold Monitoring</Button>
                </Link>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </ProtectedRoute>
  );
};

export default ThresholdIndexPage;