# Mobile City Selection Implementation

This document describes the implementation of city-based filtering for mobile users without changing the existing structure.

## Overview

The implementation adds city selection functionality to the mobile app where:

1. Users must select a city before accessing the homepage
2. Home data is filtered based on the selected city
3. All existing functionality remains unchanged

## New API Endpoints

### 1. City Selection API

**Endpoint:** `GET /api/mobile/city-selection`

**Purpose:** Get list of cities for mobile app city selection

**Parameters:**

- `search` (optional): Search cities by name
- `state_id` (optional): Filter cities by state
- `limit` (optional): Number of cities to return (default: 100, max: 500)

**Response:**

```json
{
  "success": true,
  "cities": [
    {
      "id": "uuid",
      "name": "City Name",
      "imageUrl": "https://...",
      "state": {
        "id": "uuid",
        "name": "State Name",
        "country": {
          "id": "uuid",
          "name": "Country Name"
        }
      },
      "displayName": "City Name, State Name, Country Name"
    }
  ],
  "total": 50
}
```

### 2. City-Based Home Data API

**Endpoint:** `GET /api/mobile/home-data-by-city`

**Purpose:** Get mobile home data filtered by selected city

**Parameters:**

- `city_id` (required): UUID of the selected city
- `limit` (optional): Max properties per type (default: 10, max: 50)
- `include_all_cities` (optional): If true, includes properties from all cities (default: false)

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "featured_video_url": "https://...",
    "tagline_text": "Welcome to our properties",
    "properties_by_type": {
      "Apartment": [
        {
          "id": "uuid",
          "project_name": "Project Name",
          "starting_price": {...},
          "property_images": [...],
          "city_id": "uuid",
          "cities": {
            "id": "uuid",
            "name": "City Name"
          },
          // ... other property details
        }
      ]
    },
    "selected_developers": [...],
    "story_images": [...]
  },
  "city": {
    "id": "uuid",
    "name": "City Name",
    "state": {
      "id": "uuid",
      "name": "State Name",
      "country": {
        "id": "uuid",
        "name": "Country Name"
      }
    }
  },
  "filters": {
    "city_id": "uuid",
    "include_all_cities": false,
    "limit_per_type": 10
  }
}
```

### 3. Alternative Cities API

**Endpoint:** `GET /api/mobile/cities`

**Purpose:** Alternative cities API with different response format

**Parameters:**

- `state_id` (optional): Filter cities by state
- `search` (optional): Search cities by name
- `limit` (optional): Number of cities to return (default: 1000, max: 1000)

## Implementation Details

### City Filtering Logic

1. **Property Filtering**: Properties are filtered by `city_id` in the database query
2. **Backward Compatibility**: Supports both object and array formats for `properties_by_type`
3. **Fallback Handling**: If no city-specific properties exist, returns empty arrays
4. **Limit Control**: Limits number of properties per type to prevent large responses

### Database Queries

The implementation uses Supabase queries with:

- City ID filtering: `.eq('city_id', cityId)`
- Active property filtering: `.eq('is_active', true)`
- Related data joins for complete property information
- Proper error handling for missing cities

### Error Handling

- **400 Bad Request**: Missing or invalid parameters
- **404 Not Found**: City not found
- **500 Internal Server Error**: Database or server errors

## Usage Examples

### 1. Get Cities for Selection

```javascript
const response = await fetch('/api/mobile/city-selection?search=New&limit=20');
const data = await response.json();
console.log(data.cities); // Array of cities
```

### 2. Get Home Data for Specific City

```javascript
const cityId = 'uuid-of-selected-city';
const response = await fetch(
  `/api/mobile/home-data-by-city?city_id=${cityId}&limit=5`
);
const data = await response.json();
console.log(data.data.properties_by_type); // Filtered properties
```

### 3. Get Home Data for All Cities

```javascript
const response = await fetch(
  '/api/mobile/home-data-by-city?include_all_cities=true&limit=10'
);
const data = await response.json();
console.log(data.data.properties_by_type); // All properties
```

## Mobile App Integration

### City Selection Flow

1. App loads city selection screen
2. User searches/selects a city
3. App stores selected city ID
4. App calls home data API with city ID
5. App displays filtered home data

### State Management

```javascript
// Store selected city
const [selectedCity, setSelectedCity] = useState(null);

// Load home data when city is selected
useEffect(() => {
  if (selectedCity) {
    loadHomeData(selectedCity.id);
  }
}, [selectedCity]);
```

## Testing

Run the test script to verify APIs:

```bash
node test-mobile-city-apis.js
```

## Benefits

1. **No Breaking Changes**: Existing APIs and functionality remain unchanged
2. **City-Specific Content**: Users see relevant properties for their location
3. **Scalable**: Can easily add more location-based features
4. **Flexible**: Supports both city-specific and all-cities views
5. **Performance**: Limits results to prevent large responses

## Future Enhancements

1. **Caching**: Add Redis caching for frequently accessed city data
2. **Geolocation**: Auto-detect user's city based on location
3. **Favorites**: Allow users to save favorite cities
4. **Analytics**: Track city selection patterns
5. **Push Notifications**: Send city-specific property updates

## Security Considerations

- All mobile APIs are public (no authentication required)
- Input validation for city IDs and parameters
- Rate limiting should be implemented in production
- SQL injection protection through Supabase queries
