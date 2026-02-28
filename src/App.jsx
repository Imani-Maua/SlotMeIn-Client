import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast/Toast';
import AppLayout from './components/Layout/AppLayout';
import Login from './pages/Login/Login';
import AcceptInvite from './pages/AcceptInvite/AcceptInvite';
import Dashboard from './pages/Dashboard/Dashboard';
import Talents from './pages/Talents/Talents';
import ShiftConfig from './pages/ShiftConfig/ShiftConfig';
import Schedule from './pages/Schedule/Schedule';
import Users from './pages/Users/Users';

/** Redirects to /login if the user is not authenticated. */
function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/** Redirects already-authenticated users away from auth pages. */
function GuestRoute({ children }) {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

/** Redirects non-superusers back to /dashboard. */
function SuperuserRoute({ children }) {
    const { role } = useAuth();
    return role === 'superuser' ? children : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
    return (
        <Routes>
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Auth pages — only accessible when logged out */}
            <Route
                path="/login"
                element={
                    <GuestRoute>
                        <Login />
                    </GuestRoute>
                }
            />
            <Route path="/accept-invite" element={<AcceptInvite />} />

            {/* Protected pages wrapped in the shared Layout (Sidebar) */}
            <Route
                element={
                    <ProtectedRoute>
                        <AppLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/talents" element={<Talents />} />
                {/* Placeholders for upcoming pages */}
                <Route path="/shifts" element={<ShiftConfig />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/admin/users" element={
                    <SuperuserRoute>
                        <Users />
                    </SuperuserRoute>
                } />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <AppRoutes />
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
