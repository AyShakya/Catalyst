import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import LandingPage from './pages/LandingPage';
import BrandSetupPage from './pages/BrandSetupPage';
import WorkspaceLayout from './components/layout/WorkspaceLayout';
import OverviewPage from './pages/OverviewPage';
import StrategistPage from './pages/StrategistPage';
import CampaignsPage from './pages/CampaignsPage';
import CampaignDetailsPage from './pages/CampaignDetailsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/setup" element={<BrandSetupPage />} />
          
          <Route path="/workspace" element={<WorkspaceLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="strategist" element={<StrategistPage />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="campaigns/:id" element={<CampaignDetailsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
