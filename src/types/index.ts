export interface Post {
  id: string;
  image: string;
  caption: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  username: string;
  avatar: string;
  type?: 'user' | 'restaurant';
  place_id?: string;
}

export interface PhotoAttribution {
  displayName?: string;
  uri?: string;
  photoUri?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  rating: number;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  cuisine: string;
  priceLevel: number;
  image: string;
  distance: number;
  photoAttributions?: PhotoAttribution[];
}

export interface UserLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface RestaurantDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating: number;
  photos?: Array<{
    photo_reference: string;
    width: number;
    height: number;
    attributions?: PhotoAttribution[];
  }>;
  opening_hours?: {
    weekday_text?: string[];
    open_now: boolean;
  };
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}
