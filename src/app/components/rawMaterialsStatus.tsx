import React from "react";
import { Button, message, Popconfirm, PopconfirmProps, Space, Table, Tooltip } from "antd";
import { EditOutlined, ScissorOutlined, CheckCircleOutlined } from '@ant-design/icons';

// Transform flat data into nested structure
function transformToNestedData(flatData: any[]) {
  const dataMap: Record<number, any> = {};
  const nestedData: any[] = [];

  // Map all data by SLITTING_SRNO
  flatData.forEach((item) => {
    dataMap[item.SLITTING_SRNO] = { ...item, children: [] };
  });

  // Build hierarchy using SLITTING_SRNO_FK
  flatData.forEach((item) => {
    if (item.SLITTING_SRNO_FK) {
      const parent = dataMap[item.SLITTING_SRNO_FK];
      if (parent) {
        parent.children.push(dataMap[item.SLITTING_SRNO]);
      }
    } else {
      // Top-level record
      nestedData.push(dataMap[item.SLITTING_SRNO]);
    }
  });

  return nestedData;
}

// Recursive Nested Table Component
const RecursiveNestedTable = ({ data, setSlitingLevvel, setSelectedMaterial , setModalVisible, updateSlittedStatus, setIsSlitMaterialEdit}: { data: any[], setSlitingLevvel:any, setSelectedMaterial:any, setModalVisible:any , updateSlittedStatus:any,setIsSlitMaterialEdit:any}) => {

    const confirm: PopconfirmProps['onConfirm'] = (e:any) => {
        updateSlittedStatus(e.SLITTING_SRNO);
        message.success('Click on Yes');
      };
      
      const cancel: PopconfirmProps['onCancel'] = (e:any) => {
        message.error('Click on No');
      };
      
  const slittingColumns = [
    //  {
    //    title: 'SLITTING_SRNO',
    //    dataIndex: 'SLITTING_SRNO',
    //    key: 'SLITTING_SRNO',
    //  },
    //  {
    //    title: 'SLITTING_SRNO_FK',
    //    dataIndex: 'SLITTING_SRNO_FK',
    //    key: 'SLITTING_SRNO_FK',
    //  },
    {
      title: 'DC No',
      dataIndex: 'DC_NO',
      key: 'DC_NO',
    },
     {
       title: 'Date',
       dataIndex: 'SLITTING_DATE',
       key: 'SLITTING_DATE',
     },
     {
       title: 'Slit Width (mm)',
       dataIndex: 'SLITTING_WIDTH',
       key: 'SLITTING_WIDTH',
     },
     {
      title: 'Rem. Width (mm)',
      dataIndex: 'remainingWidth',
      key: 'remainingWidth',
    },
     {
       title: 'Slit Weight (kg)',
       dataIndex: 'SLITTING_WEIGHT',
       key: 'SLITTING_WEIGHT',
     },
     {
      title: 'Rem. Weight (kg)',
      dataIndex: 'remainingWeight',
      key: 'remainingWeight',
    },
    {
      title: 'Scrap (mm)',
      dataIndex: 'SLITTING_SCRAP',
      key: 'SLITTING_SCRAP',
    },
     {
      title: 'Location',
      dataIndex: 'C_LOCATION',
      key: 'C_LOCATION',
    },
     {
      title: 'SLITTING_STATUS',
      dataIndex: 'SLITTING_STATUS',
      key: 'SLITTING_STATUS',
    },
  
    //  {
    //    title: 'IS_SLITTED',
    //    key: 'IS_SLITTED',
    //    render: (text: any, record: any) => (
    //     <>
        
    //     {record.IS_SLITTED ? "Yes" : "No"}

    //      </>
    //    ),
    //  },
      {
           title: 'Actions',
           key: 'actions',
           render: (text: any, record: any) => (
            record.IS_SLITTED ? <Button color="default" variant="solid">Slitted</Button> :
               <Space>
                 <Tooltip title="Edit">

                   <Button
                     type="primary"
                     icon={<EditOutlined />}
                     onClick={() => {
                       
                       setIsSlitMaterialEdit(true);
                       setSelectedMaterial(record);
                       setModalVisible(true);
                     }}
                   >
                     {/* Edit */}
                   </Button>
                 </Tooltip>

                 <Tooltip title="Slit">
                   <Button
                     type="primary"
                     icon={<ScissorOutlined />}

                     onClick={() => {
                       setSlitingLevvel(record);
                       setSelectedMaterial(record);
                       setModalVisible(true);
                     }}
                   >
                     {/* Slit */}
                   </Button>
                 </Tooltip>
                 {record.SLITTING_WIDTH > record.remainingWidth || record.SLITTING_WEIGHT > record.remainingWeight ? null : (
                 <Tooltip title="Mark as Slitted">
                   <Popconfirm
                     className=""
                     title="Slitted done"
                     description="Are you sure to confirm?"
                     onConfirm={() => confirm(record)}
                     onCancel={cancel}
                     okText="Yes"
                     cancelText="No"
                   >
                     <Button color="primary" variant="solid" icon={<CheckCircleOutlined />}>
                       {/* Slitted */}
                     </Button>
                   </Popconfirm>
                 </Tooltip>
                )}
               </Space>
           ),
         },
   ];

  return (
    <Table
      columns={slittingColumns}
      dataSource={data}
      rowKey="SLITTING_SRNO"
      rowClassName={(record) => (record.IS_SLITTED ? 'row-slitted' : '')}
    //   expandable={{
    //     expandedRowRender: (record) =>
    //       record.children && record.children.length > 0 ? (
    //         // <RecursiveNestedTable data={record.children} />
    //       ) : null,
    //   }}
      pagination={false}
    />
  );
};
// const SlittingTable = ({ mainTableData, slittingData }: { mainTableData: any[], slittingData: any[] }) => {

