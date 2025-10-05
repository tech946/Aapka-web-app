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
  Select,
  Tag,
  Tooltip,
  Badge,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  DollarOutlined,
  CalendarOutlined,
  EyeOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface Lead {
  id: string;
  fullname: string;
  mobile_no: string;
  email?: string;
  relationship?: string;
  budget?: number;
  purpose_of_buying?: string;
  buying_timeline?: string;
  notes?: string;
  status: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  assigned_user?: {
    id: string;
    email: string;
    user_metadata?: any;
  };
}

interface LeadFormData {
  status: string;
  assigned_to?: string;
}

const LeadsManagement: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const statusOptions = [
    { value: 'new', label: 'New', color: 'blue' },
    { value: 'contacted', label: 'Contacted', color: 'orange' },
    { value: 'qualified', label: 'Qualified', color: 'green' },
    { value: 'converted', label: 'Converted', color: 'purple' },
    { value: 'lost', label: 'Lost', color: 'red' },
  ];

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption?.color || 'default';
  };

  const getStatusLabel = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption?.label || status;
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchText && { search: searchText }),
      });

      const response = await axios.get(`/api/leads?${params}`);

      if (response.data) {
        setLeads(response.data.leads || []);
        setTotalLeads(response.data.pagination?.total || 0);
      }
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      message.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [currentPage, pageSize, statusFilter, searchText]);

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    form.setFieldsValue({
      status: lead.status,
      assigned_to: lead.assigned_to,
    });
    setModalVisible(true);
  };

  const handleDelete = async (leadId: string) => {
    try {
      await axios.delete(`/api/leads?id=${leadId}`);
      message.success('Lead deleted successfully');
      fetchLeads();
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      message.error('Failed to delete lead');
    }
  };

  const handleSubmit = async (values: LeadFormData) => {
    if (!editingLead) return;

    try {
      await axios.put('/api/leads', {
        id: editingLead.id,
        status: values.status,
        assigned_to: values.assigned_to,
      });

      message.success('Lead updated successfully');
      setModalVisible(false);
      setEditingLead(null);
      form.resetFields();
      fetchLeads();
    } catch (error: any) {
      console.error('Error updating lead:', error);
      message.error('Failed to update lead');
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const columns = [
    {
      title: 'Lead Details',
      key: 'details',
      width: 250,
      render: (record: Lead) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            <UserOutlined style={{ marginRight: '4px' }} />
            {record.fullname}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <PhoneOutlined style={{ marginRight: '4px' }} />
            {record.mobile_no}
          </div>
          {record.email && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              <MailOutlined style={{ marginRight: '4px' }} />
              {record.email}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      width: 120,
      render: (budget: number) =>
        budget ? (
          <Text strong>
            <DollarOutlined style={{ marginRight: '4px' }} />₹
            {budget.toLocaleString()}
          </Text>
        ) : (
          <Text type='secondary'>Not specified</Text>
        ),
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose_of_buying',
      key: 'purpose',
      width: 120,
      render: (purpose: string) => (
        <Tag color='blue'>{purpose || 'Not specified'}</Tag>
      ),
    },
    {
      title: 'Timeline',
      dataIndex: 'buying_timeline',
      key: 'timeline',
      width: 120,
      render: (timeline: string) => (
        <Text type='secondary'>{timeline || 'Not specified'}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
      ),
      filters: statusOptions.map(opt => ({
        text: opt.label,
        value: opt.value,
      })),
      onFilter: (value: any, record: Lead) => record.status === value,
    },
    {
      title: 'Assigned To',
      dataIndex: 'assigned_user',
      key: 'assigned_to',
      width: 150,
      render: (assignedUser: any) =>
        assignedUser ? (
          <div>
            <TeamOutlined style={{ marginRight: '4px' }} />
            <Text>{assignedUser.email}</Text>
          </div>
        ) : (
          <Text type='secondary'>Unassigned</Text>
        ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => (
        <Text type='secondary'>
          <CalendarOutlined style={{ marginRight: '4px' }} />
          {dayjs(date).format('DD/MM/YYYY')}
        </Text>
      ),
      sorter: (a: Lead, b: Lead) =>
        dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (record: Lead) => (
        <Space>
          <Tooltip title='View Details'>
            <Button
              type='text'
              icon={<EyeOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title='Edit'>
            <Button
              type='text'
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title='Are you sure you want to delete this lead?'
            onConfirm={() => handleDelete(record.id)}
            okText='Yes'
            cancelText='No'
          >
            <Tooltip title='Delete'>
              <Button type='text' danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const stats = {
    total: totalLeads,
    new: leads.filter(lead => lead.status === 'new').length,
    contacted: leads.filter(lead => lead.status === 'contacted').length,
    qualified: leads.filter(lead => lead.status === 'qualified').length,
    converted: leads.filter(lead => lead.status === 'converted').length,
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Leads Management</Title>
        <Text type='secondary'>
          Manage customer leads and track their progress
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title='Total Leads'
              value={stats.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title='New Leads'
              value={stats.new}
              prefix={<Badge color='blue' />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title='Contacted'
              value={stats.contacted}
              prefix={<Badge color='orange' />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title='Converted'
              value={stats.converted}
              prefix={<Badge color='purple' />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align='middle'>
          <Col xs={24} sm={8}>
            <Input
              placeholder='Search by name, email, or phone'
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleSearch(e.target.value)
              }
              allowClear
            />
          </Col>
          <Col xs={24} sm={6}>
            <Select
              placeholder='Filter by status'
              value={statusFilter}
              onChange={handleStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value='all'>All Statuses</Option>
              {statusOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <Button icon={<ExportOutlined />}>Export</Button>
          </Col>
        </Row>
      </Card>

      {/* Leads Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={leads}
          loading={loading}
          rowKey='id'
          pagination={false}
          scroll={{ x: 1200 }}
          size='small'
        />

        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <Pagination
            current={currentPage}
            total={totalLeads}
            pageSize={pageSize}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            }}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} leads`
            }
          />
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal
        title='Update Lead Status'
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingLead(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        {editingLead && (
          <div>
            <Card size='small' style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Text strong>Name: </Text>
                  <Text>{editingLead.fullname}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Phone: </Text>
                  <Text>{editingLead.mobile_no}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Email: </Text>
                  <Text>{editingLead.email || 'Not provided'}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Budget: </Text>
                  <Text>
                    {editingLead.budget
                      ? `₹${editingLead.budget.toLocaleString()}`
                      : 'Not specified'}
                  </Text>
                </Col>
                <Col span={24}>
                  <Text strong>Purpose: </Text>
                  <Text>
                    {editingLead.purpose_of_buying || 'Not specified'}
                  </Text>
                </Col>
                <Col span={24}>
                  <Text strong>Timeline: </Text>
                  <Text>{editingLead.buying_timeline || 'Not specified'}</Text>
                </Col>
                {editingLead.notes && (
                  <Col span={24}>
                    <Text strong>Notes: </Text>
                    <Text>{editingLead.notes}</Text>
                  </Col>
                )}
              </Row>
            </Card>

            <Form form={form} layout='vertical' onFinish={handleSubmit}>
              <Form.Item
                name='status'
                label='Status'
                rules={[{ required: true, message: 'Please select a status' }]}
              >
                <Select placeholder='Select status'>
                  {statusOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      <Tag color={option.color}>{option.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name='assigned_to' label='Assign To'>
                <Select
                  placeholder='Assign to team member (optional)'
                  allowClear
                >
                  {/* You can populate this with actual users from your system */}
                  <Option value='user1'>John Doe</Option>
                  <Option value='user2'>Jane Smith</Option>
                  <Option value='user3'>Mike Johnson</Option>
                </Select>
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setModalVisible(false)}>Cancel</Button>
                  <Button type='primary' htmlType='submit'>
                    Update Lead
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeadsManagement;
