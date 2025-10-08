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
  Upload,
  Image,
  Divider,
  Switch,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DeleteOutlined as RemoveOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { TextArea } = Input;

interface Developer {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
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

const DevelopersPage: React.FC = () => {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDeveloper, setEditingDeveloper] = useState<Developer | null>(
    null
  );
  const [form] = Form.useForm();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchDevelopers = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/developers?page=${page}&limit=${limit}`
      );
      setDevelopers(response.data.data);
      setPagination(response.data.pagination);
    } catch (error: any) {
      message.error(
        error.response?.data?.error || 'Failed to fetch developers'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const handleAdd = () => {
    setEditingDeveloper(null);
    form.resetFields();
    setImagePreview(null);
    setModalVisible(true);
  };

  const handleEdit = (developer: Developer) => {
    setEditingDeveloper(developer);
    form.setFieldsValue({
      name: developer.name,
      description: developer.description,
      image_url: developer.image_url,
      is_active: developer.is_active,
    });
    setImagePreview(developer.image_url || null);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/developers?id=${id}`);
      message.success('Developer deleted successfully');
      fetchDevelopers(pagination.page, pagination.limit);
    } catch (error: any) {
      message.error(
        error.response?.data?.error || 'Failed to delete developer'
      );
    }
  };

  const handleImageUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      return false;
    }

    // Store the file in form state and create preview
    form.setFieldsValue({ image_file: file });
    const reader = new FileReader();
    reader.onload = e => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    return false; // Prevent default upload
  };

  const handleImageRemove = () => {
    setImagePreview(null);
    form.setFieldsValue({ image_file: null, image_url: null });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();

      formData.append('name', values.name);
      formData.append('description', values.description || '');
      formData.append('is_active', values.is_active);

      if (editingDeveloper) {
        formData.append('id', editingDeveloper.id);
        formData.append('existing_image_url', values.image_url || '');
      }

      // Check if there's a new image file
      const imageFile = form.getFieldValue('image_file');
      if (imageFile) {
        formData.append('image_file', imageFile);
      }

      if (editingDeveloper) {
        await axios.put('/api/developers', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        message.success('Developer updated successfully');
      } else {
        await axios.post('/api/developers', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        message.success('Developer created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      setImagePreview(null);
      fetchDevelopers(pagination.page, pagination.limit);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save developer');
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
    setImagePreview(null);
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    fetchDevelopers(page, pageSize || pagination.limit);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Developer, b: Developer) => a.name.localeCompare(b.name),
      render: (name: string, record: Developer) => (
        <Space>
          {record.image_url && (
            <Image
              width={32}
              height={32}
              src={record.image_url}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              fallback='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN'
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
      render: (description: string) =>
        description ? (
          <span>
            {description.length > 50
              ? `${description.substring(0, 50)}...`
              : description}
          </span>
        ) : (
          <span style={{ color: '#999' }}>No description</span>
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
      render: (_: any, record: Developer) => (
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
            title='Are you sure you want to delete this developer?'
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
            Developers Management
          </Title>
        </Col>
        <Col>
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size='large'
          >
            Add Developer
          </Button>
        </Col>
      </Row>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Statistic
              title='Total Developers'
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
          dataSource={developers}
          rowKey='id'
          loading={loading}
          pagination={false}
          scroll={{ x: 1000 }}
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
        title={editingDeveloper ? 'Edit Developer' : 'Add Developer'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
        okText={editingDeveloper ? 'Update' : 'Create'}
        cancelText='Cancel'
      >
        <Form
          form={form}
          layout='vertical'
          initialValues={{
            name: '',
            description: '',
            image_url: '',
            is_active: true,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name='name'
                label='Name'
                rules={[
                  { required: true, message: 'Please enter developer name' },
                  { min: 2, message: 'Name must be at least 2 characters' },
                ]}
              >
                <Input placeholder='Enter developer name' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='is_active'
                label='Status'
                valuePropName='checked'
              >
                <Switch checkedChildren='Active' unCheckedChildren='Inactive' />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name='description' label='Description'>
            <TextArea placeholder='Enter developer description' rows={3} />
          </Form.Item>

          <Form.Item name='image_url' style={{ display: 'none' }}>
            <Input type='hidden' />
          </Form.Item>

          <Form.Item name='image_file' label='Image Upload'>
            <Upload
              beforeUpload={handleImageUpload}
              onRemove={handleImageRemove}
              showUploadList={false}
              accept='image/*'
            >
              <Button icon={<UploadOutlined />}>
                {imagePreview ? 'Change Image' : 'Upload Image'}
              </Button>
            </Upload>
          </Form.Item>

          {imagePreview && (
            <Form.Item label='Image Preview'>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Image
                  width={200}
                  height={200}
                  src={imagePreview}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                />
                <Button
                  type='text'
                  danger
                  icon={<RemoveOutlined />}
                  onClick={handleImageRemove}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  Remove
                </Button>
              </div>
            </Form.Item>
          )}

          <Divider />
        </Form>
      </Modal>
    </div>
  );
};

export default DevelopersPage;
