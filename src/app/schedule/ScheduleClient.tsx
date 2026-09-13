'use client'

import { apiClient } from '@/utils/apiClient'
import { getCookieData } from '@/utils/common'
import { Button, Form, message, Select, Space, Table, Tooltip } from 'antd'
import { useEffect, useState } from 'react'
import RawInventoryDtl from '../components/RawInvetoryDtl'

type SectionedValue = {
  section: string;
  label: string;
  value: string;
};

type Pipe = {
  id: number
  OD: number
  THICKNESS: number
  GRADE: string
  AVAILABLE_QUANTITY: number,
  THICKNESS_SRNO: number,
  OD_SRNO: number
}

type Coil = {
  id: number
  SLITTING_WIDTH: number
  thickness: number
  grade: string
  balanceWeight: number
}

type ScheduleAnalysisProps = {
  GRADE_SRNO?: string;
  OD_SRNO?: string;
  THICKNESS_SRNO?: string;
  PR_LENGTH?: number;
  PR_PRICE?: number;
  PR_QUANTITY?: number;
  autoSearch?: boolean;
  isLengthModal?: boolean;
}

export default function ScheduleClient({
  GRADE_SRNO="",
  OD_SRNO="",
  THICKNESS_SRNO="",
  PR_LENGTH=0,
  PR_PRICE=0,
  PR_QUANTITY=0,
  autoSearch = false,
  isLengthModal = false
}: ScheduleAnalysisProps) {
 
  const [pipes, setPipes] = useState<Pipe[]>([])
  const [coils, setCoils] = useState<Coil[]>([])
  const [loading, setLoading] = useState(false)

  // States for Show Modal of Raw Inventory Detail
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMaterialSrnos, setSelectedMaterialSrnos] = useState<any>(null);
    const [selectedSlittingSrnos, setSelectedSlittingSrnos] = useState<any>(null);
    const [selectedCoilTypeFlag, setSelectedCoilTypeFlag] = useState<any>(null);
const [groupedSummary, setGroupedSummary] = useState<
  Record<string, { label: string; value: string }[]>
>({});
    const [optGrades, setOptGrades] = useState<{ label: string; value: string }[]>([]);
      const [optThickness, setoptThickNess] = useState<{ label: string; value: string }[]>([]);
  
    const [optOD, setOptOD] = useState<{ label: string; value: string }[]>([]);
    
  const [searchForm] = Form.useForm();
 
 
   const cookiesData = getCookieData();
   const { USER_SRNO, API_BASE_URL, UT_SRNO } = cookiesData;

     useEffect(() => {
       FetchPlCommon();
     }, []);

