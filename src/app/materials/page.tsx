"use client"
import React, { useEffect, useState } from 'react';
import { Row, Col, Table, DatePicker, Select, Button, Card, Statistic, Typography, Form, message } from 'antd';
import Link from 'next/link';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Treemap } from 'recharts';
import { apiClient } from '@/utils/apiClient';
import { getCookieData } from '@/utils/common';
import { table } from 'console';
import ProtectedRoute from '../components/ProtectedRoute';
const { Title: AntTitle } = Typography;

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const Dashboard = () => {
  const [CARD_DATA, setCARD_DATA] = useState<any>([]);
  const [gradeWiseStockData, setGradeWiseStockData] = useState<any>([]);
  const [gradeVendorData, setgradeVendorData] = useState<any>([]);
  const [allLocations, setAllLocations] = useState<any>([]);
  const [DT_DATA, setDT_DATA] = useState<any>([]);
  const [loading, setLoading] = useState(true);
 // state for grade options with interface
  const [optGrades, setOptGrades] = useState<{ label: string; value: string }[]>([]);
  const [optThickNess, setoptThickNess] = useState<{ label: string; value: string }[]>([]);
  const [optVendors, setOptVendors] = useState<{ label: string; value: string }[]>([]);
  const [optStatus, setOptStatus] = useState<{ label: string; value: string }[]>([]);
  const cookiesData = getCookieData();
  const { USER_SRNO, API_BASE_URL, UT_SRNO } = cookiesData;
  const [SearchForm] = Form.useForm();

  const [filters, setFilters] = useState({
    startDate: null, endDate: null, grade: [], thickness: null, vendor: [], status: null, machine: [],
  });

   useEffect(() => {
     // FetchPlCommon();
      FetchRawMaterials();
    }, []);
  

     // Function to fetch common dropdown options
  const FetchPlCommon = async () => {
    const response = await apiClient(`${API_BASE_URL}Pl_Common?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&TBL_SRNO=1,3,4,5`, 'GET');
    if (response.msgId === 200) {
      if (!response.data) { return; }
      const { Table1, Table3, Table4, Table5 } = response.data;
      setOptGrades(Table1)
      setoptThickNess(Table3)
      setOptVendors(Table4)
      setOptStatus(Table5)
    } else {
      message.error(response.msg)
      console.error('API Error:', response.msg);  // Logging the error message
    }
  };

  //  fUNCTION TO FETCH RAW MATERIALS
  const FetchRawMaterials = async () => {
    setLoading(true);
    const values = SearchForm.getFieldsValue();
    try {
      const param = `MATERIAL_FLAG=D&F_DATE=${values.F_DATE  || ''}&TO_DATE=${values.TO_DATE || ''}&GRADE_SRNO=${values.GRADE_SRNO || ''}&THICNESS_SRNO=${values.THICNESS_SRNO || ''}&WIDTH=${values.WIDTH || ''}&STATUS_SRNO=${values.STATUS_SRNO  || ''}&C_LOCATION=${values.C_LOCATION ||''}&USER_SRNO=${USER_SRNO}`
      const response = await apiClient(`${API_BASE_URL}DtDashRawInventory?${param}`, 'GET');
      if (response.msgId === 200) {
        if (!response.data) { return; }
        
        const row = response.data.Table[0];
        const keyCardData = [
          { title: 'Mother coil weight', value: row.T_MOTHER_WEIGHT || 0 },
          { title: 'Semi-slitted weight', value: row.T_SLITTING_WEIGHT || 0},
          { title: 'slitted weight', value: row.T_SLITTED_WEIGHT || 0 },
          { title: 'Total Stock', value: row.T_STOCK || 0 },
          { title: 'Total Value (₹, incl. scrap)', value: round2(row.T_VALUE || 0) },
        ]

        const gradeWiseStockDataTemp = response.data.Table1.map((item:any) => ({
          name: item.GRADE,
          value: item.T_WEIGHT,
          totalValue: round2(item.T_VALUE || 0),
      }));

      debugger
      // Transform data into required format
      const gradeVendorDataTemp:any = [];
      const locationSetTemp = new Set();

      response.data.Table2.forEach((item:any )=> {
        locationSetTemp.add(item.C_LOCATION);
        let existingGrade = gradeVendorDataTemp.find((g:any) => g.grade === item.GRADE);

        if (!existingGrade) {
          existingGrade = { grade: item.GRADE };
          gradeVendorDataTemp.push(existingGrade);
        }

        existingGrade[item.C_LOCATION] = item.T_WEIGHT;
      });

      // Convert Set to Array
      const allLocationsTemp = Array.from(locationSetTemp);

      // Fill missing location columns with 0
      gradeVendorDataTemp.forEach((row:any) => {
        allLocations.forEach((location:any) => {
          if (!(location in row)) {
            row[location] = 0;
          }
        });
      });

      
        
        setCARD_DATA(keyCardData);
        setGradeWiseStockData(gradeWiseStockDataTemp);
        setgradeVendorData(gradeVendorDataTemp);
        setAllLocations(allLocationsTemp)
        
      } else {
        message.error(response.msg)
        console.error('API Error:', response.msg);  // Logging the error message
      }
    } catch (error) {
      console.error('Error fetching raw materials:', error);
      message.error('Failed to fetch raw materials');
    }
    setLoading(false);
  };

  // Key Metrics Data
  const keyMetrics = [
    { title: 'Total Raw Material Received', value: 446566 },
    { title: 'Total Slitted Weight', value: 4558 },
    { title: 'Total Processed Weight', value: 584 },
    { title: 'Remaining Stock', value: 6685 },
  ];

  // Dummy Data for Charts
  const stockData = [
    { name: 'Received', value: 446566 },
    { name: 'Slitted', value: 4558 },
    { name: 'Processed', value: 584 },
    { name: 'Remaining', value: 6685 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const materialGradeData = [
    { grade: 'Grade A', VendorA: 300, VendorB: 400, VendorC: 200 },
    { grade: 'Grade B', VendorA: 250, VendorB: 300, VendorC: 350 },
    { grade: 'Grade C', VendorA: 200, VendorB: 150, VendorC: 100 },
  ];

  const machineProcessingData = [
    { machine: 'Machine A', weight: 200 },
    { machine: 'Machine B', weight: 500 },
    { machine: 'Machine C', weight: 300 },
  ];

  const weightStatusData = [
    { name: 'Processed', size: 584 },
    { name: 'In Stock', size: 6685 },
    { name: 'Pending', size: 1000 },
  ];

  return (
    <ProtectedRoute>
    <div>
      <Row gutter={16}>
        <Col span={21}>
          <AntTitle level={2}>Advanced Dashboard</AntTitle>
        </Col>
        <Col span={3}>
          <Link href="/new-materials">
            <Button type="primary" danger>
              Add Raw Materials
            </Button>
          </Link>
        </Col>
      </Row>
      
      <Row gutter={16} hidden> 
        <Col span={8}>
          <Card>
            <DatePicker.RangePicker  />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Select
              mode="multiple"
              placeholder="Select Grade"
              onChange={value => setFilters(prev => ({ ...prev, grade: value }))}
              style={{ width: '100%' }}
            >
              <Select.Option value="GradeA">Grade A</Select.Option>
              <Select.Option value="GradeB">Grade B</Select.Option>
              <Select.Option value="GradeC">Grade C</Select.Option>
            </Select>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Select
              mode="multiple"
              placeholder="Select Vendor"
              onChange={value => setFilters(prev => ({ ...prev, vendor: value }))}
              style={{ width: '100%' }}
            >
              <Select.Option value="VendorA">Vendor A</Select.Option>
              <Select.Option value="VendorB">Vendor B</Select.Option>
              <Select.Option value="VendorC">Vendor C</Select.Option>
            </Select>
          </Card>
        </Col>
      </Row>
      
      <Row gutter={16} style={{ marginTop: '20px', flexWrap: 'nowrap', overflowX: 'auto' }}>
        {CARD_DATA?.map((metric:any) => (
          <Col style={{ flex: 1, minWidth: 180 }} key={metric.title}>
            <Card>
              <Statistic title={metric.title} value={metric.value} />
            </Card>
          </Col>
        ))}
      </Row>
      
      <Row gutter={16} style={{ marginTop: '20px' }}>
        <Col span={12}>
          <Card title="Grade Wise Stock Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={gradeWiseStockData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                  {gradeWiseStockData.map((entry:any, index:any) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any, name: any, props: any) => [`${value} kg (₹${props?.payload?.totalValue ?? 0})`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Material by Grade & Location">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradeVendorData}>
              <XAxis dataKey="grade" />
              <YAxis />
              <Tooltip />
              <Legend />
              {allLocations.map((location:any, index:any) => (
                <Bar key={location} dataKey={location} fill={["#0088FE", "#00C49F", "#FFBB28"][index % 3]} />
              ))}
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
      
      
    </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
