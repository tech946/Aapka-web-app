'use client';

import { Layout, Menu, Typography } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import {
  GlobalOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  AppstoreOutlined,
  SettingOutlined,
  FlagOutlined,
  TeamOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { ClipboardTypeIcon } from 'lucide-react';

const { Sider, Content } = Layout;
const { Title } = Typography;

const MasterLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      key: '/dashboard/master/countries',
      icon: <GlobalOutlined />,
      label: 'Countries',
    },
    {
      key: '/dashboard/master/states',
      icon: <EnvironmentOutlined />,
      label: 'States',
    },
    {
      key: '/dashboard/master/cities',
      icon: <ClipboardTypeIcon />,
      label: 'Cities',
    },
    {
      key: '/dashboard/master/areas',
      icon: <HomeOutlined />,
      label: 'Areas',
    },
    {
      key: '/dashboard/master/property-types',
      icon: <AppstoreOutlined />,
      label: 'Property Types',
    },
    {
      key: '/dashboard/master/unit-types',
      icon: <InboxOutlined />,
      label: 'Unit Types',
    },
    {
      key: '/dashboard/master/amenities',
      icon: <SettingOutlined />,
      label: 'Amenities',
    },
    {
      key: '/dashboard/master/property-status',
      icon: <FlagOutlined />,
      label: 'Property Status',
    },
    {
      key: '/dashboard/master/developers',
      icon: <TeamOutlined />,
      label: 'Developers',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={250}
        theme='light'
        style={{ borderRight: '1px solid #f0f0f0' }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            Master Data
          </Title>
        </div>
        <Menu
          mode='inline'
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ border: 'none' }}
        />
      </Sider>
      <Layout>
        <Content style={{ padding: '24px', background: '#f5f5f5' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MasterLayout;
