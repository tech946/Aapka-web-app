'use client';

import React, { useState, useEffect } from 'react';
import {
  Button,
  Form,
  Input,
  message,
  Card,
  Upload,
  Divider,
  Select,
  Typography,
  Space,
  Tag,
  Collapse,
  Empty,
  Skeleton,
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  SaveOutlined,
  EyeOutlined,
  PlusOutlined,
  CloseOutlined,
  PlayCircleOutlined,
  FileImageOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import '../properties/properties.css';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

interface PropertyType {
  id: number;
  name: string;
  image_url?: string;
}

interface Property {
  id: string;
  project_name: string;
  property_type_id?: number | null;
  property_type_ids?: string;
  property_types_text?: string;
  property_types?: PropertyType;
  starting_price?: string | number;
  property_images?: string[];
  thumbnail_image?: string;
}

interface Developer {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
}

interface PropertyByType {
  property_type_id: number;
  property_type_name: string;
  property_ids: string[];
}

interface MobileHomeData {
  id: string | null;
  featured_video_url: string | null;
  tagline_text: string;
  properties_by_type: PropertyByType[];
  selected_developers: string[];
  story_images: string[];
}

const MobileHomePage: React.FC = () => {
  const [form] = Form.useForm();
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [homeData, setHomeData] = useState<MobileHomeData | null>(null);

  // File states
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoFileName, setVideoFileName] = useState<string>('');
  const [deleteExistingVideo, setDeleteExistingVideo] =
    useState<boolean>(false);
  const [storyImages, setStoryImages] = useState<File[]>([]);
  const [existingStoryImages, setExistingStoryImages] = useState<string[]>([]);
  const [storyImagesToDelete, setStoryImagesToDelete] = useState<string[]>([]);

  // Property selection state
  const [propertiesByType, setPropertiesByType] = useState<PropertyByType[]>(
    []
  );

  // Global search state
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      const masterData = await fetchMasterData(); // Load master data first
      if (masterData) {
        await fetchHomeData(masterData.propertyTypes); // Pass propertyTypes for conversion
      }
    };
    loadData();
  }, []);

  // Debug useEffect to track propertiesByType changes
  useEffect(() => {
    console.log('🔄🔄🔄 propertiesByType state changed:', propertiesByType);
  }, [propertiesByType]);

  const fetchMasterData = async () => {
    try {
      const [propertyTypesRes, propertiesRes, developersRes] =
        await Promise.all([
          axios.get('/api/property-types?limit=1000'),
          axios.get('/api/properties?limit=1000'),
          axios.get('/api/developers?limit=1000'),
        ]);

      const propertyTypesData = propertyTypesRes.data.data;
      const propertiesData = propertiesRes.data.data;
      const developersData = developersRes.data.data;

      setPropertyTypes(propertyTypesData);
      setProperties(propertiesData);
      setDevelopers(developersData);

      // Debug logging
      console.log('Property Types:', propertyTypesData);
      console.log(
        'Properties:',
        propertiesData.map((p: Property) => ({
          id: p.id,
          name: p.project_name,
          type_ids: p.property_type_ids,
          type_text: p.property_types_text,
        }))
      );

      // Debug: Show property type ID mapping
      console.log(
        'Property Type ID Mapping:',
        propertyTypesData.map((pt: PropertyType) => ({
          id: pt.id,
          name: pt.name,
        }))
      );

      return {
        propertyTypes: propertyTypesData,
        properties: propertiesData,
        developers: developersData,
      };
    } catch (error: any) {
      message.error('Failed to fetch master data');
      return null;
    }
  };

  const fetchHomeData = async (propertyTypesData?: any[]) => {
    console.log(
      '🔄 fetchHomeData called - this will reset propertiesByType state'
    );
    setIsFetching(true);
    try {
      const response = await axios.get('/api/mobile-home-data');
      const data = response.data.data;

      setHomeData(data);

      // Extract developer IDs from full developer objects for the form
      let developerIds: string[] = [];
      if (data.selected_developers && Array.isArray(data.selected_developers)) {
        // Check if it's already an array of objects or just IDs
        if (data.selected_developers.length > 0) {
          if (typeof data.selected_developers[0] === 'object') {
            // Array of developer objects - extract IDs
            developerIds = data.selected_developers.map((dev: any) => dev.id);
          } else {
            // Array of IDs - use as is
            developerIds = data.selected_developers;
          }
        }
      }

      // Set form values
      form.setFieldsValue({
        tagline_text: data.tagline_text || '',
        selected_developers: developerIds,
      });

      // Set existing media
      if (data.featured_video_url) {
        setVideoFileName('Current Video');
        setDeleteExistingVideo(false); // Reset deletion flag when loading data
      } else {
        setVideoFileName('');
        setDeleteExistingVideo(false);
      }

      setExistingStoryImages(data.story_images || []);

      // Debug logging for properties_by_type data
      console.log('Raw properties_by_type data:', data.properties_by_type);
      console.log(
        'Type of properties_by_type:',
        typeof data.properties_by_type
      );
      console.log('Is array?', Array.isArray(data.properties_by_type));

      // Convert properties_by_type from object to array format for frontend
      let propertiesArray: PropertyByType[] = [];
      if (data.properties_by_type) {
        if (Array.isArray(data.properties_by_type)) {
          // Old array format - use as is
          propertiesArray = data.properties_by_type;
        } else {
          // New object format - convert to array
          // { "Apartment": [...], "Villa": [...] } => [{ property_type_name: "Apartment", property_ids: [...] }]
          const typesData = propertyTypesData || propertyTypes; // Use passed data or fall back to state
          console.log('Converting object format, typesData:', typesData);
          console.log(
            'Object entries:',
            Object.entries(data.properties_by_type)
          );

          propertiesArray = Object.entries(data.properties_by_type).map(
            ([typeName, properties]: [string, any]) => {
              console.log(
                `Processing type: ${typeName}, properties:`,
                properties
              );

              // Resolve property type by case-insensitive match; fall back to deriving from first property's type
              const typeNameLc = String(typeName).trim().toLowerCase();
              let matchedType = typesData.find(
                (pt: any) => String(pt.name).trim().toLowerCase() === typeNameLc
              );

              console.log(`Matched type for ${typeName}:`, matchedType);

              // Extract property IDs from the full property objects
              const propertyIds = Array.isArray(properties)
                ? properties.map((p: any) => p.id)
                : [];

              if (
                !matchedType &&
                Array.isArray(properties) &&
                properties.length > 0
              ) {
                const first = properties[0];
                // Try to read embedded property type from object payload
                const embeddedType = (first as any).property_types;
                if (embeddedType && embeddedType.id) {
                  matchedType = typesData.find(
                    (pt: any) => pt.id === embeddedType.id
                  ) || {
                    id: embeddedType.id,
                    name: embeddedType.name,
                  };
                }
              }

              const result = {
                property_type_id: matchedType?.id || 0,
                property_type_name: matchedType?.name || String(typeName),
                property_ids: propertyIds,
              };

              console.log(`Result for ${typeName}:`, result);
              return result;
            }
          );
        }
      } else {
        console.log('No properties_by_type data found in response');
      }

      // Debug logging for converted properties array
      console.log('Converted propertiesArray:', propertiesArray);
      console.log(
        '🔄 About to set propertiesByType state with:',
        propertiesArray
      );

      setPropertiesByType(propertiesArray);
    } catch (error: any) {
      message.error('Failed to fetch home data');
    } finally {
      setIsFetching(false);
    }
  };

  const handleVideoSelect = (file: File) => {
    const allowedTypes = [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
    ];
    if (!allowedTypes.includes(file.type)) {
      message.error('Only MP4, MOV, AVI, and WebM videos are allowed!');
      return false;
    }

    const isLt20M = file.size / 1024 / 1024 < 20;
    if (!isLt20M) {
      message.error('Video must be smaller than 20MB!');
      return false;
    }

    setVideoFile(file);
    setVideoFileName(file.name);
    setDeleteExistingVideo(false); // Reset deletion flag when new video selected
    message.success(`Video "${file.name}" selected successfully!`);
    return false;
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoFileName('');
    setDeleteExistingVideo(true); // Mark for deletion
  };

  const handleStoryImageSelect = (file: File) => {
    const totalImages = existingStoryImages.length + storyImages.length;
    if (totalImages >= 10) {
      message.error('Maximum 10 story images allowed');
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

    setStoryImages(prev => [...prev, file]);
    message.success(`Image "${file.name}" selected successfully!`);
    return false;
  };

  const handleRemoveNewStoryImage = (file: File) => {
    setStoryImages(prev => prev.filter(img => img !== file));
  };

  const handleRemoveExistingStoryImage = (imageUrl: string) => {
    setExistingStoryImages(prev => prev.filter(img => img !== imageUrl));
    setStoryImagesToDelete(prev => [...prev, imageUrl]);
  };

  const handlePropertyTypeChange = (
    propertyTypeId: number,
    selectedPropertyIds: string[]
  ) => {
    console.log('🚀🚀🚀 handlePropertyTypeChange called:', {
      propertyTypeId,
      selectedPropertyIds,
      propertyTypes,
    });
    console.log('🚀 Current propertiesByType before update:', propertiesByType);

    const propertyType = propertyTypes.find(pt => pt.id === propertyTypeId);
    if (!propertyType) {
      console.log('Property type not found for ID:', propertyTypeId);
      return;
    }

    setPropertiesByType(prev => {
      console.log('Previous propertiesByType:', prev);

      const existing = prev.filter(p => p.property_type_id !== propertyTypeId);

      if (selectedPropertyIds.length > 0) {
        const newEntry = {
          property_type_id: propertyTypeId,
          property_type_name: propertyType.name,
          property_ids: selectedPropertyIds,
        };

        const result = [...existing, newEntry];
        console.log('🚀🚀🚀 New propertiesByType after adding:', result);
        return result;
      }

      console.log('Removing property type, new propertiesByType:', existing);
      return existing;
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setIsSaving(true);

      const formData = new FormData();

      // Add ID if updating
      if (homeData?.id) {
        formData.append('id', homeData.id);
      }

      // Add text fields
      formData.append('tagline_text', values.tagline_text || '');

      // Add properties by type
      formData.append('properties_by_type', JSON.stringify(propertiesByType));

      // Add selected developers
      formData.append(
        'selected_developers',
        JSON.stringify(values.selected_developers || [])
      );

      // Add video file if new one selected
      if (videoFile) {
        formData.append('video_file', videoFile);
      } else if (homeData?.featured_video_url && !deleteExistingVideo) {
        // Only keep existing video if not marked for deletion
        formData.append('existing_video_url', homeData.featured_video_url);
      }

      // Send deletion flag if video was removed
      if (deleteExistingVideo) {
        formData.append('delete_video', 'true');
      }

      // Add story images
      formData.append(
        'existing_story_images',
        JSON.stringify(existingStoryImages)
      );
      formData.append(
        'story_images_to_delete',
        JSON.stringify(storyImagesToDelete)
      );

      storyImages.forEach(file => {
        formData.append('story_images', file);
      });

      const response = await axios.post('/api/mobile-home-data', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      message.success('Mobile home data saved successfully!');

      // Reset file states
      setVideoFile(null);
      setDeleteExistingVideo(false); // Reset deletion flag after save
      setStoryImages([]);
      setStoryImagesToDelete([]);

      // Refresh data to reflect latest saved state
      await fetchHomeData(propertyTypes);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save home data');
    } finally {
      setIsSaving(false);
    }
  };

  const getPropertiesByTypeId = (typeId: number): Property[] => {
    const filteredProperties = properties.filter(p => {
      // Check if property has property_type_ids and if it contains the current typeId
      if (p.property_type_ids) {
        const typeIds = p.property_type_ids
          .split(',')
          .map(id => parseInt(id.trim()));
        return typeIds.includes(typeId);
      }
      // Fallback to property_type_id if property_type_ids is not available
      return p.property_type_id === typeId;
    });

    // Debug logging
    if (filteredProperties.length > 0) {
      console.log(
        `Properties for type ${typeId}:`,
        filteredProperties.map(p => ({
          id: p.id,
          name: p.project_name,
          type_ids: p.property_type_ids,
          type_text: p.property_types_text,
        }))
      );
    }

    return filteredProperties;
  };

  const getSelectedPropertiesForType = (typeId: number): string[] => {
    console.log(`🔍 Looking for property type ${typeId} in:`, propertiesByType);
    console.log(
      `🔍 Property type IDs in state:`,
      propertiesByType.map(p => p.property_type_id)
    );

    const found = propertiesByType.find(p => p.property_type_id === typeId);
    const result = found ? found.property_ids : [];

    // Debug logging
    console.log(`Selected properties for type ${typeId}:`, {
      found: found,
      property_ids: result,
      allPropertiesByType: propertiesByType,
    });

    return result;
  };

  if (isFetching) {
    return (
      <div className='properties-container'>
        <div className='properties-header'>
          <Title level={1} className='properties-title'>
            Mobile Home Page Data
          </Title>
          <p className='properties-subtitle'>
            Manage the content displayed on the mobile app home page
          </p>
        </div>
        <Card className='properties-table-card' style={{ marginTop: 24 }}>
          <Skeleton
            active
            paragraph={{ rows: 2 }}
            title
            style={{ marginBottom: 24 }}
          />
          <Skeleton.Input
            active
            style={{ width: '100%', height: 64, marginBottom: 24 }}
          />
          <Divider />
          <Skeleton
            active
            paragraph={{ rows: 3 }}
            title
            style={{ marginBottom: 24 }}
          />
          <Skeleton.Input
            active
            style={{ width: '100%', height: 44, marginBottom: 12 }}
          />
          <Skeleton.Input
            active
            style={{ width: '100%', height: 44, marginBottom: 12 }}
          />
          <Skeleton.Input
            active
            style={{ width: '100%', height: 44, marginBottom: 12 }}
          />
          <Divider />
          <Skeleton
            active
            paragraph={{ rows: 2 }}
            title
            style={{ marginBottom: 24 }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Skeleton.Button active style={{ width: 150, height: 40 }} />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className='properties-container'>
      {/* Header */}
      <div className='properties-header'>
        <Title level={1} className='properties-title'>
          Mobile Home Page Data
        </Title>
        <p className='properties-subtitle'>
          Manage the content displayed on the mobile app home page
        </p>
      </div>

      {/* Main Form Card */}
      <Card className='properties-table-card' style={{ marginTop: 24 }}>
        <Form
          form={form}
          layout='vertical'
          className='custom-form'
          initialValues={{
            tagline_text: '',
            selected_developers: [],
          }}
        >
          {/* Featured Video Section */}
          <div style={{ marginBottom: 32 }}>
            <Title level={4} style={{ marginBottom: 16 }}>
              <PlayCircleOutlined style={{ marginRight: 8 }} />
              Featured Video
            </Title>
            <Text
              type='secondary'
              style={{ display: 'block', marginBottom: 16 }}
            >
              Upload a video to be displayed on the home page (Max 20MB,
              formats: MP4, MOV, AVI, WebM)
            </Text>

            {/* Show existing video preview */}
            {homeData?.featured_video_url &&
              !videoFile &&
              !deleteExistingVideo && (
                <div style={{ marginBottom: 16 }}>
                  <Text
                    type='secondary'
                    style={{ display: 'block', marginBottom: 8 }}
                  >
                    Current Video Preview:
                  </Text>
                  <video
                    src={homeData.featured_video_url}
                    controls
                    style={{
                      width: '100%',
                      maxWidth: '600px',
                      borderRadius: '8px',
                      border: '1px solid #d9d9d9',
                    }}
                  />
                </div>
              )}

            {/* Show new video preview if selected */}
            {videoFile && (
              <div style={{ marginBottom: 16 }}>
                <Text
                  type='success'
                  style={{ display: 'block', marginBottom: 8 }}
                >
                  New Video Preview: {videoFile.name}
                </Text>
                <video
                  src={URL.createObjectURL(videoFile)}
                  controls
                  style={{
                    width: '100%',
                    maxWidth: '600px',
                    borderRadius: '8px',
                    border: '1px solid #52c41a',
                  }}
                />
              </div>
            )}

            <Upload
              beforeUpload={handleVideoSelect}
              showUploadList={false}
              accept='video/mp4,video/quicktime,video/x-msvideo,video/webm'
            >
              <Button icon={<UploadOutlined />} size='large'>
                {videoFileName && !deleteExistingVideo
                  ? 'Change Video'
                  : 'Upload Video'}
              </Button>
            </Upload>

            {videoFileName && !deleteExistingVideo && (
              <div style={{ marginTop: 12 }}>
                <Tag
                  color='blue'
                  closable
                  onClose={handleRemoveVideo}
                  style={{ padding: '8px 12px', fontSize: '14px' }}
                >
                  {videoFileName}
                </Tag>
              </div>
            )}
          </div>

          <Divider />

          {/* Tagline Text */}
          <Form.Item
            name='tagline_text'
            label={
              <span style={{ fontSize: '16px', fontWeight: 600 }}>
                Tagline Text
              </span>
            }
            rules={[{ required: true, message: 'Please enter a tagline' }]}
          >
            <TextArea
              placeholder='Enter a catchy tagline for the home page'
              rows={2}
              maxLength={200}
              showCount
              size='large'
            />
          </Form.Item>

          <Divider />

          {/* Properties by Type Section */}
          <div style={{ marginBottom: 32 }}>
            <Title level={4} style={{ marginBottom: 16 }}>
              <FileImageOutlined style={{ marginRight: 8 }} />
              Featured Properties by Type
            </Title>
            <Text
              type='secondary'
              style={{ display: 'block', marginBottom: 16 }}
            >
              Select which properties to display for each property type. Use the
              search functionality within each property type to quickly find
              specific properties.
            </Text>

            {/* Global Search Bar */}
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Input.Search
                  placeholder='🔍 Search properties across all types...'
                  value={globalSearchTerm}
                  onChange={e => setGlobalSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '500px',
                  }}
                  size='large'
                  allowClear
                  enterButton='Search'
                  onSearch={value => {
                    setGlobalSearchTerm(value);
                    // Scroll to first matching property type
                    const matchingType = propertyTypes.find(pt => {
                      const typeProperties = getPropertiesByTypeId(pt.id);
                      return typeProperties.some(p =>
                        p.project_name
                          .toLowerCase()
                          .includes(value.toLowerCase())
                      );
                    });
                    if (matchingType) {
                      const element = document.querySelector(
                        `[data-panel-key="${matchingType.id}"]`
                      );
                      if (element) {
                        element.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center',
                        });
                      }
                    }
                  }}
                />
                {globalSearchTerm && (
                  <Button onClick={() => setGlobalSearchTerm('')} size='large'>
                    Clear Search
                  </Button>
                )}
              </div>
              {globalSearchTerm && (
                <div style={{ marginTop: '8px' }}>
                  <Text
                    type='secondary'
                    style={{ fontSize: '12px', display: 'block' }}
                  >
                    Showing results for: "{globalSearchTerm}"
                  </Text>
                  <Text
                    type='secondary'
                    style={{
                      fontSize: '11px',
                      display: 'block',
                      marginTop: '4px',
                    }}
                  >
                    💡 Tip: Click on property type panels below to see matching
                    properties highlighted
                  </Text>
                </div>
              )}
            </div>

            <Collapse accordion>
              {propertyTypes.map(propertyType => {
                console.log('🔄 Rendering property type:', {
                  id: propertyType.id,
                  name: propertyType.name,
                });
                console.log(
                  '📊 Current propertiesByType state:',
                  propertiesByType
                );

                const typeProperties = getPropertiesByTypeId(propertyType.id);
                const selectedPropertyIds = getSelectedPropertiesForType(
                  propertyType.id
                );

                console.log('Property type details:', {
                  id: propertyType.id,
                  name: propertyType.name,
                  availableProperties: typeProperties.length,
                  selectedProperties: selectedPropertyIds.length,
                });

                // Check if this property type has matching properties for global search
                const hasMatchingProperties = globalSearchTerm
                  ? typeProperties.some(p =>
                      p.project_name
                        .toLowerCase()
                        .includes(globalSearchTerm.toLowerCase())
                    )
                  : true;

                // Don't show property type if global search is active and no matches
                if (globalSearchTerm && !hasMatchingProperties) {
                  return null;
                }

                return (
                  <Panel
                    header={
                      <Space>
                        {propertyType.image_url && (
                          <img
                            src={propertyType.image_url}
                            alt={propertyType.name}
                            style={{
                              width: 24,
                              height: 24,
                              objectFit: 'cover',
                              borderRadius: 4,
                            }}
                          />
                        )}
                        <span style={{ fontWeight: 500 }}>
                          {propertyType.name}
                          {globalSearchTerm && hasMatchingProperties && (
                            <Tag color='green' style={{ marginLeft: 8 }}>
                              Found matches
                            </Tag>
                          )}
                        </span>
                        {selectedPropertyIds.length > 0 && (
                          <Tag color='blue'>
                            {selectedPropertyIds.length} selected
                          </Tag>
                        )}
                      </Space>
                    }
                    key={propertyType.id}
                    data-panel-key={propertyType.id}
                  >
                    {typeProperties.length > 0 ? (
                      <div>
                        <div style={{ marginBottom: '12px' }}>
                          <Text
                            type='secondary'
                            style={{
                              fontSize: '12px',
                              fontWeight: 500,
                              display: 'block',
                              marginBottom: '8px',
                            }}
                          >
                            🔍 Search and select properties (
                            {typeProperties.length} available):
                          </Text>
                        </div>
                        <Select
                          mode='multiple'
                          placeholder={`Type to search and select properties for ${propertyType.name}...`}
                          style={{ width: '100%' }}
                          value={selectedPropertyIds}
                          onChange={values => {
                            console.log('🚀🚀🚀 Select onChange triggered:', {
                              propertyTypeId: propertyType.id,
                              propertyTypeName: propertyType.name,
                              selectedValues: values,
                              currentSelectedPropertyIds: selectedPropertyIds,
                            });
                            console.log(
                              '🚀🚀🚀 About to call handlePropertyTypeChange'
                            );
                            handlePropertyTypeChange(propertyType.id, values);
                            console.log(
                              '🚀🚀🚀 handlePropertyTypeChange called'
                            );
                          }}
                          onSelect={value => {
                            console.log('✅ Select onSelect triggered:', {
                              propertyTypeId: propertyType.id,
                              selectedValue: value,
                            });
                          }}
                          onDeselect={value => {
                            console.log('❌ Select onDeselect triggered:', {
                              propertyTypeId: propertyType.id,
                              deselectedValue: value,
                            });
                          }}
                          size='large'
                          showSearch
                          allowClear
                          optionFilterProp='label'
                          notFoundContent='No properties found matching your search'
                          filterOption={(input, option) => {
                            const label = String(
                              option?.label || ''
                            ).toLowerCase();
                            const searchTerm = input.toLowerCase();
                            return label.includes(searchTerm);
                          }}
                          filterSort={(optionA, optionB) => {
                            const labelA = String(
                              optionA?.label || ''
                            ).toLowerCase();
                            const labelB = String(
                              optionB?.label || ''
                            ).toLowerCase();
                            return labelA.localeCompare(labelB);
                          }}
                        >
                          {typeProperties
                            .filter(property => {
                              // Filter properties based on global search term
                              if (!globalSearchTerm) return true;
                              return property.project_name
                                .toLowerCase()
                                .includes(globalSearchTerm.toLowerCase());
                            })
                            .map(property => {
                              console.log('🎯 Rendering property option:', {
                                propertyId: property.id,
                                propertyName: property.project_name,
                                propertyTypeId: propertyType.id,
                              });
                              const isHighlighted =
                                globalSearchTerm &&
                                property.project_name
                                  .toLowerCase()
                                  .includes(globalSearchTerm.toLowerCase());

                              return (
                                <Option
                                  key={property.id}
                                  value={property.id}
                                  label={property.project_name}
                                >
                                  <Space>
                                    <span
                                      style={{
                                        backgroundColor: isHighlighted
                                          ? '#fff7e6'
                                          : 'transparent',
                                        padding: isHighlighted
                                          ? '2px 4px'
                                          : '0',
                                        borderRadius: isHighlighted
                                          ? '4px'
                                          : '0',
                                      }}
                                    >
                                      {property.project_name}
                                    </span>
                                    {property.starting_price && (
                                      <Text
                                        type='secondary'
                                        style={{ fontSize: '12px' }}
                                      >
                                        (
                                        {typeof property.starting_price ===
                                        'string'
                                          ? JSON.parse(property.starting_price)
                                              .currentSign +
                                            ' ' +
                                            parseInt(
                                              JSON.parse(
                                                property.starting_price
                                              ).value
                                            ).toLocaleString()
                                          : property.starting_price.toLocaleString()}
                                        )
                                      </Text>
                                    )}
                                    {isHighlighted && (
                                      <Tag color='orange'>Matched</Tag>
                                    )}
                                  </Space>
                                </Option>
                              );
                            })}
                        </Select>
                      </div>
                    ) : (
                      <Empty
                        description={`No properties found for ${propertyType.name}`}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}

                    {/* Selected Properties Preview */}
                    {selectedPropertyIds.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <Text
                          type='secondary'
                          style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            display: 'block',
                            marginBottom: '8px',
                          }}
                        >
                          Selected Properties ({selectedPropertyIds.length}):
                        </Text>
                        <div
                          style={{
                            display: 'flex',
                            gap: '12px',
                            flexWrap: 'wrap',
                          }}
                        >
                          {selectedPropertyIds.map(propertyId => {
                            const property = properties.find(
                              p => p.id === propertyId
                            );
                            if (!property) return null;

                            return (
                              <div
                                key={propertyId}
                                style={{
                                  position: 'relative',
                                  width: '180px',
                                  border: '1px solid #d9d9d9',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  transition: 'all 0.3s',
                                  cursor: 'pointer',
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.boxShadow =
                                    '0 4px 12px rgba(0,0,0,0.15)';
                                  e.currentTarget.style.transform =
                                    'translateY(-2px)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.boxShadow = 'none';
                                  e.currentTarget.style.transform =
                                    'translateY(0)';
                                }}
                              >
                                {/* Property Image */}
                                <div
                                  style={{
                                    width: '100%',
                                    height: '120px',
                                    backgroundColor: '#f0f0f0',
                                    position: 'relative',
                                  }}
                                >
                                  {property.property_images &&
                                  property.property_images.length > 0 ? (
                                    <img
                                      src={property.property_images[0]}
                                      alt={property.project_name}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                      }}
                                    />
                                  ) : property.thumbnail_image ? (
                                    <img
                                      src={property.thumbnail_image}
                                      alt={property.project_name}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                      }}
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#999',
                                      }}
                                    >
                                      <FileImageOutlined
                                        style={{ fontSize: '32px' }}
                                      />
                                    </div>
                                  )}

                                  {/* Delete Button */}
                                  <Button
                                    type='primary'
                                    danger
                                    size='small'
                                    icon={<DeleteOutlined />}
                                    style={{
                                      position: 'absolute',
                                      top: '8px',
                                      right: '8px',
                                    }}
                                    onClick={() => {
                                      const newValues =
                                        selectedPropertyIds.filter(
                                          id => id !== propertyId
                                        );
                                      handlePropertyTypeChange(
                                        propertyType.id,
                                        newValues
                                      );
                                    }}
                                  />
                                </div>

                                {/* Property Info */}
                                <div
                                  style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#fff',
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: '13px',
                                      fontWeight: 500,
                                      marginBottom: '4px',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {property.project_name}
                                  </div>
                                  {property.starting_price && (
                                    <div
                                      style={{
                                        fontSize: '12px',
                                        color: '#1890ff',
                                        fontWeight: 500,
                                      }}
                                    >
                                      {typeof property.starting_price ===
                                      'string'
                                        ? JSON.parse(property.starting_price)
                                            .currentSign +
                                          ' ' +
                                          parseInt(
                                            JSON.parse(property.starting_price)
                                              .value
                                          ).toLocaleString()
                                        : '$' +
                                          property.starting_price.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Panel>
                );
              })}
            </Collapse>
          </div>

          <Divider />

          {/* Developers Selection */}
          <Form.Item
            name='selected_developers'
            label={
              <span style={{ fontSize: '16px', fontWeight: 600 }}>
                Featured Developers
              </span>
            }
          >
            <Select
              mode='multiple'
              placeholder='Search and select developers to feature on the home page'
              size='large'
              showSearch
              allowClear
              maxTagCount='responsive'
              optionFilterProp='label'
              filterOption={(input, option) => {
                const label = String(option?.label || '').toLowerCase();
                const searchTerm = input.toLowerCase();
                return label.includes(searchTerm);
              }}
              filterSort={(optionA, optionB) => {
                const labelA = String(optionA?.label || '').toLowerCase();
                const labelB = String(optionB?.label || '').toLowerCase();
                return labelA.localeCompare(labelB);
              }}
            >
              {developers.map(developer => (
                <Option
                  key={developer.id}
                  value={developer.id}
                  label={developer.name}
                >
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
                    <span>{developer.name}</span>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider />

          {/* Story Images Section */}
          <div style={{ marginBottom: 32 }}>
            <Title level={4} style={{ marginBottom: 16 }}>
              <FileImageOutlined style={{ marginRight: 8 }} />
              Story Images
            </Title>
            <Text
              type='secondary'
              style={{ display: 'block', marginBottom: 16 }}
            >
              Upload images for stories (Max 10 images, 5MB each)
            </Text>

            <div style={{ marginBottom: '16px' }}>
              {/* Existing Story Images */}
              {existingStoryImages.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      marginBottom: '8px',
                      fontWeight: 500,
                    }}
                  >
                    Existing Story Images:
                  </div>
                  <div
                    style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}
                  >
                    {existingStoryImages.map((imageUrl, index) => (
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
                          alt={`Story ${index + 1}`}
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
                          onClick={() =>
                            handleRemoveExistingStoryImage(imageUrl)
                          }
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

              {/* New Story Images */}
              {storyImages.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      marginBottom: '8px',
                      fontWeight: 500,
                    }}
                  >
                    New Story Images to Upload:
                  </div>
                  <div
                    style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}
                  >
                    {storyImages.map((file, index) => (
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
                          alt={`New story ${index + 1}`}
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
                          onClick={() => handleRemoveNewStoryImage(file)}
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
              beforeUpload={handleStoryImageSelect}
              showUploadList={false}
              accept='image/*'
              multiple
              disabled={existingStoryImages.length + storyImages.length >= 10}
            >
              <Button
                icon={<UploadOutlined />}
                size='large'
                disabled={existingStoryImages.length + storyImages.length >= 10}
              >
                {existingStoryImages.length + storyImages.length >= 10
                  ? 'Maximum Images Reached'
                  : 'Select Story Images'}
              </Button>
            </Upload>

            <div style={{ marginTop: 8, color: '#666', fontSize: '12px' }}>
              {existingStoryImages.length + storyImages.length}/10 images
            </div>
          </div>

          <Divider />

          {/* Action Buttons */}
          <div
            style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
          >
            <Button
              type='primary'
              size='large'
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={isSaving}
              style={{ minWidth: '150px' }}
            >
              Save Changes
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default MobileHomePage;
