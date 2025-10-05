# Properties CRUD Implementation

## Overview

Complete property management system with comprehensive fields, multiple dropdowns, multiselect amenities, and document upload functionality. This system allows managing real estate properties with all their associated details and relationships.

## Files Created/Modified

### 1. Database Schema

- **File**: `database/properties_table.sql`
- **Purpose**: Creates properties table with all required fields and relationships
- **Features**:
  - Main properties table with all specified fields
  - Junction table for many-to-many amenities relationship
  - Foreign key relationships to all master data tables
  - Storage bucket for property brochures
  - RLS policies for service role access
  - Auto-updating timestamps

### 2. API Routes

- **File**: `src/app/api/properties/route.ts`
- **Purpose**: Handles all CRUD operations for properties
- **Features**:
  - GET: Paginated list with search functionality
  - POST: Create property with optional brochure upload
  - PUT: Update property with brochure replacement
  - DELETE: Remove property and associated brochure
  - Document validation (PDF, Word)
  - Supabase Storage integration
  - Amenities relationship management

### 3. Frontend Page

- **File**: `src/app/(dashboard)/dashboard/properties/page.tsx`
- **Purpose**: User interface for managing properties
- **Features**:
  - Data table with pagination and search
  - Comprehensive form with all required fields
  - Multiple dropdowns with search functionality
  - Multiselect amenities with images
  - Document upload for brochures
  - Statistics display
  - Responsive design

### 4. Navigation

- **File**: `src/components/dashboard/sidebar.tsx`
- **Purpose**: Added properties menu item with proper navigation
- **Features**:
  - Properties menu item with building icon
  - Active state highlighting
  - Proper routing to properties page

## Key Features

### Property Fields

- **Project Name** - String (required)
- **Property Status** - Dropdown from master data
- **Country** - Dropdown from master data
- **State** - Dropdown from master data
- **City** - Dropdown from master data
- **Area** - Dropdown from master data
- **Starting Price** - Number with currency formatting
- **Property Type** - Dropdown from master data
- **Payment Plan** - Text area
- **Handover** - Text area
- **Expected Appreciation** - Text area
- **Amenities** - Multiselect from master data
- **Brochure** - Document upload (PDF/Word)

### Document Management

- Upload property brochures during creation
- Replace brochures during editing
- Automatic cleanup of old documents
- Document validation (type: PDF/Word, size: max 10MB)
- Public URL generation for document access

### Amenities Integration

- Many-to-many relationship with amenities
- Multiselect dropdown with search
- Image display for amenities
- Proper relationship management during updates

### Search & Filtering

- Real-time search across project name, payment plan, and handover
- Pagination with customizable page sizes
- Statistics dashboard
- Responsive table design

### CRUD Operations

- **Create**: Add new properties with all details and relationships
- **Read**: Paginated list with search and filtering
- **Update**: Edit property details and replace documents
- **Delete**: Remove properties and clean up documents

## API Endpoints

### GET /api/properties

- **Query Parameters**: `page`, `limit`, `search`
- **Response**: Paginated list of properties with all relationships
- **Example**: `/api/properties?page=1&limit=10&search=apartment`

### POST /api/properties

- **Content-Type**: `multipart/form-data` (with brochure) or `application/json`
- **Body**: All property fields including amenities array and brochure file
- **Response**: Created property object with all relationships

### PUT /api/properties

- **Content-Type**: `multipart/form-data` (with brochure) or `application/json`
- **Body**: All property fields including amenities array and brochure file
- **Response**: Updated property object with all relationships

### DELETE /api/properties

- **Query Parameters**: `id`
- **Response**: Success message

## Database Structure

### Main Properties Table

```sql
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name VARCHAR(255) NOT NULL,
  property_status_id UUID REFERENCES property_status(id),
  country_id UUID REFERENCES countries(id),
  state_id UUID REFERENCES states(id),
  city_id UUID REFERENCES cities(id),
  area_id UUID REFERENCES areas(id),
  starting_price DECIMAL(15,2),
  property_type_id UUID REFERENCES property_types(id),
  payment_plan TEXT,
  handover TEXT,
  expected_appreciation TEXT,
  brochure_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Amenities Junction Table

```sql
CREATE TABLE property_amenities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  amenity_id UUID REFERENCES amenities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, amenity_id)
);
```

## Storage Configuration

- **Bucket**: `property-brochures`
- **Public Access**: Yes (for document access)
- **File Naming**: Timestamp + random string
- **Supported Formats**: PDF, DOC, DOCX
- **Max File Size**: 10MB

## Usage Instructions

1. **Run Database Migration**: Execute `database/properties_table.sql` in Supabase
2. **Access Page**: Navigate to `/dashboard/properties`
3. **Add Property**: Click "Add Property" button
4. **Fill Details**: Complete all required fields
5. **Select Dropdowns**: Choose from master data dropdowns
6. **Add Amenities**: Select multiple amenities from the list
7. **Upload Brochure**: Upload PDF or Word document
8. **Search Properties**: Use the search bar to filter results
9. **Edit Property**: Click edit button on any row
10. **Delete Property**: Click delete button (with confirmation)

## Form Fields

### Required Fields

- **Project Name**: Property project name (minimum 2 characters)

### Optional Fields

- **Property Status**: Status dropdown with color indicators
- **Location**: Country, State, City, Area dropdowns
- **Starting Price**: Numeric input with currency formatting
- **Property Type**: Type dropdown with images
- **Payment Plan**: Detailed payment information
- **Handover**: Handover details
- **Expected Appreciation**: Appreciation expectations
- **Amenities**: Multiple selection with search
- **Brochure**: Document upload (PDF/Word)

## Error Handling

- Form validation for required fields
- Document type and size validation
- API error messages displayed to user
- Graceful handling of network errors
- Automatic cleanup on failed operations
- Proper relationship management

## Security

- RLS policies for database access
- Service role authentication for API operations
- Document validation to prevent malicious uploads
- Proper error handling without exposing sensitive data
- Input validation and sanitization

## Master Data Integration

- **Property Status**: Color-coded status indicators
- **Countries**: Hierarchical location selection
- **States**: State selection based on country
- **Cities**: City selection based on state
- **Areas**: Area selection based on city
- **Property Types**: Type selection with images
- **Amenities**: Multiple selection with images and search

## Document Features

- Property brochure thumbnails in table
- Document preview and download
- Document replacement during editing
- Automatic cleanup of old documents
- Fallback for missing documents
- Responsive document handling

## Search & Filtering

- Real-time search across multiple fields
- Pagination with customizable page sizes
- Statistics dashboard
- Responsive table design
- Advanced filtering capabilities

## Table Display

- **Project Name**: With property type indicator
- **Location**: Hierarchical location display
- **Price**: Formatted currency display
- **Status**: Color-coded status tags
- **Amenities**: Limited display with tooltip for more
- **Brochure**: Download link if available
- **Actions**: Edit and delete buttons

## Responsive Design

- Mobile-friendly table layout
- Responsive form design
- Adaptive column display
- Touch-friendly interface
- Optimized for all screen sizes