useEffect(() => {
  if (autoSearch) {
      let queryString = `GRADE_SRNO=${GRADE_SRNO}&OD_SRNO=${OD_SRNO}&THICKNESS_SRNO=${THICKNESS_SRNO}&PR_LENGTH=${PR_LENGTH}&PR_PRICE=${PR_PRICE}&PR_QUANTITY=${PR_QUANTITY}`;

    // Call search function
    handleSearch(queryString);
  }
}, [autoSearch, GRADE_SRNO, OD_SRNO, THICKNESS_SRNO, PR_LENGTH, PR_PRICE, PR_QUANTITY]);
       //clear selected srnos
       useEffect(() => {
         if (!!!modalVisible) {
           setSelectedMaterialSrnos(null);
           setSelectedSlittingSrnos(null);
         }
       }, [modalVisible]);



   // Fetch dropdown options for locations
     const FetchPlCommon = async () => {
       const response = await apiClient<Record<string, any>>(
         `${API_BASE_URL}Pl_Common?USER_SRNO=${USER_SRNO}&UT_SRNO=${UT_SRNO}&TBL_SRNO=1,2,3`,
         "GET"
       );
       if (response.msgId === 200) {
         if (!response.data) return;
         const { Table1, Table2,Table3 } = response.data;
         setOptGrades(Table1)
         setOptOD(Table2)
         setoptThickNess(Table3)
       } else {
         message.error(response.msg);
         console.error("API Error:", response.msg);
       }
     };


  const handleSearch = async (autoQueryString: string) => {
    setLoading(true)
    try {
         const searchFromValues = searchForm.getFieldsValue();
    const searchParam = {
      ...searchFromValues
    };
    // Handle undefined values
    Object.keys(searchParam).forEach(queryKey => {
      if (searchParam[queryKey] === undefined) {
      searchParam[queryKey] = '';
      }
    });
    // conveert it into query string USING FOREACH
    let queryString = '';
    Object.keys(searchParam).forEach(queryKey => {
      if (searchParam[queryKey]) {
        queryString += `${queryKey}=${searchParam[queryKey]}&`;
      }
    });
    // Final Query String if autoQueryString is not empty
    if (autoQueryString) {
      queryString = autoQueryString;
    }
    
     const response = await apiClient(`${API_BASE_URL}getInvStatusScheduleWise?${USER_SRNO}&${queryString}`, "GET");
       if (response.msgId === 200) {
        if (!response.data) return;
         setPipes(response.data.Table)
      setCoils(response.data.Table1) ;


        const result = response.data.Table2; // Assuming this contains section-label-value

      // ✅ Grouping section data
        const grouped: Record<string, { label: string; value: string }[]> = {};

        result?.forEach((item: { section: string; label: string; value: string }) => {
            if (!grouped[item.section]) {
            grouped[item.section] = [];
            }
            grouped[item.section].push({ label: item.label, value: item.value });
        });
        setGroupedSummary(grouped); // ⬅️ Call a useState hook to store this

      } else {
        message.error(response.msg);
        console.error("API Error:", response.msg);
      }

     
    } catch (error) {
      console.error('Error fetching data', error)
    }
    setLoading(false)
  }


  // Table columns for data
  const columns = [
    // {
    //   title: 'Challan No.',
    //   dataIndex: 'CHALLAN_NO',
    //   key: 'CHALLAN_NO',
    // },
    {
      title: 'Location',
      dataIndex: 'C_LOCATION',
      key: 'C_LOCATION',
    },
    {
      title: 'Width',
      dataIndex: 'BALANCE_WIDTH',
      key: 'BALANCE_WIDTH',
    },  
    {
      title: 'Weight',
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
      title: 'Status',
      dataIndex: 'STATUS_NAME',
      key: 'STATUS_NAME',
    },
    {
      title: 'Source',
      dataIndex: 'COIL_TYPE',
      key: 'COIL_TYPE',
    },
    {
      title: 'Quantity',
      key: 'QUANTITY',
      render: (text: any, record: any) => (
      <Space size="middle">
        <a onClick={() => handleQuantityClick(record)}>{record.QUANTITY}</a>
      </Space>
      ),
    }
    
  ];

   // Function to handle click of quantity
  const handleQuantityClick = (record: any) => {
    setModalVisible(true);
    setSelectedMaterialSrnos(record.MATERIAL_SRNOS);
    setSelectedSlittingSrnos(record.SLITTING_SRNOS);
    setSelectedCoilTypeFlag(record.COIL_TYPE_FLAG);
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6" hidden={autoSearch}>
            <h1 className="text-2xl font-bold mb-4">Scheduling Page</h1>
            <Form
                layout="vertical"
                className="mb-6"
                onFinish={handleSearch}
                form={searchForm}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Form.Item name="GRADE_SRNO" label="Grade">
                        <Select
                            showSearch
                            placeholder="Select Grade"
                            options={optGrades}
                            filterOption={(input: any, option: any) =>
                                option?.label.toLowerCase().includes(input.toLowerCase())
                            }
                            allowClear
                        />
                    </Form.Item>
                    <Form.Item name="OD_SRNO" label="OD">
                        <Select
                            showSearch
                            placeholder="Select OD"
                            options={optOD}
                            filterOption={(input: any, option: any) =>
                                option?.label.toLowerCase().includes(input.toLowerCase())
                            }
                            allowClear
                        />
                    </Form.Item>
                    <Form.Item name="THICKNESS_SRNO" label="Thickness">
                        <Select
                            showSearch
                            placeholder="Select Thickness"
                            options={optThickness}
                            filterOption={(input: any, option: any) =>
                                option?.label.toLowerCase().includes(input.toLowerCase())
                            }
                            allowClear
                        />
                    </Form.Item>
                    <Form.Item name="PR_LENGTH" label="Length">
                        <input
                            type="number"
                            name="length"
                            className="border rounded px-2 py-1 w-full"
                            placeholder="Length"
                        />
                    </Form.Item>
                    <Form.Item name="PR_PRICE" label="Price Per KG">
                        <input
                            type="number"
                            name="Price"
                            className="border rounded px-2 py-1 w-full"
                            placeholder="Price Per KG"
                        />
                    </Form.Item>
                    <Form.Item name="PR_QUANTITY" label="Quantity">
                        <input
                            type="number"
                            name="quantity"
                            className="border rounded px-2 py-1 w-full"
                            placeholder="Quantity"
                        />
                    </Form.Item>
                </div>
                <div className="flex justify-end mt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
                    >
                        {loading ? 'Checking...' : 'Check Availability'}
                    </button>
                </div>
            </Form>
        </div>

        {modalVisible && (
            <RawInventoryDtl
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
                selectedMaterialSrnos={selectedMaterialSrnos}
                selectedSlittingSrnos={selectedSlittingSrnos}
                selectedCoilTypeFlag={selectedCoilTypeFlag}
            />
        )}

        {/* Results */}
        <div className="mt-8 grid grid-cols-1 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Available Pipes</h2>
                {pipes.length > 0 ? (
                    <Table
                      dataSource={pipes}
                      columns={[
                        {
                          title: 'Location',
                          dataIndex: 'C_LOCATION',
                          key: 'C_LOCATION',
                        },
                        {
                          title: 'Pipe Length',
                          dataIndex: 'PIPE_LENGTH',
                          key: 'PIPE_LENGTH',
                        },
                        {
                          title: 'Available Quantity',
                          dataIndex: 'AVAILABLE_QUANTITY',
                          key: 'AVAILABLE_QUANTITY',
                        },
                     {
                          title: 'Pipe Can Be Produced',
                          key: 'actions',
                          render: (text: any, record: any) => (
                            <Space size="middle">
                              {/* quantity per pipe * Total Quantity = Total Quantity */}
                              <span>
                                <Tooltip title={`Quantity per pipe: ${record.QUANTITY_PER_PIPE}`}>
                                  <span>{record.QUANTITY_PER_PIPE}</span>
                                </Tooltip>
                                {' * '}
                                <Tooltip title={`Available quantity: ${record.AVAILABLE_QUANTITY}`}>
                                  <span>{record.AVAILABLE_QUANTITY}</span>
                                </Tooltip>
                                {' = '}
                                <Tooltip title={`Total Pipe Can Be Produced: ${record.TOTAL_QUANTITY_PER_PIPE}`}>
                                  <span>{record.TOTAL_QUANTITY_PER_PIPE}</span>
                                </Tooltip>
                              </span>
                            </Space>
                          ),
                        } ,
                        {
                          title: 'End Piece Calculation',
                          key: 'END_PIECE_QUANTITY_PER_PIPE',
                          render: (text: any, record: any) => (
                             <Space size="middle">
                              {/* quantity per pipe * Total Quantity = Total Quantity */}
                              <span>
                                <Tooltip title={`End Piece Length: ${record.END_PIECE_QUANTITY_PER_PIPE}`}>
                                  <span>{record.END_PIECE_QUANTITY_PER_PIPE}</span>
                                </Tooltip>
                                {' * '}
                                <Tooltip title={`Available quantity: ${record.AVAILABLE_QUANTITY}`}>
                                  <span>{record.AVAILABLE_QUANTITY}</span>
                                </Tooltip>
                                {' = '}
                                <Tooltip title={`Total End Piece Length: ${record.TOTAL_END_PIECE_QUANTITY_PER_PIPE}`}>
                                  <span>{record.TOTAL_END_PIECE_QUANTITY_PER_PIPE}</span>
                                </Tooltip>
                              </span>
                            </Space>
                          ),
                        },
             
                        
                      ]}
                      loading={loading}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                      style={{ marginTop: 20 }}
                      className="bg-white shadow-none rounded-lg"
                    />
                ) : (
                    <p className="text-gray-600 mt-2">No matching pipe found.</p>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Convertible Slitted Coils</h2>
                {coils.length > 0 ? (
                    <Table
                        dataSource={coils}
                        columns={columns}
                        loading={loading}
                        rowKey="name"
                        pagination={{ pageSize: 10 }}
                        style={{ marginTop: 20 }}
                        className="bg-white shadow-none rounded-lg"
                        bordered
                    />
                ) : (
                    <p className="text-gray-600 mt-2">No convertible coil found.</p>
                )}
            </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(groupedSummary).map(([section, items]) => (
                <div key={section} className="bg-white rounded-lg shadow-lg p-6 mb-4">
                    <h3 className="text-lg font-semibold mb-2">{section}</h3>
                    {items.map(({ label, value }) => (
                        <div key={label} className="flex justify-between py-1 border-b last:border-b-0">
                            <span className="font-medium">{label}:</span>
                            <span>{value}</span>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    </div>
  )
}
