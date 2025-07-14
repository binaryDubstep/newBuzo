# QuantumClimb - Social Food Discovery & Location Sharing

## 🚨 2024 Update: Google Maps Place API Migration & Robustness Improvements

- **Full migration to the new Google Maps Place API**: The app now exclusively uses the new Place API for all restaurant search and details, ensuring future compatibility and compliance with Google’s deprecation of legacy PlacesService.
- **Robust feed and details handling**: Restaurant names and images are now always shown in the feed, and the details page is resilient to missing or malformed data.
- **Error handling**: Defensive checks and filtering prevent crashes from undefined or missing fields (e.g., photos, names). The UI only displays valid data, and logs are added for easier debugging.
- **.env setup required**: Ensure your `.env` file contains a valid `VITE_GOOGLE_MAPS_API_KEY` for full functionality.

A modern mobile-first React application that combines social media with location-based restaurant discovery. Share your dining experiences, discover new restaurants, and connect with fellow food enthusiasts.

## 🚀 Features

- **📱 Social Feed**: Instagram-style feed for sharing food and dining experiences
- **🎯 Restaurant Radar**: Location-based restaurant discovery with filtering and live map
- **📸 Camera Integration**: Capture and share photos with geolocation
- **🗺️ Location Services**: Real-time geolocation for restaurant recommendations
- **🏷️ Smart Filtering**: Filter restaurants by cuisine, price, and rating
- **📍 Toronto Focus**: Curated content and restaurants in the Toronto area
- **🔎 Location-First Search**: Search for locations first, then view restaurants in the selected area (Google Places API)
- **🖼️ Google Places Photo Attribution**: Restaurant images display required attributions per Google’s policy
- **🗺️ Enhanced Radar**: Interactive map with "Detect My Location" and a distance slider (50m–5000m) to filter nearby restaurants

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query + React Hook Form
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Validation**: Zod schema validation
- **Development**: ESLint + Modern TypeScript config

## 📦 Installation

### Prerequisites
- Node.js 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- npm or yarn package manager

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/QuantumClimb/fuzo.git
   cd newBuzo
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:8080`

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── Feed.tsx        # Social media feed
│   ├── RadarWithGoogleMaps.tsx # Enhanced radar with map & filters
│   ├── Camera.tsx      # Photo capture
│   └── ...
├── hooks/              # Custom React hooks
├── data/               # Mock data and constants
├── types/              # TypeScript type definitions
├── lib/                # Utility functions
└── pages/              # Page components
```

## 🎨 Components Overview

### Feed Component
- Social media style posts with images and captions
- Interactive like, comment, and share buttons
- Restaurant post integration with detailed views
- Time-based post sorting
- **Location-first search**: Search for a location, then view restaurants in that area
- **Google Places photo attribution**: Attributions shown under restaurant images

### RadarWithGoogleMaps Component
- Real-time location-based restaurant discovery
- Interactive map with "Detect My Location"
- Cuisine filtering (Steakhouse, Thai, Japanese, Canadian)
- **Distance slider**: Filter restaurants by adjustable radius (50m–5000m)
- Restaurant cards with ratings, prices, and distances
- Geolocation permission handling

### Camera Component
- Native camera access with front/back switching
- Photo capture with canvas processing
- Caption and location tagging
- Photo download functionality

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🌐 Deployment

### Git Configuration for CI/CD
This project includes a `prepare` script and config section in `package.json` to ensure all git commits use the correct identity for QuantumClimb:

```json
"scripts": {
  ...
  "prepare": "git config user.name 'Quantum Climb' && git config user.email 'quantumclimb@users.noreply.github.com'"
},
"config": {
  "gitUser": "Quantum Climb",
  "gitEmail": "quantumclimb@users.noreply.github.com"
}
```

This prevents permission and email privacy issues during deployment.

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Deploy automatically on every push

### Netlify
1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`

### Other Platforms
The app builds to static files in the `dist` directory and can be deployed to any static hosting service.

## 🔐 Environment Variables

The app requires Google Maps API integration for full functionality. Create a `.env` file in the root directory:

```env
# Required: Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Optional: Backend API URL (if using a backend service)
VITE_API_BASE_URL=https://your-api-endpoint.com

# Optional: App environment
VITE_APP_ENV=development
```

### 🗺️ **Google Maps API Setup**

1. **Get Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the following APIs:
     - Places API
     - Maps JavaScript API
     - Geocoding API
     - Maps Static API (optional)
   - Create credentials (API Key)
   - Restrict the API key (recommended for production)

2. **API Restrictions (Production):**
   ```
   Application restrictions: HTTP referrers (web sites)
   Website restrictions: Add your domain(s)
   API restrictions: Select specific APIs listed above
   ```

3. **Required Google Maps APIs:**
   - **Places API** - Restaurant search and details
   - **Geocoding API** - Address resolution
   - **Maps JavaScript API** - Interactive maps
   - **Maps Static API** - Static map images

### 📊 **Google Maps API Usage:**

- **Location-First Search**: Search for a location, then view restaurants in that area
- **Restaurant Discovery**: Real-time nearby restaurant search
- **Place Details**: Complete restaurant information (hours, photos, contact)
- **Reverse Geocoding**: Convert coordinates to readable addresses
- **Place Photos**: High-quality restaurant images with required attributions
- **Static Maps**: Location visualization

**Without API Key**: App falls back to mock data for development.

## 📱 Mobile Optimization

- Responsive design with mobile-first approach
- Touch-friendly interactions
- Bottom navigation for thumb accessibility
- PWA-ready with proper meta tags
- Optimized for various screen sizes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Unsplash](https://unsplash.com/) for placeholder images
- [Lucide](https://lucide.dev/) for the icon set
- Toronto restaurant community for inspiration
- Google Maps Platform for location and places APIs
