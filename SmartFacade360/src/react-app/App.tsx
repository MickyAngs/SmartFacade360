import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from '@getmocha/users-service/react';
import SmartFacade360 from "@/react-app/pages/SmartFacade360";
import ARStudioPage from "@/react-app/pages/ARStudioPage";
import BuildingDashboard from "@/react-app/pages/BuildingDashboard";
import CalibrationDashboard from "@/react-app/pages/CalibrationDashboard";
import DigitalTwinDashboard from "@/react-app/pages/DigitalTwinDashboard";
import DiagnosticAnalysis from "@/react-app/pages/DiagnosticAnalysis";
import SustainabilityDashboard from "@/react-app/pages/SustainabilityDashboard";
import AuthCallbackPage from "@/react-app/pages/AuthCallbackPage";
import ErrorBoundary from "@/react-app/components/ErrorBoundary";
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SmartFacade360 />} />
          <Route path="/ar-studio" element={<ARStudioPage />} />
          <Route path="/calibration" element={<CalibrationDashboard />} />
          <Route path="/dashboard/:buildingId" element={
            <ErrorBoundary>
              <BuildingDashboard />
            </ErrorBoundary>
          } />
          <Route path="/digital-twin" element={<DigitalTwinDashboard />} />
          <Route path="/diagnostic" element={<DiagnosticAnalysis />} />
          <Route path="/sustainability" element={<SustainabilityDashboard />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
