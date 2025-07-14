
import React, { useState } from 'react';
import { Heart, MessageCircle, Share, MapPin, Clock, Utensils, Search, X, Star, Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import RestaurantDetail from './RestaurantDetail';
import { useLocationSearch, useNearbyRestaurants } from '@/hooks/useGoogleMaps';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Restaurant, UserLocation } from '@/types';
import { LocationSearchResult } from '@/lib/googleMaps';

const Feed: React.FC = () => {
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<UserLocation | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  
  // Location detection
  const { location: currentLocation, loading: locationLoading, error: locationError, getCurrentLocation } = useGeolocation();
  
  // Use current location or selected location for restaurants
  const activeLocation = selectedLocation || currentLocation;
  const { restaurants, loading: restaurantsLoading, error: restaurantsError } = useNearbyRestaurants(activeLocation);
  
  // Location search functionality
  const { results, loading: searchLoading, error: searchError, searchLocations, clearResults } = useLocationSearch();

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant.id);
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim()) {
      setShowSearchResults(true);
      // Search for locations instead of restaurants
      searchLocations(value);
    } else {
      setShowSearchResults(false);
      clearResults();
    }
  };

  const handleLocationSelect = (location: LocationSearchResult) => {
    setSelectedLocation({
      lat: location.location.lat,
      lng: location.location.lng,
    });
    setLocationName(location.name);
    setSearchQuery('');
    setShowSearchResults(false);
    clearResults();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
    clearResults();
  };

  const handleDetectLocation = () => {
    getCurrentLocation();
    setSelectedLocation(null);
    setLocationName('');
  };

  const clearSelectedLocation = () => {
    setSelectedLocation(null);
    setLocationName('');
  };

  // Convert Restaurant to Post-like format for display
  const createPostFromRestaurant = (restaurant: Restaurant, index: number) => {
    return {
      id: restaurant.id,
      image: restaurant.image,
      caption: `Great ${restaurant.cuisine} spot with ${restaurant.rating} stars! Perfect for a delicious meal.`,
      location: restaurant.address,
      coordinates: restaurant.coordinates,
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(), // Random time within last 24h
      username: 'FoodieBot',
      avatar: '/placeholder.svg',
      type: 'restaurant' as const,
      place_id: restaurant.id,
      rating: restaurant.rating,
      cuisine: restaurant.cuisine,
      distance: restaurant.distance,
    };
  };

  // Filter restaurants to only those with a valid name and image
  const validRestaurants = restaurants.filter((restaurant) => {
    const hasValidName = typeof restaurant.name === 'string' && restaurant.name.trim().length > 0;
    const hasValidImage = typeof restaurant.image === 'string' && restaurant.image.trim().length > 0 && !restaurant.image.includes('placeholder');
    if (!hasValidName || !hasValidImage) {
      // Optional: log skipped restaurants for debugging
      // console.warn('Skipping invalid restaurant:', restaurant);
    }
    return hasValidName && hasValidImage;
  });

  if (selectedRestaurant) {
    return (
      <RestaurantDetail 
        place_id={selectedRestaurant}
        onBack={() => setSelectedRestaurant(null)}
      />
    );
  }

  return (
    <div className="flex flex-col space-y-4 pb-20">
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-border p-4 z-10">
        <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          newBuzo
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          {activeLocation ? `${restaurants.length} restaurants found${locationName ? ` in ${locationName}` : ' nearby'}` : 'Search for a location to discover restaurants'}
        </p>
        
        {/* Selected Location Display */}
        {selectedLocation && locationName && (
          <div className="mt-2 flex items-center justify-center space-x-2">
            <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">{locationName}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelectedLocation}
                className="h-4 w-4 p-0 hover:bg-blue-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Location Detection Button */}
        <div className="mt-4 flex justify-center">
          <Button
            onClick={handleDetectLocation}
            disabled={locationLoading}
            className="flex items-center space-x-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
          >
            <Navigation className={`h-4 w-4 ${locationLoading ? 'animate-spin' : ''}`} />
            <span>
              {locationLoading ? 'Detecting Location...' : 'DETECT MY LOCATION'}
            </span>
          </Button>
        </div>
        
        {/* Search Section */}
        <div className="mt-4 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search for a location (city, address, place)..."
              value={searchQuery}
              onChange={handleSearchInput}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Location Search Results */}
          {showSearchResults && (
            <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto z-50 border shadow-lg">
              <CardContent className="p-0">
                {searchLoading && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Searching locations...</span>
                    </div>
                  </div>
                )}
                
                {searchError && (
                  <div className="p-4 text-center text-sm text-red-500">
                    <p>Error: {searchError}</p>
                    <p className="text-xs mt-1">Check if Google Maps API is configured correctly</p>
                  </div>
                )}
                
                {!searchLoading && !searchError && results.length === 0 && searchQuery && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No locations found for "{searchQuery}"
                  </div>
                )}
                
                {results.map((location) => (
                  <div
                    key={location.place_id}
                    className="p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleLocationSelect(location)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{location.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {location.formatted_address}
                        </p>
                        <div className="flex items-center space-x-1 mt-2">
                          {location.types.slice(0, 2).map((type) => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Location Error */}
        {locationError && (
          <Alert className="mt-4">
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Content */}
      <div className="px-4">
        {/* Loading State */}
        {restaurantsLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading restaurants...</span>
          </div>
        )}

        {/* Error State */}
        {restaurantsError && (
          <Alert>
            <AlertDescription>{restaurantsError}</AlertDescription>
          </Alert>
        )}

        {/* No Location Selected */}
        {!activeLocation && !locationLoading && (
          <div className="text-center py-8 space-y-4">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <MapPin className="h-12 w-12 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Find Great Restaurants</h3>
              <p className="text-sm text-gray-600 mt-1">
                Search for a location or detect your current location to discover amazing restaurants nearby
              </p>
            </div>
          </div>
        )}

        {/* Restaurants Feed */}
        {activeLocation && validRestaurants.length > 0 && (
          <div className="space-y-6">
            {validRestaurants.map((restaurant, index) => {
              const post = createPostFromRestaurant(restaurant, index);
              return (
                <Card key={restaurant.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header */}
                    <div className="p-4 pb-2">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={post.avatar} alt={post.username} />
                          <AvatarFallback>{post.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm">{post.username}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{formatTimeAgo(post.timestamp)}</span>
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground truncate">{post.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Image */}
                    <div 
                      className="relative aspect-square cursor-pointer"
                      onClick={() => handleRestaurantClick(restaurant)}
                    >
                      <img
                        src={post.image}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {/* Photo Attributions */}
                      {restaurant.photoAttributions && restaurant.photoAttributions.length > 0 && (
                        <div className="absolute bottom-1 left-4 right-4 flex flex-wrap items-center gap-2 text-[10px] text-white/80 z-10">
                          {restaurant.photoAttributions.map((attr, idx) => (
                            <span key={idx}>
                              Photo by{' '}
                              {attr.uri ? (
                                <a href={attr.uri.startsWith('http') ? attr.uri : `https:${attr.uri}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
                                  {attr.displayName || 'Contributor'}
                                </a>
                              ) : (
                                attr.displayName || 'Contributor'
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-white font-bold text-lg">{restaurant.name}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
                                {post.cuisine}
                              </Badge>
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-white text-sm font-medium">{post.rating.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white text-sm font-medium">{post.distance.toFixed(1)} km</div>
                            <div className="text-white/80 text-xs">away</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 pt-2">
                      <div className="flex items-center space-x-4 mb-2">
                        <Button variant="ghost" size="sm" className="flex items-center space-x-1 p-0">
                          <Heart className="h-4 w-4" />
                          <span className="text-sm">{Math.floor(Math.random() * 100) + 10}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="flex items-center space-x-1 p-0">
                          <MessageCircle className="h-4 w-4" />
                          <span className="text-sm">{Math.floor(Math.random() * 20) + 1}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="flex items-center space-x-1 p-0">
                          <Share className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold">{post.username}</span>
                        <span className="ml-2">{post.caption}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* No Restaurants Found */}
        {activeLocation && validRestaurants.length === 0 && !restaurantsLoading && (
          <div className="text-center py-8 space-y-4">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Utensils className="h-12 w-12 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No Restaurants Found</h3>
              <p className="text-sm text-gray-600 mt-1">
                Try searching for a different location or expand your search area
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
