
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Phone, Globe, Clock, Star, MapPin, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RestaurantDetails } from '@/types';
import { usePlaceDetails } from '@/hooks/useGoogleMaps';
import { getPlacePhotoUrl } from '@/lib/googleMaps';

interface RestaurantDetailProps {
  place_id: string;
  onBack: () => void;
}

const RestaurantDetail: React.FC<RestaurantDetailProps> = ({ place_id, onBack }) => {
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null);
  const { fetchPlaceDetails, loading, error } = usePlaceDetails();

  useEffect(() => {
    const loadRestaurantDetails = async () => {
      try {
        const data = await fetchPlaceDetails(place_id);
        setRestaurant(data);
      } catch (err) {
        console.error('Error loading restaurant details:', err);
      }
    };

    loadRestaurantDetails();
  }, [place_id, fetchPlaceDetails]);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center p-4 border-b">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Restaurant Details</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">Loading restaurant details...</span>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center p-4 border-b">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Restaurant Details</h1>
        </div>
        <div className="p-4">
          <Alert>
            <AlertDescription>
              {error || 'Restaurant details not available'}
              {error && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Make sure Google Maps API is configured correctly with Places API enabled.
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="flex flex-col h-full pb-20">
      <div className="flex items-center p-4 border-b bg-white/95 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold truncate">{restaurant.name}</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{restaurant.name}</span>
                <Badge variant={restaurant.opening_hours?.open_now ? 'default' : 'secondary'}>
                  {restaurant.opening_hours?.open_now ? 'Open' : 'Closed'}
                </Badge>
              </CardTitle>
              <div className="flex items-center space-x-1">
                {renderStars(restaurant.rating)}
                <span className="ml-2 text-sm font-medium">{restaurant.rating}</span>
              </div>
            </CardHeader>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                <span className="text-sm">{restaurant.formatted_address}</span>
              </div>
              
              {restaurant.formatted_phone_number && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`tel:${restaurant.formatted_phone_number}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {restaurant.formatted_phone_number}
                  </a>
                </div>
              )}
              
              {restaurant.website && (
                <div className="flex items-center space-x-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={restaurant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Opening Hours */}
          {restaurant.opening_hours && restaurant.opening_hours.weekday_text && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Opening Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {restaurant.opening_hours.weekday_text.map((hours, index) => (
                    <div key={index} className="text-sm">
                      {hours}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photos */}
          {restaurant.photos && restaurant.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {restaurant.photos.slice(0, 4).filter(photo => photo.photo_reference).map((photo, index) => (
                    <img
                      key={index}
                      src={getPlacePhotoUrl(photo.photo_reference, 400, 300)}
                      alt={`${restaurant.name} photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={() => {
                const url = `https://www.google.com/maps/search/?api=1&query=${restaurant.name}&query_place_id=${restaurant.place_id}`;
                window.open(url, '_blank');
              }}
              className="flex items-center space-x-2"
            >
              <MapPin className="h-4 w-4" />
              <span>Directions</span>
            </Button>
            
            {restaurant.formatted_phone_number && (
              <Button 
                variant="outline"
                onClick={() => window.open(`tel:${restaurant.formatted_phone_number}`, '_self')}
                className="flex items-center space-x-2"
              >
                <Phone className="h-4 w-4" />
                <span>Call</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;
