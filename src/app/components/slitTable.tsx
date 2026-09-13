import React, { useRef, useState } from "react";
import { Button, Input, InputRef, message, Popconfirm, PopconfirmProps, Space, Table, TableColumnType, Tooltip } from "antd";
import { EditOutlined, ScissorOutlined, CheckCircleOutlined, SearchOutlined, DeleteColumnOutlined, DeleteFilled,CheckOutlined, FileExcelOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import { FilterDropdownProps } from "antd/es/table/interface";
import { exportExcelPro, sortByDateDesc } from "@/utils/exportExcelPro";


interface DataType {
  key: string;
  CHALLAN_NO: string;
    RECEIVED_DATE: string;
    MATERIAL_GRADE: string;
    MATERIAL_GRADE_SRNO: number;
    MATERIAL_C_LOCATION: string;
    MATERIAL_C_LOCATION_SRNO: number;
    MATERIAL_THICKNESS: string;
    MATERIAL_THICKNESS_SRNO: number;
    MATERIAL_WIDTH: number;
    MATERIAL_WEIGHT: number;
    remainingWeight: number;
    remainingWidth: number;
    MATERIAL_SRNO: number;
    MATERIAL_SCRAP: Number;
    SLIT_MATERIAL_SCRAP: Number
}

type DataIndex = keyof DataType;
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
const RecursiveNestedTable = ({ data, setSlitingLevvel, setSelectedMaterial , setModalVisible, updateSlittedStatus,delRawSlit, setIsSlitMaterialEdit}: { data: any[], setSlitingLevvel:any, setSelectedMaterial:any, setModalVisible:any,  updateSlittedStatus:any,delRawSlit:any,setIsSlitMaterialEdit:any}) => {

    const confirmSlit: PopconfirmProps['onConfirm'] = (e:any) => {
        updateSlittedStatus(e.SLITTING_SRNO,'P','S');
        // message.success('Click on Yes');
      };
    const confirmSlitDelete: PopconfirmProps['onConfirm'] = (e:any) => {
        delRawSlit(e.SLITTING_SRNO, false);
        // message.success('Click on Yes');
      };
      
      const cancel: PopconfirmProps['onCancel'] = (e:any) => {
        // message.error('Click on No');
      };
      
  const slittingColumns = [

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
      title: "Total",
      key: "width_weight",
      width: 120,
      render: (text: any, record: any) => (
        <Tooltip title={`Width: ${record.SLITTING_WIDTH} mm, Weight: ${record.SLITTING_WEIGHT} kg`}>
          <div>{record.SLITTING_WIDTH} mm</div>
          <div>{record.SLITTING_WEIGHT} kg</div>
        </Tooltip>
      ),
    },
    {
      title: "Balance",
      key: "remaining_width_weight",
      width: 120,
      render: (text: any, record: any) => (
        <Tooltip title={`Remaining Width: ${record.remainingWidth} mm, Remaining Weight: ${record.remainingWeight} kg`}>
          <div> {record.remainingWidth} mm</div>
          <div> {record.remainingWeight} kg</div>
        </Tooltip>
      ),
    },
    {
      title: "Scrap",
      key: "scrap",
      width: 120,
      render: (text: any, record: any) => (
        <Tooltip 
        // title={`Scrap Width: ${record.SLITTING_SCRAP} mm, Scrap Weight: ${record.SLITTING_SCRAP_WEIGHT} kg`}
        title={`Scrap Weight: ${record.SLITTING_SCRAP_WEIGHT} kg`}
        >
          <div> {record.SLITTING_SCRAP} mm</div>
          <div> {record.SLITTING_SCRAP_WEIGHT} kg</div>
        </Tooltip>
      ),
    },
    //  {
    //    title: 'Slit Width (mm)',
    //    dataIndex: 'SLITTING_WIDTH',
    //    key: 'SLITTING_WIDTH',
    //  },
    //  {
    //   title: 'Rem. Width (mm)',
    //   dataIndex: 'remainingWidth',
    //   key: 'remainingWidth',
    // },
    //  {
    //    title: 'Slit Weight (kg)',
    //    dataIndex: 'SLITTING_WEIGHT',
    //    key: 'SLITTING_WEIGHT',
    //  },
    //  {
    //   title: 'Rem. Weight (kg)',
    //   dataIndex: 'remainingWeight',
    //   key: 'remainingWeight',
    // },
    // {
    //   title: 'Scrap (mm)',
    //   dataIndex: 'SLITTING_SCRAP',
    //   key: 'SLITTING_SCRAP',
    // },
    // {
    //   title: 'Scrap (KG)',
    //   dataIndex: 'scrap_weight',
    //   key: 'scrap_weight',
    // },
     {
      title: 'Location',
      dataIndex: 'C_LOCATION',
      key: 'C_LOCATION',
    },
     {
      title: 'Status',
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

                 {  record.SLITTING_WIDTH > record.remainingWidth || record.SLITTING_WEIGHT > record.remainingWeight ? null : (
                    <Tooltip title="Mark as Slitted">
                      <Popconfirm
                          className=""
                          title="Slitted done"
                          description="Are you sure to confirm?"
                          onConfirm={() => confirmSlit(record)}
                          onCancel={cancel}
                          okText="Yes"
                          cancelText="No"
                          >
                          <Button color="primary" variant="solid" icon={<CheckCircleOutlined />}></Button>
                        </Popconfirm>
                    </Tooltip>
                    )
                  }


{record.SLITTING_STATUS== 'In Slitting' && (
<Tooltip title="Mark as Completed">
                      <Popconfirm
                        title="Complete Slitting"
                        description="Are you sure you want to mark this as completed?"
                        onConfirm={() => updateSlittedStatus(record.SLITTING_SRNO,'P','C')}
                        onCancel={cancel}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button 
                            type="primary" 
                            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }} 
                            icon={<CheckOutlined />}
                          >
                            {/* Mark as Completed */}
                          </Button>

                      </Popconfirm>
                    </Tooltip>
)}

              <Tooltip title="Delete">
              <Popconfirm
                     className=""
                     title="Delete Slitted Coil"
                     description="Are you sure to confirm?"
                     onConfirm={() => confirmSlitDelete(record)}
                     onCancel={cancel}
                     okText="Yes"
                     cancelText="No"
                   >
                     <Button color="danger" variant="solid" icon={<DeleteFilled />}>
                       {/* Delete */}
                     </Button>
                   </Popconfirm>
                    </Tooltip>


                    
               </Space>
           ),
         },
   ];

  return (
    <Table
    className=" table-blue p-5"
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
const SlittingTable = ({ mainTableData, slittingData ,setSlitingLevvel, setSelectedMaterial,setModalVisible, setMotherModalVisible ,updateSlittedStatus,delRawSlit,setIsRawMaterialEdit , setIsSlitMaterialEdit}: { mainTableData: any[], slittingData: any[], setSlitingLevvel :any ,setSelectedMaterial:any, setModalVisible :any,setMotherModalVisible:any, updateSlittedStatus :any,delRawSlit:any, setIsRawMaterialEdit:any,setIsSlitMaterialEdit:any }) => {
  const [searchText, setSearchText] = useState('');const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<InputRef>(null);  
 
  const confirmMotherDelete: PopconfirmProps['onConfirm'] = (e:any) => {
    delRawSlit(e.MATERIAL_SRNO, true);
    // message.success('Click on Yes');
  };
  
  const cancel: PopconfirmProps['onCancel'] = (e:any) => {
    // message.error('Click on No');
  };
      
  const mainTableDataWithRemainingValues = mainTableData.map((record) => {
    // debugger
    const filteredSlittingData = slittingData.filter(
      (item) => (item.MATERIAL_SRNO === record.MATERIAL_SRNO && item.SLITTING_LEVEL === 1 && item.SLITTING_SRNO_FK === null)  
    );
    // Calculate total slitted weight and width
    const totalSlittedWeight = filteredSlittingData.reduce((sum, item) => sum + (item.SLITTING_WEIGHT || 0), 0);
    const totalSlittedWidth = filteredSlittingData.reduce((sum, item) => sum + (item.SLITTING_WIDTH || 0), 0);

    // alert(totalSlittedWeight)
    // Calculate remaining values
    // const SLIT_MATERIAL_SCRAP_weight = ((record.SLIT_MATERIAL_SCRAP * record.MATERIAL_WEIGHT / record.MATERIAL_WIDTH) || 0)
    // const scrap_weight = ((record.MATERIAL_SCRAP * record.MATERIAL_WEIGHT / record.MATERIAL_WIDTH) || 0)
    const remainingWeight = (record.MATERIAL_WEIGHT || 0) - totalSlittedWeight - (record.MATERIAL_SCRAP_WEIGHT || 0);
    const remainingWidth = (record.MATERIAL_WIDTH || 0) - totalSlittedWidth - (record.MATERIAL_SCRAP || 0);

    return {
      ...record,
      IS_SEMI_SLITTED: totalSlittedWeight > 0,
      remainingWeight: remainingWidth > 0 ?(remainingWeight > 0 ? parseFloat(remainingWeight.toFixed(2)) : 0) : 0, // Ensure no negative weights
      remainingWidth: remainingWidth > 0 ? remainingWidth : 0,   // Ensure no negative widths
      // scrap_weight: (scrap_weight > 0 ? parseFloat(scrap_weight.toFixed(2)) : 0),
      // SLIT_MATERIAL_SCRAP_weight : parseFloat(SLIT_MATERIAL_SCRAP_weight.toFixed(2)),

      // remainingWeight: remainingWeight,
      // remainingWidth: remainingWidth,
    };
  });


  const slittingWithRemainingValues = slittingData.map((record) => {

    // debugger
    const filteredSlittingData = slittingData.filter(
      (item) => (item.SLITTING_SRNO_FK === record.SLITTING_SRNO && item.SLITTING_LEVEL > record.SLITTING_LEVEL)  
    );

    // Calculate total slitted weight and width
    // const scrap_weight = ((record.SLITTING_SCRAP * record.SLITTING_WEIGHT / record.SLITTING_WIDTH) || 0)
    const totalSlittedWeight = filteredSlittingData.reduce((sum, item) => sum + (item.SLITTING_WEIGHT || 0), 0);
    const totalSlittedWidth = filteredSlittingData.reduce((sum, item) => sum + (item.SLITTING_WIDTH || 0), 0);

    // Calculate remaining values
    const remainingWeight = (record.SLITTING_WEIGHT || 0) - totalSlittedWeight - (record.SLITTING_SCRAP_WEIGHT || 0);
    const remainingWidth = (record.SLITTING_WIDTH || 0) - totalSlittedWidth - (record.SLITTING_SCRAP || 0);

    return {
      ...record,
      IS_SEMI_SLITTED: totalSlittedWeight > 0,
      remainingWeight:  remainingWidth > 0 ?(remainingWeight > 0 ? parseFloat(remainingWeight.toFixed(2)) : 0) : 0 , // Ensure no negative weights
      remainingWidth: remainingWidth > 0 ? remainingWidth : 0,   // Ensure no negative widths
      // scrap_weight: parseFloat(scrap_weight.toFixed(2)),
      // remainingWidth: remainingWidth,

    };
  });

  // Enriched, flat copy of slitting data (for Excel export only) - adds the parent mother coil's
  // challan number so each slit/semi-slit row is traceable back to its source coil.
  const slittingWithRemainingValuesForExport = slittingWithRemainingValues.map((record: any) => {
    const parentMother = mainTableData.find((m) => m.MATERIAL_SRNO === record.MATERIAL_SRNO);
    return {
      ...record,
      MOTHER_CHALLAN_NO: parentMother ? parentMother.CHALLAN_NO : '',
    };
  });

  // ---------------------------------------------------------------------
  // Excel Exports
  // ---------------------------------------------------------------------

  const motherCoilExportColumns = [
    { header: 'Challan No', key: 'CHALLAN_NO' },
    { header: 'Received Date', key: 'RECEIVED_DATE' },
    { header: 'Grade', key: 'MATERIAL_GRADE' },
    { header: 'Thickness (mm)', key: 'MATERIAL_THICKNESS' },
    { header: 'Width (mm)', key: 'MATERIAL_WIDTH', type: 'number' as const },
    { header: 'Weight (kg)', key: 'MATERIAL_WEIGHT', type: 'number' as const },
    { header: 'Balance Width (mm)', key: 'remainingWidth', type: 'number' as const },
    { header: 'Balance Weight (kg)', key: 'remainingWeight', type: 'number' as const },
    { header: 'Scrap (mm)', key: 'MATERIAL_SCRAP', type: 'number' as const },
    { header: 'Scrap (kg)', key: 'MATERIAL_SCRAP_WEIGHT', type: 'number' as const },
    { header: 'Location', key: 'MATERIAL_C_LOCATION' },
    { header: 'Status', key: 'MATERIAL_STATUS' },
    { header: 'Rate (₹/kg)', key: 'RATE_PER_KG', type: 'number' as const },
    { header: 'Value (₹)', key: 'VALUE', type: 'number' as const },
  ];

  const slittingExportColumns = [
    { header: 'DC No', key: 'DC_NO' },
    { header: 'Mother Coil Challan No', key: 'MOTHER_CHALLAN_NO' },
    { header: 'Slitting Date', key: 'SLITTING_DATE' },
    { header: 'Grade', key: 'SLITTING_GRADE' },
    { header: 'Thickness (mm)', key: 'SLITTING_THICKNESS' },
    { header: 'Width (mm)', key: 'SLITTING_WIDTH', type: 'number' as const },
    { header: 'Weight (kg)', key: 'SLITTING_WEIGHT', type: 'number' as const },
    { header: 'Balance Width (mm)', key: 'remainingWidth', type: 'number' as const },
    { header: 'Balance Weight (kg)', key: 'remainingWeight', type: 'number' as const },
    { header: 'Scrap (mm)', key: 'SLITTING_SCRAP', type: 'number' as const },
    { header: 'Scrap (kg)', key: 'SLITTING_SCRAP_WEIGHT', type: 'number' as const },
    { header: 'Location', key: 'C_LOCATION' },
    { header: 'Status', key: 'SLITTING_STATUS' },
  ];

  // 1) RM Stock export - mother (raw) coils only, current on-screen data
  const handleExportRmStock = async () => {
    if (!mainTableDataWithRemainingValues || mainTableDataWithRemainingValues.length === 0) {
      message.warning('No data to export.');
      return;
    }
    try {
      await exportExcelPro(
        [
          {
            sheetName: 'RM Stock',
            title: 'Omech - Raw Material (Mother Coil) Stock',
            columns: motherCoilExportColumns,
            rows: sortByDateDesc(mainTableDataWithRemainingValues, 'RECEIVED_DATE'),
          },
        ],
        'RM_Stock',
        'Sorted by Received Date - descending'
      );
    } catch (err) {
      console.error('Export error:', err);
      message.error('Failed to export RM Stock');
    }
  };

  // 2) Mother Coil + Slitting Coil with Position details - combined, two-sheet workbook
  const handleExportCoilPosition = async () => {
    if (
      (!mainTableDataWithRemainingValues || mainTableDataWithRemainingValues.length === 0) &&
      (!slittingWithRemainingValuesForExport || slittingWithRemainingValuesForExport.length === 0)
    ) {
      message.warning('No data to export.');
      return;
    }
    try {
      await exportExcelPro(
        [
          {
            sheetName: 'Mother Coils',
            title: 'Omech - Mother Coils (with Position)',
            columns: motherCoilExportColumns,
            rows: sortByDateDesc(mainTableDataWithRemainingValues, 'RECEIVED_DATE'),
          },
          {
            sheetName: 'Slitting Coils',
            title: 'Omech - Slitting Coils (with Position)',
            columns: slittingExportColumns,
            rows: sortByDateDesc(slittingWithRemainingValuesForExport, 'SLITTING_DATE'),
          },
        ],
        'Mother_and_Slitting_Coils_Position',
        'Each sheet sorted by its date column - descending'
      );
    } catch (err) {
      console.error('Export error:', err);
      message.error('Failed to export coil position report');
    }
  };


   


//
const handleSearch = (
  selectedKeys: string[],
  confirm: FilterDropdownProps['confirm'],
  dataIndex: DataIndex,
) => {
  confirm();
  setSearchText(selectedKeys[0]);
  setSearchedColumn(dataIndex);
};

const handleReset = (clearFilters: () => void) => {
  clearFilters();
  setSearchText('');
};

const getColumnSearchProps = (dataIndex: DataIndex): TableColumnType<DataType> => ({
  filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
    <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
      <Input
        ref={searchInput}
        placeholder={`Search`}
        value={selectedKeys[0]}
        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
        onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
        style={{ marginBottom: 8, display: 'block' }}
      />
      <Space>
        <Button
          type="primary"
          onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          icon={<SearchOutlined />}
          size="small"
          style={{ width: 90 }}
        >
          Search
        </Button>
        <Button
          onClick={() => clearFilters && handleReset(clearFilters)}
          size="small"
          style={{ width: 90 }}
        >
          Reset
        </Button>
        <Button
          type="link"
          size="small"
          onClick={() => {
            confirm({ closeDropdown: false });
            setSearchText((selectedKeys as string[])[0]);
            setSearchedColumn(dataIndex);
          }}
        >
          Filter
        </Button>
        <Button
          type="link"
          size="small"
          onClick={() => {
            close();
          }}
        >
          close
        </Button>
      </Space>
    </div>
  ),
  filterIcon: (filtered: boolean) => (
    <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
  ),
  onFilter: (value:any, record:any) =>
    record[dataIndex]
      .toString()
      .toLowerCase()
      .includes((value as string).toLowerCase()),
  filterDropdownProps: {
    onOpenChange(open : any) {
      if (open) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
  },
  render: (text : any) =>
    searchedColumn === dataIndex ? (
      <Highlighter
        highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
        searchWords={[searchText]}
        autoEscape
        textToHighlight={text ? text.toString() : ''}
      />
    ) : (
      text
    ),
});

const mainTableColumns = [
  {
    title: 'Challan No',
    dataIndex: 'CHALLAN_NO',
    key: 'CHALLAN_NO',
    ...getColumnSearchProps('CHALLAN_NO'),
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
    title: "Total",
    key: "width_weight",
    width: 140,
    render: (text: any, record: any) => (
      <Tooltip title={`Width: ${record.MATERIAL_WIDTH} mm, Weight: ${record.MATERIAL_WEIGHT} kg`}>
        <div>{record.MATERIAL_WIDTH} mm</div>
        <div>{record.MATERIAL_WEIGHT} kg</div>
      </Tooltip>
    ),
  },
  {
    title: "Balance",
    key: "remaining_width_weight",
    width: 140,
    render: (text: any, record: any) => (
      <Tooltip title={`Remaining Width: ${record.remainingWidth} mm, Remaining Weight: ${record.remainingWeight} kg`}>
        <div> {record.remainingWidth} mm</div>
        <div> {record.remainingWeight} kg</div>
      </Tooltip>
    ),
  },
  {
    title: "Scrap",
    key: "scrap",
    width: 150,
    render: (text: any, record: any) => (
      <Tooltip 
      // title={`Mother Coil Slitting Scrap: ${record.MATERIAL_SCRAP || 0} mm , Slitting Process Scrap : (${record.SLIT_MATERIAL_SCRAP || 0} mm), Mother Coil Slitting Weight: ${record.scrap_weight || 0} kg , Slitting Process Weight (${record.SLIT_MATERIAL_SCRAP_weight || 0} kg)`}
      title={`Mother Coil Slitting Weight: ${record.MATERIAL_SCRAP_WEIGHT || 0} kg , Slitting Process Weight (${record.SLIT_MATERIAL_SCRAP_WEIGHT || 0} kg)`}>
        <div>{record.MATERIAL_SCRAP || 0} + {record.SLIT_MATERIAL_SCRAP || 0} mm</div>
        <div>{record.MATERIAL_SCRAP_WEIGHT || 0} + {record.SLIT_MATERIAL_SCRAP_WEIGHT || 0} kg</div>
      </Tooltip>
    ),
  },
  // {
  //   title: 'Width (mm)',
  //   dataIndex: 'MATERIAL_WIDTH',
  //   key: 'MATERIAL_WIDTH',
  // },
  // {
  //   title: 'Rem. Width (mm)',
  //   dataIndex: 'remainingWidth',
  //   key: 'remainingWidth',
  // },
  // {
  //   title: 'Weight (kg)',
  //   dataIndex: 'MATERIAL_WEIGHT',
  //   key: 'MATERIAL_WEIGHT',
  // },
  // {
  //   title: 'Rem. Weight (kg)',
  //   dataIndex: 'remainingWeight',
  //   key: 'remainingWeight',
  // },
  // {
  //   title: 'Scrap (mm)',
  //   dataIndex: 'MATERIAL_SCRAP',
  //   render: (text: any,record:any) => `${record.MATERIAL_SCRAP || 0} + ${record.SLIT_MATERIAL_SCRAP || 0} `,
  // },
  // {
  //   title: 'Scrap (KG)',
  //   dataIndex: 'scrap_weight',
  //   render: (text: any,record:any) => `${record.scrap_weight || 0} + ${record.SLIT_MATERIAL_SCRAP_weight || 0} `,
  // },
  {
    title: 'Location',
    dataIndex: 'MATERIAL_C_LOCATION',
    key: 'MATERIAL_C_LOCATION',
  },
  {
    title: 'Status',
    dataIndex: 'MATERIAL_STATUS',
    key: 'MATERIAL_STATUS',
  },
  {
    title: 'Rate / Value',
    key: 'rate_value',
    width: 140,
    render: (text: any, record: any) => {
      const rate = Number(record.RATE_PER_KG) || 0;
      const value = Number(record.VALUE) || 0;
      return (
        <Tooltip title={`Rate: ₹${rate}/kg, Value: ₹${value} (from database, based on total/original weight)`}>
          <div>₹{rate}/kg</div>
          <div>₹{value}</div>
        </Tooltip>
      );
    },
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
           setMotherModalVisible(true);
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
        {record.MATERIAL_STATUS== 'In Slitting' && (
      <Tooltip title="Mark as Completed">
                      <Popconfirm
                        title="Complete Slitting"
                        description="Are you sure you want to mark this as completed?"
                        onConfirm={() => updateSlittedStatus(record.MATERIAL_SRNO,'M','C')}
                        onCancel={cancel}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button 
                            type="primary" 
                            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }} 
                            icon={<CheckOutlined />}
                          >
                            {/* Mark as Completed */}
                          </Button>

                      </Popconfirm>
                    </Tooltip>
        )}
      <Tooltip title="Delete">
      <Popconfirm
                     className=""
                     title="Delete Mother Coil"
                     description="Are you sure to confirm?"
                     onConfirm={() => confirmMotherDelete(record)}
                     onCancel={cancel}
                     okText="Yes"
                     cancelText="No"
                   >
                     <Button color="danger" variant="solid" icon={<DeleteFilled />}>
                       {/* Delete */}
                     </Button>
                   </Popconfirm>
      </Tooltip>
        </Space>
    ), 
  },
];
//
  return (
    <div>
      {/* <h1>Main Table</h1> */}
      <Space style={{ marginBottom: 12 }}>
        <Tooltip title="Export the raw material (mother coil) stock currently listed below">
          <Button icon={<FileExcelOutlined />} onClick={handleExportRmStock}>
            Export RM Stock
          </Button>
        </Tooltip>
        <Tooltip title="Export Mother Coils and Slitting Coils together, each with its current location/position">
          <Button icon={<FileExcelOutlined />} onClick={handleExportCoilPosition}>
            Export Mother &amp; Slitting Coils (Position)
          </Button>
        </Tooltip>
      </Space>
      <Table
      className="raw-material-table table-red"
        columns={mainTableColumns}
        dataSource={mainTableDataWithRemainingValues}
        rowKey="MATERIAL_SRNO"
        style={{ backgroundColor: '#e3f2fd' }} // Light blue
        // scroll={{ x: 1300 }}
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
                <RecursiveNestedTable data={nestedSlittingData} setSlitingLevvel={setSlitingLevvel} setSelectedMaterial={setSelectedMaterial} setModalVisible={setModalVisible} updateSlittedStatus={updateSlittedStatus} delRawSlit={delRawSlit} setIsSlitMaterialEdit={setIsSlitMaterialEdit} />
              </div>
            );
          },
        }}
        // pagination={false}
      />
    </div>
  );
};

export default SlittingTable;
