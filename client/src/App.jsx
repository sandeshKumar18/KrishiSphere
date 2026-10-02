import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppShell from "./components/layout/AppShell.jsx";
import { useAuth } from "./context/AuthContext.jsx";

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Fields from "./pages/Fields.jsx";
import FieldDetails from "./pages/FieldDetails.jsx";
import CropCycles from "./pages/CropCycles.jsx";
import CropCycleDashboard from "./pages/CropCycleDashboard.jsx";
import Market from "./pages/Market.jsx";
import AIAdvice from "./pages/AIAdvice.jsx";
import Settings from "./pages/Settings.jsx";
import CropCatalog from "./pages/CropCatalog.jsx";
import GovernmentSchemes from "./pages/GovernmentSchemes.jsx";
import Guidance from "./pages/Guidance.jsx";

const ProtectedRoute = ({
  children,
}) => {
  const { user, loading } =
    useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return (
    <AppShell>
      {children}
    </AppShell>
  );
};

const App = () => (
  <BrowserRouter>
    <Routes>

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/signup"
        element={<Signup />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/fields"
        element={
          <ProtectedRoute>
            <Fields />
          </ProtectedRoute>
        }
      />

      <Route
        path="/fields/:fieldId"
        element={
          <ProtectedRoute>
            <FieldDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/crop-cycles"
        element={
          <ProtectedRoute>
            <CropCycles />
          </ProtectedRoute>
        }
      />

      <Route
        path="/crop-cycles/:cropCycleId"
        element={
          <ProtectedRoute>
            <CropCycleDashboard />
          </ProtectedRoute>
        }
      />


      <Route
        path="/market"
        element={
          <ProtectedRoute>
            <Market />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai-advice"
        element={
          <ProtectedRoute>
              <AIAdvice />
          </ProtectedRoute>
        }
      />


      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/guidance"
        element={
          <ProtectedRoute>
            <Guidance />
          </ProtectedRoute>
        }
      />


      <Route
        path="/crops"
        element={
          <ProtectedRoute>
            <CropCatalog />
          </ProtectedRoute>
        }
      />
      <Route
        path="/government-schemes"
        element={
            <ProtectedRoute>
              <GovernmentSchemes />
            </ProtectedRoute>
            }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  </BrowserRouter>
);

export default App;