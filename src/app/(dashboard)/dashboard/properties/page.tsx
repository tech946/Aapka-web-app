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
  Divider,
  Select,
  InputNumber,
  Tag,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  SearchOutlined,
  FileTextOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  FlagOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface PropertyStatus {
  id: string;
  name: string;
  color?: string;
}

interface Country {
  id: string;
  name: string;
}

interface State {
  id: string;
  name: string;
}

interface City {
  id: string;
  name: string;
}

interface Area {
  id: string;
  name: string;
}

interface PropertyType {
  id: number;
  name: string;
  image_url?: string;
}

interface Amenity {
  id: string;
  name: string;
  image_url?: string;
}

interface Property {
  id: string;
  project_name: string;
  property_status_id?: string;
  country_id?: string;
  state_id?: string;
  city_id?: string;
  area_id?: string;
  starting_price?: number;
  property_type_id?: number;
  payment_plan?: string;
  handover?: string;
  expected_appreciation?: string;
  brochure_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  property_status?: PropertyStatus;
  countries?: Country;
  states?: State;
  cities?: City;
  areas?: Area;
  property_types?: PropertyType;
  property_amenities?: Array<{
    amenity_id: string;
    amenities: Amenity;
  }>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const PropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyStatuses, setPropertyStatuses] = useState<PropertyStatus[]>(
    []
  );
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Fetch all master data
  const fetchMasterData = async () => {
    try {
      const [
        propertyStatusesRes,
        countriesRes,
        statesRes,
        citiesRes,
        areasRes,
        propertyTypesRes,
        amenitiesRes,
      ] = await Promise.all([
        axios.get('/api/property-status?limit=1000'),
        axios.get('/api/countries?limit=1000'),
        axios.get('/api/states?limit=1000'),
        axios.get('/api/cities?limit=1000'),
        axios.get('/api/areas?limit=1000'),
        axios.get('/api/property-types?limit=1000'),
        axios.get('/api/amenities?limit=1000'),
      ]);

      setPropertyStatuses(propertyStatusesRes.data.data);
      setCountries(countriesRes.data.data);
      setStates(statesRes.data.data);
      setCities(citiesRes.data.data);
      setAreas(areasRes.data.data);
      setPropertyTypes(propertyTypesRes.data.data);
      setAmenities(amenitiesRes.data.data);
    } catch (error: any) {
      message.error('Failed to fetch master data');
    }
  };

  const fetchProperties = async (page = 1, limit = 10, search = '') => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/properties?page=${page}&limit=${limit}&search=${search}`
      );
      setProperties(response.data.data);
      setPagination(response.data.pagination);
    } catch (error: any) {
      message.error(
        error.response?.data?.error || 'Failed to fetch properties'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
    fetchProperties();
  }, []);

  const handleAdd = () => {
    setEditingProperty(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    form.setFieldsValue({
      project_name: property.project_name,
      property_status_id: property.property_status_id,
      country_id: property.country_id,
      state_id: property.state_id,
      city_id: property.city_id,
      area_id: property.area_id,
      starting_price: property.starting_price,
      property_type_id: property.property_type_id,
      payment_plan: property.payment_plan,
      handover: property.handover,
      expected_appreciation: property.expected_appreciation,
      brochure_url: property.brochure_url,
      amenities: property.property_amenities?.map(pa => pa.amenity_id) || [],
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/properties?id=${id}`);
      message.success('Property deleted successfully');
      fetchProperties(pagination.page, pagination.limit, searchText);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to delete property');
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchProperties(1, pagination.limit, value);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();

      formData.append('project_name', values.project_name);
      formData.append('property_status_id', values.property_status_id || '');
      formData.append('country_id', values.country_id || '');
      formData.append('state_id', values.state_id || '');
      formData.append('city_id', values.city_id || '');
      formData.append('area_id', values.area_id || '');
      formData.append(
        'starting_price',
        values.starting_price?.toString() || ''
      );
      formData.append('property_type_id', values.property_type_id || '');
      formData.append('payment_plan', values.payment_plan || '');
      formData.append('handover', values.handover || '');
      formData.append(
        'expected_appreciation',
        values.expected_appreciation || ''
      );
      formData.append('amenities', JSON.stringify(values.amenities || []));
      formData.append('brochure_url', values.brochure_url || '');

      if (editingProperty) {
        formData.append('id', editingProperty.id);
        formData.append('existing_brochure_url', values.brochure_url || '');
      }

      // Check if there's a new brochure file
      const brochureFile = form.getFieldValue('brochure_file');
      if (brochureFile) {
        formData.append('brochure_file', brochureFile);
      }

      if (editingProperty) {
        await axios.put('/api/properties', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        message.success('Property updated successfully');
      } else {
        await axios.post('/api/properties', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        message.success('Property created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      fetchProperties(pagination.page, pagination.limit, searchText);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save property');
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    fetchProperties(page, pageSize || pagination.limit, searchText);
  };

  const columns = [
    {
      title: 'Project Name',
      dataIndex: 'project_name',
      key: 'project_name',
      sorter: (a: Property, b: Property) =>
        a.project_name.localeCompare(b.project_name),
      render: (name: string, record: Property) => (
        <Space direction='vertical' size={0}>
          <div style={{ fontWeight: 500 }}>{name}</div>
          {record.property_types && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              <HomeOutlined /> {record.property_types.name}
            </div>
          )}
        </Space>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      render: (record: Property) => (
        <Space direction='vertical' size={0}>
          {record.countries && (
            <div style={{ fontSize: '12px' }}>
              <EnvironmentOutlined /> {record.countries.name}
              {record.states && `, ${record.states.name}`}
              {record.cities && `, ${record.cities.name}`}
              {record.areas && `, ${record.areas.name}`}
            </div>
          )}
        </Space>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'starting_price',
      key: 'starting_price',
      render: (price: number) =>
        price ? (
          <Space>
            <DollarOutlined />
            {price.toLocaleString()}
          </Space>
        ) : (
          <span style={{ color: '#999' }}>Not set</span>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'property_status',
      key: 'status',
      render: (status: PropertyStatus) =>
        status ? (
          <Tag color={status.color || 'blue'} style={{ margin: 0 }}>
            {status.name}
          </Tag>
        ) : (
          <span style={{ color: '#999' }}>No status</span>
        ),
    },
    {
      title: 'Amenities',
      dataIndex: 'property_amenities',
      key: 'amenities',
      render: (
        amenities: Array<{ amenity_id: string; amenities: Amenity }>
      ) => (
        <Space wrap>
          {amenities?.slice(0, 2).map((pa, index) => (
            <Tag key={index}>{pa.amenities.name}</Tag>
          ))}
          {amenities && amenities.length > 2 && (
            <Tooltip
              title={amenities
                .slice(2)
                .map(pa => pa.amenities.name)
                .join(', ')}
            >
              <Tag>+{amenities.length - 2}</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Brochure',
      dataIndex: 'brochure_url',
      key: 'brochure',
      render: (url: string) =>
        url ? (
          <Button
            type='link'
            icon={<FileTextOutlined />}
            href={url}
            target='_blank'
            size='small'
          >
            View
          </Button>
        ) : (
          <span style={{ color: '#999' }}>No brochure</span>
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
      render: (_: any, record: Property) => (
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
            title='Are you sure you want to delete this property?'
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
            Properties Management
          </Title>
        </Col>
        <Col>
          <Space>
            <Input.Search
              placeholder='Search properties...'
              allowClear
              onSearch={handleSearch}
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={handleAdd}
              size='large'
            >
              Add Property
            </Button>
          </Space>
        </Col>
      </Row>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Statistic
              title='Total Properties'
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
          dataSource={properties}
          rowKey='id'
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
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
        title={editingProperty ? 'Edit Property' : 'Add Property'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={1000}
        okText={editingProperty ? 'Update' : 'Create'}
        cancelText='Cancel'
      >
        <Form
          form={form}
          layout='vertical'
          initialValues={{
            project_name: '',
            property_status_id: '',
            country_id: '',
            state_id: '',
            city_id: '',
            area_id: '',
            starting_price: null,
            property_type_id: '',
            payment_plan: '',
            handover: '',
            expected_appreciation: '',
            amenities: [],
            brochure_url: '',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name='project_name'
                label='Project Name'
                rules={[
                  { required: true, message: 'Please enter project name' },
                  {
                    min: 2,
                    message: 'Project name must be at least 2 characters',
                  },
                ]}
              >
                <Input placeholder='Enter project name' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name='property_status_id' label='Property Status'>
                <Select placeholder='Select property status'>
                  {propertyStatuses.map(status => (
                    <Option key={status.id} value={status.id}>
                      <Space>
                        {status.color && (
                          <div
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: status.color,
                              display: 'inline-block',
                            }}
                          />
                        )}
                        {status.name}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name='country_id' label='Country'>
                <Select
                  placeholder='Select country'
                  showSearch
                  optionFilterProp='children'
                  filterOption={(input, option) =>
                    String(option?.children)
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {countries.map(country => (
                    <Option key={country.id} value={country.id}>
                      {country.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='state_id' label='State'>
                <Select
                  placeholder='Select state'
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
                      {state.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='city_id' label='City'>
                <Select
                  placeholder='Select city'
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
                      {city.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='area_id' label='Area'>
                <Select
                  placeholder='Select area'
                  showSearch
                  optionFilterProp='children'
                  filterOption={(input, option) =>
                    String(option?.children)
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {areas.map(area => (
                    <Option key={area.id} value={area.id}>
                      {area.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name='starting_price' label='Starting Price'>
                <InputNumber
                  placeholder='Enter starting price'
                  style={{ width: '100%' }}
                  formatter={value =>
                    `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name='property_type_id' label='Property Type'>
                <Select placeholder='Select property type'>
                  {propertyTypes.map(type => (
                    <Option key={type.id} value={type.id}>
                      <Space>
                        {type.image_url && (
                          <img
                            src={type.image_url}
                            alt={type.name}
                            style={{
                              width: 20,
                              height: 20,
                              objectFit: 'cover',
                              borderRadius: 2,
                            }}
                          />
                        )}
                        {type.name}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name='payment_plan' label='Payment Plan'>
            <TextArea placeholder='Enter payment plan details' rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name='handover' label='Handover'>
                <TextArea placeholder='Enter handover details' rows={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='expected_appreciation'
                label='Expected Appreciation'
              >
                <TextArea
                  placeholder='Enter expected appreciation details'
                  rows={2}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name='amenities' label='Amenities'>
            <Select
              mode='multiple'
              placeholder='Select amenities'
              showSearch
              optionFilterProp='children'
              filterOption={(input, option) =>
                String(option?.children)
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {amenities.map(amenity => (
                <Option key={amenity.id} value={amenity.id}>
                  <Space>
                    {amenity.image_url && (
                      <img
                        src={amenity.image_url}
                        alt={amenity.name}
                        style={{
                          width: 20,
                          height: 20,
                          objectFit: 'cover',
                          borderRadius: 2,
                        }}
                      />
                    )}
                    {amenity.name}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name='brochure_url' label='Brochure'>
            <Input type='hidden' />
          </Form.Item>

          <Form.Item name='brochure_file' label='Upload Brochure'>
            <Upload
              beforeUpload={file => {
                const isDoc =
                  file.type === 'application/pdf' ||
                  file.type === 'application/msword' ||
                  file.type ===
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                if (!isDoc) {
                  message.error('You can only upload PDF or Word documents!');
                  return false;
                }
                const isLt10M = file.size / 1024 / 1024 < 10;
                if (!isLt10M) {
                  message.error('File must be smaller than 10MB!');
                  return false;
                }
                form.setFieldsValue({ brochure_file: file });
                return false;
              }}
              showUploadList={false}
              accept='.pdf,.doc,.docx'
            >
              <Button icon={<UploadOutlined />}>
                Upload Brochure (PDF/Word)
              </Button>
            </Upload>
          </Form.Item>

          <Divider />
        </Form>
      </Modal>
    </div>
  );
};

export default PropertiesPage;
