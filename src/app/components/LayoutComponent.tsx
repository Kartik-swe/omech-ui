// src/components/LayoutComponent.tsx
'use client'
import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Menu, 
  Breadcrumb, 
  theme, 
  Avatar, 
  Dropdown, 
  Badge, 
  Button, 
  Space, 
  Typography 
} from 'antd';
import type { MenuProps } from 'antd';
import type { ItemType, MenuDividerType } from 'antd/es/menu/interface';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DashboardOutlined,
  DatabaseOutlined,
  StockOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  BuildOutlined,
  UsergroupAddOutlined,
  SyncOutlined,
  BarChartOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ScheduleOutlined,
  ToolOutlined,
  HomeOutlined,
  PlusCircleOutlined,
  ApartmentOutlined,
  EnvironmentOutlined,
  DesktopOutlined,
  FileAddOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  FileOutlined,
  FileDoneOutlined,
  FileExcelOutlined,
  FileExclamationOutlined,
  FileProtectOutlined,
  FileUnknownOutlined,
  FileZipOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FilePptOutlined,
  FileMarkdownOutlined,
  FileImageOutlined,
  FileGifOutlined,
  FileSyncOutlined,
  MessageOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const { Header, Sider, Content, Footer } = Layout;



const menuItems = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
    subMenu: [
      // {
      //   key: 'Dashboard',
      //   label: 'Dashboard',
      //   link: '/dashboard',
      // },
      {
        key: 'Raw_Materials',
        label: 'Raw Materials',
        link: '/materials',
      },
      {
        key: 'Raw_Materials2',
        label: 'Raw Material Stock',
        link: '/materials/dash2',
      },
      {
        key: 'Raw_Materials12',
        label: 'Shift Material',
        link: '/materials/dash1',
      },
       {
        key: 'PRODUCTION_ANALYSIS',
        label: 'Production Analysis',
        link: '/dashboard/production',
      },
      // {
      //   key: 'PO_SUMMARY',
      //   label: 'PO Summary',
      //   link: '/dashboard/po-summary',
      // },
      
      // {
      //   key: 'slitting_process',
      //   label: 'Slitted Material Stock',
      //   link: '/materials/dash3',
      // },
      // {
      //   key: 'slitting_process2',
      //   label: 'Slitting History',
      //   link: '/materials/dash4',
      // },
    ]
  },
  {
    key: 'Pipes',
    icon: <DatabaseOutlined />,
    label: 'Pipes',
    subMenu: [
      // {
      //   key: 'Dashboard',
      //   label: 'Dashboard',
      //   link: '/inventory-master',
      // },
      {
        key: 'Inventory',
        label: 'Inventory',
        link: '/pipe/inventory',
      },
      {
        key: 'InventoryLogs',
        label: 'Inventory Logs',
        link: '/pipe/logs',
      },
      // {
      //   key: 'inventory',
      //   label: 'Inventory',
      //   link: '/inventory',
      // },
      
      
    ],
  },
  {
  key: 'quotation',
  icon: <FileTextOutlined />,
  label: 'Quotation',
  link: '/quotation',
},
  // {
  //   key: 'management1',
  //   icon: <DatabaseOutlined />,
  //   label: 'Management',
  //   subMenu: [
  //     {
  //       key: 'products',
  //       label: 'Products',
  //       link: '/products',
  //     },
  //     {
  //       key: 'inventory',
  //       label: 'Inventory',
  //       link: '/inventory',
  //     },
  //     {
  //       key: 'inventory1',
  //       label: 'Inventory 1',
  //       link: '/inventory1',
  //     },
  //     {
  //       key: 'inventory2',
  //       label: 'Inventory 2',
  //       link: '/inventory2',
  //     },
  //     {
  //       key: 'production',
  //       label: 'Production',
  //       link: '/production',
  //     },
  //   ],
  // },
  // {
  //   key: 'orders',
  //   icon: <ShoppingCartOutlined />,
  //   label: 'Orders',
  //   link: '/orders',
  // },
  // {
  //   key: 'resources',
  //   icon: <BuildOutlined />,
  //   label: 'Resources',
  //   subMenu: [
  //     {
  //       key: 'materials',
  //       label: 'Materials',
  //       link: '/materials',
  //     },
  //     {
  //       key: 'suppliers',
  //       label: 'Suppliers',
  //       link: '/suppliers',
  //     },
  //   ],
  // },
  // {
  //   key: 'transactions',
  //   icon: <SyncOutlined />,
  //   label: 'Transactions',
  //   link: '/transactions',
  // },
  // {
  //   key: 'reports',
  //   icon: <BarChartOutlined />,
  //   label: 'Reports',
  //   link: '/reports',
  // },
  {
    key: 'Scheduling',
    icon: <StockOutlined />,
    label: 'Scheduling',
    subMenu: [
      {
        key: 'SchedulingPage',
        label: 'Scheduling Analysis',
        link: '/schedule',
      },
      {
        key: 'scheduleAdd',
        label: 'Add PO',
        link: '/PO/schedule',
      },
      {
        key: 'poMaterialMapping',
        label: 'PO Material Mapping',
        link: '/po-material-mapping',
      },
      {
        key: 'poAnalysis',
        label: 'PO Analysis',
        link: '/PO/analysis',
      },
          ],
  },
  {
    key: 'master',
    icon: <DatabaseOutlined />,
    label: 'Master',
    subMenu: [
      
      {
        key: 'Grades & Thickness',
        label: 'Material',
        link: '/master/material',
      },
      {
        key: 'Location',
        label: 'Location',
        link: '/master/location',
      },
      {
        key: 'Party Name',
        label: 'Party Name',
        link: '/master/Party',
      },
      {
        key: 'Machine',
        label: 'Machine',
        link: '/master/machine',
      },
      {
        key: 'users',
        label: 'Users',
        link: '/master/users',
      },
      {
        key: 'Company Profile',
        label: 'Company Profile',
        link: '/master/company',
      },
    ],
  },
