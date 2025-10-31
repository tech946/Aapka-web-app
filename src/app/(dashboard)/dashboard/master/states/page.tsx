'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
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
const { Option } = Select;

interface Country {
  id: number;
  name: string;
}

interface State {
  id: number;
  name: string;
  country_id: number;
  image_url?: string;
  country?: Country;
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

const StatesPage = () => {
  const [states, setStates] = useState<State[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingState, setEditingState] = useState<State | null>(null);
  const [form] = Form.useForm();
  const [imagePreview, setImagePreview] = useState<string>('');
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

  const fetchCountries = async () => {
    try {
      const response = await axios.get('/api/countries?limit=1000');
      setCountries(response.data.data);
    } catch (error: any) {
      message.error('Failed to fetch countries');
    }
  };

  const fetchStates = async (page = 1, limit = 10, search = '') => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/states?page=${page}&limit=${limit}&search=${search}`
      );
      setStates(response.data.data);
      setPagination(response.data.pagination);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to fetch states');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
    fetchStates();
  }, []);

  const handleAdd = () => {
    setEditingState(null);
    form.resetFields();
    setImagePreview('');
    setModalVisible(true);
  };

  const handleEdit = (record: State) => {
    setEditingState(record);
    form.setFieldsValue(record);
    setImagePreview(record.image_url || '');
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/states?id=${id}`);
      message.success('State deleted successfully');
      fetchStates(pagination.page, pagination.limit, searchText);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to delete state');
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchStates(1, pagination.limit, value);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      // Store the file for later use in form submission
      setImagePreview(URL.createObjectURL(file));
      form.setFieldsValue({ image_file: file });
      message.success('Image selected successfully');
      return false; // Prevent default upload behavior
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
      form.setFieldsValue({ image_file: null, image_url: '' });
      message.success('Image removed successfully');
    } catch (error: any) {
      message.error('Failed to remove image');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingState) {
        // Handle update with form data if file is present
        if (values.image_file) {
          const formData = new FormData();
          formData.append('id', editingState.id.toString());
          formData.append('name', values.name);
          formData.append('country_id', values.country_id.toString());
          formData.append('old_image_url', editingState.image_url || '');
          formData.append('file', values.image_file);

          await axios.put('/api/states', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } else {
          // Handle update with JSON if no file
          await axios.put('/api/states', {
            id: editingState.id,
            name: values.name,
            country_id: values.country_id,
            image_url: values.image_url,
            old_image_url: editingState.image_url,
          });
        }
        message.success('State updated successfully');
      } else {
        // Handle create with form data if file is present
        if (values.image_file) {
          const formData = new FormData();
          formData.append('name', values.name);
          formData.append('country_id', values.country_id.toString());
          formData.append('file', values.image_file);

          await axios.post('/api/states', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } else {
          // Handle create with JSON if no file
          await axios.post('/api/states', {
            name: values.name,
            country_id: values.country_id,
            image_url: values.image_url,
          });
        }
        message.success('State created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      setImagePreview('');
      fetchStates(pagination.page, pagination.limit, searchText);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save state');
    }
  };

  const handleTableChange = (page: number, pageSize?: number) => {
    fetchStates(page, pageSize || pagination.limit, searchText);
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
            alt='State'
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
      sorter: (a: State, b: State) => a.name.localeCompare(b.name),
    },
    {
      title: 'Country',
      dataIndex: 'country_id',
      key: 'country_id',
      render: (countryId: number) => {
        const country = countries.find(c => c.id === countryId);
        return country ? country.name : 'Unknown';
      },
      filters: countries.map(country => ({
        text: country.name,
        value: country.id,
      })),
      onFilter: (value: any, record: State) => record.country_id === value,
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
      render: (_: any, record: State) => (
        <Space>
          <Button
            type='link'
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size='small'
          />
          <Popconfirm
            title='Are you sure you want to delete this state?'
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
              States Management
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() =>
                  fetchStates(pagination.page, pagination.limit, searchText)
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
                Add State
              </Button>
            </Space>
          </Col>
        </Row>

        <Row style={{ marginBottom: 16 }}>
          <Col span={24}>
            <Input.Search
              placeholder='Search states by name...'
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
              title='Total States'
              value={pagination.total}
              valueStyle={{ color: '#52c41a' }}
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
          dataSource={states}
          rowKey='id'
          loading={loading}
          pagination={false}
          scroll={{ x: 600 }}
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
        title={editingState ? 'Edit State' : 'Add State'}
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
            label='State Name'
            rules={[
              { required: true, message: 'Please enter state name' },
              { min: 2, message: 'State name must be at least 2 characters' },
            ]}
          >
            <Input placeholder='Enter state name' />
          </Form.Item>
          <Form.Item
            name='country_id'
            label='Country'
            rules={[{ required: true, message: 'Please select a country' }]}
          >
            <Select
              placeholder='Select a country'
              showSearch
              optionFilterProp='children'
              filterOption={(input, option) =>
                String(option?.children)
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {countries.length > 0 ? (
                countries.map(country => (
                  <Option key={country.id} value={country.id}>
                    {country.name}
                  </Option>
                ))
              ) : (
                <Option disabled value='no-data'>
                  No countries available
                </Option>
              )}
            </Select>
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

export default StatesPage;
