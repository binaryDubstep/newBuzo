
import React, { useState } from 'react';
import BottomNavigation from '@/components/BottomNavigation';
import Feed from '@/components/Feed';
import RadarWithGoogleMaps from '@/components/RadarWithGoogleMaps';
import Camera from '@/components/Camera';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'radar' | 'camera'>('feed');

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'feed':
        return <Feed />;
      case 'radar':
        return <RadarWithGoogleMaps />;
      case 'camera':
        return <Camera />;
      default:
        return <Feed />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto bg-white min-h-screen relative">
        {renderActiveComponent()}
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;