// Main Table Component
const rawMaterialsStatus = ({ mainTableData, slittingData ,setSlitingLevvel, setSelectedMaterial,setModalVisible, updateSlittedStatus,setIsRawMaterialEdit , setIsSlitMaterialEdit}: { mainTableData: any[], slittingData: any[], setSlitingLevvel :any ,setSelectedMaterial:any, setModalVisible :any, updateSlittedStatus :any, setIsRawMaterialEdit:any,setIsSlitMaterialEdit:any }) => {
   
      
  const mainTableDataWithRemainingValues = mainTableData.map((record) => {
    // debugger
    const filteredSlittingData = slittingData.filter(
      (item) => (item.MATERIAL_SRNO === record.MATERIAL_SRNO && item.SLITTING_LEVEL === 1 && item.SLITTING_SRNO_FK === null)  
    );
    
    // Calculate total slitted weight and width
    const totalSlittedWeight = filteredSlittingData.reduce((sum, item) => sum + (item.SLITTING_WEIGHT || 0), 0);
    const totalSlittedWidth = filteredSlittingData.reduce((sum, item) => sum + (item.SLITTING_WIDTH || 0), 0);

    // Calculate remaining values
    const remainingWeight = (record.MATERIAL_WEIGHT || 0) - totalSlittedWeight - ((record.MATERIAL_SCRAP * record.MATERIAL_WEIGHT / record.MATERIAL_WIDTH) || 0);
    const remainingWidth = (record.MATERIAL_WIDTH || 0) - totalSlittedWidth - (record.MATERIAL_SCRAP || 0);

    return {
      ...record,
      IS_SEMI_SLITTED: totalSlittedWeight > 0,
      // remainingWeight: remainingWeight > 0 ? remainingWeight : 0, // Ensure no negative weights
      // remainingWidth: remainingWidth > 0 ? remainingWidth : 0,   // Ensure no negative widths
      remainingWeight: remainingWeight,
      remainingWidth: remainingWidth,
    };
  });


  const slittingWithRemainingValues = slittingData.map((record) => {

    // debugger
    const filteredSlittingData = slittingData.filter(
      (item) => (item.SLITTING_SRNO_FK === record.SLITTING_SRNO && item.SLITTING_LEVEL > record.SLITTING_LEVEL)  
    );

    // Calculate total slitted weight and width
    const totalSlittedWeight = filteredSlittingData.reduce((sum, item) => sum + (item.SLITTING_WEIGHT || 0), 0);
    const totalSlittedWidth = filteredSlittingData.reduce((sum, item) => sum + (item.SLITTING_WIDTH || 0), 0);

    // Calculate remaining values
    const remainingWeight = (record.SLITTING_WEIGHT || 0) - totalSlittedWeight;
    const remainingWidth = (record.SLITTING_WIDTH || 0) - totalSlittedWidth - (record.SLITTING_SCRAP || 0);

    return {
      ...record,
      IS_SEMI_SLITTED: totalSlittedWeight > 0,
      // remainingWeight: remainingWeight > 0 ? remainingWeight : 0, // Ensure no negative weights
      // remainingWidth: remainingWidth > 0 ? remainingWidth : 0,   // Ensure no negative widths
      remainingWeight: remainingWeight,
      remainingWidth: remainingWidth,

    };
  });
  
    const mainTableColumns = [
        {
          title: 'Challan No',
          dataIndex: 'CHALLAN_NO',
          key: 'CHALLAN_NO',
        },
        {
          title: 'Date',
          dataIndex: 'RECEIVED_DATE',
          key: 'RECEIVED_DATE',
        },
        {
          title: 'Grade',
          dataIndex: 'MATERIAL_GRADE',
          key: 'MATERIAL_GRADE',
        },
        {
          title: 'Thickness (mm)',
          dataIndex: 'MATERIAL_THICKNESS',
          key: 'MATERIAL_THICKNESS',
        },
        {
          title: 'Width (mm)',
          dataIndex: 'MATERIAL_WIDTH',
          key: 'MATERIAL_WIDTH',
        },
        {
          title: 'Rem. Width (mm)',
          dataIndex: 'remainingWidth',
          key: 'remainingWidth',
        },
        {
          title: 'Weight (kg)',
          dataIndex: 'MATERIAL_WEIGHT',
          key: 'MATERIAL_WEIGHT',
        },
        {
          title: 'Rem. Weight (kg)',
          dataIndex: 'remainingWeight',
          key: 'remainingWeight',
        },
        {
          title: 'Scrap (mm)',
          dataIndex: 'MATERIAL_SCRAP',
          render: (text: any,record:any) => `${record.MATERIAL_SCRAP || 0} + ${record.SLIT_MATERIAL_SCRAP || 0} `,
        },
        {
          title: 'Location',
          dataIndex: 'MATERIAL_C_LOCATION',
          key: 'MATERIAL_C_LOCATION',
        },
        {
          title: 'MATERIAL_STATUS',
          dataIndex: 'MATERIAL_STATUS',
          key: 'MATERIAL_STATUS',
        },
        {
          title: 'Actions',
          key: 'actions',
          render: (text: any, record: any) => (
            <Space>
              <Tooltip title="Edit">

            <Button
               type="primary"
                icon={<EditOutlined />}
               onClick={() => {
                 //  setSlitingLevvel(record);
                 setIsRawMaterialEdit(true);
                 setSelectedMaterial(record);
                 //  setModalVisible(true);
                }}
                >
               {/* Edit */}
             </Button>
                  </Tooltip>
            <Tooltip title="Slit">
            <Button
              type="primary"
              icon={<ScissorOutlined />}
              onClick={() => {
                setSelectedMaterial(record);
                setModalVisible(true);
              }}
              >
              {/* Slit */}
            </Button>
            </Tooltip>
              </Space>
          ), 
        },
      ];



  return (
    <div>
      {/* <h1>Main Table</h1> */}
      <Table
      className="raw-material-table"
        columns={mainTableColumns}
        dataSource={mainTableDataWithRemainingValues}
        rowKey="MATERIAL_SRNO"
        expandable={{
          expandedRowRender: (record) => {
            // Create a copy of slittingData filtered for the current MATERIAL_SRNO
            const filteredSlittingData = slittingWithRemainingValues.filter(
              (item) => item.MATERIAL_SRNO === record.MATERIAL_SRNO
            );

            // Transform filtered data into a nested structure
            const nestedSlittingData = transformToNestedData(filteredSlittingData);

            return (
              <div>
                {/* <h2>Slitting Details</h2> */}
                <RecursiveNestedTable data={nestedSlittingData} setSlitingLevvel={setSlitingLevvel} setSelectedMaterial={setSelectedMaterial} setModalVisible={setModalVisible} updateSlittedStatus={updateSlittedStatus} setIsSlitMaterialEdit={setIsSlitMaterialEdit} />
              </div>
            );
          },
        }}
        pagination={false}
      />
    </div>
  );
};

export default rawMaterialsStatus;
