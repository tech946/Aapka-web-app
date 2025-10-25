# Mobile Search Properties API Documentation

## Overview

The Mobile Search Properties API provides a comprehensive search functionality for properties with advanced filtering options. It includes authentication, multiple filter criteria, and fallback to default search properties when no search term is provided.

## Endpoint

```
POST /api/mobile/search-properties
```

## Authentication

- **Required**: Yes
- **Method**: Token-based authentication using Supabase session
- **Header**: Authorization token in session cookie

## Request Body

### Parameters (All Optional)

| Parameter         | Type     | Description                                              | Example              | Default |
| ----------------- | -------- | -------------------------------------------------------- | -------------------- | ------- |
| `searchkey`       | string   | Search term for property name, payment plan, or handover | "apartment"          | -       |
| `areaname`        | string   | Filter by area name                                      | "Dubai Marina"       | -       |
| `cityname`        | string   | Filter by city name                                      | "Dubai"              | -       |
| `property_status` | string   | Filter by property status name                           | "Ready"              | -       |
| `developers`      | string[] | Array of developer names                                 | ["Emaar", "Nakheel"] | -       |
| `hasBrochure`     | boolean  | Filter properties with/without brochures                 | true                 | -       |
| `page`            | number   | Page number for pagination (1-based)                     | 1                    | 1       |
| `limit`           | number   | Number of items per page (max 100)                       | 20                   | 20      |

### Example Request Body

```json
{
  "searchkey": "apartment",
  "areaname": "Dubai Marina",
  "cityname": "Dubai",
  "property_status": "Ready",
  "developers": ["Emaar", "Nakheel"],
  "hasBrochure": true,
  "page": 1,
  "limit": 20
}
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": [
    {
      "id": "property-uuid",
      "project_name": "Property Name",
      "starting_price": "{\"currentSign\":\"د.إ\",\"value\":\"2500000\",\"currencyName\":\"AED\"}",
      "thumbnail_image": "https://example.com/image.jpg",
      "brochure_url": "https://example.com/brochure.pdf",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "property_types": {
        "id": "type-uuid",
        "name": "Apartment"
      },
      "cities": {
        "id": "city-uuid",
        "name": "Dubai"
      },
      "states": {
        "id": "state-uuid",
        "name": "Dubai"
      },
      "countries": {
        "id": "country-uuid",
        "name": "United Arab Emirates",
        "code": "AE"
      },
      "developers": {
        "id": "developer-uuid",
        "name": "Emaar"
      },
      "property_statuses": {
        "id": "status-uuid",
        "name": "Ready"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "total": 1,
  "message": "Properties retrieved successfully"
}
```

### Error Response

```json
{
  "error": "Error message",
  "status": 401
}
```

## Behavior

### 1. Default Search Properties

When no `searchkey` is provided or it's empty:

- Returns properties from the `default_search_properties` table
- Orders by `display_order` (ascending)
- Only returns active properties
- Includes all related data (types, cities, states, countries, developers, statuses)

### 2. Search with Filters

When `searchkey` is provided:

- Searches across `project_name`, `payment_plan`, and `handover` fields
- Applies additional filters based on provided parameters
- Orders by `created_at` (descending)
- Limits results to 50 properties for mobile performance

### 3. Filter Logic

- **searchkey**: Uses `ilike` for case-insensitive partial matching across multiple fields
- **areaname**: Exact match on city name
- **cityname**: Exact match on city name
- **property_status**: Exact match on property status name
- **developers**: Matches any of the provided developer names
- **hasBrochure**: Filters based on presence of `brochure_url`

### 4. Pagination

- **page**: Page number (1-based, default: 1)
- **limit**: Items per page (default: 20, max: 100)
- **Response includes**: Current page, total pages, total items, navigation flags
- **Performance**: Optimized for mobile with reasonable page sizes

## Error Handling

### Common Error Responses

| Status Code | Error Message                                 | Description                           |
| ----------- | --------------------------------------------- | ------------------------------------- |
| 401         | "Unauthorized. Please provide a valid token." | Authentication failed                 |
| 500         | "Failed to fetch default search properties"   | Database error when fetching defaults |
| 500         | "Failed to search properties"                 | Database error during search          |
| 500         | "Internal server error"                       | Unexpected server error               |

## Usage Examples

### 1. Get Default Search Properties

```javascript
const response = await fetch('/api/mobile/search-properties', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer your-token',
  },
  body: JSON.stringify({}),
});
```

### 2. Search with Basic Filter

```javascript
const response = await fetch('/api/mobile/search-properties', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer your-token',
  },
  body: JSON.stringify({
    searchkey: 'villa',
    cityname: 'Dubai',
  }),
});
```

### 3. Advanced Search with Multiple Filters

```javascript
const response = await fetch('/api/mobile/search-properties', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer your-token',
  },
  body: JSON.stringify({
    searchkey: 'apartment',
    areaname: 'Dubai Marina',
    cityname: 'Dubai',
    property_status: 'Ready',
    developers: ['Emaar', 'Nakheel'],
    hasBrochure: true,
    page: 1,
    limit: 20,
  }),
});
```

### 4. Search Properties with Brochures Only

```javascript
const response = await fetch('/api/mobile/search-properties', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer your-token',
  },
  body: JSON.stringify({
    searchkey: 'luxury',
    hasBrochure: true,
  }),
});
```

### 5. Pagination Example

```javascript
// Get first page with 10 items
const page1Response = await fetch('/api/mobile/search-properties', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer your-token',
  },
  body: JSON.stringify({
    searchkey: 'apartment',
    page: 1,
    limit: 10,
  }),
});

const page1Data = await page1Response.json();
console.log('Page 1:', page1Data.pagination);

// Get next page if available
if (page1Data.pagination.hasNextPage) {
  const page2Response = await fetch('/api/mobile/search-properties', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer your-token',
    },
    body: JSON.stringify({
      searchkey: 'apartment',
      page: 2,
      limit: 10,
    }),
  });

  const page2Data = await page2Response.json();
  console.log('Page 2:', page2Data.pagination);
}
```

## Testing

A test script is available at `test-mobile-search-api.js` that tests various scenarios:

- Search with filters
- Default search properties
- Empty search key
- Multiple filters
- GET method (for testing)

Run the test script:

```bash
node test-mobile-search-api.js
```

## Database Schema

The API queries the following tables:

- `properties` - Main properties table
- `default_search_properties` - Default search properties
- `property_types` - Property type information
- `cities` - City information
- `states` - State information
- `countries` - Country information
- `developers` - Developer information
- `property_statuses` - Property status information

## Performance Considerations

- Results are limited to 50 properties for mobile performance
- Only active properties are returned
- Proper indexing on search fields is recommended
- Authentication is required for all requests

## Security

- All requests require valid authentication
- Uses Supabase RLS (Row Level Security) where applicable
- Admin client used for database operations to bypass RLS for authorized access
- Input validation and sanitization applied to search terms
