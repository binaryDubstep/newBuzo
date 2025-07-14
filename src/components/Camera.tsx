
import React, { useState, useRef, useCallback } from 'react';
import { Camera as CameraIcon, FlipHorizontal, Download, X, Check } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

const Camera: React.FC = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { location, loading: locationLoading, error: locationError } = useGeolocation();

  const startCamera = useCallback(async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera. Please check permissions.');
      setIsCapturing(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
    stopCamera();
    toast.success('Photo captured successfully!');
  }, [stopCamera]);

  const flipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (isCapturing) {
      stopCamera();
      setTimeout(startCamera, 100);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setCaption('');
    startCamera();
  };

  const savePhoto = () => {
    if (!capturedImage) return;

    // Create a new post object (in a real app, this would save to a database)
    const newPost = {
      id: Date.now().toString(),
      image: capturedImage,
      caption: caption || 'New post from newBuzo Camera!',
      location: location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Unknown location',
      coordinates: location ? { lat: location.lat, lng: location.lng } : { lat: 0, lng: 0 },
      timestamp: new Date().toISOString(),
      username: 'you',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
    };

    console.log('New post created:', newPost);
    toast.success('Photo saved to feed!');
    
    // Reset state
    setCapturedImage(null);
    setCaption('');
  };

  const downloadPhoto = () => {
    if (!capturedImage) return;

    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `newbuzo-${Date.now()}.jpg`;
    link.click();
    toast.success('Photo downloaded!');
  };

  return (
    <div className="flex flex-col h-full pb-20">
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-border p-4 z-10">
        <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Camera
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Capture and share your moments
        </p>
      </div>

      <div className="flex-1 p-4">
        {locationError && (
          <Alert className="mb-4">
            <AlertDescription>
              {locationError} Location data won't be added to your photos.
            </AlertDescription>
          </Alert>
        )}

        {!capturedImage ? (
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative bg-black aspect-square rounded-lg overflow-hidden">
                  {isCapturing ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-white">
                        <CameraIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-sm opacity-75">Tap to start camera</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-center space-x-4">
              {!isCapturing ? (
                <Button onClick={startCamera} size="lg" className="flex-1">
                  <CameraIcon className="h-5 w-5 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <>
                  <Button onClick={flipCamera} variant="outline" size="lg">
                    <FlipHorizontal className="h-5 w-5" />
                  </Button>
                  <Button onClick={capturePhoto} size="lg" className="flex-1">
                    Capture
                  </Button>
                  <Button onClick={stopCamera} variant="outline" size="lg">
                    <X className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full aspect-square object-cover"
                />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div>
                <Label htmlFor="caption">Caption</Label>
                <Input
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  className="mt-1"
                />
              </div>

              {location && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-xs text-muted-foreground">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                </div>
              )}

              <div className="flex space-x-2">
                <Button onClick={retakePhoto} variant="outline" className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button onClick={downloadPhoto} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={savePhoto} className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  Save to Feed
                </Button>
              </div>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default Camera;
