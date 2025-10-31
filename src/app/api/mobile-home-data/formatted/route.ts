import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET - Get mobile home data formatted for mobile app consumption (PUBLIC - NO AUTHENTICATION REQUIRED)
 * This endpoint returns the home data with full property and developer details
 * organized exactly as needed for the mobile app
 *
 * No authentication required - allows mobile users to view homepage before logging in
 */
export async function GET(request: NextRequest) {
  try {
    // Get the most recent active mobile home data
    const { data: homeData, error: homeError } = await supabaseAdmin
      .from('mobile_home_data')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (homeError && homeError.code !== 'PGRST116') {
      return NextResponse.json({ error: homeError.message }, { status: 500 });
    }

    if (!homeData) {
      return NextResponse.json({
        data: {
          featuredVideo: null,
          propertyTypes: [],
          taglineText: '',
          properties: {},
          developers: [],
          stories: [],
        },
      });
    }

    // Handle properties_by_type - support both object and array formats
    const propertiesByTypeData = homeData.properties_by_type || {};
    const propertiesObject: { [key: string]: any[] } = {};

    // Check if already in object format
    if (!Array.isArray(propertiesByTypeData)) {
      // Already an object { "Apartment": [...], "Villa": [...] }
      // Process each property type to parse unit types and fetch missing data
      for (const [propertyType, properties] of Object.entries(
        propertiesByTypeData
      )) {
        if (Array.isArray(properties) && properties.length > 0) {
          // Check if properties have earn_referral and unit_types_text
          // If not, fetch fresh data from database
          const needsFreshData =
            !properties[0].earn_referral && properties[0].id;

          if (needsFreshData) {
            // Fetch fresh property data with earn_referral and unit_types_text
            const propertyIds = properties.map((p: any) => p.id);
            const { data: freshProperties, error: freshPropsError } =
              await supabaseAdmin
                .from('properties')
                .select(
                  `
                id,
                project_name,
                starting_price,
                property_type_id,
                unit_types_text,
                property_images,
                brochure_url,
                payment_plan,
                handover,
                earn_referral,
                property_status_id,
                country_id,
                state_id,
                city_id,
                area_id,
                developer_id,
                is_active,
                created_at,
                property_types (
                  id,
                  name,
                  image_url
                ),
                property_status (
                  id,
                  name,
                  color
                ),
                countries (
                  id,
                  name
                ),
                states (
                  id,
                  name
                ),
                cities (
                  id,
                  name
                ),
                areas (
                  id,
                  name
                ),
                developers (
                  id,
                  name,
                  description,
                  image_url
                ),
                property_amenities (
                  amenity_id,
                  amenities (
                    id,
                    name,
                    image_url
                  )
                )
              `
                )
                .in('id', propertyIds)
                .eq('is_active', true);

            if (!freshPropsError && freshProperties) {
              // Process fresh properties
              const processedProperties = freshProperties.map(
                (property: any) => {
                  const unitTypes: Array<{ name: string }> = [];
                  if (property.unit_types_text) {
                    const unitTypeNames = property.unit_types_text
                      .split(',')
                      .map((name: string) => name.trim());
                    unitTypeNames.forEach((name: string) => {
                      if (name) {
                        unitTypes.push({ name });
                      }
                    });
                  }
                  return {
                    ...property,
                    unit_types: unitTypes,
                  };
                }
              );
              propertiesObject[propertyType] = processedProperties;
            } else {
              // Fallback to existing data
              propertiesObject[propertyType] = properties;
            }
          } else {
            // Properties already have the data, just process unit_types
            const processedProperties = properties.map((property: any) => {
              // If unit_types already exists as an array, use it
              if (property.unit_types && Array.isArray(property.unit_types)) {
                return property;
              }
              // Otherwise parse from unit_types_text
              const unitTypes: Array<{ name: string }> = [];
              if (property.unit_types_text) {
                const unitTypeNames = property.unit_types_text
                  .split(',')
                  .map((name: string) => name.trim());
                unitTypeNames.forEach((name: string) => {
                  if (name) {
                    unitTypes.push({ name });
                  }
                });
              }
              return {
                ...property,
                unit_types: unitTypes,
              };
            });
            propertiesObject[propertyType] = processedProperties;
          }
        }
      }
    } else {
      // Old array format, convert to object
      for (const typeGroup of propertiesByTypeData) {
        // Check if we have full property objects or just IDs
        if (
          typeGroup.properties &&
          Array.isArray(typeGroup.properties) &&
          typeGroup.properties.length > 0
        ) {
          // Check if properties have earn_referral
          const needsFreshData =
            !typeGroup.properties[0].earn_referral &&
            typeGroup.properties[0].id;

          if (needsFreshData) {
            // Fetch fresh property data with earn_referral and unit_types_text
            const propertyIds = typeGroup.properties.map((p: any) => p.id);
            const { data: freshProperties, error: freshPropsError } =
              await supabaseAdmin
                .from('properties')
                .select(
                  `
                id,
                project_name,
                starting_price,
                property_type_id,
                unit_types_text,
                property_images,
                brochure_url,
                payment_plan,
                handover,
                earn_referral,
                property_status_id,
                country_id,
                state_id,
                city_id,
                area_id,
                developer_id,
                is_active,
                created_at,
                property_types (
                  id,
                  name,
                  image_url
                ),
                property_status (
                  id,
                  name,
                  color
                ),
                countries (
                  id,
                  name
                ),
                states (
                  id,
                  name
                ),
                cities (
                  id,
                  name
                ),
                areas (
                  id,
                  name
                ),
                developers (
                  id,
                  name,
                  description,
                  image_url
                ),
                property_amenities (
                  amenity_id,
                  amenities (
                    id,
                    name,
                    image_url
                  )
                )
              `
                )
                .in('id', propertyIds)
                .eq('is_active', true);

            if (!freshPropsError && freshProperties) {
              // Process fresh properties
              const processedProperties = freshProperties.map(
                (property: any) => {
                  const unitTypes: Array<{ name: string }> = [];
                  if (property.unit_types_text) {
                    const unitTypeNames = property.unit_types_text
                      .split(',')
                      .map((name: string) => name.trim());
                    unitTypeNames.forEach((name: string) => {
                      if (name) {
                        unitTypes.push({ name });
                      }
                    });
                  }
                  return {
                    ...property,
                    unit_types: unitTypes,
                  };
                }
              );
              propertiesObject[typeGroup.property_type_name] =
                processedProperties;
            } else {
              // Fallback to existing data
              propertiesObject[typeGroup.property_type_name] =
                typeGroup.properties;
            }
          } else {
            // Already have full property objects, process them to parse unit types
            const processedProperties = typeGroup.properties.map(
              (property: any) => {
                // If unit_types already exists as an array, use it
                if (property.unit_types && Array.isArray(property.unit_types)) {
                  return property;
                }
                // Otherwise parse from unit_types_text
                const unitTypes: Array<{ name: string }> = [];
                if (property.unit_types_text) {
                  const unitTypeNames = property.unit_types_text
                    .split(',')
                    .map((name: string) => name.trim());
                  unitTypeNames.forEach((name: string) => {
                    if (name) {
                      unitTypes.push({ name });
                    }
                  });
                }
                return {
                  ...property,
                  unit_types: unitTypes,
                };
              }
            );
            propertiesObject[typeGroup.property_type_name] =
              processedProperties;
          }
        } else if (
          typeGroup.property_ids &&
          typeGroup.property_ids.length > 0
        ) {
          // Have IDs only, fetch full property details (backward compatibility)
          const { data: properties, error: propsError } = await supabaseAdmin
            .from('properties')
            .select(
              `
              id,
              project_name,
              starting_price,
              property_type_id,
              unit_types_text,
              property_images,
              brochure_url,
              payment_plan,
              handover,
              earn_referral,
              property_status_id,
              country_id,
              state_id,
              city_id,
              area_id,
              developer_id,
              is_active,
              created_at,
              property_types (
                id,
                name,
                image_url
              ),
              property_status (
                id,
                name,
                color
              ),
              countries (
                id,
                name
              ),
              states (
                id,
                name
              ),
              cities (
                id,
                name
              ),
              areas (
                id,
                name
              ),
              developers (
                id,
                name,
                description,
                image_url
              ),
              property_amenities (
                amenity_id,
                amenities (
                  id,
                  name,
                  image_url
                )
              )
            `
            )
            .in('id', typeGroup.property_ids)
            .eq('is_active', true);

          if (!propsError && properties) {
            // Parse unit types from comma-separated text for each property
            const processedProperties = properties.map((property: any) => {
              const unitTypes: Array<{ name: string }> = [];
              if (property.unit_types_text) {
                const unitTypeNames = property.unit_types_text
                  .split(',')
                  .map((name: string) => name.trim());
                unitTypeNames.forEach((name: string) => {
                  if (name) {
                    unitTypes.push({ name });
                  }
                });
              }
              return {
                ...property,
                unit_types: unitTypes,
              };
            });
            propertiesObject[typeGroup.property_type_name] =
              processedProperties;
          }
        }
      }
    }

    // Fetch all property types
    const { data: propertyTypes, error: propertyTypesError } =
      await supabaseAdmin
        .from('property_types')
        .select('id, name, description, image_url')
        .order('name', { ascending: true });

    const propertyTypesArray = propertyTypes || [];

    // Handle selected_developers - check if they're already full objects or just IDs
    const selectedDevelopers = homeData.selected_developers || [];
    let developersArray: any[] = [];

    if (selectedDevelopers.length > 0) {
      // Check if first item is an object (full developer data) or a string (just ID)
      if (
        typeof selectedDevelopers[0] === 'object' &&
        selectedDevelopers[0] !== null
      ) {
        // Already have full developer objects, use them as is
        developersArray = selectedDevelopers;
      } else {
        // Have IDs only, fetch full developer details (backward compatibility)
        const { data: developers, error: devsError } = await supabaseAdmin
          .from('developers')
          .select('*')
          .in('id', selectedDevelopers);

        if (!devsError && developers) {
          developersArray = developers;
        }
      }
    }

    // Format the response
    const formattedResponse = {
      featuredVideo: homeData.featured_video_url,
      propertyTypes: propertyTypesArray,
      taglineText: homeData.tagline_text,
      properties: propertiesObject,
      developers: developersArray,
      stories: homeData.story_images || [],
    };

    return NextResponse.json({ data: formattedResponse });
  } catch (error) {
    console.error('Error fetching formatted mobile home data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
