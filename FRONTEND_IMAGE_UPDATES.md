# Frontend Image Functionality Updates

## ✅ **Completed Components**

### **Countries Component** (`/dashboard/master/countries/page.tsx`)

- ✅ Added image imports (Upload, Image, Divider, UploadOutlined)
- ✅ Updated Country interface with `image_url` field
- ✅ Added image state variables (`imagePreview`, `uploading`)
- ✅ Added image handling functions (`handleImageUpload`, `handleImageRemove`)
- ✅ Updated `handleAdd` and `handleEdit` to handle image previews
- ✅ Updated `handleModalOk` to send form data for image uploads
- ✅ Added image column to table with preview
- ✅ Updated modal with image upload section

### **States Component** (`/dashboard/master/states/page.tsx`)

- ✅ Added image imports (Upload, Image, Divider, UploadOutlined)
- ✅ Updated State interface with `image_url` field
- ✅ Added image state variables (`imagePreview`, `uploading`)
- ✅ Added image handling functions (`handleImageUpload`, `handleImageRemove`)
- ✅ Updated `handleAdd` and `handleEdit` to handle image previews
- ✅ Updated `handleModalOk` to send form data for image uploads
- ✅ Added image column to table with preview
- ✅ Updated modal with image upload section

## 🔄 **Partially Completed**

### **Cities Component** (`/dashboard/master/cities/page.tsx`)

- ✅ Added image imports (Upload, Image, Divider, UploadOutlined)
- ✅ Updated City interface with `image_url` field
- ✅ Added image state variables (`imagePreview`, `uploading`)
- ❌ Need to add image handling functions
- ❌ Need to update handleAdd/handleEdit functions
- ❌ Need to update handleModalOk function
- ❌ Need to add image column to table
- ❌ Need to update modal with image upload

### **Areas Component** (`/dashboard/master/areas/page.tsx`)

- ❌ Need to add all image functionality

## 📋 **Pattern to Follow for Remaining Components**

### 1. Add Image Handling Functions

```typescript
const handleImageUpload = async (file: File) => {
  setUploading(true);
  try {
    setImagePreview(URL.createObjectURL(file));
    form.setFieldsValue({ image_file: file });
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
    form.setFieldsValue({ image_file: null, image_url: '' });
    message.success('Image removed successfully');
  } catch (error: any) {
    message.error('Failed to remove image');
  }
};
```

### 2. Update handleAdd and handleEdit

```typescript
const handleAdd = () => {
  setEditingItem(null);
  form.resetFields();
  setImagePreview('');
  setModalVisible(true);
};

const handleEdit = (record: Item) => {
  setEditingItem(record);
  form.setFieldsValue(record);
  setImagePreview(record.image_url || '');
  setModalVisible(true);
};
```

### 3. Update handleModalOk for Form Data

```typescript
const handleModalOk = async () => {
  try {
    const values = await form.validateFields();

    if (editingItem) {
      if (values.image_file) {
        const formData = new FormData();
        formData.append('id', editingItem.id.toString());
        formData.append('name', values.name);
        formData.append('state_id', values.state_id.toString());
        formData.append('old_image_url', editingItem.image_url || '');
        formData.append('file', values.image_file);

        await axios.put('/api/cities', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await axios.put('/api/cities', {
          id: editingItem.id,
          name: values.name,
          state_id: values.state_id,
          image_url: values.image_url,
          old_image_url: editingItem.image_url,
        });
      }
      message.success('City updated successfully');
    } else {
      if (values.image_file) {
        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('state_id', values.state_id.toString());
        formData.append('file', values.image_file);

        await axios.post('/api/cities', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
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
```

### 4. Add Image Column to Table

```typescript
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
```

### 5. Update Modal with Image Upload

```typescript
<Modal
  title={editingItem ? 'Edit Item' : 'Add Item'}
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
    {/* Existing form fields */}

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
```

## 🎯 **Current Status**

- **Countries**: ✅ Complete
- **States**: ✅ Complete
- **Cities**: 🔄 50% Complete
- **Areas**: ❌ Not Started

## 🚀 **Next Steps**

1. Complete cities component with remaining image functionality
2. Add full image functionality to areas component
3. Test all components with image uploads
4. Ensure database has `image_url` columns
5. Create storage buckets in Supabase

The pattern is established and working for countries and states - just need to apply the same pattern to cities and areas!
