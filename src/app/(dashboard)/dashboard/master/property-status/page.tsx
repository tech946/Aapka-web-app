'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Space,
  Typography,
  Card,
  Pagination,
  Row,
  Col,
  Statistic,
  Switch,
  ColorPicker,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { TextArea } = Input;

interface PropertyStatus {
  id: string;
  name: string;
  description?: string;
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const PropertyStatusPage: React.FC = () => {
  const [propertyStatuses, setPropertyStatuses] = useState<PropertyStatus[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStatus, setEditingStatus] = useState<PropertyStatus | null>(
    null
  );
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchPropertyStatuses = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/property-status?page=${page}&limit=${limit}`
      );
      setPropertyStatuses(response.data.data);
      setPagination(response.data.pagination);
    } catch (error: any) {
      message.error(
        error.response?.data?.error || 'Failed to fetch property statuses'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertyStatuses();
  }, []);

  const handleAdd = () => {
    setEditingStatus(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (status: PropertyStatus) => {
    setEditingStatus(status);
    form.setFieldsValue({
      name: status.name,
      description: status.description,
      color: status.color,
      is_active: status.is_active,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/property-status?id=${id}`);
      message.success('Property status deleted successfully');
      fetchPropertyStatuses(pagination.page, pagination.limit);
    } catch (error: any) {
      message.error(
        error.response?.data?.error || 'Failed to delete property status'
      );
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingStatus) {
        await axios.put('/api/property-status', {
          id: editingStatus.id,
          ...values,
        });
        message.success('Property status updated successfully');
      } else {
        await axios.post('/api/property-status', values);
        message.success('Property status created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      fetchPropertyStatuses(pagination.page, pagination.limit);
    } catch (error: any) {
      message.error(
        error.response?.data?.error || 'Failed to save property status'
      );
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    fetchPropertyStatuses(page, pageSize || pagination.limit);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: PropertyStatus, b: PropertyStatus) =>
        a.name.localeCompare(b.name),
      render: (name: string, record: PropertyStatus) => (
        <Space>
          {record.color && (
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: record.color,
                display: 'inline-block',
              }}
            />
          )}
          {name}
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Color',
      dataIndex: 'color',
      key: 'color',
      render: (color: string) =>
        color ? (
          <Tag color={color} style={{ margin: 0 }}>
            {color}
          </Tag>
        ) : (
          <span style={{ color: '#999' }}>No color</span>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: PropertyStatus) => (
        <Space>
          <Button
            type='primary'
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size='small'
          >
            Edit
          </Button>
          <Popconfirm
            title='Are you sure you want to delete this property status?'
            onConfirm={() => handleDelete(record.id)}
            okText='Yes'
            cancelText='No'
          >
            <Button
              type='primary'
              danger
              icon={<DeleteOutlined />}
              size='small'
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row justify='space-between' align='middle' style={{ marginBottom: 16 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Property Status Management
          </Title>
        </Col>
        <Col>
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size='large'
          >
            Add Property Status
          </Button>
        </Col>
      </Row>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Statistic
              title='Total Property Statuses'
              value={pagination.total}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title='Current Page'
              value={pagination.page}
              suffix={`/ ${pagination.totalPages}`}
            />
          </Col>
          <Col span={8}>
            <Statistic title='Items Per Page' value={pagination.limit} />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={propertyStatuses}
          rowKey='id'
          loading={loading}
          pagination={false}
          scroll={{ x: 800 }}
        />

        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination
            current={pagination.page}
            total={pagination.total}
            pageSize={pagination.limit}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
            }
            onChange={handlePageChange}
            onShowSizeChange={handlePageChange}
          />
        </div>
      </Card>

      <Modal
        title={editingStatus ? 'Edit Property Status' : 'Add Property Status'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        okText={editingStatus ? 'Update' : 'Create'}
        cancelText='Cancel'
      >
        <Form
          form={form}
          layout='vertical'
          initialValues={{
            name: '',
            description: '',
            color: '#1890ff',
            is_active: true,
          }}
        >
          <Form.Item
            name='name'
            label='Name'
            rules={[
              { required: true, message: 'Please enter property status name' },
              { min: 2, message: 'Name must be at least 2 characters' },
            ]}
          >
            <Input placeholder='Enter property status name' />
          </Form.Item>

          <Form.Item name='description' label='Description'>
            <TextArea
              placeholder='Enter property status description'
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name='color'
            label='Color'
            rules={[
              {
                pattern: /^#[0-9A-F]{6}$/i,
                message: 'Please enter a valid hex color code (e.g., #FF0000)',
              },
            ]}
          >
            <Input
              placeholder='#FF0000'
              addonBefore={
                <ColorPicker
                  onChange={color => {
                    form.setFieldsValue({ color: color.toHexString() });
                  }}
                  value={form.getFieldValue('color')}
                />
              }
            />
          </Form.Item>

          <Form.Item name='is_active' label='Status' valuePropName='checked'>
            <Switch checkedChildren='Active' unCheckedChildren='Inactive' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PropertyStatusPage;
