// Google Maps API service layer
import { Restaurant, RestaurantDetails, UserLocation } from '@/types';

// Environment variables
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';
const GOOGLE_GEOCODING_BASE_URL = 'https://maps.googleapis.com/maps/api/geocode';

// Validate API key
if (!GOOGLE_MAPS_API_KEY) {
  console.warn('Google Maps API key not found. Set VITE_GOOGLE_MAPS_API_KEY in your environment variables.');
}

// TypeScript types for Google Maps API
interface GoogleMapsWindow extends Window {
  google: {
    maps: {
      Map: unknown;
      LatLng: unknown;
      Geocoder: unknown;
      places: {
        Place: unknown;
        PlacesService: unknown;
        PlacesServiceStatus: {
          OK: string;
          ZERO_RESULTS: string;
        };
        SearchNearbyRequest: unknown;
        SearchByTextRequest: unknown;
      };
      GeocoderStatus: {
        OK: string;
        ZERO_RESULTS: string;
      };
    };
  };
  googleMapsLoaded: boolean;
  initGoogleMaps: () => void;
}

declare const window: GoogleMapsWindow;

// Google Maps API result types
interface GooglePlaceResult {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  geometry: {
    location: {
      lat(): number;
      lng(): number;
    };
  };
  rating?: number;
  price_level?: number;
  types: string[];
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
  formatted_phone_number?: string;
  website?: string;
}

interface GoogleGeocoderResult {
  formatted_address: string;
}

// Load Google Maps API script dynamically
function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.googleMapsLoaded && window.google) {
      resolve();
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      reject(new Error('Google Maps API key is required'));
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      window.addEventListener('google-maps-loaded', () => resolve());
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps API'));
    
    window.addEventListener('google-maps-loaded', () => resolve());
    document.head.appendChild(script);
  });
}

// Wait for Google Maps API to load
export function waitForGoogleMaps(): Promise<void> {
  return new Promise((resolve) => {
    if (window.googleMapsLoaded && window.google) {
      resolve();
    } else {
      loadGoogleMapsScript().then(() => resolve()).catch(() => resolve());
    }
  });
}

// Initialize Google Maps service
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mapInstance: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let placesService: any;

