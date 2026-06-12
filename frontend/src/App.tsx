import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<div>Landing Page</div>} />
          <Route path="/setup" element={<div>Brand Setup</div>} />
          <Route path="/workspace" element={<div>Workspace Overview</div>} />
          <Route path="/workspace/strategist" element={<div>AI Strategist</div>} />
          <Route path="/workspace/campaigns" element={<div>Campaigns</div>} />
          <Route path="/workspace/campaigns/:id" element={<div>Campaign Details</div>} />
          <Route path="/workspace/analytics" element={<div>Analytics</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
