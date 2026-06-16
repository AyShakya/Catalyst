import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import WorkspaceLayout from './components/layout/WorkspaceLayout';
import BackgroundEffect from './components/layout/BackgroundEffect';
import { Skeleton } from './components/layout/Skeleton';
import './styles/App.css';

import { WorkspaceProvider } from './context/WorkspaceContext';

// Lazy load pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const BrandSetupPage = lazy(() => import('./pages/BrandSetupPage'));
const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const StrategistPage = lazy(() => import('./pages/StrategistPage'));
const CampaignsPage = lazy(() => import('./pages/CampaignsPage'));
const CampaignDetailsPage = lazy(() => import('./pages/CampaignDetailsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

function App() {
  return (
    <Router>
      <WorkspaceProvider>
        <div className="app-container relative min-h-screen">
          <BackgroundEffect />
          <div className="relative z-10">
            <Navbar />
            <Suspense fallback={
              <div className="flex items-center justify-center h-[80vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/setup" element={<BrandSetupPage />} />

                {/* Brand-specific workspace routes */}
                <Route path="/workspace/:brandId" element={<WorkspaceLayout />}>
                  <Route index element={<OverviewPage />} />
                  <Route path="overview" element={<OverviewPage />} />
                  <Route path="strategist" element={<StrategistPage />} />
                  <Route path="campaigns" element={<CampaignsPage />} />
                  <Route path="campaigns/:id" element={<CampaignDetailsPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                </Route>

                {/* Fallback legacy routes without brandId */}
                <Route path="/workspace" element={<WorkspaceLayout />}>
                  <Route index element={<OverviewPage />} />
                  <Route path="overview" element={<OverviewPage />} />
                  <Route path="strategist" element={<StrategistPage />} />
                  <Route path="campaigns" element={<CampaignsPage />} />
                  <Route path="campaigns/:id" element={<CampaignDetailsPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                </Route>
              </Routes>
            </Suspense>
          </div>
        </div>
      </WorkspaceProvider>
    </Router>
  );
}


export default App;
