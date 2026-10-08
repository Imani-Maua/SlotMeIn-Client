import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast/Toast';
import { JobProvider } from './context/JobContext';
import AppLayout from './components/Layout/AppLayout';
import Login from './pages/Login/Login';
import AcceptInvite from './pages/AcceptInvite/AcceptInvite';
import Dashboard from './pages/Dashboard/Dashboard';
import Talents from './pages/Talents/Talents';
import ShiftConfig from './pages/ShiftConfig/ShiftConfig';
import Schedule from './pages/Schedule/Schedule';
import Users from './pages/Users/Users';
import Constraints from './pages/Constraints/Constraints';
import StaffingConfig from './pages/StaffingConfig/StaffingConfig';

function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function SuperuserRoute({ children }) {
    const { role } = useAuth();
    return role === 'superuser' ? children : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/accept-invite" element={<AcceptInvite />} />

            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/talents" element={<Talents />} />
                <Route path="/shifts" element={<ShiftConfig />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/constraints" element={<Constraints />} />
                <Route path="/staffing" element={<StaffingConfig />} />
                <Route path="/admin/users" element={<SuperuserRoute><Users /></SuperuserRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <JobProvider>
                        <AppRoutes />
                    </JobProvider>
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
