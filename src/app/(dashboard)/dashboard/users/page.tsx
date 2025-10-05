'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  InputNumber,
  message,
  Popconfirm,
  Tag,
  Avatar,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { TextArea } = Input;

interface User {
  id: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  totalleads?: string;
  commissions?: any;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

interface UsersResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  // Fetch users
  const fetchUsers = async (page = 1, limit = 10, search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const response = await axios.get<UsersResponse>(`/api/users?${params}`);

      setUsers(response.data.data);
      setPagination({
        current: response.data.pagination.page,
        pageSize: response.data.pagination.limit,
        total: response.data.pagination.total,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchUsers(1, pagination.pageSize, value);
  };

  // Handle table change (pagination, sorting, filtering)
  const handleTableChange = (pagination: any) => {
    fetchUsers(pagination.current, pagination.pageSize, searchText);
  };

  // Handle edit user
  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      full_name: user.full_name,
      role: user.role,
      totalleads: user.totalleads,
      notes: user.notes,
    });
    setIsModalVisible(true);
  };

  // Handle save user
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (editingUser) {
        await axios.put('/api/users', {
          id: editingUser.id,
          ...values,
        });
        message.success('User updated successfully');
      }

      setIsModalVisible(false);
      setEditingUser(null);
      form.resetFields();
      fetchUsers(pagination.current, pagination.pageSize, searchText);
    } catch (error) {
      console.error('Error saving user:', error);
      message.error('Failed to save user');
    }
  };

  // Handle delete user
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/users?id=${id}`);
      message.success('User deleted successfully');
      fetchUsers(pagination.current, pagination.pageSize, searchText);
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error('Failed to delete user');
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchUsers(pagination.current, pagination.pageSize, searchText);
  };

  // Table columns
  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar_url',
      key: 'avatar',
      width: 80,
      render: (avatarUrl: string, record: User) => (
        <Avatar src={avatarUrl} icon={<UserOutlined />} size={40} />
      ),
    },
    {
      title: 'Name',
      dataIndex: 'full_name',
      key: 'full_name',
      sorter: (a: User, b: User) => a.full_name.localeCompare(b.full_name),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag
          color={role === 'admin' ? 'red' : role === 'user' ? 'blue' : 'green'}
        >
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Total Leads',
      dataIndex: 'totalleads',
      key: 'totalleads',
      render: (totalleads: string) => totalleads || '-',
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes: string) => (
        <Tooltip title={notes}>
          <div
            style={{
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {notes || '-'}
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a: User, b: User) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: User) => (
        <Space>
          <Button
            type='text'
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size='small'
          />
          <Popconfirm
            title='Are you sure you want to delete this user?'
            onConfirm={() => handleDelete(record.id)}
            okText='Yes'
            cancelText='No'
          >
            <Button type='text' danger icon={<DeleteOutlined />} size='small' />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Row
          justify='space-between'
          align='middle'
          style={{ marginBottom: 16 }}
        >
          <Col>
            <Title
              level={2}
              style={{
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <TeamOutlined />
              Users Management
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic
              title='Total Users'
              value={pagination.total}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title='Active Users'
              value={users.filter(u => u.role === 'user').length}
              prefix={<TeamOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title='Admins'
              value={users.filter(u => u.role === 'admin').length}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title='With Leads'
              value={users.filter(u => u.totalleads).length}
              prefix={<TeamOutlined />}
            />
          </Col>
        </Row>

        <Row style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Input
              placeholder='Search by name or role...'
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onPressEnter={() => handleSearch(searchText)}
              allowClear
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={users}
          rowKey='id'
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} users`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title={editingUser ? 'Edit User' : 'Add User'}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        width={600}
      >
        <Form
          form={form}
          layout='vertical'
          initialValues={{
            role: 'user',
          }}
        >
          <Form.Item
            name='full_name'
            label='Full Name'
            rules={[{ required: true, message: 'Please enter full name' }]}
          >
            <Input placeholder='Enter full name' />
          </Form.Item>

          <Form.Item
            name='role'
            label='Role'
            rules={[{ required: true, message: 'Please select role' }]}
          >
            <Input placeholder='Enter role (admin, user, etc.)' />
          </Form.Item>

          <Form.Item name='totalleads' label='Total Leads'>
            <Input placeholder='Enter total leads' />
          </Form.Item>

          <Form.Item name='notes' label='Notes'>
            <TextArea rows={4} placeholder='Enter notes about the user' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;
