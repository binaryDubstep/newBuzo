# Google Maps API Integration Guide

This document outlines where and how Google Maps API integration replaces mock data in the newBuzo app.

## 🗺️ **Current Mock Data vs Google Maps API**

### **Files Created for Google Maps Integration:**

1. **`src/lib/googleMaps.ts`** - Core Google Maps API service layer
2. **`src/hooks/useGoogleMaps.ts`** - React hooks for Google Maps functionality

## 📍 **Integration Points**

### **1. Restaurant Discovery (Radar Component)**
**File**: `src/components/Radar.tsx`

**Current**: Uses `mockRestaurants` from `src/data/mockData.ts`
**Replace with**: Google Places Nearby Search API

```typescript
// BEFORE (Mock Data)
import { mockRestaurants } from '@/data/mockData';
const filteredRestaurants = mockRestaurants.filter(restaurant => {
  if (selectedFilter === 'all') return true;
  return restaurant.cuisine.toLowerCase().includes(selectedFilter.toLowerCase());
});

// AFTER (Google Maps API)
import { useNearbyRestaurants } from '@/hooks/useGoogleMaps';
const { restaurants, loading, error, searchWithFilters } = useNearbyRestaurants(location);
```

**Integration Steps:**
1. Replace `mockRestaurants` import with `useNearbyRestaurants` hook
2. Handle loading and error states
3. Implement real-time filtering by cuisine type
4. Add radius-based search options

### **2. Restaurant Details (RestaurantDetail Component)**
**File**: `src/components/RestaurantDetail.tsx`

**Current**: Uses mock `fetchRestaurantDetails` function
**Replace with**: Google Places Details API

```typescript
// BEFORE (Mock Data)
const fetchRestaurantDetails = async (place_id: string): Promise<RestaurantDetails> => {
  const mockData: Record<string, RestaurantDetails> = { /* mock data */ };
  return mockData[place_id];
};

// AFTER (Google Maps API)
import { usePlaceDetails } from '@/hooks/useGoogleMaps';
const { fetchPlaceDetails, loading, error } = usePlaceDetails();
```

**Integration Steps:**
1. Replace mock function with `usePlaceDetails` hook
2. Handle API errors and loading states
3. Display real restaurant photos using `getPlacePhotoUrl`
4. Show actual opening hours and contact information

### **3. Location Services (Multiple Components)**
**Files**: `src/hooks/useGeolocation.ts`, `src/components/Camera.tsx`, `src/components/Radar.tsx`

**Current**: Shows raw coordinates
**Replace with**: Google Geocoding API for human-readable addresses

```typescript
// BEFORE (Raw Coordinates)
location: location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Unknown location'

// AFTER (Human-Readable Address)
import { useReverseGeocode } from '@/hooks/useGoogleMaps';
const { getAddressFromCoordinates } = useReverseGeocode();
const address = await getAddressFromCoordinates(lat, lng);
```

### **4. Social Feed Posts (Feed Component)**
**File**: `src/components/Feed.tsx`

**Current**: Uses `mockPosts` with static `place_id` references
**Integration**: Enhance with real place data

```typescript
// Enhanced post creation with Google Places data
const handlePostClick = async (post: Post) => {
  if (post.type === 'restaurant' && post.place_id) {
    // Fetch real-time restaurant details
    const details = await fetchPlaceDetails(post.place_id);
    setSelectedRestaurant(details);
  }
};
```

### **5. Photo Capture (Camera Component)**
**File**: `src/components/Camera.tsx`

**Current**: Saves coordinates only
**Enhancement**: Add reverse geocoding for location names

```typescript
// BEFORE
location: location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Unknown location'

// AFTER  
import { useReverseGeocode } from '@/hooks/useGoogleMaps';
const address = await getAddressFromCoordinates(location.lat, location.lng);
const newPost = {
  // ... other fields
  location: address,
  coordinates: { lat: location.lat, lng: location.lng }
};
```

## 🔧 **Implementation Priority**

### **Phase 1: Core Restaurant Data**
1. ✅ **Created**: Google Maps API service layer (`src/lib/googleMaps.ts`)
2. ✅ **Created**: React hooks (`src/hooks/useGoogleMaps.ts`)
3. **TODO**: Update Radar component to use `useNearbyRestaurants`
4. **TODO**: Update RestaurantDetail component to use `usePlaceDetails`

### **Phase 2: Enhanced Location Services**
5. **TODO**: Replace geolocation hook with `useEnhancedGeolocation`
6. **TODO**: Add reverse geocoding to Camera component
7. **TODO**: Implement real-time address resolution

### **Phase 3: Advanced Features**
8. **TODO**: Add text-based restaurant search
9. **TODO**: Implement static map displays
10. **TODO**: Add directions integration

## 📊 **API Usage Mapping**

| Component | Current Data Source | Google Maps API | Hook to Use |
|-----------|-------------------|-----------------|-------------|
| **Radar** | `mockRestaurants` | Places Nearby Search | `useNearbyRestaurants` |
| **RestaurantDetail** | Mock function | Places Details | `usePlaceDetails` |
| **Camera** | Raw coordinates | Reverse Geocoding | `useReverseGeocode` |
| **Feed** | Mock posts | Places Details | `usePlaceDetails` |
| **Geolocation** | Basic coordinates | Enhanced with addresses | `useEnhancedGeolocation` |

## 🔑 **Required Google Maps APIs**

1. **Places API**
   - **Nearby Search**: Find restaurants near user location
   - **Place Details**: Get comprehensive restaurant information
   - **Place Photos**: Restaurant images
   - **Text Search**: Search by restaurant name/cuisine

2. **Geocoding API**
   - **Reverse Geocoding**: Convert coordinates to addresses
   - **Forward Geocoding**: Convert addresses to coordinates (future use)

3. **Maps Static API** (Optional)
   - **Static Maps**: Display location thumbnails
   - **Street View**: Restaurant exterior views (future feature)

## 🚀 **Next Steps for Implementation**

1. **Set up Google Cloud Project** and enable required APIs
2. **Add API key** to environment variables
3. **Update Radar component** to use real restaurant data
4. **Update RestaurantDetail** to show actual place information
5. **Enhance geolocation** with address resolution
6. **Test API quotas** and implement caching strategies
7. **Add error handling** for API failures
8. **Implement fallback** to mock data when API is unavailable

## 💰 **Cost Considerations**

**Google Maps API Pricing** (as of 2024):
- **Places Nearby Search**: $32/1000 requests
- **Place Details**: $17/1000 requests  
- **Geocoding**: $5/1000 requests
- **Place Photos**: $7/1000 requests

**Cost Optimization Strategies**:
1. **Caching**: Store API responses locally
2. **Debouncing**: Limit search frequency
3. **Selective Fields**: Only request needed data
4. **User Location**: Cache user location to reduce requests
5. **Image Optimization**: Cache restaurant photos

## 🔍 **Testing Strategy**

1. **Development**: Use mock data when API key is not available
2. **Staging**: Use restricted API key with development domains
3. **Production**: Use production API key with proper restrictions
4. **Fallback**: Gracefully handle API failures with cached/mock data

## 📱 **Mobile Considerations**

1. **Network**: Handle offline scenarios
2. **Performance**: Implement request debouncing
3. **User Experience**: Show loading states
4. **Data Usage**: Optimize API calls for mobile users
5. **Permissions**: Handle location permission gracefully 