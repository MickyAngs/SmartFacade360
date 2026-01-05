import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from '@getmocha/users-service/react';
import SmartFacade360 from "@/react-app/pages/SmartFacade360";
import ARStudioPage from "@/react-app/pages/ARStudioPage";
import AuthCallbackPage from "@/react-app/pages/AuthCallbackPage";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SmartFacade360 />} />
          <Route path="/ar-studio" element={<ARStudioPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