async function initializeGoogleMapsService(): Promise<void> {
  await waitForGoogleMaps();
  
  if (!window.google || !window.googleMapsLoaded) {
    throw new Error('Google Maps API failed to load');
  }
  
  if (!mapInstance) {
    // Create a hidden div for the map (required for legacy PlacesService)
    const mapDiv = document.createElement('div');
    mapDiv.style.display = 'none';
    document.body.appendChild(mapDiv);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapInstance = new (window.google.maps.Map as any)(mapDiv, {
      center: { lat: 43.6532, lng: -79.3832 }, // Toronto
      zoom: 15,
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    placesService = new (window.google.maps.places.PlacesService as any)(mapInstance);
  }
}

// Types for Google Places API responses
interface GooglePlace {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  price_level?: number;
  types: string[];
  photos?: {
    photo_reference: string;
    height: number;
    width: number;
  }[];
  opening_hours?: {
    open_now: boolean;
  };
}

interface GooglePlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating: number;
  photos?: {
    photo_reference: string;
    height: number;
    width: number;
  }[];
  opening_hours?: {
    weekday_text: string[];
    open_now: boolean;
  };
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  price_level?: number;
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Map Google cuisine types to our app's cuisine categories
function mapCuisineType(types: string[]): string {
  const cuisineMap: Record<string, string> = {
    restaurant: 'Restaurant',
    food: 'Food',
    meal_takeaway: 'Takeaway',
    meal_delivery: 'Delivery',
    cafe: 'Cafe',
    bar: 'Bar',
    bakery: 'Bakery',
    // Specific cuisines
    chinese_restaurant: 'Chinese',
    japanese_restaurant: 'Japanese',
    thai_restaurant: 'Thai',
    italian_restaurant: 'Italian',
    mexican_restaurant: 'Mexican',
    indian_restaurant: 'Indian',
    french_restaurant: 'French',
    american_restaurant: 'American',
    steakhouse: 'Steakhouse',
  };

  for (const type of types) {
    if (cuisineMap[type]) {
      return cuisineMap[type];
    }
  }
  return 'Restaurant';
}

// Search for nearby restaurants using Google Places API
export async function searchNearbyRestaurants(
  location: UserLocation,
  radius: number = 2000, // 2km radius
  type: string = 'restaurant'
): Promise<Restaurant[]> {
  await initializeGoogleMapsService();

  // Try new Place API first (if available)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (window.google.maps.places.Place && (window.google.maps.places.Place as any).searchNearby) {
      const request = {
        // Only use valid fields for the new Place API
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'priceLevel', 'types', 'photos'],
        locationRestriction: {
          center: { lat: location.lat, lng: location.lng },
          radius: radius,
        },
        includedTypes: ['restaurant'],
        maxResultCount: 20,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (window.google.maps.places.Place as any).searchNearby(request);
      const places = response.places || [];
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const restaurants = places.map((place: any): Restaurant => {
        // Log the raw place object for debugging
        console.log('Place object:', place);
        console.log('Place.Dg:', place.Dg);
        console.log('Place.Mg:', place.Mg);
        // Robustly extract the name
        let restaurantName = '';
        if (place.Dg && typeof place.Dg.displayName === 'string' && place.Dg.displayName.trim().length > 0) {
          restaurantName = place.Dg.displayName;
        } else if (place.displayName && typeof place.displayName.text === 'string' && place.displayName.text.trim().length > 0) {
          restaurantName = place.displayName.text;
        } else if (typeof place.name === 'string' && place.name.trim().length > 0) {
          restaurantName = place.name;
        } else if (typeof place.title === 'string' && place.title.trim().length > 0) {
          restaurantName = place.title;
        }
        return {
          id: place.place_id || place.id,
          name: restaurantName || 'Unknown Restaurant',
          rating: place.rating || 0,
          address: place.formattedAddress || place.vicinity || '',
          coordinates: {
            lat: place.location.lat(),
            lng: place.location.lng(),
          },
          cuisine: mapCuisineType(place.types || []),
          priceLevel: place.priceLevel || 2,
          image: getBestRestaurantImage(place.photos),
          distance: calculateDistance(
            location.lat,
            location.lng,
            place.location.lat(),
            place.location.lng()
          ),
          photoAttributions: (place.photos && place.photos[0] && place.photos[0].authorAttributions) ? place.photos[0].authorAttributions : [],
        };
      });
      
      return restaurants;
    }
  } catch (error) {
    console.warn('New Place API failed, falling back to legacy PlacesService:', error);
  }

  // Fallback to legacy PlacesService
  return new Promise((resolve, reject) => {
    const request = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      location: new (window.google.maps.LatLng as any)(location.lat, location.lng),
      radius: radius,
      type: type,
    };

    placesService.nearbySearch(request, (results: GooglePlaceResult[], status: string) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        const restaurants = results.map((place: GooglePlaceResult): Restaurant => ({
          id: place.place_id,
          name: place.name,
          rating: place.rating || 0,
          address: place.vicinity || '',
          coordinates: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          },
          cuisine: mapCuisineType(place.types),
          priceLevel: place.price_level || 2,
          image: getBestRestaurantImage(place.photos),
          distance: calculateDistance(
            location.lat,
            location.lng,
            place.geometry.location.lat(),
            place.geometry.location.lng()
          ),
          photoAttributions: [], // No attributions in legacy API
        }));
        resolve(restaurants);
      } else {
        reject(new Error(`Places API error: ${status}`));
      }
    });
  });
}

