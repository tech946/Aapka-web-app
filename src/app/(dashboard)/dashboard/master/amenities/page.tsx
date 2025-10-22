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

interface Amenity {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
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

const AmenitiesPage: React.FC = () => {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);
  const [form] = Form.useForm();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchAmenities = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/amenities?page=${page}&limit=${limit}`
      );
      setAmenities(response.data.data);
      setPagination(response.data.pagination);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to fetch amenities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmenities();
  }, []);

  const handleAdd = () => {
    setEditingAmenity(null);
    form.resetFields();
    setImagePreview(null);
    setSelectedImageFile(null);
    setModalVisible(true);
  };

  const handleEdit = (amenity: Amenity) => {
    setEditingAmenity(amenity);
    form.setFieldsValue({
      name: amenity.name,
      description: amenity.description,
      image_url: amenity.image_url,
    });
    setImagePreview(amenity.image_url || null);
    setSelectedImageFile(null); // Clear any previously selected file
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/amenities?id=${id}`);
      message.success('Amenity deleted successfully');
      fetchAmenities(pagination.page, pagination.limit);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to delete amenity');
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

    // Store the file in state and create preview
    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onload = e => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    return false; // Prevent default upload
  };

  const handleImageRemove = () => {
    setImagePreview(null);
    setSelectedImageFile(null);
    form.setFieldsValue({ image_url: null });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();

      formData.append('name', values.name);
      formData.append('description', values.description || '');

      if (editingAmenity) {
        formData.append('id', editingAmenity.id);
        formData.append('existing_image_url', values.image_url || '');
      }

      // Check if there's a new image file
      if (selectedImageFile) {
        formData.append('image_file', selectedImageFile);
      }

      if (editingAmenity) {
        await axios.put('/api/amenities', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        message.success('Amenity updated successfully');
      } else {
        await axios.post('/api/amenities', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        message.success('Amenity created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      setImagePreview(null);
      setSelectedImageFile(null);
      fetchAmenities(pagination.page, pagination.limit);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save amenity');
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
    setImagePreview(null);
    setSelectedImageFile(null);
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    fetchAmenities(page, pageSize || pagination.limit);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Amenity, b: Amenity) => a.name.localeCompare(b.name),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Image',
      dataIndex: 'image_url',
      key: 'image_url',
      render: (imageUrl: string) =>
        imageUrl ? (
          <Image
            width={50}
            height={50}
            src={imageUrl}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            fallback='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN'
          />
        ) : (
          <div
            style={{
              width: 50,
              height: 50,
              backgroundColor: '#f5f5f5',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            No Image
          </div>
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
      render: (_: any, record: Amenity) => (
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
            title='Are you sure you want to delete this amenity?'
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
            Amenities Management
          </Title>
        </Col>
        <Col>
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size='large'
          >
            Add Amenity
          </Button>
        </Col>
      </Row>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Statistic
              title='Total Amenities'
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
          dataSource={amenities}
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
        title={editingAmenity ? 'Edit Amenity' : 'Add Amenity'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        okText={editingAmenity ? 'Update' : 'Create'}
        cancelText='Cancel'
      >
        <Form
          form={form}
          layout='vertical'
          initialValues={{
            name: '',
            description: '',
            image_url: '',
          }}
        >
          <Form.Item
            name='name'
            label='Name'
            rules={[
              { required: true, message: 'Please enter amenity name' },
              { min: 2, message: 'Amenity name must be at least 2 characters' },
            ]}
          >
            <Input placeholder='Enter amenity name' />
          </Form.Item>

          <Form.Item name='description' label='Description'>
            <TextArea placeholder='Enter amenity description' rows={3} />
          </Form.Item>

          <Form.Item name='image_url' label='Image'>
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

export default AmenitiesPage;
