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
  property_type_id?: number;
  property_types?: PropertyType;
  starting_price?: number;
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
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    fetchMasterData();
    fetchHomeData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const [propertyTypesRes, propertiesRes, developersRes] =
        await Promise.all([
          axios.get('/api/property-types?limit=1000'),
          axios.get('/api/properties?limit=1000'),
          axios.get('/api/developers?limit=1000'),
        ]);

      setPropertyTypes(propertyTypesRes.data.data);
      setProperties(propertiesRes.data.data);
      setDevelopers(developersRes.data.data);
    } catch (error: any) {
      message.error('Failed to fetch master data');
    }
  };

  const fetchHomeData = async () => {
    setLoading(true);
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
      setPropertiesByType(data.properties_by_type || []);
    } catch (error: any) {
      message.error('Failed to fetch home data');
    } finally {
      setLoading(false);
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
    const propertyType = propertyTypes.find(pt => pt.id === propertyTypeId);
    if (!propertyType) return;

    setPropertiesByType(prev => {
      const existing = prev.filter(p => p.property_type_id !== propertyTypeId);

      if (selectedPropertyIds.length > 0) {
        return [
          ...existing,
          {
            property_type_id: propertyTypeId,
            property_type_name: propertyType.name,
            property_ids: selectedPropertyIds,
          },
        ];
      }

      return existing;
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

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

      await axios.post('/api/mobile-home-data', formData, {
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

      // Refresh data
      fetchHomeData();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save home data');
    } finally {
      setLoading(false);
    }
  };

  const getPropertiesByTypeId = (typeId: number): Property[] => {
    return properties.filter(p => p.property_type_id === typeId);
  };

  const getSelectedPropertiesForType = (typeId: number): string[] => {
    const found = propertiesByType.find(p => p.property_type_id === typeId);
    return found ? found.property_ids : [];
  };

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
              Select which properties to display for each property type
            </Text>

            <Collapse accordion>
              {propertyTypes.map(propertyType => {
                const typeProperties = getPropertiesByTypeId(propertyType.id);
                const selectedPropertyIds = getSelectedPropertiesForType(
                  propertyType.id
                );

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
                        </span>
                        {selectedPropertyIds.length > 0 && (
                          <Tag color='blue'>
                            {selectedPropertyIds.length} selected
                          </Tag>
                        )}
                      </Space>
                    }
                    key={propertyType.id}
                  >
                    {typeProperties.length > 0 ? (
                      <Select
                        mode='multiple'
                        placeholder={`Select properties for ${propertyType.name}`}
                        style={{ width: '100%' }}
                        value={selectedPropertyIds}
                        onChange={values =>
                          handlePropertyTypeChange(propertyType.id, values)
                        }
                        size='large'
                      >
                        {typeProperties.map(property => (
                          <Option key={property.id} value={property.id}>
                            <Space>
                              <span>{property.project_name}</span>
                              {property.starting_price && (
                                <Text
                                  type='secondary'
                                  style={{ fontSize: '12px' }}
                                >
                                  (${property.starting_price.toLocaleString()})
                                </Text>
                              )}
                            </Space>
                          </Option>
                        ))}
                      </Select>
                    ) : (
                      <Empty
                        description={`No properties found for ${propertyType.name}`}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
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
              loading={loading}
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