// Get detailed information about a specific place
export async function getPlaceDetails(placeId: string): Promise<RestaurantDetails> {
  await initializeGoogleMapsService();

  // Try new Place API first (if available)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (window.google.maps.places.Place && (window.google.maps.places.Place as any).fetchFields) {
      const request = {
        place_id: placeId,
        // Only use valid fields for the new Place API
        fields: [
          'id',
          'displayName',
          'formattedAddress',
          'nationalPhoneNumber',
          'websiteUri',
          'rating',
          'photos',
          'location',
          'types',
          'priceLevel',
        ],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const place = new (window.google.maps.places.Place as any)(request);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (place as any).fetchFields();

      // Log the raw place object and Dg for debugging
      console.log('Place details object:', place);
      console.log('Place details Dg:', place.Dg);

      const dg = place.Dg || {};
      // Define PlacePhoto type for type safety
      interface PlacePhoto { name?: string; widthPx?: number; heightPx?: number; authorAttributions?: unknown[] }
      const details: RestaurantDetails = {
        place_id: dg.id || place.place_id || place.id || placeId,
        name: dg.displayName || 'Unknown Restaurant',
        formatted_address: dg.formattedAddress || '',
        formatted_phone_number: dg.nationalPhoneNumber,
        website: dg.websiteUri || dg.websiteURI,
        rating: dg.rating || 0,
        photos: dg.photos
          ? dg.photos
              .filter((photo: PlacePhoto) => typeof photo.name === 'string' && photo.name.trim().length > 0)
              .map((photo: PlacePhoto) => ({
                photo_reference: photo.name,
                width: photo.widthPx,
                height: photo.heightPx,
                attributions: photo.authorAttributions || [],
              }))
          : [],
        opening_hours: dg.currentOpeningHours,
        geometry: {
          location: {
            lat: dg.location?.lat ? dg.location.lat() : 0,
            lng: dg.location?.lng ? dg.location.lng() : 0,
          },
        },
      };
      return details;
    }
  } catch (error) {
    console.warn('New Place API failed, falling back to legacy PlacesService:', error);
  }

  // Fallback to legacy PlacesService
  return new Promise((resolve, reject) => {
    const request = {
      placeId: placeId,
      // Use only valid fields for legacy API
      fields: [
        'place_id',
        'name',
        'formatted_address',
        'formatted_phone_number',
        'website',
        'rating',
        'photos',
        'opening_hours',
        'geometry',
        'types',
        'price_level',
      ],
    };

    placesService.getDetails(request, (place: GooglePlaceResult, status: string) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        const details: RestaurantDetails = {
          place_id: place.place_id,
          name: place.name,
          formatted_address: place.formatted_address || '',
          formatted_phone_number: place.formatted_phone_number,
          website: place.website,
          rating: place.rating || 0,
          photos: place.photos?.map((photo) => ({
            photo_reference: photo.photo_reference,
            width: photo.width,
            height: photo.height,
            attributions: [], // No attributions in legacy API
          })),
          opening_hours: place.opening_hours,
          geometry: {
            location: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            },
          },
        };
        resolve(details);
      } else {
        reject(new Error(`Place Details API error: ${status}`));
      }
    });
  });
}

// Get the best featured image for a restaurant
function getBestRestaurantImage(photos?: Array<{
  photo_reference?: string;
  name?: string;
  height?: number;
  width?: number;
  heightPx?: number;
  widthPx?: number;
}>): string {
  if (!photos || photos.length === 0) {
    return '/placeholder.svg';
  }

  // Find the best photo (largest and most suitable for restaurant display)
  let bestPhoto = photos[0];
  
  // Prefer photos that are more landscape-oriented and high resolution
  for (const photo of photos) {
    const currentWidth = photo.width || photo.widthPx || 0;
    const currentHeight = photo.height || photo.heightPx || 0;
    const bestWidth = bestPhoto.width || bestPhoto.widthPx || 0;
    const bestHeight = bestPhoto.height || bestPhoto.heightPx || 0;
    
    if (currentWidth === 0 || currentHeight === 0) continue;
    
    const currentRatio = currentWidth / currentHeight;
    const bestRatio = bestWidth / bestHeight;
    const currentSize = currentWidth * currentHeight;
    const bestSize = bestWidth * bestHeight;
    
    // Prefer landscape photos (ratio between 1.2 and 2.0) with good resolution
    if (currentRatio >= 1.2 && currentRatio <= 2.0 && currentSize > bestSize) {
      bestPhoto = photo;
    }
  }

  // Return high-quality image URL (larger size for better quality)
  const photoRef = bestPhoto.photo_reference || bestPhoto.name;
  return photoRef ? getPlacePhotoUrl(photoRef, 800, 600) : '/placeholder.svg';
}

// Enhance restaurant data with photos if missing
export async function enhanceRestaurantWithPhotos(restaurant: Restaurant): Promise<Restaurant> {
  // If restaurant already has a real image, return as is
  if (restaurant.image !== '/placeholder.svg') {
    return restaurant;
  }

  try {
    // Fetch detailed place information to get photos
    const details = await getPlaceDetails(restaurant.id);
    
    if (details.photos && details.photos.length > 0) {
      return {
        ...restaurant,
        image: getBestRestaurantImage(details.photos),
      };
    }
  } catch (error) {
    console.warn(`Failed to enhance restaurant ${restaurant.name} with photos:`, error);
  }

  return restaurant;
}

// Enhance multiple restaurants with photos
export async function enhanceRestaurantsWithPhotos(restaurants: Restaurant[]): Promise<Restaurant[]> {
  const enhancedRestaurants = await Promise.all(
    restaurants.map(async (restaurant) => {
      return await enhanceRestaurantWithPhotos(restaurant);
    })
  );

  return enhancedRestaurants;
}

