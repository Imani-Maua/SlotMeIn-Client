import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast/Toast';
import AppLayout from './components/Layout/AppLayout';
import Login from './pages/Login/Login';
import AcceptInvite from './pages/AcceptInvite/AcceptInvite';
import Dashboard from './pages/Dashboard/Dashboard';
import Talents from './pages/Talents/Talents';
import ShiftConfig from './pages/ShiftConfig/ShiftConfig';

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
                <Route path="/schedule" element={<div>Schedule Placeholder</div>} />
                <Route path="/admin/users" element={<div>User Admin Placeholder</div>} />
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
