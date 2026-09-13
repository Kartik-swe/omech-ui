'use client';

import { useEffect, useState } from 'react';
import {
  Card, Table, DatePicker, Select, Row, Col, Statistic, Typography, Divider, message, Button, Spin
} from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { apiClient } from '@/utils/apiClient';
import { getCookieData } from '@/utils/common';

dayjs.extend(customParseFormat);

const { RangePicker } = DatePicker;
const { Title } = Typography;

const COLORS = ['#1890ff', '#82ca9d', '#ffc658', '#ff6b6b', '#8e44ad', '#16a085'];

const gradeColors: Record<string, string> = {
  '304': '#8884d8',
  '409': '#82ca9d',
  '441': '#ffc658',
  // Add more if needed
};

type OptionType = {
    value: string | number;
    label: string;
};

export default function ProductionDashboard() {
  const [dsData, setDsData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [selectedMachine, setSelectedMachine] = useState<string | undefined>();
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>();
  const [selectedOperator, setSelectedOperator] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<any[]>([]);

  const [optMachines, setOptMachines] = useState<OptionType[]>([]);
  const [optLocations, setOptLocations] = useState<OptionType[]>([]);
  const [optOperators, setOptOperators] = useState<OptionType[]>([]);

  const cookiesData = getCookieData();
  const { USER_SRNO, API_BASE_URL, UT_SRNO } = cookiesData;

   useEffect(() => {
    FetchPlCommon();
    // fetchSchedule();
}, []);
  // Function to fetch common dropdown options
      const FetchPlCommon = async () => {
        const response = await apiClient<Record<string, any>>(`${API_BASE_URL}Pl_Common?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&TBL_SRNO=4,8,11`, 'GET');
        if (response.msgId === 200) {
          if (!response.data) { return; }
            const { Table4, Table8, Table11 } = response.data;
            setOptLocations(Table4);
            setOptMachines(Table8);
            setOptOperators(Table11);


          } else {
          message.error(response.msg)
          console.error('API Error:', response.msg);  // Logging the error message
        }
      };


  const fetchData = async () => {
    const values = {
      REG_DATE_FROM: dateRange[0] ? dayjs(dateRange[0]).format('YYYY-MM-DD') : '',
      REG_DATE_TO: dateRange[1] ? dayjs(dateRange[1]).format('YYYY-MM-DD') : '',
      GRADE_SRNO: '',
      THICNESS_SRNO: '',
      WIDTH: '',
      STATUS_SRNO: '',
      C_LOCATION: selectedLocation || '',
      TUBE_MILL_SRNO: selectedMachine || '',
      WORKING_USER: selectedOperator || null
    };

    const param = `MATERIAL_FLAG=F&REG_DATE_FROM=${values.REG_DATE_FROM}&REG_DATE_TO=${values.REG_DATE_TO}&GRADE_SRNO=${values.GRADE_SRNO}&THICNESS_SRNO=${values.THICNESS_SRNO}&WIDTH=${values.WIDTH}&STATUS_SRNO=${values.STATUS_SRNO}&C_LOCATION=${values.C_LOCATION}&TUBE_MILL_SRNO=${values.TUBE_MILL_SRNO}&USER_SRNO=${USER_SRNO}`;

    try {
      setLoading(true);
      const response = await apiClient(`${API_BASE_URL}DtRawMaterialShift?${param}`, 'GET');
      if (response.msgId === 200 && response.data) {
        setDsData(response.data.Table3 || []);
      } else {
        message.error(response.msg || 'No data received');
      }
    } catch (error) {
      console.error(error);
      message.error('Failed to fetch production data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMachine,selectedLocation, selectedOperator, dateRange]);

  // useEffect(() => {
  //   let result = data;
  //   setFiltered(result);
  // }, [data]);

  const totalWeight = dsData.reduce((sum, d) => sum + (parseFloat(d.WEIGHT ?? '0') || 0), 0);

  const resetFilters = () => {
    setSelectedMachine(undefined);
    setSelectedLocation(undefined);
    setSelectedOperator(undefined);
    setDateRange([]);
  };

  return (
    <div className="p-4">
      <Title level={3}>Production Dashboard</Title>

      <Row gutter={16} className="mb-4">
        <Col span={4}>
          <Select
            allowClear
            placeholder="Select Machine"
            className="w-full"
            showSearch
            value={selectedMachine}
            onChange={value => setSelectedMachine(value)}
            options={optMachines}
          >
           
          </Select>
        </Col>

        <Col span={4}>
          <Select
            allowClear
            placeholder="Select Location"
            className="w-full"
            showSearch
            value={selectedLocation}
            onChange={value => setSelectedLocation(value)}
            options={optLocations}
          >
            
          </Select>
        </Col>
        <Col span={4}>
          <Select
            allowClear
            placeholder="Select Operator"
            className="w-full"
            showSearch
            value={selectedOperator}
            onChange={value => setSelectedOperator(value)}
            options={optOperators}
          >
            
          </Select>
        </Col>


        

        <Col span={8}>
          <RangePicker
            className="w-full"
            value={[
              dateRange[0] ?? null,
              dateRange[1] ?? null
            ]}
            onChange={dates => setDateRange(dates || [])}
          />
        </Col>

        <Col span={4}>
          <Button className="w-full" onClick={resetFilters}>Reset Filters</Button>
        </Col>
      </Row>

      <Spin spinning={loading}>
        <Row gutter={16} className="mb-4">
          <Col span={6}><Card><Statistic title="Total Weight (kg)" value={totalWeight} precision={0} /></Card></Col>
          <Col span={6}><Card><Statistic title="Total Coils" value={dsData.length} /></Card></Col>
          <Col span={6}><Card><Statistic title="Unique Machines" value={new Set(dsData.map(d => d.MACHINE)).size} /></Card></Col>
          <Col span={6}><Card><Statistic title="Unique Locations" value={new Set(dsData.map(d => d.C_LOCATION)).size} /></Card></Col>
        </Row>

        <Divider orientation="left">Charts</Divider>
        <Row gutter={16} className="mb-4">
          <Col span={24}>
            <Card title="Production by Machine">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={aggregateBy(dsData, 'MACHINE')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="key" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1890ff" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
            {/* {JSON.stringify(aggregateByMonth(dsData))} */}
          <Col span={24}>
            <Card title="Production Trend (Month-wise)">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={aggregateByMonth(dsData)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="key" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Card title="Production by Grade">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={aggregateBy(dsData, 'GRADE')}
                    dataKey="value"
                    nameKey="key"
                    outerRadius={100}
                    label
                  >
                    {aggregateBy(dsData, 'GRADE').map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>

       <Col span={16}>
  <Card title="Production by Grade and Thickness">
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={aggregateByGradeAndThickness(dsData)}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="grade" />
        <YAxis />
        <Tooltip />
        <Legend />
        {getAllThicknesses(dsData).map((thickness, index) => (
          <Bar
            key={thickness}
            dataKey={thickness}
            stackId="a"
            fill={getColorByIndex(index)}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  </Card>
</Col>

        </Row>

        <Divider orientation="left">Detailed Records</Divider>
        <Card>
          <Table
            loading={loading}
            dataSource={dsData.map((d, i) => ({ ...d, key: i }))}
            columns={[
              { title: "Issue Date", dataIndex: "STATUS_LOG_DATE_STR", key: "STATUS_LOG_DATE_STR" },
              { title: 'Machine', dataIndex: 'MACHINE', sorter: (a, b) => (a.MACHINE || '').localeCompare(b.MACHINE || '') },
              { title: 'Location', dataIndex: 'C_LOCATION', sorter: (a, b) => (a.C_LOCATION || '').localeCompare(b.C_LOCATION || '') },
              { title: 'Weight (kg)', dataIndex: 'WEIGHT', sorter: (a, b) => parseFloat(a.WEIGHT || 0) - parseFloat(b.WEIGHT || 0) },
              { title: "Width", dataIndex: "WIDTH", key: "WIDTH" },
              { title: 'Grade', dataIndex: 'GRADE', sorter: (a, b) => (a.GRADE || '').localeCompare(b.GRADE || '') },
              { title: 'Thickness', dataIndex: 'THICKNESS', sorter: (a, b) => parseFloat(a.THICKNESS || 0) - parseFloat(b.THICKNESS || 0) },
              { title: "OD", dataIndex: "OD", key: "OD" },
              // { title: 'Slitting Date', dataIndex: 'SLITTING_DATE', sorter: (a, b) => new Date(a.SLITTING_DATE).getTime() - new Date(b.SLITTING_DATE).getTime() },
              { title: "Responsible Supervisor", dataIndex: "RESPONSIBLE_SUPERVISOR", key: "RESPONSIBLE_SUPERVISOR" },
              { title: "Operator", dataIndex: "WORKING_USER", key: "WORKING_USER" },
              { title: 'Coil Type', dataIndex: 'COIL_TYPE' }
            ]}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Spin>
    </div>
  );
}

// Utility to aggregate data by a key (like MACHINE, GRADE, etc.)
function aggregateBy(data: any[], key: string) {
  const map: Record<string, number> = {};
  for (const item of data) {
    const k = item[key] ?? 'Unknown';
    const weight = parseFloat(item.WEIGHT ?? '0') || 0;
    map[k] = (map[k] || 0) + weight;
  }
  return Object.entries(map).map(([key, value]) => ({ key, value }));
}

// Utility to aggregate data month-wise
function aggregateByMonth(data: any[]) {
  const map: Record<string, number> = {};

  for (const item of data) {
    const rawDate = item.STATUS_LOG_DATE;

    if (!rawDate) continue; // skip if null/undefined

    const parsedDate = dayjs(rawDate);

    if (!parsedDate.isValid()) {
      console.warn('Invalid date:', rawDate); // helpful for debugging
      continue;
    }

    const monthKey = parsedDate.format('YYYY-MM');

    const weight = parseFloat(item.WEIGHT ?? '0') || 0;
    map[monthKey] = (map[monthKey] || 0) + weight;
  }

  return Object.entries(map).map(([key, value]) => ({ key, value }));
}

function aggregateByThicknessAndGrade(data: any[]) {
  const result: Record<string, Record<string, number>> = {};

  for (const item of data) {
    const thickness = item.THICKNESS?.toString().trim();
    const grade = item.GRADE?.toString().trim();
    const weight = parseFloat(item.WEIGHT || 0);

    if (!thickness || !grade) continue;

    if (!result[thickness]) result[thickness] = {};
    if (!result[thickness][grade]) result[thickness][grade] = 0;

    result[thickness][grade] += weight;
  }

  // Convert to Recharts format
  const chartData = Object.entries(result).map(([thickness, gradeMap]) => ({
    thickness,
    ...gradeMap,
  }));

  return chartData;
}

function getAllGrades(data: any[]): string[] {
  const gradeSet = new Set<string>();
  data.forEach((item) => {
    const grade = item.GRADE?.toString().trim();
    if (grade) gradeSet.add(grade);
  });
  return Array.from(gradeSet);
}

function getColorByIndex(index: number): string {
  const palette = ['#1890ff', '#82ca9d', '#ffc658', '#ff6b6b', '#8e44ad', '#16a085'];
  return palette[index % palette.length];
}


function aggregateByGradeAndThickness(data: any[]) {
  const result: Record<string, Record<string, number>> = {};

  for (const item of data) {
    const thickness = item.THICKNESS?.toString().trim();
    const grade = item.GRADE?.toString().trim();
    const weight = parseFloat(item.WEIGHT || 0);

    if (!thickness || !grade) continue;

    if (!result[grade]) result[grade] = {};
    if (!result[grade][thickness]) result[grade][thickness] = 0;

    result[grade][thickness] += weight;
  }

  // Convert to Recharts format
  const chartData = Object.entries(result).map(([grade, thicknessMap]) => ({
    grade,
    ...thicknessMap,
  }));

  return chartData;
}

function getAllThicknesses(data: any[]) {
  const unique = new Set<string>();
  for (const item of data) {
    const t = item.THICKNESS?.toString().trim();
    if (t) unique.add(t);
  }
  return Array.from(unique);
}
