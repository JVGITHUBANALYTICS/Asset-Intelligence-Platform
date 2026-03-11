import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Assets from '../pages/Users';
import HealthModels from '../pages/HealthModels';
import WorkQueue from '../pages/WorkQueue';
import ReplacementPlanning from '../pages/ReplacementPlanning';
import Analytics from '../pages/Analytics';
import Reports from '../pages/Reports';
import InspectionResults from '../pages/InspectionResults';
import DGATestResults from '../pages/DGATestResults';
import MaintenanceHistory from '../pages/MaintenanceHistory';
import DataIngestion from '../pages/DataIngestion';
import Settings from '../pages/Settings';
import Profile from '../pages/Profile';
import NotFound from '../pages/NotFound';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-900 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading Asset Intelligence Platform...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-900 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading Asset Intelligence Platform...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="assets" element={<Assets />} />
        <Route path="inspections" element={<InspectionResults />} />
        <Route path="dga-tests" element={<DGATestResults />} />
        <Route path="maintenance" element={<MaintenanceHistory />} />
        <Route path="health-models" element={<HealthModels />} />
        <Route path="work-queue" element={<WorkQueue />} />
        <Route path="replacement" element={<ReplacementPlanning />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="reports" element={<Reports />} />
        <Route path="data-upload" element={<DataIngestion />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
