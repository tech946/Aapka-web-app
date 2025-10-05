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
  Cascader,
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
  country?: Country;
}

interface City {
  id: number;
  name: string;
  state_id: number;
  image_url?: string;
  state?: State;
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

const CitiesPage = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [form] = Form.useForm();
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
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

  const fetchStates = async () => {
    try {
      const response = await axios.get('/api/states?limit=1000');
      setStates(response.data.data);
    } catch (error: any) {
      message.error('Failed to fetch states');
    }
  };

  const fetchCities = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/cities?page=${page}&limit=${limit}`
      );
      setCities(response.data.data);
      setPagination(response.data.pagination);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to fetch cities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
    fetchStates();
    fetchCities();
  }, []);

  const handleAdd = () => {
    setEditingCity(null);
    form.resetFields();
    setImagePreview('');
    setModalVisible(true);
  };

  const handleEdit = (record: City) => {
    setEditingCity(record);
    form.setFieldsValue({
      name: record.name,
      state_id: record.state_id,
    });
    setImagePreview(record.image_url || '');
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/cities?id=${id}`);
      message.success('City deleted successfully');
      fetchCities(pagination.page, pagination.limit);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to delete city');
    }
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

      if (editingCity) {
        // Handle update with form data if file is present
        if (values.image_file) {
          const formData = new FormData();
          formData.append('id', editingCity.id.toString());
          formData.append('name', values.name);
          formData.append('state_id', values.state_id.toString());
          formData.append('old_image_url', editingCity.image_url || '');
          formData.append('file', values.image_file);

          await axios.put('/api/cities', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } else {
          // Handle update with JSON if no file
          await axios.put('/api/cities', {
            id: editingCity.id,
            name: values.name,
            state_id: values.state_id,
            image_url: values.image_url,
            old_image_url: editingCity.image_url,
          });
        }
        message.success('City updated successfully');
      } else {
        // Handle create with form data if file is present
        if (values.image_file) {
          const formData = new FormData();
          formData.append('name', values.name);
          formData.append('state_id', values.state_id.toString());
          formData.append('file', values.image_file);

          await axios.post('/api/cities', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } else {
          // Handle create with JSON if no file
          await axios.post('/api/cities', {
            name: values.name,
            state_id: values.state_id,
            image_url: values.image_url,
          });
        }
        message.success('City created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      setImagePreview('');
      fetchCities(pagination.page, pagination.limit);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save city');
    }
  };

  const handleTableChange = (page: number, pageSize?: number) => {
    fetchCities(page, pageSize || pagination.limit);
  };

  const getStateName = (stateId: number) => {
    const state = states.find(s => s.id === stateId);
    return state ? state.name : 'Unknown';
  };

  const getCountryName = (stateId: number) => {
    const state = states.find(s => s.id === stateId);
    if (state) {
      const country = countries.find(c => c.id === state.country_id);
      return country ? country.name : 'Unknown';
    }
    return 'Unknown';
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
            alt='City'
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
      sorter: (a: City, b: City) => a.name.localeCompare(b.name),
    },
    {
      title: 'State',
      dataIndex: 'state_id',
      key: 'state_id',
      render: (stateId: number) => getStateName(stateId),
      filters: states.map(state => ({
        text: state.name,
        value: state.id,
      })),
      onFilter: (value: any, record: City) => record.state_id === value,
    },
    {
      title: 'Country',
      dataIndex: 'state_id',
      key: 'country',
      render: (stateId: number) => getCountryName(stateId),
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
      render: (_: any, record: City) => (
        <Space>
          <Button
            type='link'
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size='small'
          />
          <Popconfirm
            title='Are you sure you want to delete this city?'
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
              Cities Management
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchCities(pagination.page, pagination.limit)}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                type='primary'
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Add City
              </Button>
            </Space>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Statistic
              title='Total Cities'
              value={pagination.total}
              valueStyle={{ color: '#fa8c16' }}
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
          dataSource={cities}
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
            onChange={handleTableChange}
            onShowSizeChange={handleTableChange}
          />
        </div>
      </Card>

      <Modal
        title={editingCity ? 'Edit City' : 'Add City'}
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
            label='City Name'
            rules={[
              { required: true, message: 'Please enter city name' },
              { min: 2, message: 'City name must be at least 2 characters' },
            ]}
          >
            <Input placeholder='Enter city name' />
          </Form.Item>
          <Form.Item
            name='state_id'
            label='State'
            rules={[{ required: true, message: 'Please select a state' }]}
          >
            <Select
              placeholder='Select a state'
              showSearch
              optionFilterProp='children'
              filterOption={(input, option) =>
                String(option?.children)
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {states.map(state => (
                <Option key={state.id} value={state.id}>
                  {state.name} ({getCountryName(state.id)})
                </Option>
              ))}
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

export default CitiesPage;
