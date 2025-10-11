'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import './properties.css';
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
  DownOutlined,
  CalendarOutlined,
  CloseOutlined,
  CheckOutlined,
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

interface Developer {
  id: string;
  name: string;
  description?: string;
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
  developer_id?: string;
  payment_plan?: string;
  handover?: string;
  expected_appreciation?: string;
  brochure_url?: string;
  thumbnail_image?: string;
  property_images?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  property_status?: PropertyStatus;
  countries?: Country;
  states?: State;
  cities?: City;
  areas?: Area;
  property_types?: PropertyType;
  developers?: Developer;
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
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [brochureFileName, setBrochureFileName] = useState<string>('');
  const [thumbnailImage, setThumbnailImage] = useState<File | null>(null);
  const [existingThumbnail, setExistingThumbnail] = useState<string>('');
  const [propertyImages, setPropertyImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  // Custom dropdown states
  const [propertyTypeDropdownOpen, setPropertyTypeDropdownOpen] =
    useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [selectedPropertyType, setSelectedPropertyType] =
    useState<string>('All Property Types');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Status');
  const [selectedDateRange, setSelectedDateRange] =
    useState<string>('Last 2 days');

  // Refs for dropdown click outside detection
  const propertyTypeRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
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
        developersRes,
      ] = await Promise.all([
        axios.get('/api/property-status?limit=1000'),
        axios.get('/api/countries?limit=1000'),
        axios.get('/api/states?limit=1000'),
        axios.get('/api/cities?limit=1000'),
        axios.get('/api/areas?limit=1000'),
        axios.get('/api/property-types?limit=1000'),
        axios.get('/api/amenities?limit=1000'),
        axios.get('/api/developers?limit=1000'),
      ]);

