"use client";
import { useState, useEffect } from "react";
import { Card, Table, Spin, Row, Col, Statistic, Progress, Alert, Tag, Tooltip, message } from "antd";
import { InfoCircleOutlined, WarningOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { apiClient } from "@/utils/apiClient";
import { getCookieData } from "@/utils/common";
import ProtectedRoute from "@/app/components/ProtectedRoute";

interface ThresholdRecord {
  THRESHOLD_SRNO: number;
  GRADE: string;
  THICKNESS: string;
  OD: string;
  REQUIRED_WIDTH : number;
  MIN_THRESHOLD: number;
  TOTAL_SLITTING_WEIGHT: number;
  STATUS: 'below' | 'near' | 'above';
}

const ThresholdDisplayPage = () => {
  const [loading, setLoading] = useState(false);
  const [thresholdData, setThresholdData] = useState<ThresholdRecord[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalRecords: 0,
    belowThreshold: 0,
    nearThreshold: 0,
    aboveThreshold: 0,
    totalAvailableWeight: 0
  });

  const cookiesData = getCookieData();
  const { USER_SRNO, API_BASE_URL, UT_SRNO } = cookiesData;

  // Function to fetch threshold data with available weights
  const fetchThresholdData = async () => {
    setLoading(true);

    try {
      // Call the DT_THRESHOLD_DISPLAY stored procedure
      const response = await apiClient(
        `${API_BASE_URL}DtThresholdDisplay?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}`, 
        "GET"
      );
      
      if (response.msgId === 200 && response.data?.Table) {
        // Data already includes STATUS field from the stored procedure
        setThresholdData(response.data.Table);
        
        // Set summary statistics from Table1
        if (response.data?.Table1 && response.data.Table1.length > 0) {
          const stats = response.data.Table1[0];
          setSummaryStats({
            totalRecords: stats.TOTAL_RECORDS || 0,
            belowThreshold: stats.BELOW_THRESHOLD || 0,
            nearThreshold: stats.NEAR_THRESHOLD || 0,
            aboveThreshold: stats.ABOVE_THRESHOLD || 0,
            totalAvailableWeight: stats.TOTAL_AVAILABLE_WEIGHT || 0
          });
        }
      } else {
        message.error("Failed to load threshold data");
      }
    } catch (error: any) {
      console.error("Error fetching threshold data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial data on mount
  useEffect(() => {
    fetchThresholdData();
  }, []);

  const getStatusTag = (status: 'below' | 'near' | 'above') => {
    switch (status) {
      case 'below':
        return <Tag color="red"><WarningOutlined /> Below Threshold</Tag>;
      case 'near':
        return <Tag color="orange"><InfoCircleOutlined /> Near Threshold</Tag>;
      case 'above':
        return <Tag color="green"><CheckCircleOutlined /> Above Threshold</Tag>;
      default:
        return null;
    }
  };

  const getProgressStatus = (status: 'below' | 'near' | 'above') => {
    switch (status) {
      case 'below': return 'exception';
      case 'near': return 'normal';
      case 'above': return 'success';
      default: return 'normal';
    }
  };

  const columns = [
    {
      title: "Grade",
      dataIndex: "GRADE",
      key: "GRADE",
    },
    {
      title: "Thickness",
      dataIndex: "THICKNESS",
      key: "THICKNESS",
    },
    {
      title: "OD",
      dataIndex: "OD",
      key: "OD",
    },
    {
      title: "Required Width",
      dataIndex: "REQUIRED_WIDTH",
      key: "REQUIRED_WIDTH",
    },
    {
      title: "Min Threshold (kg)",
      dataIndex: "MIN_THRESHOLD",
      key: "MIN_THRESHOLD",
    },
    {
      title: "Available Weight (kg)",
      dataIndex: "TOTAL_SLITTING_WEIGHT",
      key: "TOTAL_SLITTING_WEIGHT",
    },
    {
      title: "Status",
      dataIndex: "STATUS",
      key: "STATUS",
      render: (status: 'below' | 'near' | 'above') => getStatusTag(status),
    },
    {
      title: "Threshold Level",
      key: "threshold_level",
      render: (record: ThresholdRecord) => {
        const percent = Math.min(Math.round((record.TOTAL_SLITTING_WEIGHT / record.MIN_THRESHOLD) * 100), 150);
        return (
          <Tooltip title={`${percent}% of threshold`}>
            <Progress 
              percent={percent} 
              status={getProgressStatus(record.STATUS)}
              strokeWidth={10}
              showInfo={false}
            />
          </Tooltip>
        );
      },
    },
  ];

  return (
    <ProtectedRoute>
      <div style={{ padding: "20px" }}>
        <Card title="Threshold Monitoring Dashboard">
          <Spin spinning={loading}>
            {/* Summary Statistics */}
            <Row gutter={16} style={{ marginBottom: 20 }}>
              <Col span={4}>
                <Statistic 
                  title="Total Materials" 
                  value={summaryStats.totalRecords} 
                  prefix={<InfoCircleOutlined />} 
                />
              </Col>
              <Col span={5}>
                <Statistic 
                  title="Below Threshold" 
                  value={summaryStats.belowThreshold} 
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<WarningOutlined />} 
                />
              </Col>
              <Col span={5}>
                <Statistic 
                  title="Near Threshold" 
                  value={summaryStats.nearThreshold} 
                  valueStyle={{ color: '#faad14' }}
                  prefix={<InfoCircleOutlined />} 
                />
              </Col>
              <Col span={5}>
                <Statistic 
                  title="Above Threshold" 
                  value={summaryStats.aboveThreshold} 
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />} 
                />
              </Col>
              <Col span={5}>
                <Statistic 
                  title="Total Available Weight" 
                  value={summaryStats.totalAvailableWeight} 
                  suffix="kg"
                />
              </Col>
            </Row>

            {/* Alert for below threshold items */}
            {summaryStats.belowThreshold > 0 && (
              <Alert
                message="Attention Required"
                description={`${summaryStats.belowThreshold} material${summaryStats.belowThreshold > 1 ? 's' : ''} below threshold level. Please consider restocking.`}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {/* Main Table */}
            <Table 
              dataSource={thresholdData} 
              columns={columns} 
              rowKey="THRESHOLD_SRNO"
              pagination={{ pageSize: 10 }}
            />
          </Spin>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default ThresholdDisplayPage;