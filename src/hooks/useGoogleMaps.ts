import { useState, useEffect, useCallback } from 'react';
import { Restaurant, RestaurantDetails, UserLocation } from '@/types';
import {
  searchNearbyRestaurants,
  getPlaceDetails,
  reverseGeocode,
  searchPlacesByText,
  enhanceRestaurantsWithPhotos,
  searchLocationsByText,
  LocationSearchResult,
} from '@/lib/googleMaps';

// Hook for searching nearby restaurants
export const useNearbyRestaurants = (location: UserLocation | null, radius: number = 2000) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchRestaurants = useCallback(async (
    userLocation: UserLocation,
    searchRadius: number = radius,
    type: string = 'restaurant'
  ) => {
    setLoading(true);
    setError(null);

    try {
      // First, get basic restaurant data
      const basicResults = await searchNearbyRestaurants(userLocation, searchRadius, type);
      
      // Set basic results immediately for faster UI response
      setRestaurants(basicResults);
      
      // Then enhance with photos in the background
      const enhancedResults = await enhanceRestaurantsWithPhotos(basicResults);
      
      // Update with enhanced results
      setRestaurants(enhancedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch restaurants');
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, [radius]);

  useEffect(() => {
    if (location) {
      searchRestaurants(location);
    }
  }, [location, searchRestaurants]);

  return {
    restaurants,
    loading,
    error,
    refetch: () => location && searchRestaurants(location),
    searchWithFilters: searchRestaurants,
  };
};

// Hook for getting place details
export const usePlaceDetails = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaceDetails = useCallback(async (placeId: string): Promise<RestaurantDetails | null> => {
    setLoading(true);
    setError(null);

    try {
      const details = await getPlaceDetails(placeId);
      return details;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch place details');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    fetchPlaceDetails,
    loading,
    error,
  };
};

// Hook for reverse geocoding
export const useReverseGeocode = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAddressFromCoordinates = useCallback(async (lat: number, lng: number): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const address = await reverseGeocode(lat, lng);
      return address;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get address');
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getAddressFromCoordinates,
    loading,
    error,
  };
};

// Hook for text-based place search
export const usePlaceSearch = () => {
  const [results, setResults] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPlaces = useCallback(async (
    query: string,
    location?: UserLocation,
    radius?: number
  ) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, get basic search results
      const basicResults = await searchPlacesByText(query, location, radius);
      
      // Set basic results immediately for faster UI response
      setResults(basicResults);
      
      // Then enhance with photos in the background
      const enhancedResults = await enhanceRestaurantsWithPhotos(basicResults);
      
      // Update with enhanced results
      setResults(enhancedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search places');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    searchPlaces,
    clearResults,
  };
};

// Hook for location search
export const useLocationSearch = () => {
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const locations = await searchLocationsByText(query);
      setResults(locations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search locations');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    searchLocations,
    clearResults,
  };
};

// Enhanced geolocation hook with reverse geocoding
export const useEnhancedGeolocation = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAddressFromCoordinates } = useReverseGeocode();

  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };
        setLocation(newLocation);

        // Get human-readable address
        try {
          const addressResult = await getAddressFromCoordinates(latitude, longitude);
          setAddress(addressResult);
          setLocation({ ...newLocation, address: addressResult });
        } catch (err) {
          console.warn('Failed to get address for coordinates:', err);
          setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }

        setLoading(false);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [getAddressFromCoordinates]);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  return {
    location,
    address,
    loading,
    error,
    getCurrentLocation,
  };
}; 