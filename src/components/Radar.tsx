
import React, { useState } from 'react';
import { Star, MapPin, DollarSign, Clock } from 'lucide-react';
import { mockRestaurants } from '@/data/mockData';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Radar: React.FC = () => {
  const { location, loading, error, getCurrentLocation } = useGeolocation();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

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

  const filteredRestaurants = mockRestaurants.filter(restaurant => {
    if (selectedFilter === 'all') return true;
    return restaurant.cuisine.toLowerCase().includes(selectedFilter.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full pb-20">
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-border p-4 z-10">
        <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Radar
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Discover nearby restaurants
        </p>
      </div>

      <div className="p-4">
        {error && (
          <Alert className="mb-4">
            <MapPin className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button onClick={getCurrentLocation} size="sm" variant="outline">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Getting your location...</span>
          </div>
        )}

        {location && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-primary mr-2" />
              <span className="text-sm font-medium">
                Your location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </span>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Badge
                key={filter.id}
                variant={selectedFilter === filter.id ? 'default' : 'secondary'}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSelectedFilter(filter.id)}
              >
                {filter.label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredRestaurants.map((restaurant) => (
            <Card key={restaurant.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <div className="flex">
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-24 h-24 object-cover"
                />
                <div className="flex-1">
                  <CardHeader className="p-3 pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-semibold leading-tight">
                        {restaurant.name}
                      </CardTitle>
                      <div className="flex items-center space-x-1 text-sm">
                        <Clock className="h-3 w-3" />
                        <span>{restaurant.distance}km</span>
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
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Radar;
