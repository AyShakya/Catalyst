import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import WorkspaceLayout from './components/layout/WorkspaceLayout';
import { Skeleton } from './components/layout/Skeleton';
import './styles/App.css';

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
      <div className="app-container">
        <Navbar />
        <Suspense fallback={
          <div className="flex items-center justify-center h-[80vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/setup" element={<BrandSetupPage />} />

            <Route path="/workspace" element={<WorkspaceLayout />}>
              <Route path="overview" element={<OverviewPage />} />
              <Route path="strategist" element={<StrategistPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="campaigns/:id" element={<CampaignDetailsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
            </Route>
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}


export default App;
