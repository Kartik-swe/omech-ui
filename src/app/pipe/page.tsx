"use client";
import { Card, Row, Col } from "antd";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { useState } from "react";

const Dashboard = () => {
  const [summary] = useState({
    totalPipes: 1500,
    totalWeight: 32000,
    uniqueODs: 8,
    uniqueGrades: 5,
  });

  const pipeByOD = [
    { name: "OD 50", value: 400 },
    { name: "OD 60", value: 300 },
    { name: "OD 40", value: 500 },
    { name: "OD 70", value: 300 },
  ];

  const pipeByGrade = [
    { name: "Grade A", value: 40 },
    { name: "Grade B", value: 30 },
    { name: "Grade C", value: 20 },
    { name: "Grade D", value: 10 },
  ];

  const shiftProduction = [
    { name: "Morning", value: 600 },
    { name: "Evening", value: 500 },
    { name: "Night", value: 400 },
  ];

  const odDistribution = [
    { od: "OD 50", count: 400 },
    { od: "OD 60", count: 300 },
    { od: "OD 40", count: 500 },
    { od: "OD 70", count: 300 },
  ];

  const thicknessDistribution = [
    { thickness: "2mm", count: 450 },
    { thickness: "3mm", count: 350 },
    { thickness: "4mm", count: 400 },
    { thickness: "5mm", count: 300 },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div style={{ padding: 20 }}>
      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}><Card title="Total Pipes Produced" style={{ textAlign: "center" }}><h2>{summary.totalPipes}</h2></Card></Col>
        <Col span={6}><Card title="Total Weight (kg)" style={{ textAlign: "center" }}><h2>{summary.totalWeight}</h2></Card></Col>
        <Col span={6}><Card title="Unique OD Sizes" style={{ textAlign: "center" }}><h2>{summary.uniqueODs}</h2></Card></Col>
        <Col span={6}><Card title="Unique Grades Used" style={{ textAlign: "center" }}><h2>{summary.uniqueGrades}</h2></Card></Col>
      </Row>

      {/* Charts */}
      <Row gutter={16}>
        <Col span={8}><Card title="Pipes by OD & Thickness"><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={pipeByOD} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value">{pipeByOD.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></Card></Col>
        <Col span={8}><Card title="Pipes by Grade"><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={pipeByGrade} cx="50%" cy="50%" outerRadius={80} fill="#82ca9d" dataKey="value">{pipeByGrade.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></Card></Col>
        <Col span={8}><Card title="Production by...."><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={shiftProduction} cx="50%" cy="50%" outerRadius={80} fill="#ffc658" dataKey="value">{shiftProduction.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></Card></Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 20 }}>
        <Col span={12}><Card title="OD-wise Pipe Distribution"><ResponsiveContainer width="100%" height={250}><BarChart data={odDistribution}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="od" /><YAxis /><Tooltip /><Legend /><Bar dataKey="count" fill="#8884d8" /></BarChart></ResponsiveContainer></Card></Col>
        <Col span={12}><Card title="Thickness-wise Pipe Count"><ResponsiveContainer width="100%" height={250}><BarChart data={thicknessDistribution}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="thickness" /><YAxis /><Tooltip /><Legend /><Bar dataKey="count" fill="#82ca9d" /></BarChart></ResponsiveContainer></Card></Col>
      </Row>
    </div>
  );
};

export default Dashboard;