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
  state?: State;
}

interface Area {
  id: number;
  name: string;
  city_id: number;
  image_url?: string;
  city?: City;
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

const AreasPage = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [form] = Form.useForm();
  const [imagePreview, setImagePreview] = useState<string>('');
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

  const fetchCities = async () => {
    try {
      const response = await axios.get('/api/cities?limit=1000');
      setCities(response.data.data);
    } catch (error: any) {
      message.error('Failed to fetch cities');
    }
  };

  const fetchAreas = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/areas?page=${page}&limit=${limit}`
      );
      setAreas(response.data.data);
      setPagination(response.data.pagination);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to fetch areas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
    fetchStates();
    fetchCities();
    fetchAreas();
  }, []);

  const handleAdd = () => {
    setEditingArea(null);
    form.resetFields();
    setImagePreview('');
    setSelectedImageFile(null);
    setModalVisible(true);
  };

  const handleEdit = (record: Area) => {
    setEditingArea(record);
    form.setFieldsValue({
      name: record.name,
      city_id: record.city_id,
    });
    setImagePreview(record.image_url || '');
    setSelectedImageFile(null); // Clear any previously selected file
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/areas?id=${id}`);
      message.success('Area deleted successfully');
      fetchAreas(pagination.page, pagination.limit);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to delete area');
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      // Store the file for later use in form submission
      setImagePreview(URL.createObjectURL(file));
      setSelectedImageFile(file);
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

      if (editingArea) {
        // Check if image was removed during editing
        const hadImage = editingArea.image_url;
        const hasNewImage = selectedImageFile;
        const shouldRemoveImage = hadImage && !hasNewImage;

        // Handle update with form data if file is present or should be removed
        if (selectedImageFile || shouldRemoveImage) {
          const formData = new FormData();
          formData.append('id', editingArea.id.toString());
          formData.append('name', values.name);
          formData.append('city_id', values.city_id.toString());
          formData.append('old_image_url', editingArea.image_url || '');

          if (shouldRemoveImage) {
            formData.append('remove_image', 'true');
          } else if (selectedImageFile) {
            formData.append('file', selectedImageFile);
          }

          await axios.put('/api/areas', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } else {
          // Handle update with JSON if no file
          await axios.put('/api/areas', {
            id: editingArea.id,
            name: values.name,
            city_id: values.city_id,
            image_url: values.image_url,
            old_image_url: editingArea.image_url,
          });
        }
        message.success('Area updated successfully');
      } else {
        // Handle create with form data if file is present
        if (selectedImageFile) {
          const formData = new FormData();
          formData.append('name', values.name);
          formData.append('city_id', values.city_id.toString());
          formData.append('file', selectedImageFile);

          await axios.post('/api/areas', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } else {
          // Handle create with JSON if no file
          await axios.post('/api/areas', {
            name: values.name,
            city_id: values.city_id,
            image_url: values.image_url,
          });
        }
        message.success('Area created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      setImagePreview('');
      setSelectedImageFile(null);
      fetchAreas(pagination.page, pagination.limit);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save area');
    }
  };

  const handleTableChange = (page: number, pageSize?: number) => {
    fetchAreas(page, pageSize || pagination.limit);
  };

  const getCityName = (cityId: number) => {
    const city = cities.find(c => c.id === cityId);
    return city ? city.name : 'Unknown';
  };

  const getStateName = (cityId: number) => {
    const city = cities.find(c => c.id === cityId);
    if (city) {
      const state = states.find(s => s.id === city.state_id);
      return state ? state.name : 'Unknown';
    }
    return 'Unknown';
  };

  const getCountryName = (cityId: number) => {
    const city = cities.find(c => c.id === cityId);
    if (city) {
      const state = states.find(s => s.id === city.state_id);
      if (state) {
        const country = countries.find(c => c.id === state.country_id);
        return country ? country.name : 'Unknown';
      }
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
            alt='Area'
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
      sorter: (a: Area, b: Area) => a.name.localeCompare(b.name),
    },
    {
      title: 'City',
      dataIndex: 'city_id',
      key: 'city_id',
      render: (cityId: number) => getCityName(cityId),
      filters: cities.map(city => ({
        text: city.name,
        value: city.id,
      })),
      onFilter: (value: any, record: Area) => record.city_id === value,
    },
    {
      title: 'State',
      dataIndex: 'city_id',
      key: 'state',
      render: (cityId: number) => getStateName(cityId),
    },
    {
      title: 'Country',
      dataIndex: 'city_id',
      key: 'country',
      render: (cityId: number) => getCountryName(cityId),
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
      render: (_: any, record: Area) => (
        <Space>
          <Button
            type='link'
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size='small'
          />
          <Popconfirm
            title='Are you sure you want to delete this area?'
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
              Areas Management
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchAreas(pagination.page, pagination.limit)}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                type='primary'
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Add Area
              </Button>
            </Space>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Statistic
              title='Total Areas'
              value={pagination.total}
              valueStyle={{ color: '#eb2f96' }}
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
          dataSource={areas}
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
        title={editingArea ? 'Edit Area' : 'Add Area'}
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
            label='Area Name'
            rules={[
              { required: true, message: 'Please enter area name' },
              { min: 2, message: 'Area name must be at least 2 characters' },
            ]}
          >
            <Input placeholder='Enter area name' />
          </Form.Item>
          <Form.Item
            name='city_id'
            label='City'
            rules={[{ required: true, message: 'Please select a city' }]}
          >
            <Select
              placeholder='Select a city'
              showSearch
              optionFilterProp='children'
              filterOption={(input, option) =>
                String(option?.children)
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {cities.map(city => (
                <Option key={city.id} value={city.id}>
                  {city.name} ({getStateName(city.id)},{' '}
                  {getCountryName(city.id)})
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

export default AreasPage;
