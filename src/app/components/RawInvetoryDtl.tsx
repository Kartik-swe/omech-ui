'use client'
// src/inventory/components/InventoryTable.tsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Popconfirm, Space, Modal, Card, message } from 'antd';
import { getCookieData } from '@/utils/common';
import { apiClient } from '@/utils/apiClient';

interface InventoryItem {
  id: number;
  grade: string;
  outerDiameter: string;
  thickness: string;
  quantity: number;
}

interface InventoryTableProps {
  modalVisible: boolean;
  setModalVisible : any;
  selectedMaterialSrnos :string;
  selectedSlittingSrnos : String;
  selectedCoilTypeFlag : String;
}

const RawInventoryDtl: React.FC<InventoryTableProps> = ({ modalVisible,setModalVisible,selectedMaterialSrnos,selectedSlittingSrnos,selectedCoilTypeFlag }) => {
  // states for raw inventory detail
  const [isloading, setLoading] = useState(false);
  const [DT_DATA, setDT_DATA] = useState<InventoryItem[]>([]);
  
  const cookiesData = getCookieData();
  const { USER_SRNO, API_BASE_URL, UT_SRNO } = cookiesData;


  
    useEffect(() => {
      if (modalVisible) {
        FetchRawMaterials();  
      }
    }, [modalVisible]);

    
  //  fUNCTION TO FETCH RAW MATERIALS
  const FetchRawMaterials = async () => {
    setLoading(true);
    try {
      const param = `MATERIAL_FLAG=${selectedCoilTypeFlag}&SLITTING_SRNOS=${selectedSlittingSrnos}&MATERIAL_SRNOS=${selectedMaterialSrnos}&USER_SRNO=${USER_SRNO}`;
      const response = await apiClient(`${API_BASE_URL}DtDashRawInventoryDtl?${param}`, 'GET');
      if (response.msgId === 200) {
        if (!response.data) { return; }
        setDT_DATA(response.data.Table);
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


  // handle modal cancel
  const handleCancel = () => {
    setModalVisible(false);
  }
  return (
   
    // Add modal.
    <Modal title="Raw Inventory Detail" open={modalVisible} footer={null} width={1300} onCancel={handleCancel}>
        {/* Add card */}
       <Table dataSource={DT_DATA} loading={isloading}
       
       columns={[
        {
            title: 'Challan No',
            dataIndex: 'CHALLAN_NO',
            key: 'CHALLAN_NO',
          },
          {
            title: 'DC NO',
            dataIndex: 'DC_NO',
            key: 'DC_NO',
          },
        
        {
          title: 'Total Width',
          dataIndex: 'TOTAL_WIDTH',
          key: 'TOTAL_WIDTH',
        },
        {
          title: 'Balance Width',
          dataIndex: 'BALANCE_WIDTH',
          key: 'BALANCE_WIDTH',
        },
        {
          title: 'Balance Weight',
          dataIndex: 'BALANCE_WEIGHT',
          key: 'BALANCE_WEIGHT',
        },
        {
          title: 'Grade',
          dataIndex: 'GRADE',
          key: 'GRADE',
        },
        {
          title: 'Thickness',
          dataIndex: 'THICKNESS',
          key: 'THICKNESS',
        },
        {
          title: 'Source',
          dataIndex: 'COIL_TYPE',
          key: 'COIL_TYPE',
        },
        {
          title: 'Status',
          dataIndex: 'STATUS_NAME',
          key: 'STATUS_NAME',
        },
        {
          title: 'Location',
          dataIndex: 'C_LOCATION',
          key: 'C_LOCATION',
        },
        {
          title: 'Date',
          dataIndex: 'ITEM_DATE',
          key: 'ITEM_DATE',
        }
       ]} />
    </Modal>
  );
};

export default RawInventoryDtl;
