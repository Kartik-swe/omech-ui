'use client'

import React, { useEffect, useState } from 'react';
import { Table, Modal, message, Space, Button } from 'antd';
import { getCookieData } from '@/utils/common';
import { apiClient } from '@/utils/apiClient';

interface LengthDetailItem {
  SCHEDULE_DT_SRNO: number;
  SCHEDULE_SRNO: number;
  PARTY_NAME: string;
  PO_NUMBER: string;
  SCHEDULE_DATE: string;
  GRADE: string;
  THICKNESS: string;
  OD: string;
  LENGTH: number;
  PIPE_QTY: number;
  WEIGHT: number;
  ITEM_TYPE: string;
  STATUS_NAME: string;
  STATUS_SRNO: number;
}

interface LengthDetailModalProps {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  selectedRecord: any;
  isLengthModal?: boolean;
}

const LengthDetailModal: React.FC<LengthDetailModalProps> = ({ 
  modalVisible, 
  setModalVisible, 
  selectedRecord,
  isLengthModal = true
}) => {
  const [isLoading, setLoading] = useState(false);
  const [lengthDetails, setLengthDetails] = useState<LengthDetailItem[]>([]);
  
  const cookiesData = getCookieData();
  const { USER_SRNO, API_BASE_URL } = cookiesData;

  useEffect(() => {
    if (modalVisible && selectedRecord) {
      fetchLengthDetails();
    }
  }, [modalVisible, selectedRecord]);

  const fetchLengthDetails = async () => {
    setLoading(true);
    try {
      // Construct query parameters
      const params = [
        `SCHEDULE_SRNOS=${selectedRecord.SCHEDULE_SRNOS || ''}`,
        `GRADE_SRNO=${selectedRecord.GRADE_SRNO || ''}`,
        `THICKNESS_SRNO=${selectedRecord.THICKNESS_SRNO || ''}`,
        `OD_SRNO=${selectedRecord.OD_SRNO || ''}`,
        `LENGTH=${selectedRecord.LENGTH || ''}`,
        `USER_SRNO=${USER_SRNO}`,
        `IS_LENGTH_MODAL=1`
      ].join('&');

      const response = await apiClient(`${API_BASE_URL}DISP_PO_LENGTH_DETAILS?${params}`, 'GET');
      
      if (response.msgId === 200) {
        if (!response.data) { return; }
        setLengthDetails(response.data.Table || []);
      } else {
        message.error(response.msg);
        console.error('API Error:', response.msg);
      }
    } catch (error) {
      console.error('Error fetching length details:', error);
      message.error('Failed to fetch length details');
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  const columns = [
    {
      title: 'PO Number',
      dataIndex: 'PO_NUMBER',
      key: 'PO_NUMBER',
    },
    {
      title: 'Party Name',
      dataIndex: 'PARTY_NAME',
      key: 'PARTY_NAME',
    },
    {
      title: 'Schedule Date',
      dataIndex: 'SCHEDULE_DATE',
      key: 'SCHEDULE_DATE',
      render: (text: string) => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Length',
      dataIndex: 'LENGTH',
      key: 'LENGTH',
    },
    {
      title: 'Quantity',
      dataIndex: 'PIPE_QTY',
      key: 'PIPE_QTY',
    },
    {
      title: 'Weight (kg)',
      dataIndex: 'WEIGHT',
      key: 'WEIGHT',
    },
    {
      title: 'Status',
      dataIndex: 'STATUS_NAME',
      key: 'STATUS_NAME',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: LengthDetailItem) => (
        <Space size="middle">
          <Button type="primary" size="small" onClick={() => handleMapMaterial(record)}>
            Map Material
          </Button>
        </Space>
      ),
    },
  ];

  const handleMapMaterial = (record: LengthDetailItem) => {
    // Implement material mapping functionality
    message.info(`Mapping material for PO: ${record.PO_NUMBER}, Length: ${record.LENGTH}`);
    // Add your implementation here
  };

  return (
    <Modal 
      title={`Length Details - ${selectedRecord?.GRADE || ''} - ${selectedRecord?.THICKNESS || ''} - ${selectedRecord?.OD || 'N/A'}`}
      open={modalVisible} 
      onCancel={handleCancel}
      width={1000}
      footer={null}
    >
      <Table 
        dataSource={lengthDetails} 
        columns={columns} 
        loading={isLoading}
        rowKey="SCHEDULE_DT_SRNO"
        pagination={{ pageSize: 10 }}
      />
    </Modal>
  );
};

export default LengthDetailModal;