# Users Management Implementation

## Overview

This implementation adds user management functionality to the Proptz dashboard, allowing administrators to view, search, and manage user profiles with additional fields for lead tracking and notes.

## Database Changes

### Profiles Table Updates

The `profiles` table has been enhanced with new fields:

```sql
-- New fields added to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS totalleads TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS commissions JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

**New Fields:**

- `totalleads` (TEXT): Stores total leads information for the user
- `commissions` (JSONB): Stores commission data in JSON format for flexible data structure
- `notes` (TEXT): Additional notes about the user
- `updated_at` (TIMESTAMP): Automatic timestamp for tracking updates

**Indexes Created:**

- `idx_profiles_totalleads`: For efficient searching by total leads
- `idx_profiles_commissions`: GIN index for JSONB queries
- `idx_profiles_notes`: For efficient searching by notes

## API Implementation

### File: `src/app/api/users/route.ts`

**Endpoints:**

- `GET /api/users` - Fetch users with pagination and search
- `PUT /api/users` - Update user profile
- `DELETE /api/users` - Delete user profile

**Features:**

- Pagination support (page, limit parameters)
- Search functionality (by name and role)
- Proper error handling and validation
- Uses Supabase Admin client for RLS bypass

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 1000)
- `search`: Search term for name or role filtering

## Frontend Implementation

### File: `src/app/(dashboard)/dashboard/users/page.tsx`

**Features:**

- **User Table**: Displays all users with avatar, name, role, total leads, notes, and creation date
- **Search**: Real-time search by name or role
- **Pagination**: Full pagination with page size options
- **Statistics**: Dashboard showing total users, active users, admins, and users with leads
- **Edit Modal**: In-line editing of user profiles
- **Delete Confirmation**: Safe deletion with confirmation dialog
- **Responsive Design**: Mobile-friendly table with horizontal scrolling

**Table Columns:**

1. **Avatar**: User profile picture or default icon
2. **Name**: Full name with sorting capability
3. **Role**: Color-coded role tags (admin=red, user=blue, others=green)
4. **Total Leads**: Lead count or dash if empty
5. **Notes**: Truncated notes with tooltip for full text
6. **Created At**: Formatted creation date with sorting
7. **Actions**: Edit and delete buttons

**Statistics Cards:**

- Total Users count
- Active Users count (role = 'user')
- Admins count (role = 'admin')
- Users with Leads count (has totalleads data)

## Navigation Integration

### File: `src/components/dashboard/sidebar.tsx`

**Changes:**

- Updated "All Users" menu item to link to `/dashboard/users`
- Added proper active state highlighting
- Changed icon to users-specific icon (lucide-users)
- Added proper Link component for navigation

## Security & Permissions

### Row Level Security (RLS) Policies

```sql
-- Service role can perform all operations
CREATE POLICY "Allow all operations for service role" ON profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users can read profiles
CREATE POLICY "Allow read access for authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can update their own profile
CREATE POLICY "Allow users to update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

## Usage Instructions

### For Administrators:

1. Navigate to "All Users" in the sidebar
2. Use the search bar to find specific users by name or role
3. Click edit button to modify user information
4. Use pagination controls to navigate through large user lists
5. View statistics dashboard for quick insights

### For Developers:

1. Run the SQL script `database/profiles_table_update.sql` in Supabase
2. The API endpoints are ready to use with proper error handling
3. Frontend components are fully responsive and accessible
4. All operations use the Supabase Admin client for proper permissions

## Technical Details

### Dependencies:

- Ant Design components for UI
- Axios for API calls
- Next.js API routes
- Supabase for database operations

### Performance Optimizations:

- Database indexes on searchable fields
- Pagination to limit data transfer
- Efficient JSONB queries for commissions data
- Proper error handling and loading states

### Future Enhancements:

- Bulk operations (bulk edit, bulk delete)
- Advanced filtering options
- Export functionality
- User activity tracking
- Commission calculation features

## File Structure

```
src/
├── app/
│   ├── api/users/route.ts          # API endpoints
│   └── (dashboard)/dashboard/users/page.tsx  # Frontend page
├── components/dashboard/sidebar.tsx # Navigation update
database/
└── profiles_table_update.sql       # Database schema updates
```

This implementation provides a complete user management system with search, pagination, and CRUD operations while maintaining security and performance best practices.
