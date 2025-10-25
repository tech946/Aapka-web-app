'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Input,
  message,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Tag,
  Empty,
  Skeleton,
  Spin,
  Tooltip,
  Modal,
  Checkbox,
  AutoComplete,
  List,
  Avatar,
} from 'antd';
import {
  SearchOutlined,
  SaveOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import Image from 'next/image';
import './page.css';

const { Title, Text } = Typography;

// World currencies list with flag images
const CURRENCIES = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    country: 'United States',
    countryCode: 'us',
  },
  {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    country: 'United Arab Emirates',
    countryCode: 'ae',
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    country: 'European Union',
    countryCode: 'eu',
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    country: 'United Kingdom',
    countryCode: 'gb',
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    country: 'India',
    countryCode: 'in',
  },
  {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: '﷼',
    country: 'Saudi Arabia',
    countryCode: 'sa',
  },
  {
    code: 'QAR',
    name: 'Qatari Riyal',
    symbol: 'ر.ق',
    country: 'Qatar',
    countryCode: 'qa',
  },
  {
    code: 'OMR',
    name: 'Omani Rial',
    symbol: 'ر.ع.',
    country: 'Oman',
    countryCode: 'om',
  },
  {
    code: 'KWD',
    name: 'Kuwaiti Dinar',
    symbol: 'د.ك',
    country: 'Kuwait',
    countryCode: 'kw',
  },
  {
    code: 'BHD',
    name: 'Bahraini Dinar',
    symbol: 'د.ب',
    country: 'Bahrain',
    countryCode: 'bh',
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    country: 'Japan',
    countryCode: 'jp',
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    country: 'China',
    countryCode: 'cn',
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    country: 'Australia',
    countryCode: 'au',
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    country: 'Canada',
    countryCode: 'ca',
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    country: 'Switzerland',
    countryCode: 'ch',
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    country: 'Singapore',
    countryCode: 'sg',
  },
  {
    code: 'MYR',
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    country: 'Malaysia',
    countryCode: 'my',
  },
  {
    code: 'THB',
    name: 'Thai Baht',
    symbol: '฿',
    country: 'Thailand',
    countryCode: 'th',
  },
  {
    code: 'PKR',
    name: 'Pakistani Rupee',
    symbol: '₨',
    country: 'Pakistan',
    countryCode: 'pk',
  },
  {
    code: 'BDT',
    name: 'Bangladeshi Taka',
    symbol: '৳',
    country: 'Bangladesh',
    countryCode: 'bd',
  },
];

interface PropertyType {
  id: number;
  name: string;
  image_url?: string;
}

interface PropertyStatus {
  id: number;
  name: string;
  color: string;
}

interface Location {
  id: number;
  name: string;
}

interface Developer {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
}

interface Amenity {
  id: number;
  name: string;
  image_url?: string;
}

interface Property {
  id: string;
  project_name: string;
  starting_price?: string | number;
  property_type_id?: number;
  property_images?: string[];
  thumbnail_image?: string;
  brochure_url?: string;
  payment_plan?: string;
  handover?: string;
  earn_referral?: string;
  property_status_id?: number;
  country_id?: number;
  state_id?: number;
  city_id?: number;
  area_id?: number;
  developer_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  property_types?: PropertyType;
  property_status?: PropertyStatus;
  countries?: Location;
  states?: Location;
  cities?: Location;
  areas?: Location;
  developers?: Developer;
  property_amenities?: Array<{
    amenity_id: number;
    amenities: Amenity;
  }>;
}

interface DefaultSearchProperty {
  id: string;
  property_id: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  properties: Property;
}

const DefaultSearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [savedProperties, setSavedProperties] = useState<
    DefaultSearchProperty[]
  >([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [selectedPropertiesData, setSelectedPropertiesData] = useState<
    Property[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [autoCompleteOptions, setAutoCompleteOptions] = useState<any[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [propertiesToDelete, setPropertiesToDelete] = useState<string[]>([]);

  // Load saved properties on component mount
  useEffect(() => {
    loadSavedProperties();
  }, []);

  const loadSavedProperties = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        '/api/default-search-properties?limit=100'
      );
      if (response.data.success) {
        setSavedProperties(response.data.data);
      }
    } catch (error: any) {
      message.error('Failed to load saved properties');
      console.error('Error loading saved properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchProperties = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setAutoCompleteOptions([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await axios.get(
        `/api/properties?search=${encodeURIComponent(query)}&limit=10`
      );

      if (response.data.data && response.data.data.length > 0) {
        setSearchResults(response.data.data);
        // Convert properties to AutoComplete options
        const options = response.data.data.map((property: Property) => {
          const isSelected = selectedProperties.includes(property.id);
          return {
            value: property.project_name,
            disabled: isSelected, // Disable already selected properties
            label: (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  opacity: isSelected ? 0.6 : 1, // Make selected items appear dimmed
                }}
              >
                <Avatar
                  size={40}
                  src={property.thumbnail_image}
                  style={{ flexShrink: 0 }}
                >
                  {property.project_name.charAt(0)}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 500,
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>{property.project_name}</span>
                    {isSelected && <Tag color='blue'>Selected</Tag>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {formatPrice(property.starting_price)} •{' '}
                    {property.property_types?.name || 'N/A'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {[
                      property.cities?.name,
                      property.states?.name,
                      property.countries?.name,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                </div>
              </div>
            ),
            property: property,
          };
        });
        setAutoCompleteOptions(options);
      } else {
        setSearchResults([]);
        setAutoCompleteOptions([]);
      }
    } catch (error: any) {
      message.error('Failed to search properties');
      console.error('Error searching properties:', error);
      setAutoCompleteOptions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    searchProperties(value);
  };

  const handleSelect = (value: string, option: any) => {
    const property = option.property;
    if (property && !selectedProperties.includes(property.id)) {
      setSelectedProperties(prev => [...prev, property.id]);
      setSelectedPropertiesData(prev => [...prev, property]);
      message.success(`${property.project_name} added to selection`);

      // Refresh autocomplete options to update disabled state
      if (searchQuery.length >= 3) {
        searchProperties(searchQuery);
      }
    } else if (property && selectedProperties.includes(property.id)) {
      message.warning(`${property.project_name} is already selected`);
    }
  };

  const handlePropertySelect = (propertyId: string) => {
    setSelectedProperties(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
    });
    setSelectedPropertiesData(prev =>
      prev.filter(property => property.id !== propertyId)
    );

    // Refresh autocomplete options to update disabled state
    if (searchQuery.length >= 3) {
      searchProperties(searchQuery);
    }
  };

  const handleSaveProperties = async () => {
    if (selectedProperties.length === 0) {
      message.warning('Please select at least one property to save');
      return;
    }

    try {
      setIsSaving(true);
      const response = await axios.post('/api/default-search-properties', {
        property_ids: selectedProperties,
        display_orders: selectedProperties.map((_, index) => index),
      });

      if (response.data.success) {
        message.success('Properties saved to default search successfully');
        setSelectedProperties([]);
        setSelectedPropertiesData([]);
        setSearchResults([]);
        setAutoCompleteOptions([]);
        setSearchQuery('');
        await loadSavedProperties();
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save properties');
      console.error('Error saving properties:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProperty = (propertyId: string) => {
    setPropertiesToDelete([propertyId]);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(
        `/api/default-search-properties?property_ids=${propertiesToDelete.join(',')}`
      );

      if (response.data.success) {
        message.success('Properties removed from default search successfully');
        setPropertiesToDelete([]);
        setSelectedProperties([]);
        await loadSavedProperties();
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.error || 'Failed to delete properties'
      );
      console.error('Error deleting properties:', error);
    } finally {
      setDeleteModalVisible(false);
    }
  };

  const formatPrice = (price: string | number | undefined) => {
    if (!price) return 'Price not available';

    // Handle JSON string format
    if (typeof price === 'string' && price.startsWith('{')) {
      try {
        const priceData = JSON.parse(price);
        if (priceData.value && priceData.currentSign) {
          const numPrice = parseFloat(priceData.value);
          const currency = CURRENCIES.find(
            c => c.code === priceData.currencyName
          );

          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {currency && (
                <img
                  src={`https://flagcdn.com/w40/${currency.countryCode}.png`}
                  alt={currency.country}
                  style={{
                    width: '20px',
                    height: '15px',
                    objectFit: 'cover',
                    borderRadius: '2px',
                    border: '1px solid #e5e7eb',
                  }}
                />
              )}
              <span>
                {priceData.currentSign} {numPrice.toLocaleString()}
              </span>
            </div>
          );
        }
      } catch (error) {
        console.error('Error parsing price JSON:', error);
      }
    }

    // Handle regular number or string
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'Price not available';

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <img
          src='https://flagcdn.com/w40/us.png'
          alt='United States'
          style={{
            width: '20px',
            height: '15px',
            objectFit: 'cover',
            borderRadius: '2px',
            border: '1px solid #e5e7eb',
          }}
        />
        <span>${numPrice.toLocaleString()}</span>
      </div>
    );
  };

  const renderPropertyCard = (property: Property, isSearchResult = false) => {
    const isSelected = selectedProperties.includes(property.id);
    const isSaved = savedProperties.some(sp => sp.property_id === property.id);

    return (
      <Col xs={24} sm={12} md={8} lg={6} key={property.id}>
        <Card
          className={`property-card ${isSelected ? 'selected' : ''} ${isSaved ? 'saved' : ''}`}
          cover={
            <div className='property-image-container'>
              {property.thumbnail_image ? (
                <Image
                  src={property.thumbnail_image}
                  alt={property.project_name}
                  width={300}
                  height={200}
                  className='property-image'
                />
              ) : (
                <div className='no-image-placeholder'>
                  <Text type='secondary'>No Image</Text>
                </div>
              )}
            </div>
          }
          actions={[
            <Tooltip title='Remove from Default Search'>
              <Button
                key='delete'
                type='text'
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteProperty(property.id)}
                className='delete-button'
              >
                Delete
              </Button>
            </Tooltip>,
          ]}
        >
          <Card.Meta
            title={
              <div className='property-title'>
                <Text strong>{property.project_name}</Text>
              </div>
            }
            description={
              <div className='property-location'>
                {[
                  property.cities?.name,
                  property.states?.name,
                  property.countries?.name,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </div>
            }
          />
        </Card>
      </Col>
    );
  };

  return (
    <div className='default-search-page'>
      <div className='page-header'>
        <h1 className='page-title'>Default Search Properties</h1>
        <p className='page-subtitle'>
          Manage properties that appear in the default search results
        </p>
      </div>

      {/* Search Section */}
      <Card className='search-section'>
        <Space direction='vertical' style={{ width: '100%' }} size='large'>
          <div>
            <h3 className='search-title'>Search Properties</h3>
            <p className='search-description'>
              Search for properties to add to default search. Enter at least 3
              characters to search.
            </p>
          </div>

          <AutoComplete
            className='search-autocomplete'
            placeholder='Search properties by name, payment plan, or handover...'
            allowClear
            size='large'
            value={searchQuery}
            onChange={handleSearch}
            onSelect={handleSelect}
            options={
              isSearching
                ? [
                    {
                      value: 'loading',
                      label: (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                          <Spin size='small' /> Loading...
                        </div>
                      ),
                    },
                  ]
                : autoCompleteOptions
            }
            notFoundContent={
              searchQuery.length >= 3
                ? 'No properties found'
                : 'Enter at least 3 characters to search'
            }
            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
          />

          {selectedProperties.length > 0 && (
            <div className='search-actions'>
              <Space>
                <Button
                  className='save-button'
                  type='primary'
                  icon={<SaveOutlined />}
                  onClick={handleSaveProperties}
                  loading={isSaving}
                >
                  Save Selected ({selectedProperties.length})
                </Button>
                <Button
                  className='clear-button'
                  onClick={() => {
                    setSelectedProperties([]);
                    setSelectedPropertiesData([]);
                    setSearchQuery('');
                    setAutoCompleteOptions([]);
                  }}
                >
                  Clear Selection
                </Button>
              </Space>
            </div>
          )}
        </Space>
      </Card>

      {/* Selected Properties Preview - Only show when properties are selected */}
      {selectedProperties.length > 0 && selectedPropertiesData.length > 0 && (
        <Card className='selected-properties'>
          <h3 className='selected-properties-title'>
            Selected Properties ({selectedProperties.length})
          </h3>
          <Row gutter={[16, 16]}>
            {selectedPropertiesData.map(property => {
              return (
                <Col xs={24} sm={12} md={8} lg={6} key={property.id}>
                  <Card
                    size='small'
                    className='selected-property-card'
                    actions={[
                      <Button
                        type='text'
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handlePropertySelect(property.id)}
                        size='small'
                      >
                        Remove
                      </Button>,
                    ]}
                  >
                    <Card.Meta
                      avatar={
                        <Avatar size={40} src={property.thumbnail_image}>
                          {property.project_name.charAt(0)}
                        </Avatar>
                      }
                      title={
                        <Text strong className='property-card-title'>
                          {property.project_name}
                        </Text>
                      }
                      description={
                        <div className='property-info'>
                          <div className='property-price'>
                            {formatPrice(property.starting_price)}
                          </div>
                          <div className='property-type'>
                            {property.property_types?.name || 'N/A'}
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card>
      )}

      {/* Saved Properties */}
      <Card className='saved-properties'>
        <div className='saved-properties-header'>
          <h3 className='saved-properties-title'>
            Saved Default Search Properties
          </h3>
          <Button
            className='refresh-button'
            icon={<ReloadOutlined />}
            onClick={loadSavedProperties}
            loading={isLoading}
          >
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <Row gutter={[16, 16]}>
            {[...Array(6)].map((_, index) => (
              <Col xs={24} sm={12} md={8} lg={6} key={index}>
                <Card className='loading-skeleton' loading />
              </Col>
            ))}
          </Row>
        ) : savedProperties.length > 0 ? (
          <Row gutter={[16, 16]}>
            {savedProperties.map(item => renderPropertyCard(item.properties))}
          </Row>
        ) : (
          <div className='empty-state'>
            <div className='empty-state-icon'>🏠</div>
            <p className='empty-state-text'>
              No properties saved to default search yet
            </p>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        title='Confirm Delete'
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okText='Delete'
        cancelText='Cancel'
        okButtonProps={{ danger: true }}
      >
        <p>
          Are you sure you want to remove {propertiesToDelete.length}{' '}
          property/properties from the default search?
        </p>
        <p>This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default DefaultSearchPage;
