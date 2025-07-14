import React, { useState } from 'react';
import { Star, MapPin, DollarSign, Clock, Wifi, WifiOff } from 'lucide-react';
import { mockRestaurants } from '@/data/mockData';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useNearbyRestaurants } from '@/hooks/useGoogleMaps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { getStaticMapUrl } from '@/lib/googleMaps';
import { Slider } from '@/components/ui/slider';

/**
 * Example component showing Google Maps API integration
 * This demonstrates how to switch between mock data and real Google Maps data
 */
const RadarWithGoogleMaps: React.FC = () => {
  const { location, loading: locationLoading, error: locationError, getCurrentLocation } = useGeolocation();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [useGoogleMaps, setUseGoogleMaps] = useState(false);
  const [distance, setDistance] = useState(2000); // default 2km
  
  // Google Maps API integration
  const { 
    restaurants: googleRestaurants, 
    loading: googleLoading, 
    error: googleError,
    searchWithFilters
  } = useNearbyRestaurants(useGoogleMaps ? location : null);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'steakhouse', label: 'Steakhouse' },
    { id: 'thai', label: 'Thai' },
    { id: 'japanese', label: 'Japanese' },
    { id: 'canadian', label: 'Canadian' },
  ];

  const getPriceLevel = (level: number) => {
    return '$'.repeat(level);
  };

  // Choose data source based on Google Maps toggle
  const restaurants = useGoogleMaps ? googleRestaurants : mockRestaurants;
  const loading = useGoogleMaps ? googleLoading : false;
  const dataError = useGoogleMaps ? googleError : null;

  // Filter restaurants based on selected cuisine and distance
  const filteredRestaurants = restaurants.filter(restaurant => {
    if (selectedFilter !== 'all' && !restaurant.cuisine.toLowerCase().includes(selectedFilter.toLowerCase())) {
      return false;
    }
    return restaurant.distance <= distance / 1000; // restaurant.distance is in km
  });

  // Handle cuisine-specific search for Google Maps
  const handleFilterChange = async (filterId: string) => {
    setSelectedFilter(filterId);
    
    if (useGoogleMaps && location && filterId !== 'all') {
      // Use Google Maps text search for specific cuisines
      try {
        await searchWithFilters(location, 2000, filterId);
      } catch (error) {
        console.error('Failed to filter restaurants:', error);
      }
    }
  };

  return (
    <div className="flex flex-col h-full pb-20">
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-border p-4 z-10">
        <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Radar (Demo)
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Restaurant discovery with Google Maps integration
        </p>
        
        {/* Google Maps Toggle */}
        <div className="flex items-center justify-center space-x-2 mt-3">
          <WifiOff className="h-4 w-4 text-muted-foreground" />
          <Switch 
            checked={useGoogleMaps}
            onCheckedChange={setUseGoogleMaps}
            disabled={!location}
          />
          <Wifi className="h-4 w-4 text-green-600" />
          <span className="text-xs text-muted-foreground">
            {useGoogleMaps ? 'Google Maps API' : 'Mock Data'}
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* Location Error */}
        {locationError && (
          <Alert className="mb-4">
            <MapPin className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{locationError}</span>
              <Button onClick={getCurrentLocation} size="sm" variant="outline">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Google Maps API Error */}
        {useGoogleMaps && dataError && (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>
              Google Maps API Error: {dataError}
              <br />
              <span className="text-xs">Falling back to mock data...</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {(locationLoading || loading) && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">
              {locationLoading 
                ? 'Getting your location...' 
                : 'Loading restaurants from Google Maps...'
              }
            </span>
          </div>
        )}

        {/* User Location Display */}
        {location && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm font-medium">
                  Your location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </span>
              </div>
              <Badge variant={useGoogleMaps ? 'default' : 'secondary'}>
                {useGoogleMaps ? 'Live' : 'Demo'}
              </Badge>
            </div>
            {location.address && useGoogleMaps && (
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                {location.address}
              </p>
            )}
          </div>
        )}

        {/* Add Detect My Location button at the top, after the title/description */}
        <div className="flex justify-center mt-4">
          <Button
            onClick={getCurrentLocation}
            disabled={locationLoading}
            className="flex items-center space-x-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
          >
            <MapPin className={`h-4 w-4 ${locationLoading ? 'animate-spin' : ''}`} />
            <span>{locationLoading ? 'Detecting Location...' : 'DETECT MY LOCATION'}</span>
          </Button>
        </div>

        {/* Cuisine Filters */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Filter by cuisine:</span>
            <Badge variant="outline" className="text-xs">
              {filteredRestaurants.length} results
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Badge
                key={filter.id}
                variant={selectedFilter === filter.id ? 'default' : 'secondary'}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => handleFilterChange(filter.id)}
              >
                {filter.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Add slider above cuisine filters */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Distance: {distance}m</span>
            <span className="text-xs text-muted-foreground">Showing restaurants within {distance} meters</span>
          </div>
          <Slider
            min={50}
            max={5000}
            step={50}
            value={[distance]}
            onValueChange={([val]) => setDistance(val)}
            className="w-full mb-2"
          />
        </div>

        {/* After cuisine filters and before Data Source Indicator, show map if location and restaurants exist */}
        {useGoogleMaps && location && filteredRestaurants.length > 0 && (
          <div className="mb-6 flex flex-col items-center">
            <img
              src={getStaticMapUrl(
                location,
                14,
                600,
                300,
                [
                  { lat: location.lat, lng: location.lng, label: 'U' },
                  ...filteredRestaurants.map((r, i) => ({ lat: r.coordinates.lat, lng: r.coordinates.lng, label: String.fromCharCode(65 + (i % 26)) }))
                ]
              )}
              alt="Map with restaurants"
              className="rounded-lg border shadow"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            <div className="text-xs text-muted-foreground mt-1">Map: U = You, A-Z = Restaurants</div>
          </div>
        )}

        {/* Data Source Indicator */}
        <div className="mb-4 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">
                Data Source: {useGoogleMaps ? 'Google Maps Places API' : 'Mock Data'}
              </p>
              <p className="text-xs text-blue-600">
                {useGoogleMaps 
                  ? 'Real-time restaurant data with live ratings and photos'
                  : 'Sample Toronto restaurants for development'
                }
              </p>
            </div>
            <div className="text-2xl">
              {useGoogleMaps ? '🌐' : '📱'}
            </div>
          </div>
        </div>

        {/* Restaurant List */}
        <div className="space-y-4">
          {filteredRestaurants.map((restaurant) => (
            <Card key={restaurant.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <div className="flex">
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-24 h-24 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                <div className="flex-1">
                  <CardHeader className="p-3 pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-semibold leading-tight">
                        {restaurant.name}
                        {useGoogleMaps && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Live
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center space-x-1 text-sm">
                        <Clock className="h-3 w-3" />
                        <span>{restaurant.distance.toFixed(1)}km</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-3 pt-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium ml-1">{restaurant.rating}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {restaurant.cuisine}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        <span>{getPriceLevel(restaurant.priceLevel)}</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {restaurant.address}
                    </p>
                  </CardContent>
                </div>
              </div>
              {/* In the restaurant list, after the <img> in each card, show attributions if present */}
              {restaurant.photoAttributions && restaurant.photoAttributions.length > 0 && (
                <div className="text-[10px] text-muted-foreground mt-1">
                  {restaurant.photoAttributions.map((attr, idx) => (
                    <span key={idx}>
                      Photo by{' '}
                      {attr.uri ? (
                        <a href={attr.uri.startsWith('http') ? attr.uri : `https:${attr.uri}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
                          {attr.displayName || 'Contributor'}
                        </a>
                      ) : (
                        attr.displayName || 'Contributor'
                      )}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredRestaurants.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No restaurants found for "{filters.find(f => f.id === selectedFilter)?.label}"
            </p>
            <Button 
              variant="outline" 
              onClick={() => handleFilterChange('all')}
              className="mt-2"
            >
              Show All Restaurants
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RadarWithGoogleMaps; 