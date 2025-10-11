# Property Details Storage Update

## Summary

Updated the mobile home data API to store **complete property details** instead of just property IDs. This matches the same improvement made for developers, ensuring mobile apps receive all necessary data without additional lookups.

## Changes Made

### 1. Main Route - POST Endpoint (`/api/mobile-home-data/route.ts`)

**Before:**

```typescript
// Stored only property IDs
properties_by_type: [
  {
    property_type_name: 'Apartment',
    property_ids: ['id1', 'id2', 'id3'],
  },
];
```

**After:**

```typescript
// Now stores full property objects with all details
properties_by_type: [
  {
    property_type_name: 'Apartment',
    properties: [
      {
        id: 'id1',
        project_name: 'Luxury Apartments',
        starting_price: 500000,
        property_images: ['url1', 'url2'],
        thumbnail: 'thumbnail_url',
        property_types: { id, name, image_url },
        property_status: { id, name, color },
        countries: { id, name },
        states: { id, name },
        cities: { id, name },
        areas: { id, name },
        developers: { id, name, description, image_url },
        property_amenities: [
          { amenity_id, amenities: { id, name, image_url } },
        ],
        // ... all other property fields
      },
    ],
  },
];
```

**Key Implementation:**

```typescript
// Fetch full property details to store in database
if (parsedPropertiesByType && Array.isArray(parsedPropertiesByType)) {
  for (const typeGroup of parsedPropertiesByType) {
    if (typeGroup.property_ids && typeGroup.property_ids.length > 0) {
      // Fetch full property details including all relations
      const { data: properties } = await supabaseAdmin
        .from('properties')
        .select(
          `
          id, project_name, starting_price, property_type_id,
          property_images, thumbnail, brochure_url, payment_plan,
          handover, expected_appreciation,
          property_types (id, name, image_url),
          property_status (id, name, color),
          countries (id, name),
          states (id, name),
          cities (id, name),
          areas (id, name),
          developers (id, name, description, image_url),
          property_amenities (
            amenity_id,
            amenities (id, name, image_url)
          )
        `
        )
        .in('id', typeGroup.property_ids)
        .eq('is_active', true);

      // Store full property objects
      propertiesByTypeWithFullDetails.push({
        property_type_name: typeGroup.property_type_name,
        properties: properties, // Full objects, not just IDs
      });
    }
  }
}
```

### 2. Main Route - GET Endpoint (Backward Compatibility)

Added logic to handle both formats:

```typescript
// Handle properties_by_type - check if they're already full objects or just IDs
let propertiesWithDetails = [];
if (data.properties_by_type && Array.isArray(data.properties_by_type)) {
  for (const typeGroup of data.properties_by_type) {
    // Check format
    if (typeGroup.properties && Array.isArray(typeGroup.properties)) {
      // Already have full property objects (new format)
      propertiesWithDetails.push(typeGroup);
    } else if (typeGroup.property_ids && typeGroup.property_ids.length > 0) {
      // Have IDs only, fetch full details (backward compatibility)
      const { data: properties } = await supabaseAdmin
        .from('properties')
        .select(/* full query */)
        .in('id', typeGroup.property_ids)
        .eq('is_active', true);

      propertiesWithDetails.push({
        property_type_name: typeGroup.property_type_name,
        properties: properties,
      });
    }
  }
}
```

### 3. Formatted Route (`/api/mobile-home-data/formatted/route.ts`)

Updated to handle both formats for mobile apps:

```typescript
// Handle properties_by_type - check if they're already full objects or just IDs
const propertiesObject: { [key: string]: any[] } = {};

for (const typeGroup of propertiesByType) {
  if (typeGroup.properties && Array.isArray(typeGroup.properties)) {
    // Already have full property objects, use them directly
    propertiesObject[typeGroup.property_type_name] = typeGroup.properties;
  } else if (typeGroup.property_ids && typeGroup.property_ids.length > 0) {
    // Legacy format - fetch full details
    const { data: properties } = await supabaseAdmin
      .from('properties')
      .select(/* full query */)
      .in('id', typeGroup.property_ids);

    propertiesObject[typeGroup.property_type_name] = properties;
  }
}
```

## Benefits

### 1. **Performance Improvement**

- ✅ Reduced database queries for mobile apps
- ✅ Faster response times (data is pre-fetched and stored)
- ✅ Less load on the database

### 2. **Complete Data**

- ✅ Mobile apps receive all property details in one call
- ✅ Includes related data: property types, status, locations, developers, amenities
- ✅ Includes thumbnail images for faster loading

### 3. **Consistency**

- ✅ Matches the developer data structure
- ✅ Consistent API response format
- ✅ Easier for mobile developers to work with

### 4. **Backward Compatibility**

- ✅ Old data with property IDs still works
- ✅ Automatic fallback to fetch details if IDs are found
- ✅ No database migration required

## API Response Format

### Mobile Home Data Structure