      setPropertyStatuses(propertyStatusesRes.data.data);
      setCountries(countriesRes.data.data);
      setStates(statesRes.data.data);
      setCities(citiesRes.data.data);
      setAreas(areasRes.data.data);
      setPropertyTypes(propertyTypesRes.data.data);
      setAmenities(amenitiesRes.data.data);
      setDevelopers(developersRes.data.data);
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

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        propertyTypeRef.current &&
        !propertyTypeRef.current.contains(event.target as Node)
      ) {
        setPropertyTypeDropdownOpen(false);
      }
      if (
        statusRef.current &&
        !statusRef.current.contains(event.target as Node)
      ) {
        setStatusDropdownOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setDateDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAdd = () => {
    setEditingProperty(null);
    form.resetFields();
    setThumbnailImage(null);
    setExistingThumbnail('');
    setPropertyImages([]);
    setExistingImages([]);
    setImagesToDelete([]);
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
      developer_id: property.developer_id,
      payment_plan: property.payment_plan,
      handover: property.handover,
      expected_appreciation: property.expected_appreciation,
      brochure_url: property.brochure_url,
      amenities: property.property_amenities?.map(pa => pa.amenity_id) || [],
    });
    setThumbnailImage(null);
    setExistingThumbnail(property.thumbnail_image || '');
    setPropertyImages([]);
    setExistingImages(property.property_images || []);
    setImagesToDelete([]);
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

      // Validate thumbnail is present (required field)
      if (!thumbnailImage && !existingThumbnail) {
        message.error('Thumbnail image is required!');
        return;
      }

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
      formData.append('developer_id', values.developer_id || '');
      formData.append('payment_plan', values.payment_plan || '');
      formData.append('handover', values.handover || '');
      formData.append(
        'expected_appreciation',
        values.expected_appreciation || ''
      );
      formData.append('amenities', JSON.stringify(values.amenities || []));
      formData.append('brochure_url', values.brochure_url || '');

      // Handle thumbnail image
      if (thumbnailImage) {
        formData.append('thumbnail_image', thumbnailImage);
      } else if (existingThumbnail) {
        formData.append('existing_thumbnail', existingThumbnail);
      }

      if (editingProperty) {
        formData.append('id', editingProperty.id);
        formData.append('existing_brochure_url', values.brochure_url || '');
        formData.append('existing_thumbnail', existingThumbnail || '');
        // Send existing images that weren't deleted
        formData.append('existing_images', JSON.stringify(existingImages));
        // Send images marked for deletion
        formData.append('images_to_delete', JSON.stringify(imagesToDelete));
      }

      // Check if there's a new brochure file
      const brochureFileValue = form.getFieldValue('brochure_file');
      console.log('Brochure file from form:', brochureFileValue);

      // Extract the actual File object from Ant Design Upload structure
      let brochureFile = null;
      if (brochureFileValue) {
        // If it's an object with 'file' property (Ant Design structure)
        if (brochureFileValue.file) {
          brochureFile = brochureFileValue.file;
        }
        // If it's already a File object
        else if (brochureFileValue instanceof File) {
          brochureFile = brochureFileValue;
        }
      }

      console.log('Extracted brochure file:', brochureFile);
      console.log(
        'Brochure file instanceof File:',
        brochureFile instanceof File
      );

      if (
        brochureFile &&
        brochureFile instanceof File &&
        brochureFile.size > 0
      ) {
        formData.append('brochure_file', brochureFile);
        console.log(
          'Brochure file appended to formData:',
          brochureFile.name,
          brochureFile.size
        );
      } else {
        console.log('No valid brochure file selected');
      }

      // Append property images (new images to upload)
      propertyImages.forEach((file, index) => {
        formData.append('property_images', file);
      });

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
      setBrochureFileName('');
      setPropertyImages([]);
      setExistingImages([]);
      setImagesToDelete([]);
      fetchProperties(pagination.page, pagination.limit, searchText);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save property');
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
    setBrochureFileName('');
    setPropertyImages([]);
    setExistingImages([]);
    setImagesToDelete([]);
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    fetchProperties(page, pageSize || pagination.limit, searchText);
  };

  // Custom dropdown handlers
  const handlePropertyTypeSelect = (type: string) => {
    setSelectedPropertyType(type);
    setPropertyTypeDropdownOpen(false);
    // Add filtering logic here
  };

  const handleStatusSelect = (status: string) => {
    setSelectedStatus(status);
    setStatusDropdownOpen(false);
    // Add filtering logic here
  };

  const handleDateRangeSelect = (range: string) => {
    setSelectedDateRange(range);
    setDateDropdownOpen(false);
    // Add filtering logic here
  };

  // Image handling functions
  const handleImageSelect = (file: File) => {
    const totalImages = existingImages.length + propertyImages.length;
    if (totalImages >= 5) {
      message.error('Maximum 5 images allowed per property');
      return false;
    }

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

    setPropertyImages(prev => [...prev, file]);
    message.success(`Image "${file.name}" selected successfully!`);
    return false;
  };

  const handleRemoveNewImage = (file: File) => {
    setPropertyImages(prev => prev.filter(img => img !== file));
  };

  const handleRemoveExistingImage = (imageUrl: string) => {
    setExistingImages(prev => prev.filter(img => img !== imageUrl));
    setImagesToDelete(prev => [...prev, imageUrl]);
  };

  // Thumbnail handling functions
  const validateThumbnailDimensions = (file: File): Promise<boolean> => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          if (img.width > 800 || img.height > 800) {
            message.error(
              'Thumbnail dimensions must not exceed 800x800 pixels!'
            );
            resolve(false);
          } else {
            resolve(true);
          }
        };
        img.onerror = () => {
          message.error('Failed to load image for validation');
          resolve(false);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleThumbnailSelect = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Thumbnail must be smaller than 5MB!');
      return false;
    }

    const isValidDimensions = await validateThumbnailDimensions(file);
    if (!isValidDimensions) {
      return false;
    }

    setThumbnailImage(file);
    setExistingThumbnail(''); // Clear existing thumbnail when selecting new one
    message.success(`Thumbnail "${file.name}" selected successfully!`);
    return false;
  };

  const handleRemoveThumbnail = () => {
    setThumbnailImage(null);
    setExistingThumbnail('');
  };

  const columns = [
    {
      title: 'PROJECT NAME',
      dataIndex: 'project_name',
      key: 'project_name',
      sorter: (a: Property, b: Property) =>
        a.project_name.localeCompare(b.project_name),
      render: (name: string, record: Property) => (
        <div>
          <div className='table-column-title'>{name}</div>
          {record.property_types && (
            <div className='table-column-subtitle'>
              {record.property_types.name}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'LOCATION',
      key: 'location',
      render: (record: Property) => (
        <div className='table-location'>
          {record.countries && (
            <div>
              {record.countries.name}
              {record.states && `, ${record.states.name}`}
              {record.cities && `, ${record.cities.name}`}
              {record.areas && `, ${record.areas.name}`}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'STATUS',
      dataIndex: 'property_status',
      key: 'status',
      render: (status: PropertyStatus) =>
        status ? (
          <Tag
            color={
              status.color === '#10b981' ? 'green' : status.color || 'blue'
            }
            className='table-status-tag'
          >
            {status.name}
          </Tag>
        ) : (
          <span className='table-no-data'>No status</span>
        ),
    },
    {
      title: 'PRICE',
      dataIndex: 'starting_price',
      key: 'starting_price',
      render: (price: number) =>
        price ? (
          <div className='table-price'>${price.toLocaleString()}</div>
        ) : (
          <span className='table-no-data'>Not set</span>
        ),
    },
    {
      title: 'CREATED',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => {
        const dateObj = new Date(date);
        return (
          <div className='table-date'>
            {dateObj.toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: '2-digit',
            })}{' '}
            {dateObj.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}
          </div>
        );
      },
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      render: (_: any, record: Property) => (
        <Space>
          <Button
            type='link'
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size='small'
            className='action-edit-btn'
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
              type='link'
              danger
              icon={<DeleteOutlined />}
              size='small'
              className='action-delete-btn'
            >
              Delete
            </Button>
          </Popconfirm>
          {record.brochure_url && (
            <Button
              type='link'
              icon={<FileTextOutlined />}
              href={record.brochure_url}
              target='_blank'
              size='small'
              className='action-download-btn'
            >
              Download
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className='properties-container'>
      {/* Header */}
      <div className='properties-header'>
        <Title level={1} className='properties-title'>
          Properties
        </Title>
        <p className='properties-subtitle'>
          Manage your property listings and details
        </p>
      </div>

      {/* Search and Filters */}
      <div className='search-filters-card'>
        <Row gutter={[16, 16]} align='middle'>
          <Col flex='auto'>
            <Input.Search
              placeholder='Search properties...'
              allowClear
              onSearch={handleSearch}
              className='search-input'
              prefix={<SearchOutlined className='search-icon' />}
              size='large'
            />
          </Col>

          {/* Property Types Dropdown */}
          <Col>
            <div style={{ position: 'relative' }} ref={propertyTypeRef}>
              <div
                className={`custom-dropdown-trigger ${propertyTypeDropdownOpen ? 'active' : ''}`}
                onClick={() =>
                  setPropertyTypeDropdownOpen(!propertyTypeDropdownOpen)
                }
              >
                <div className='dropdown-trigger-content'>
                  <span className='dropdown-trigger-text'>
                    {selectedPropertyType}
                  </span>
                </div>
                <DownOutlined
                  className={`dropdown-chevron ${propertyTypeDropdownOpen ? 'open' : ''}`}
                />
              </div>

              {propertyTypeDropdownOpen && (
                <div className='custom-dropdown-menu'>
                  <div className='dropdown-menu-list'>
                    <div
                      className={`dropdown-menu-item ${selectedPropertyType === 'All Property Types' ? 'selected' : ''}`}
                      onClick={() =>
                        handlePropertyTypeSelect('All Property Types')
                      }
                    >
                      <span>All Property Types</span>
                      {selectedPropertyType === 'All Property Types' && (
                        <CheckOutlined className='dropdown-menu-check' />
                      )}
                    </div>
                    {propertyTypes.map(type => (
                      <div
                        key={type.id}
                        className={`dropdown-menu-item ${selectedPropertyType === type.name ? 'selected' : ''}`}
                        onClick={() => handlePropertyTypeSelect(type.name)}
                      >
                        <span>{type.name}</span>
                        {selectedPropertyType === type.name && (
                          <CheckOutlined className='dropdown-menu-check' />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Col>

          {/* Status Dropdown */}
          <Col>
            <div style={{ position: 'relative' }} ref={statusRef}>
              <div
                className={`custom-dropdown-trigger ${statusDropdownOpen ? 'active' : ''}`}
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              >
                <div className='dropdown-trigger-content'>
                  <span className='dropdown-trigger-text'>
                    {selectedStatus}
                  </span>
                </div>
                <DownOutlined
                  className={`dropdown-chevron ${statusDropdownOpen ? 'open' : ''}`}
                />
              </div>

              {statusDropdownOpen && (
                <div className='custom-dropdown-menu'>
                  <div className='dropdown-menu-list'>
                    <div
                      className={`dropdown-menu-item ${selectedStatus === 'All Status' ? 'selected' : ''}`}
                      onClick={() => handleStatusSelect('All Status')}
                    >
                      <span>All Status</span>
                      {selectedStatus === 'All Status' && (
                        <CheckOutlined className='dropdown-menu-check' />
                      )}
                    </div>
                    {propertyStatuses.map(status => (
                      <div
                        key={status.id}
                        className={`dropdown-menu-item ${selectedStatus === status.name ? 'selected' : ''}`}
                        onClick={() => handleStatusSelect(status.name)}
                      >
                        <span>{status.name}</span>
                        {selectedStatus === status.name && (
                          <CheckOutlined className='dropdown-menu-check' />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Col>

          {/* Date Range Dropdown */}
          <Col>
            <div style={{ position: 'relative' }} ref={dateRef}>
              <div
                className={`custom-dropdown-trigger date-dropdown-trigger ${dateDropdownOpen ? 'active' : ''}`}
                onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
              >
                <div className='dropdown-trigger-content'>
                  <CalendarOutlined className='dropdown-calendar-icon' />
                  <span className='dropdown-trigger-text'>
                    {selectedDateRange}
                  </span>
                </div>
                <DownOutlined
                  className={`dropdown-chevron ${dateDropdownOpen ? 'open' : ''}`}
                />
              </div>

              {dateDropdownOpen && (
                <div className='custom-dropdown-menu'>
                  <div className='dropdown-menu-header'>
                    <span className='dropdown-menu-title'>Date Range</span>
                    <CloseOutlined
                      className='dropdown-menu-close'
                      onClick={() => setDateDropdownOpen(false)}
                    />
                  </div>
                  <div className='dropdown-menu-list'>
                    {[
                      'Last 2 days',
                      'Last 7 days',
                      'Last 30 days',
                      'Last 90 days',
                      'Custom range',
                    ].map(range => (
                      <div
                        key={range}
                        className={`dropdown-menu-item ${selectedDateRange === range ? 'selected' : ''}`}
                        onClick={() => handleDateRangeSelect(range)}
                      >
                        <span>{range}</span>
                        {selectedDateRange === range && (
                          <CheckOutlined className='dropdown-menu-check' />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Col>

          <Col>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={handleAdd}
              size='large'
              className='add-property-btn'
            >
              Add Property
            </Button>
          </Col>
        </Row>
      </div>

      {/* Properties Table */}
      <div className='properties-table-card'>
        <Table
          columns={columns}
          dataSource={properties}
          rowKey='id'
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
          className='properties-table'
        />

        <div className='pagination-container'>
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
      </div>

      <Modal
        title={editingProperty ? 'Edit Property' : 'Add Property'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={1000}
        okText={editingProperty ? 'Update' : 'Create'}
        cancelText='Cancel'
        className='custom-modal'
        okButtonProps={{
          className: 'custom-modal-ok-btn',
        }}
        cancelButtonProps={{
          className: 'custom-modal-cancel-btn',
        }}
        styles={{
          header: {
            borderRadius: '12px 12px 0 0',
          },
          body: {
            borderRadius: '0 0 12px 12px',
          },
          footer: {
            borderRadius: '0 0 12px 12px',
          },
        }}
      >
        <Form
          form={form}
          layout='vertical'
          className='custom-form'
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
                className='custom-form-item-label'
                rules={[
                  { required: true, message: 'Please enter project name' },
                  {
                    min: 2,
                    message: 'Project name must be at least 2 characters',
                  },
                ]}
              >
                <Input
                  placeholder='Enter project name'
                  className='custom-form-input'
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='developer_id'
                label='Developer'
                className='custom-form-item-label'
              >
                <Select
                  placeholder='Select developer'
                  className='custom-form-input'
                  showSearch
                  optionFilterProp='children'
                  filterOption={(input, option) =>
                    String(option?.children)
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {developers.map(developer => (
                    <Option key={developer.id} value={developer.id}>
                      <Space>
                        {developer.image_url && (
                          <img
                            src={developer.image_url}
                            alt={developer.name}
                            style={{
                              width: 20,
                              height: 20,
                              objectFit: 'cover',
                              borderRadius: 2,
                            }}
                          />
                        )}
                        {developer.name}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name='country_id'
                label='Country'
                className='custom-form-item-label'
              >
                <Select
                  placeholder='Select country'
                  className='custom-form-input'
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
              <Form.Item
                name='state_id'
                label='State'
                className='custom-form-item-label'
              >
                <Select
                  placeholder='Select state'
                  className='custom-form-input'
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
              <Form.Item
                name='city_id'
                label='City'
                className='custom-form-item-label'
              >
                <Select
                  placeholder='Select city'
                  className='custom-form-input'
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
              <Form.Item
                name='area_id'
                label='Area'
                className='custom-form-item-label'
              >
                <Select
                  placeholder='Select area'
                  className='custom-form-input'
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
            <Col span={8}>
              <Form.Item
                name='starting_price'
                label='Starting Price'
                className='custom-form-item-label'
              >
                <InputNumber
                  placeholder='Enter starting price'
                  className='custom-form-input'
                  style={{ width: '100%' }}
                  formatter={value =>
                    `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name='property_type_id'
                label='Property Type'
                className='custom-form-item-label'
              >
                <Select
                  placeholder='Select property type'
                  className='custom-form-input'
                >
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
            <Col span={8}>
              <Form.Item
                name='property_status_id'
                label='Property Status'
                className='custom-form-item-label'
              >
                <Select
                  placeholder='Select property status'
                  className='custom-form-input'
                >
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

          <Form.Item
            name='payment_plan'
            label='Payment Plan'
            className='custom-form-item-label'
          >
            <TextArea
              placeholder='Enter payment plan details'
              rows={3}
              className='custom-form-input custom-form-textarea'
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name='handover'
                label='Handover'
                className='custom-form-item-label'
              >
                <TextArea
                  placeholder='Enter handover details'
                  rows={2}
                  className='custom-form-input custom-form-textarea'
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name='expected_appreciation'
                label='Expected Appreciation'
                className='custom-form-item-label'
              >
                <TextArea
                  placeholder='Enter expected appreciation details'
                  rows={2}
                  className='custom-form-input custom-form-textarea'
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name='amenities'
            label='Amenities'
            className='custom-form-item-label'
          >
            <Select
              mode='multiple'
              placeholder='Select amenities'
              className='custom-form-input'
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

          <Form.Item
            name='brochure_url'
            label='Brochure'
            style={{ display: 'none' }}
          >
            <Input type='hidden' />
          </Form.Item>

          <Form.Item
            name='brochure_file'
            label='Upload Brochure'
            className='custom-form-item-label'
          >
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
                setBrochureFileName(file.name);
                message.success(`File "${file.name}" selected successfully!`);
                return false;
              }}
              onRemove={() => {
                form.setFieldsValue({ brochure_file: null });
                setBrochureFileName('');
                return true;
              }}
              fileList={
                brochureFileName
                  ? [
                      {
                        uid: '-1',
                        name: brochureFileName,
                        status: 'done',
                        url: '',
                      },
                    ]
                  : []
              }
              accept='.pdf,.doc,.docx'
            >
              <Button icon={<UploadOutlined />} className='custom-upload-btn'>
                {brochureFileName
                  ? 'Change Brochure'
                  : 'Upload Brochure (PDF/Word)'}
              </Button>
            </Upload>
          </Form.Item>

          <Divider />

          <Form.Item
            label='Thumbnail Image'
            className='custom-form-item-label'
            required
            extra='Required. Max dimensions: 800x800 pixels'
          >
            <div style={{ marginBottom: '16px' }}>
              {/* Existing Thumbnail */}
              {existingThumbnail && !thumbnailImage && (
                <div style={{ marginBottom: '12px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      marginBottom: '8px',
                    }}
                  >
                    Current Thumbnail:
                  </div>
                  <div
                    style={{
                      position: 'relative',
                      width: '150px',
                      height: '150px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={existingThumbnail}
                      alt='Thumbnail'
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <Button
                      type='text'
                      danger
                      icon={<CloseOutlined />}
                      size='small'
                      onClick={handleRemoveThumbnail}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(255, 255, 255, 0.9)',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* New Thumbnail Preview */}
              {thumbnailImage && (
                <div style={{ marginBottom: '12px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      marginBottom: '8px',
                    }}
                  >
                    New Thumbnail:
                  </div>
                  <div
                    style={{
                      position: 'relative',
                      width: '150px',
                      height: '150px',
                      border: '1px solid #52c41a',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={URL.createObjectURL(thumbnailImage)}
                      alt='New Thumbnail'
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <Button
                      type='text'
                      danger
                      icon={<CloseOutlined />}
                      size='small'
                      onClick={handleRemoveThumbnail}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(255, 255, 255, 0.9)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '4px',
                        right: '4px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        padding: '2px 6px',
                        fontSize: '10px',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {thumbnailImage.name}
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              {!thumbnailImage && !existingThumbnail && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#ff4d4f',
                    marginBottom: '8px',
                  }}
                >
                  * Thumbnail is required
                </div>
              )}
              <Upload
                beforeUpload={handleThumbnailSelect}
                showUploadList={false}
                accept='image/*'
                disabled={!!thumbnailImage}
              >
                <Button
                  icon={<UploadOutlined />}
                  className='custom-upload-btn'
                  disabled={!!thumbnailImage}
                >
                  {thumbnailImage || existingThumbnail
                    ? 'Thumbnail Selected'
                    : 'Select Thumbnail'}
                </Button>
              </Upload>
            </div>
          </Form.Item>

          <Form.Item
            label='Property Images'
            className='custom-form-item-label'
            extra={`You can upload up to 5 images. ${existingImages.length + propertyImages.length}/5 images selected.`}
          >
            <div style={{ marginBottom: '16px' }}>
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      marginBottom: '8px',
                    }}
                  >
                    Existing Images:
                  </div>
                  <div
                    style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}
                  >
                    {existingImages.map((imageUrl, index) => (
                      <div
                        key={`existing-${index}`}
                        style={{
                          position: 'relative',
                          width: '120px',
                          height: '120px',
                          border: '1px solid #d9d9d9',
                          borderRadius: '8px',
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt={`Property ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        <Button
                          type='primary'
                          danger
                          size='small'
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveExistingImage(imageUrl)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images */}
              {propertyImages.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      marginBottom: '8px',
                    }}
                  >
                    New Images to Upload:
                  </div>
                  <div
                    style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}
                  >
                    {propertyImages.map((file, index) => (
                      <div
                        key={`new-${index}`}
                        style={{
                          position: 'relative',
                          width: '120px',
                          height: '120px',
                          border: '1px solid #d9d9d9',
                          borderRadius: '8px',
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        <Button
                          type='primary'
                          danger
                          size='small'
                          icon={<CloseOutlined />}
                          onClick={() => handleRemoveNewImage(file)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Upload
              beforeUpload={handleImageSelect}
              showUploadList={false}
              accept='image/*'
              multiple
              disabled={existingImages.length + propertyImages.length >= 5}
            >
              <Button
                icon={<UploadOutlined />}
                className='custom-upload-btn'
                disabled={existingImages.length + propertyImages.length >= 5}
              >
                {existingImages.length + propertyImages.length >= 5
                  ? 'Maximum Images Reached'
                  : 'Select Images'}
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
