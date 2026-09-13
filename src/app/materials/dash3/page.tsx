"use client";
import React, { useState, useEffect } from "react";
import { Card, Table, Row, Col, message } from "antd";
import { apiClient } from "@/utils/apiClient";
import { getCookieData } from "@/utils/common";

// Define the columns for the slitted table
const SlittingTableCol = [
  // {
  //   title: 'Slitting Sr. No',
  //   dataIndex: 'SLITTING_SRNO',
  //   key: 'SLITTING_SRNO',
  // },
  {
    title: 'DC Number',
    dataIndex: 'DC_NO',
    key: 'DC_NO',
  },
  {
    title: 'Slitting Date',
    dataIndex: 'SLITTING_DATE',
    key: 'SLITTING_DATE',
    render: (text:any) => <a>{text}</a>, // You can customize rendering as needed
  },
  {
    title: 'Slitting Width',
    dataIndex: 'SLITTING_WIDTH',
    key: 'SLITTING_WIDTH',
  },
  {
    title: 'Slitting Weight',
    dataIndex: 'SLITTING_WEIGHT',
    key: 'SLITTING_WEIGHT',
  },
  {
    title: 'Thickness',
    dataIndex: 'THICKNESS',
    key: 'THICKNESS', // Mapped from `M_THICKNESS` table
  },
  {
    title: 'Grade',
    dataIndex: 'GRADE',
    key: 'GRADE', // Mapped from `M_GRADE` table
  },
  {
    title: 'Vendor Name',
    dataIndex: 'VENDOR_NAME',
    key: 'VENDOR_NAME', // Mapped from `M_VENDORS` table
  },
];


const RawMaterialVsSlittingComparison = () => {
  const [SlittedData, setSlittedData] = useState<any[]>([]);

  const cookiesData = getCookieData();
  const { USER_SRNO, API_BASE_URL, UT_SRNO } = cookiesData;

  // Fetch slitted data
  const FetchSlitted = async () => {
    try {
      const response = await apiClient(`${API_BASE_URL}DtSlitted`, "GET");

      if (response.msgId === 200) {
        if (!response.data) return;

        // Set the state for the slitted data
        setSlittedData(response.data.Table);
      } else {
        message.error(response.msg);
        console.error("API Error:", response.msg); // Logging the error message
      }
    } catch (error: any) {
      console.error("Error fetching slitted Coil:", error);
      message.error(error.message);
    }
  };

  useEffect(() => {
    FetchSlitted();
  }, []);

  return (
    <Card title="Slitted Coil">
      <Row gutter={16}>
        <Col span={24}>
          <Table dataSource={SlittedData} columns={SlittingTableCol} pagination={false} />
        </Col>
      </Row>
    </Card>
  );
};

export default RawMaterialVsSlittingComparison;
