'use client';

import { Card, Row, Col, Statistic, Typography } from 'antd';
import {
  GlobalOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  AppstoreOutlined,
  InboxOutlined,
  SettingOutlined,
  FlagOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { ClipboardTypeIcon } from 'lucide-react';

const { Title, Paragraph } = Typography;

const MasterPage = () => {
  const router = useRouter();

  const masterDataCards = [
    {
      title: 'Countries',
      icon: <GlobalOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
      description: 'Manage countries data',
      route: '/dashboard/master/countries',
      color: '#1890ff',
    },
    {
      title: 'States',
      icon: (
        <EnvironmentOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
      ),
      description: 'Manage states data',
      route: '/dashboard/master/states',
      color: '#52c41a',
    },
    {
      title: 'Cities',
      icon: (
        <ClipboardTypeIcon style={{ fontSize: '24px', color: '#fa8c16' }} />
      ),
      description: 'Manage cities data',
      route: '/dashboard/master/cities',
      color: '#fa8c16',
    },
    {
      title: 'Areas',
      icon: <HomeOutlined style={{ fontSize: '24px', color: '#eb2f96' }} />,
      description: 'Manage areas data',
      route: '/dashboard/master/areas',
      color: '#eb2f96',
    },
    {
      title: 'Property Types',
      icon: <AppstoreOutlined style={{ fontSize: '24px', color: '#722ed1' }} />,
      description: 'Manage property types',
      route: '/dashboard/master/property-types',
      color: '#722ed1',
    },
    {
      title: 'Unit Types',
      icon: <InboxOutlined style={{ fontSize: '24px', color: '#13c2c2' }} />,
      description: 'Manage unit types with images',
      route: '/dashboard/master/unit-types',
      color: '#13c2c2',
    },
    {
      title: 'Amenities',
      icon: <SettingOutlined style={{ fontSize: '24px', color: '#faad14' }} />,
      description: 'Manage property amenities',
      route: '/dashboard/master/amenities',
      color: '#faad14',
    },
    {
      title: 'Property Status',
      icon: <FlagOutlined style={{ fontSize: '24px', color: '#f5222d' }} />,
      description: 'Manage property status types',
      route: '/dashboard/master/property-status',
      color: '#f5222d',
    },
    {
      title: 'Developers',
      icon: <TeamOutlined style={{ fontSize: '24px', color: '#2f54eb' }} />,
      description: 'Manage property developers',
      route: '/dashboard/master/developers',
      color: '#2f54eb',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Master Data Management</Title>
        <Paragraph>
          Manage all your master data including location hierarchy (countries,
          states, cities, areas), property types, unit types, amenities,
          property status, and developers.
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        {masterDataCards.map((card, index) => (
          <Col xs={24} sm={12} md={8} lg={6} key={index}>
            <Card
              hoverable
              onClick={() => router.push(card.route)}
              style={{
                textAlign: 'center',
                cursor: 'pointer',
                border: `2px solid ${card.color}20`,
                borderRadius: '8px',
              }}
            >
              <div style={{ marginBottom: '16px' }}>{card.icon}</div>
              <Title level={4} style={{ margin: '0 0 8px 0' }}>
                {card.title}
              </Title>
              <Paragraph style={{ margin: 0, color: '#666' }}>
                {card.description}
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default MasterPage;
