'use client';

import { apiClient } from '@/utils/apiClient';
import { getCookieData } from '@/utils/common';
import { Modal, Table, Typography, Spin, message } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';

const { Title } = Typography;

interface GroupedItem {
  GRADE: string;
  GRADE_SRNO: number;
  THICKNESS: number;
  THICKNESS_SRNO: number;
  OD: number;
  OD_SRNO: number;
  ITEM_TYPE: 'PIPE' | 'COIL' | 'SHEET';
  PIPE_QTY: number;
  COIL_SHEET_WEIGHT: number;
  PARTY_NAME: string;
  PO_NUMBER: string;
}

interface ExpandableRowData {
  C_LOCATION: string;
  BALANCE_WEIGHT: number;
  BALANCE_WIDTH: number;
  GRADE: string;
  THICKNESS: number;
  STATUS_NAME: string;
  COIL_TYPE_FLAG: string;
  SLITTING_SRNOS: string;
  MATERIAL_SRNOS: string;
  QUANTITY: number;
  COIL_TYPE: string;
}

interface DispatchAnalysisModalProps {
  open: boolean;
  onCancel: () => void;
  scheduleSrno: string;
}

const DispatchAnalysisModal: React.FC<DispatchAnalysisModalProps> = ({
  open,
  onCancel,
  scheduleSrno,
}) => {
  const { USER_SRNO, API_BASE_URL, UT_SRNO } = getCookieData();
  const [loading, setLoading] = useState(false);
  const [groupedData, setGroupedData] = useState<GroupedItem[]>([]);
  const [expandableData, setExpandableData] = useState<{
    [key: string]: ExpandableRowData[];
  }>({});

  const getAnalysisData = async () => {
    setLoading(true);
    try {
      const res = await apiClient(
        `${API_BASE_URL}DispPoAutoMap?SCHEDULE_SRNOS=${scheduleSrno}&UT_SRNO=${UT_SRNO}&USER_SRNO=${USER_SRNO}`,
        'GET'
      );
      if (res?.msgId === 200 && res.data?.Table) {
        setGroupedData(res.data.Table);
      } else {
        message.error(res?.msg || 'Failed to fetch analysis');
      }
    } catch (error) {
      console.error(error);
      message.error('Error fetching analysis');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpandedRowData = async (record: GroupedItem) => {
    const key = `${record.GRADE_SRNO}-${record.THICKNESS_SRNO}-${record.OD_SRNO}`;
    if (expandableData[key]) return;

    const query = new URLSearchParams({
      GRADE_SRNO: record.GRADE_SRNO.toString(),
      THICKNESS_SRNO: record.THICKNESS_SRNO.toString(),
      OD_SRNO: record.OD_SRNO.toString(),
      PR_LENGTH: '6000', // default
      PR_PRICE: '0',
      PR_QUANTITY: (record.PIPE_QTY || 0).toString(),
      USER_SRNO: USER_SRNO,
    });

    try {
      const res = await apiClient(
        `${API_BASE_URL}GetInvStatusScheduleWise?${query}`,
        'GET'
      );
      if (res?.msgId === 200 && res.data?.Table) {
        setExpandableData((prev) => ({
          ...prev,
          [key]: res.data.Table,
        }));
      } else {
        message.error(res?.msg || 'Failed to fetch expandable row data');
      }
    } catch (err) {
      console.error(err);
      message.error('Error loading detailed inventory data');
    }
  };

  useEffect(() => {
    if (open && scheduleSrno) {
      getAnalysisData();
    }
  }, [open, scheduleSrno]);

  const columns: ColumnsType<GroupedItem> = [
    { title: 'Grade', dataIndex: 'GRADE', key: 'GRADE' },
    { title: 'Thickness', dataIndex: 'THICKNESS', key: 'THICKNESS' },
    { title: 'OD', dataIndex: 'OD', key: 'OD' },
    { title: 'Pipe Quantity', dataIndex: 'PIPE_QTY', key: 'PIPE_QTY' },
    { title: 'Coil/Sheet Weight (KG)', dataIndex: 'COIL_SHEET_WEIGHT', key: 'COIL_SHEET_WEIGHT' },
    { title: 'Party Name', dataIndex: 'PARTY_NAME', key: 'PARTY_NAME' },
    { title: 'PO Number', dataIndex: 'PO_NUMBER', key: 'PO_NUMBER' },
  ];

  const expandedRowRender = (record: GroupedItem) => {
    const key = `${record.GRADE_SRNO}-${record.THICKNESS_SRNO}-${record.OD_SRNO}`;
    const data = expandableData[key] || [];

    const childColumns: ColumnsType<ExpandableRowData> = [
      { title: 'Location', dataIndex: 'C_LOCATION', key: 'C_LOCATION' },
      { title: 'Balance Weight', dataIndex: 'BALANCE_WEIGHT', key: 'BALANCE_WEIGHT' },
      { title: 'Balance Width', dataIndex: 'BALANCE_WIDTH', key: 'BALANCE_WIDTH' },
      { title: 'Status', dataIndex: 'STATUS_NAME', key: 'STATUS_NAME' },
      { title: 'Coil Type', dataIndex: 'COIL_TYPE', key: 'COIL_TYPE' },
      { title: 'Quantity', dataIndex: 'QUANTITY', key: 'QUANTITY' },
    ];

    return (
      <Table
        columns={childColumns}
        dataSource={data}
        pagination={false}
        rowKey="MATERIAL_SRNOS"
        size="small"
      />
    );
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      title={<Title level={4}>Dispatch Analysis</Title>}
      width={1000}
    >
      <Spin spinning={loading}>
        <Table
          dataSource={groupedData}
          columns={columns}
          rowKey={(record) => `${record.GRADE_SRNO}-${record.THICKNESS_SRNO}-${record.OD_SRNO}`}
          bordered
          expandable={{
            expandedRowRender,
            onExpand: (expanded, record) => {
              if (expanded) {
                fetchExpandedRowData(record);
              }
            },
          }}
        />
      </Spin>
    </Modal>
  );
};

export default DispatchAnalysisModal;