//   {
//   key: 'ai-reports',
//   icon: <MessageOutlined />,
//   label: 'AI Reports',
//   link: '/ai-reports',
// },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: 'Settings',
    link: '/settings',
  },
// add one more menu item for logout
  {
    key: 'logout',
    icon: <UsergroupAddOutlined />,
    label: 'Logout',
    link: '/logout',
  },
  // {
  //   key: 'userManagement',
  //   icon: <UsergroupAddOutlined />,
  //   label: 'User Management',
  //   link: '/user-management',
  // },
  // {
  //   key: 'reports',
  //   icon: <BarChartOutlined />,
  //   label: 'Reports',
  //   link: '/reports',
  // },

];

const LayoutComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    token: { colorBgContainer, borderRadiusLG, colorPrimary, colorBgElevated },
  } = theme.useToken();
  
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['dashboard']);
  const pathname = usePathname();
  
  // Find active menu item based on current path
  useEffect(() => {
    const findActiveMenuItem = () => {
      // Find the submenu item that matches the current path
      for (const item of menuItems) {
        if (item.subMenu) {
          const matchingSubItem = item.subMenu.find(subItem => pathname === subItem.link);
          if (matchingSubItem) {
            setSelectedKeys([matchingSubItem.key]);
            return;
          }
        } else if (item.link === pathname) {
          setSelectedKeys([item.key]);
          return;
        }
      }
      // Default to dashboard if no match found
      setSelectedKeys(['dashboard']);
    };
    
    findActiveMenuItem();
  }, [pathname]);
  
  // User profile dropdown items
  const userMenuItems: ItemType[] = [
    {
      key: '1',
      label: 'Profile',
      icon: <UserOutlined />,
    },
    {
      key: '2',
      label: 'Settings',
      icon: <SettingOutlined />,
    },
    {
      type: 'divider',
      key: 'divider',
      dashed: false,
    } as MenuDividerType,
    {
      key: '3',
      label: 'Logout',
      icon: <LogoutOutlined />,
      onClick: () => {
        window.location.href = '/logout';
      },
    },
  ];
   const isPrintRoute = pathname?.includes('/print');
  if (isPrintRoute) {
    return <>{children}</>;
  }

  return (
    <Layout className="app-layout" style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        style={{
          boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
          zIndex: 10,
        }}
        width={250}
        theme="light"
      >
        <div className="logo" style={{ 
          height: '64px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0' : '0 24px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          overflow: 'hidden',
        }}>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: colorPrimary,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            {collapsed ? (
              <img 
                src="/Omech_Components_Logo.png" 
                alt="Omech Logo"
                style={{ height: '40px', width: 'auto' }}
              />
            ) : (
              <>
                <img 
                  src="/Omech_Components_Logo.png" 
                  alt="Omech Logo"
                  style={{ height: '40px', width: 'auto' }}
                />
                {/* <span>OMECH INVENTORY</span> */}
              </>
            )}
          </div>
        </div>
        
        <Menu 
          theme="light" 
          mode="inline" 
          selectedKeys={selectedKeys}
          style={{ borderRight: 0 }}
          items={menuItems.map(item => {
            if (item.subMenu) {
              return {
                key: item.key,
                icon: item.icon,
                label: item.label,
                children: item.subMenu.map(subItem => ({
                  key: subItem.key,
                  label: <Link href={subItem.link}>{subItem.label}</Link>
                }))
              };
            }
            return {
              key: item.key,
              icon: item.icon,
              label: <Link href={item.link}>{item.label}</Link>
            };
          })}
        />
      </Sider>

      <Layout>
        <Header style={{ 
          background: colorBgContainer, 
          padding: '0 16px', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          zIndex: 9,
          height: '64px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              type="text" 
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', marginRight: '12px' }}
            />
            <Breadcrumb 
              style={{ margin: 0 }}
              items={pathname.split('/').filter(Boolean).map((path, index, array) => {
                const url = `/${array.slice(0, index + 1).join('/')}`;
                return {
                  key: url,
                  title: <Link href={url}>{path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ')}</Link>
                };
              })}
            />
          </div>
          
          <Space size={16}>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: colorPrimary }} icon={<UserOutlined />} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>Admin User</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Administrator</Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ padding: '24px', overflow: 'auto' }}>
          <div
            style={{
              background: colorBgContainer,
              minHeight: 280,
              padding: 24,
              borderRadius: borderRadiusLG,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              height: 'calc(100vh - 184px)', /* 64px header + 56px footer + 24px*2 padding */
              overflowY: 'auto',
            }}
          >
            {children}
          </div>
        </Content>

        <Footer style={{ 
          textAlign: 'center', 
          padding: '16px 50px',
          backgroundColor: colorBgElevated,
          color: 'rgba(0, 0, 0, 0.45)',
          fontSize: '14px',
        }}>
          OMECH INVENTORY System ©{new Date().getFullYear()} All Rights Reserved
        </Footer>
      </Layout>
    </Layout>
  );
};

export default LayoutComponent;