// Generate URL for Google Places photo with optimized parameters
export function getPlacePhotoUrl(
  photoReference: string,
  maxWidth: number = 800,
  maxHeight: number = 600
): string {
  if (!GOOGLE_MAPS_API_KEY) {
    return '/placeholder.svg';
  }

  // Handle both old and new photo reference formats
  if (photoReference.startsWith('places/')) {
    // New Place API (New) format - use the photo name directly
    // Format: https://places.googleapis.com/v1/NAME/media?key=API_KEY&PARAMETERS
    const url = new URL(`https://places.googleapis.com/v1/${photoReference}/media`);
    url.searchParams.append('maxWidthPx', maxWidth.toString());
    url.searchParams.append('maxHeightPx', maxHeight.toString());
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);
    return url.toString();
  } else {
    // Legacy format - use the old photo reference
    const url = new URL(`${GOOGLE_PLACES_BASE_URL}/photo`);
    url.searchParams.append('photoreference', photoReference);
    url.searchParams.append('maxwidth', maxWidth.toString());
    url.searchParams.append('maxheight', maxHeight.toString());
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);
    return url.toString();
  }
}

// Get multiple image sizes for different use cases
export function getRestaurantImages(photos?: Array<{
  photo_reference?: string;
  name?: string;
  height?: number;
  width?: number;
  heightPx?: number;
  widthPx?: number;
}>) {
  if (!photos || photos.length === 0) {
    return {
      thumbnail: '/placeholder.svg',
      medium: '/placeholder.svg',
      large: '/placeholder.svg',
      hero: '/placeholder.svg',
    };
  }

  const bestPhoto = photos[0]; // Use the first photo as the best one after our selection logic
  const photoRef = bestPhoto.photo_reference || bestPhoto.name;
  
  if (!photoRef) {
    return {
      thumbnail: '/placeholder.svg',
      medium: '/placeholder.svg',
      large: '/placeholder.svg',
      hero: '/placeholder.svg',
    };
  }
  
  return {
    thumbnail: getPlacePhotoUrl(photoRef, 200, 150),  // For cards/lists
    medium: getPlacePhotoUrl(photoRef, 400, 300),     // For feed posts
    large: getPlacePhotoUrl(photoRef, 800, 600),      // For detail views
    hero: getPlacePhotoUrl(photoRef, 1200, 800),      // For hero sections
  };
}

// Create a restaurant image with fallback strategy
export function getRestaurantImageWithFallback(
  photos?: Array<{
    photo_reference?: string;
    name?: string;
    height?: number;
    width?: number;
    heightPx?: number;
    widthPx?: number;
  }>,
  size: 'thumbnail' | 'medium' | 'large' | 'hero' = 'medium'
): string {
  if (!photos || photos.length === 0) {
    return '/placeholder.svg';
  }

  const bestPhoto = photos[0];
  const photoRef = bestPhoto.photo_reference || bestPhoto.name;
  
  if (!photoRef) {
    return '/placeholder.svg';
  }
  
  const sizeConfig = {
    thumbnail: { width: 200, height: 150 },
    medium: { width: 400, height: 300 },
    large: { width: 800, height: 600 },
    hero: { width: 1200, height: 800 },
  };

  const config = sizeConfig[size];
  return getPlacePhotoUrl(photoRef, config.width, config.height);
}

// Reverse geocoding: Convert coordinates to human-readable address
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  await initializeGoogleMapsService();

  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geocoder = new (window.google.maps.Geocoder as any)();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const latLng = new (window.google.maps.LatLng as any)(lat, lng);

    geocoder.geocode({ location: latLng }, (results: GoogleGeocoderResult[], status: string) => {
      if (status === window.google.maps.GeocoderStatus.OK && results.length > 0) {
        resolve(results[0].formatted_address);
      } else {
        resolve(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    });
  });
}

// Forward geocoding: Search for locations by text query
export interface LocationSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  location: {
    lat: number;
    lng: number;
  };
  types: string[];
}

export async function searchLocationsByText(query: string): Promise<LocationSearchResult[]> {
  await initializeGoogleMapsService();

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geocoder = new (window.google.maps.Geocoder as any)();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    geocoder.geocode({ address: query }, (results: any[], status: string) => {
      if (status === window.google.maps.GeocoderStatus.OK && results) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const locations = results.map((result: any): LocationSearchResult => ({
          place_id: result.place_id,
          name: result.address_components[0]?.long_name || result.formatted_address,
          formatted_address: result.formatted_address,
          location: {
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng(),
          },
          types: result.types || [],
        }));
        resolve(locations);
      } else if (status === window.google.maps.GeocoderStatus.ZERO_RESULTS) {
        resolve([]);
      } else {
        reject(new Error(`Geocoding API error: ${status}`));
      }
    });
  });
}

