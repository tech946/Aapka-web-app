# Leads System Implementation

This document describes the implementation of the leads management system for web dashboard interface.

## Overview

The leads system allows:

- **Mobile users** to submit leads via API (external mobile app)
- **Web admins** to view, manage and track lead status and assignments through dashboard
- Leads are created only through mobile API, managed through web dashboard

## Database Schema

### Leads Table

```sql
-- See database/leads_table.sql for complete schema
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fullname VARCHAR(255) NOT NULL,
  mobile_no VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  relationship VARCHAR(100),
  budget DECIMAL(15,2),
  purpose_of_buying TEXT,
  buying_timeline VARCHAR(100),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'new',
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

## API Routes

### GET /api/leads

- **Purpose**: Retrieve leads with pagination and filtering
- **Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `status`: Filter by status
  - `search`: Search by name, email, or phone
- **Response**: Leads array with pagination info

### POST /api/leads

- **Purpose**: Create new lead (mobile API submission)
- **Required Fields**: `fullname`, `mobile_no`, `email`, `relationship`, `budget`, `purpose_of_buying`, `buying_timeline`
- **Optional Fields**: `notes`
- **Note**: Status defaults to 'new' for new leads from mobile

### PUT /api/leads

- **Purpose**: Update lead status and assignment (web interface)
- **Required**: `id`
- **Allowed Fields**: `status`, `assigned_to`
- **Note**: Only status and assignment can be updated from web interface

### DELETE /api/leads

- **Purpose**: Delete a lead
- **Required**: `id` as query parameter

## Frontend Components

### Web Lead Management Interface

- **Location**: `/dashboard/leads` (protected route)
- **Features**:
  - Lead listing with pagination
  - Search and filter functionality
  - Statistics dashboard
  - Status management (edit only)
  - Assignment capabilities
  - Lead details modal

## Lead Status Options

1. **New** - Default status for new leads
2. **Contacted** - Lead has been contacted
3. **Qualified** - Lead meets qualification criteria
4. **Converted** - Lead converted to customer
5. **Lost** - Lead did not convert

## Security

- Row Level Security (RLS) enabled on leads table
- Authentication required for all operations
- Users can only perform authorized actions based on their role
- Leads are created only through mobile API
- Web dashboard is for viewing and status management only
- Web interface allows status updates and assignments

## Usage Instructions

### For Web Admins

1. Navigate to `/dashboard/leads`
2. Create new leads with all required information
3. View all leads with filtering and search
4. Click on a lead to view details and update status
5. Assign leads to team members
6. Track lead progress through the pipeline

## File Structure

```
src/
├── app/
│   ├── api/leads/route.ts          # API endpoints
│   └── (dashboard)/dashboard/leads/page.tsx  # Web management interface
├── components/dashboard/sidebar.tsx # Updated with leads menu
└── database/leads_table.sql        # Database schema
```

## Next Steps

1. Run the SQL schema to create the leads table
2. Test the web management interface
3. Configure user roles and permissions as needed
4. Add email notifications for new leads
5. Implement lead assignment workflows
