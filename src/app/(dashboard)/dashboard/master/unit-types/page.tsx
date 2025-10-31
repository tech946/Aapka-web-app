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
  ReloadOutlined,
  UploadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface UnitType {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const UnitTypesPage = () => {
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUnitType, setEditingUnitType] = useState<UnitType | null>(null);
  const [form] = Form.useForm();
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchUnitTypes = async (page = 1, limit = 10, search = '') => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/unit-types?page=${page}&limit=${limit}&search=${search}`
      );
      setUnitTypes(response.data.data);
      setPagination(response.data.pagination);
    } catch (error: any) {
      message.error(
        error.response?.data?.error || 'Failed to fetch unit types'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnitTypes();
  }, []);

  const handleAdd = () => {
    setEditingUnitType(null);
    form.resetFields();
    setImagePreview('');
    setSelectedImageFile(null);
    setModalVisible(true);
  };

  const handleEdit = (record: UnitType) => {
    setEditingUnitType(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
    });
    setImagePreview(record.image_url || '');
    setSelectedImageFile(null);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/unit-types?id=${id}`);
      message.success('Unit type deleted successfully');
      fetchUnitTypes(pagination.page, pagination.limit, searchText);
    } catch (error: any) {
      message.error(
        error.response?.data?.error || 'Failed to delete unit type'
      );
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchUnitTypes(1, pagination.limit, value);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      setImagePreview(URL.createObjectURL(file));
      setSelectedImageFile(file);
      message.success('Image selected successfully');
      return false;
    } catch (error: any) {
      message.error('Failed to select image');
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleImageRemove = async () => {
    try {
      setImagePreview('');
      setSelectedImageFile(null);
      form.setFieldsValue({ image_url: '' });
      message.success('Image removed successfully');
    } catch (error: any) {
      message.error('Failed to remove image');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingUnitType) {
        const hadImage = editingUnitType.image_url;
        const hasNewImage = selectedImageFile;
        const shouldRemoveImage = hadImage && !hasNewImage;

        if (selectedImageFile || shouldRemoveImage) {
          const formData = new FormData();
          formData.append('id', editingUnitType.id.toString());
          formData.append('name', values.name);
          formData.append('description', values.description || '');
          formData.append('old_image_url', editingUnitType.image_url || '');

          if (shouldRemoveImage) {
            formData.append('remove_image', 'true');
          } else if (selectedImageFile) {
            formData.append('file', selectedImageFile);
          }

          await axios.put('/api/unit-types', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } else {
          await axios.put('/api/unit-types', {
            id: editingUnitType.id,
            name: values.name,
            description: values.description,
            image_url: values.image_url,
            old_image_url: editingUnitType.image_url,
          });
        }
        message.success('Unit type updated successfully');
      } else {
        if (selectedImageFile) {
          const formData = new FormData();
          formData.append('name', values.name);
          formData.append('description', values.description || '');
          formData.append('file', selectedImageFile);

          await axios.post('/api/unit-types', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } else {
          await axios.post('/api/unit-types', {
            name: values.name,
            description: values.description,
            image_url: values.image_url,
          });
        }
        message.success('Unit type created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      setImagePreview('');
      setSelectedImageFile(null);
      fetchUnitTypes(pagination.page, pagination.limit, searchText);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save unit type');
    }
  };

  const handleTableChange = (page: number, pageSize?: number) => {
    fetchUnitTypes(page, pageSize || pagination.limit, searchText);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Image',
      dataIndex: 'image_url',
      key: 'image_url',
      width: 100,
      render: (imageUrl: string) =>
        imageUrl ? (
          <Image
            width={50}
            height={50}
            src={imageUrl}
            alt='Unit Type'
            style={{ objectFit: 'cover', borderRadius: 4 }}
            fallback='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN'
          />
        ) : (
          <div
            style={{
              width: 50,
              height: 50,
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              color: '#999',
            }}
          >
            No Image
          </div>
        ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: UnitType, b: UnitType) => a.name.localeCompare(b.name),
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
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: UnitType) => (
        <Space>
          <Button
            type='link'
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size='small'
          />
          <Popconfirm
            title='Are you sure you want to delete this unit type?'
            onConfirm={() => handleDelete(record.id)}
            okText='Yes'
            cancelText='No'
          >
            <Button type='link' danger icon={<DeleteOutlined />} size='small' />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Row
          justify='space-between'
          align='middle'
          style={{ marginBottom: 16 }}
        >
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              Unit Types Management
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() =>
                  fetchUnitTypes(pagination.page, pagination.limit, searchText)
                }
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                type='primary'
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Add Unit Type
              </Button>
            </Space>
          </Col>
        </Row>

        <Row style={{ marginBottom: 16 }}>
          <Col span={24}>
            <Input.Search
              placeholder='Search unit types by name...'
              allowClear
              onSearch={handleSearch}
              onChange={e => {
                if (e.target.value === '') {
                  handleSearch('');
                }
              }}
              style={{ width: '100%' }}
              size='large'
              prefix={<SearchOutlined />}
            />
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Statistic
              title='Total Unit Types'
              value={pagination.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title='Current Page'
              value={`${pagination.page} of ${pagination.totalPages}`}
            />
          </Col>
          <Col span={8}>
            <Statistic title='Items Per Page' value={pagination.limit} />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={unitTypes}
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
            onChange={handleTableChange}
            onShowSizeChange={handleTableChange}
          />
        </div>
      </Card>

      <Modal
        title={editingUnitType ? 'Edit Unit Type' : 'Add Unit Type'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setImagePreview('');
        }}
        okText='Save'
        cancelText='Cancel'
        width={600}
      >
        <Form form={form} layout='vertical'>
          <Form.Item
            name='name'
            label='Unit Type Name'
            rules={[
              { required: true, message: 'Please enter unit type name' },
              {
                min: 2,
                message: 'Unit type name must be at least 2 characters',
              },
            ]}
          >
            <Input placeholder='Enter unit type name' />
          </Form.Item>

          <Form.Item name='description' label='Description'>
            <TextArea
              placeholder='Enter unit type description (optional)'
              rows={3}
            />
          </Form.Item>

          <Form.Item name='image_url' label='Image'>
            <Input type='hidden' />
          </Form.Item>

          <Form.Item name='image_file' label='Image File'>
            <Input type='hidden' />
          </Form.Item>

          <Divider>Image Upload</Divider>

          {imagePreview && (
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <Image
                src={imagePreview}
                alt='Preview'
                style={{ maxWidth: 200, maxHeight: 200, objectFit: 'cover' }}
                fallback='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN'
              />
              <div style={{ marginTop: 8 }}>
                <Button
                  type='link'
                  danger
                  onClick={handleImageRemove}
                  icon={<DeleteOutlined />}
                >
                  Remove Image
                </Button>
              </div>
            </div>
          )}

          <Upload
            beforeUpload={handleImageUpload}
            showUploadList={false}
            accept='image/*'
            disabled={uploading}
          >
            <Button
              icon={<UploadOutlined />}
              loading={uploading}
              disabled={uploading}
            >
              {imagePreview ? 'Change Image' : 'Upload Image'}
            </Button>
          </Upload>

          <Text type='secondary' style={{ display: 'block', marginTop: 8 }}>
            Supported formats: JPEG, PNG, WebP. Max size: 5MB
          </Text>
        </Form>
      </Modal>
    </div>
  );
};

export default UnitTypesPage;