```json
{
  "data": {
    "id": "uuid",
    "featured_video_url": "https://...",
    "tagline_text": "Find Your Dream Property",
    "properties_by_type": [
      {
        "property_type_name": "Apartment",
        "properties": [
          {
            "id": "uuid",
            "project_name": "Luxury Apartments",
            "starting_price": 500000,
            "property_type_id": "uuid",
            "property_images": [
              "https://storage.url/image1.jpg",
              "https://storage.url/image2.jpg"
            ],
            "thumbnail": "https://storage.url/thumbnail.jpg",
            "brochure_url": "https://storage.url/brochure.pdf",
            "payment_plan": "60/40",
            "handover": "Q4 2025",
            "expected_appreciation": 15.5,
            "property_status_id": "uuid",
            "country_id": "uuid",
            "state_id": "uuid",
            "city_id": "uuid",
            "area_id": "uuid",
            "developer_id": "uuid",
            "is_active": true,
            "created_at": "2024-01-01T00:00:00Z",
            "property_types": {
              "id": "uuid",
              "name": "Apartment",
              "image_url": "https://..."
            },
            "property_status": {
              "id": "uuid",
              "name": "Under Construction",
              "color": "#ff9800"
            },
            "countries": {
              "id": "uuid",
              "name": "United Arab Emirates"
            },
            "states": {
              "id": "uuid",
              "name": "Dubai"
            },
            "cities": {
              "id": "uuid",
              "name": "Dubai City"
            },
            "areas": {
              "id": "uuid",
              "name": "Downtown Dubai"
            },
            "developers": {
              "id": "uuid",
              "name": "Emaar Properties",
              "description": "Leading developer in Dubai",
              "image_url": "https://..."
            },
            "property_amenities": [
              {
                "amenity_id": "uuid",
                "amenities": {
                  "id": "uuid",
                  "name": "Swimming Pool",
                  "image_url": "https://..."
                }
              },
              {
                "amenity_id": "uuid",
                "amenities": {
                  "id": "uuid",
                  "name": "Gym",
                  "image_url": "https://..."
                }
              }
            ]
          }
        ]
      },
      {
        "property_type_name": "Villa",
        "properties": [...]
      }
    ],
    "selected_developers": [
      {
        "id": "uuid",
        "name": "Emaar Properties",
        "description": "Leading developer",
        "image_url": "https://...",
        "website": "https://...",
        "is_active": true
      }
    ],
    "story_images": [
      "https://storage.url/story1.jpg",
      "https://storage.url/story2.jpg"
    ],
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

## Mobile App Usage

### React Native Example

```javascript
const HomeScreen = () => {
  const [homeData, setHomeData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = await SecureStore.getItemAsync('access_token');
      const response = await fetch(
        'https://your-domain.com/api/mobile-home-data/formatted',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const { data } = await response.json();
      setHomeData(data);
    };

    fetchData();
  }, []);

  return (
    <ScrollView>
      {/* Featured video */}
      {homeData?.featuredVideo && (
        <Video source={{ uri: homeData.featuredVideo }} />
      )}

      {/* Properties by type */}
      {Object.entries(homeData?.properties || {}).map(([type, properties]) => (
        <View key={type}>
          <Text style={styles.typeTitle}>{type}</Text>
          {properties.map(property => (
            <PropertyCard key={property.id}>
              {/* Thumbnail for fast loading */}
              <Image source={{ uri: property.thumbnail }} />

              {/* All details available */}
              <Text>{property.project_name}</Text>
              <Text>${property.starting_price.toLocaleString()}</Text>
              <Text>{property.property_status.name}</Text>
              <Text>
                {property.areas.name}, {property.cities.name}
              </Text>
              <Text>By {property.developers.name}</Text>

              {/* Amenities */}
              <View style={styles.amenities}>
                {property.property_amenities.map(pa => (
                  <Chip key={pa.amenity_id}>{pa.amenities.name}</Chip>
                ))}
              </View>
            </PropertyCard>
          ))}
        </View>
      ))}

      {/* Developers */}
      {homeData?.developers.map(dev => (
        <DeveloperCard key={dev.id} developer={dev} />
      ))}
    </ScrollView>
  );
};
```

## Data Included for Each Property

✅ **Basic Info:**

- ID, project name, starting price
- Property type ID
- Active status, created date

✅ **Media:**

- Property images array
- Thumbnail (optimized for list views)
- Brochure URL

✅ **Financial Details:**

- Payment plan
- Expected appreciation percentage

✅ **Timeline:**

- Handover date/quarter

✅ **Related Objects (Full Details):**

- Property Type (name, image)
- Property Status (name, color for UI)
- Country (name)
- State (name)
- City (name)
- Area (name)
- Developer (name, description, image)
- Amenities (array of amenities with names and images)

## Migration Path

### For Existing Data

No action required! The API automatically handles both formats:

- Old data with `property_ids` continues to work
- New saves automatically use the new format

### Testing

```bash
# 1. Save new home data (will store full property objects)
POST /api/mobile-home-data

# 2. Verify in dashboard (should work seamlessly)
GET /api/mobile-home-data

# 3. Test mobile app access (should receive full details)
GET /api/mobile-home-data/formatted
Authorization: Bearer <token>
```

## Performance Considerations

### Storage Trade-offs

- **More Storage:** Storing full objects uses more database space
- **Faster Access:** No joins needed when reading data
- **Better UX:** Mobile apps load instantly with all data

### Recommendations

1. **Thumbnail Usage:** Use thumbnail field for list views
2. **Image Optimization:** Compress images before uploading
3. **Caching:** Mobile apps should cache the response
4. **Refresh Strategy:** Check for updates periodically, not on every app open

## Related Files

- `src/app/api/mobile-home-data/route.ts` - Main endpoint (admin dashboard)
- `src/app/api/mobile-home-data/formatted/route.ts` - Mobile endpoint
- `MOBILE_API_ACCESS.md` - Mobile authentication guide
- `MOBILE_FORMATTED_API_CHANGES.md` - Authentication changes documentation

## Summary

✅ **Complete property details now stored in database**
✅ **Mobile apps get all data in single API call**
✅ **Includes thumbnail images for performance**
✅ **Backward compatible with existing data**
✅ **Consistent with developer data structure**
✅ **Improved performance and user experience**