// Search places by text query using JavaScript API
export async function searchPlacesByText(
  query: string,
  location?: UserLocation,
  radius?: number
): Promise<Restaurant[]> {
  await initializeGoogleMapsService();

  // Try new Place API first (if available)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (window.google.maps.places.Place && (window.google.maps.places.Place as any).searchByText) {
      const request = {
        // Only use valid fields for the new Place API
        textQuery: query,
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'priceLevel', 'types', 'photos'],
        locationRestriction: location ? {
          center: { lat: location.lat, lng: location.lng },
          radius: radius || 50000, // 50km default if not specified
        } : undefined,
        includedType: 'restaurant',
        maxResultCount: 20,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (window.google.maps.places.Place as any).searchByText(request);
      const places = response.places || [];
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const restaurants = places.map((place: any): Restaurant => ({
        id: place.place_id || place.id,
        name: place.displayName?.text || place.name || 'Unknown Restaurant',
        rating: place.rating || 0,
        address: place.formattedAddress || '',
        coordinates: {
          lat: place.location.lat(),
          lng: place.location.lng(),
        },
        cuisine: mapCuisineType(place.types || []),
        priceLevel: place.priceLevel || 2,
        image: getBestRestaurantImage(place.photos),
        distance: location ? calculateDistance(
          location.lat,
          location.lng,
          place.location.lat(),
          place.location.lng()
        ) : 0,
        photoAttributions: (place.photos && place.photos[0] && place.photos[0].authorAttributions) ? place.photos[0].authorAttributions : [],
      }));
      
      return restaurants;
    }
  } catch (error) {
    console.warn('New Place API failed, falling back to legacy PlacesService:', error);
  }

  // Fallback to legacy PlacesService
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request: any = {
      query: query,
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'rating', 'photos', 'types', 'price_level'],
    };

    if (location) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      request.location = new (window.google.maps.LatLng as any)(location.lat, location.lng);
      if (radius) {
        request.radius = radius;
      }
    }

    placesService.textSearch(request, (results: GooglePlaceResult[], status: string) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        const restaurants = results.map((place: GooglePlaceResult): Restaurant => ({
          id: place.place_id,
          name: place.name,
          rating: place.rating || 0,
          address: place.formatted_address || '',
          coordinates: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          },
          cuisine: mapCuisineType(place.types),
          priceLevel: place.price_level || 2,
          image: getBestRestaurantImage(place.photos),
          distance: location ? calculateDistance(
            location.lat,
            location.lng,
            place.geometry.location.lat(),
            place.geometry.location.lng()
          ) : 0,
          photoAttributions: [], // No attributions in legacy API
        }));
        resolve(restaurants);
      } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        resolve([]);
      } else {
        reject(new Error(`Text Search API error: ${status}`));
      }
    });
  });
}

// Generate Google Maps URL for directions
export function getDirectionsUrl(destination: { lat: number; lng: number }, origin?: { lat: number; lng: number }): string {
  const baseUrl = 'https://www.google.com/maps/dir/';
  
  if (origin) {
    return `${baseUrl}${origin.lat},${origin.lng}/${destination.lat},${destination.lng}`;
  } else {
    return `${baseUrl}Current+Location/${destination.lat},${destination.lng}`;
  }
}

// Generate static map image URL
export function getStaticMapUrl(
  center: { lat: number; lng: number },
  zoom: number = 15,
  width: number = 400,
  height: number = 300,
  markers?: { lat: number; lng: number; label?: string }[]
): string {
  if (!GOOGLE_MAPS_API_KEY) {
    return '/placeholder.svg';
  }

  const url = new URL('https://maps.googleapis.com/maps/api/staticmap');
  url.searchParams.append('center', `${center.lat},${center.lng}`);
  url.searchParams.append('zoom', zoom.toString());
  url.searchParams.append('size', `${width}x${height}`);
  url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

  if (markers && markers.length > 0) {
    markers.forEach((marker, index) => {
      const label = marker.label || String.fromCharCode(65 + index); // A, B, C...
      url.searchParams.append('markers', `label:${label}|${marker.lat},${marker.lng}`);
    });
  } else {
    url.searchParams.append('markers', `${center.lat},${center.lng}`);
  }

  return url.toString();
} 