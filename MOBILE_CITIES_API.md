# Mobile Cities API

Simple API endpoint to get all cities for mobile app city selection.

## Endpoint

**GET** `/api/mobile/cities`

## Description

Returns all cities from the database with their associated state and country information. No authentication required.

## Response Format

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
      }
    }
  ],
  "total": 50
}
```

## Usage Example

```javascript
// Fetch all cities
const response = await fetch('/api/mobile/cities');
const data = await response.json();

console.log(data.cities); // Array of all cities
console.log(data.total); // Total number of cities
```

## Mobile App Integration

```javascript
// React Native example
const [cities, setCities] = useState([]);

useEffect(() => {
  const fetchCities = async () => {
    try {
      const response = await fetch('https://your-api.com/api/mobile/cities');
      const data = await response.json();
      setCities(data.cities);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  fetchCities();
}, []);
```

## Features

- ✅ **No Authentication Required** - Public API
- ✅ **Complete Data** - Includes city, state, and country information
- ✅ **Sorted Results** - Cities ordered alphabetically by name
- ✅ **Mobile Optimized** - Clean, simple response format
- ✅ **Error Handling** - Proper error responses

## Testing

Run the test script to verify the API:

```bash
node test-mobile-city-apis.js
```

## Response Fields

| Field                         | Type    | Description                   |
| ----------------------------- | ------- | ----------------------------- |
| `success`                     | boolean | API call success status       |
| `cities`                      | array   | Array of city objects         |
| `total`                       | number  | Total number of cities        |
| `cities[].id`                 | string  | Unique city identifier (UUID) |
| `cities[].name`               | string  | City name                     |
| `cities[].imageUrl`           | string  | City image URL (optional)     |
| `cities[].state.id`           | string  | State identifier              |
| `cities[].state.name`         | string  | State name                    |
| `cities[].state.country.id`   | string  | Country identifier            |
| `cities[].state.country.name` | string  | Country name                  |
