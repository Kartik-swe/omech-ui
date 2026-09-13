"use client";
import { useState, useRef, useEffect } from "react";
import { Card, Input, Button, Spin, Typography, Table, Avatar, Empty, Divider } from "antd";
import { SendOutlined, UserOutlined, MessageOutlined } from "@ant-design/icons";
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { apiClient } from "@/utils/apiClient";
import { getCookieData } from "@/utils/common";

const { Paragraph, Title: AntTitle } = Typography;

const COLORS = ["#1677ff", "#52c41a", "#faad14", "#f5222d", "#722ed1", "#13c2c2"];

interface ReportTable {
  title: string;
  rows: Record<string, any>[];
}
interface ReportChart {
  title: string;
  type: "bar" | "line" | "pie";
  xField: string;
  yField: string;
  groupByField?: string;
  data: Record<string, any>[];
}
interface Report {
  summary: string;
  analysis?: string;
  tables?: ReportTable[];
  charts?: ReportChart[];
}
interface ChatMessage {
  role: "user" | "assistant";
  text?: string; // simple conversational message
  report?: Report; // structured report
}

// Pivots rows so each x-axis value becomes one row with one column per
// group value — needed for grouped/multi-series bar & line charts.
const pivotForGroups = (rows: Record<string, any>[], xField: string, yField: string, groupField: string) => {
  const groups = Array.from(new Set(rows.map((r) => String(r[groupField]))));
  const byX = new Map<string, Record<string, any>>();
  rows.forEach((r) => {
    const xVal = r[xField];
    if (!byX.has(xVal)) byX.set(xVal, { [xField]: xVal });
    byX.get(xVal)![String(r[groupField])] = r[yField];
  });
  return { pivoted: Array.from(byX.values()), groups };
};

const ChartBlock = ({ chart }: { chart: ReportChart }) => {
  if (!chart.data?.length) return null;

  if (chart.type === "pie") {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={chart.data} dataKey={chart.yField} nameKey={chart.xField} outerRadius={90} label>
            {chart.data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  const hasGroups = !!chart.groupByField;
  const { pivoted, groups } = hasGroups
    ? pivotForGroups(chart.data, chart.xField, chart.yField, chart.groupByField!)
    : { pivoted: chart.data, groups: [chart.yField] };

  if (chart.type === "line") {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={pivoted}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={chart.xField} />
          <YAxis />
          <Tooltip />
          <Legend />
          {groups.map((g, i) => (
            <Line key={g} type="monotone" dataKey={g} stroke={COLORS[i % COLORS.length]} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={pivoted}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={chart.xField} />
        <YAxis />
        <Tooltip />
        <Legend />
        {groups.map((g, i) => (
          <Bar key={g} dataKey={g} fill={COLORS[i % COLORS.length]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

const TableBlock = ({ table }: { table: ReportTable }) => {
  if (!table.rows?.length) return null;
  const columns = Object.keys(table.rows[0]).map((key) => ({
    title: key.replace(/_/g, " "),
    dataIndex: key,
    key,
  }));
  return (
    <div style={{ marginTop: 12 }}>
      <Typography.Text strong>{table.title}</Typography.Text>
      <Table
        style={{ marginTop: 6 }}
        size="small"
        columns={columns}
        dataSource={table.rows.map((r, i) => ({ ...r, __key: i }))}
        rowKey="__key"
        pagination={table.rows.length > 10 ? { pageSize: 10 } : false}
        scroll={{ x: true }}
      />
    </div>
  );
};

const ReportBlock = ({ report }: { report: Report }) => (
  <div>
    <Paragraph style={{ marginBottom: 4, fontWeight: 500 }}>{report.summary}</Paragraph>
    {report.analysis && <Paragraph style={{ marginBottom: 8, color: "#555" }}>{report.analysis}</Paragraph>}
    {report.charts?.map((c, i) => (
      <div key={i} style={{ marginTop: 12 }}>
        <Typography.Text strong>{c.title}</Typography.Text>
        <ChartBlock chart={c} />
      </div>
    ))}
    {report.tables?.map((t, i) => (
      <TableBlock key={i} table={t} />
    ))}
  </div>
);

const AiReportsPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef<string>(
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  const cookiesData = getCookieData();
  const { USER_SRNO, UT_SRNO } = cookiesData;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await apiClient(`${baseUrl}api/AiChat/Ask`, "POST", {
        sessionId: sessionIdRef.current,
        message: question,
        userSrno: USER_SRNO,
        utSrno: UT_SRNO,
      });

      if (res.msgId !== 200) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: res.msg || "Something went wrong. Please try again." },
        ]);
      } else {
        const data = res.data as any;
        const hasReport = (data?.tables?.length || 0) > 0 || (data?.charts?.length || 0) > 0 || data?.analysis;
        if (hasReport) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              report: {
                summary: data.summary,
                analysis: data.analysis,
                tables: data.tables,
                charts: data.charts,
              },
            },
          ]);
        } else {
          setMessages((prev) => [...prev, { role: "assistant", text: data?.summary || "(no answer returned)" }]);
        }
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Error: ${e.message || "could not reach the server"}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ maxWidth: 950, margin: "0 auto", padding: "16px" }}>
      <Card
        title="Ask about your data"
        style={{ minHeight: "70vh", display: "flex", flexDirection: "column" }}
        styles={{ body: { flex: 1, display: "flex", flexDirection: "column", padding: 16 } }}
      >
        <div style={{ flex: 1, overflowY: "auto", maxHeight: "65vh", paddingRight: 4 }}>
          {messages.length === 0 && (
            <Empty
              style={{ marginTop: 60 }}
              description="Ask for a report, e.g. 'give me a production report for grade X, OD 1.2 for last month' or 'what's running low on stock'"
            />
          )}
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 16,
                flexDirection: m.role === "user" ? "row-reverse" : "row",
              }}
            >
              <Avatar
                icon={m.role === "user" ? <UserOutlined /> : <MessageOutlined />}
                style={{ flexShrink: 0, backgroundColor: m.role === "user" ? "#1677ff" : "#52c41a" }}
              />
              <div
                style={{
                  background: m.role === "user" ? "#e6f4ff" : "#f6ffed",
                  borderRadius: 8,
                  padding: "8px 12px",
                  maxWidth: m.role === "user" ? "80%" : "95%",
                  width: m.report ? "95%" : undefined,
                }}
              >
                {m.report ? <ReportBlock report={m.report} /> : (
                  <Paragraph style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>{m.text}</Paragraph>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <Avatar icon={<MessageOutlined />} style={{ backgroundColor: "#52c41a" }} />
              <Spin size="small" />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Input.TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question or ask for a full report..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={loading}
          />
          <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={loading} />
        </div>
      </Card>
    </div>
  );
};

export default AiReportsPage;
