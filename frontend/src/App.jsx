import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { ThemeProvider, createTheme } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import VerifyEmailNotice from './components/auth/VerifyEmailNotice';
import DashboardLayout from './components/DashboardLayout';
import { AuthProvider } from './contexts/AuthContext';
import { Signup } from './components/auth/Signup';
import { Login } from './components/auth/Login';
import './App.css';
import { useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const PrivateRoute = ({ user, loading, children }) => {
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
};

const LoginRedirect = ({user, loading}) => {
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);
  return <Login />;
};

function AppContent() {
  const { user, loading, user_role, fetchUserRole } = useAuth();

  return (
    <Router>
      <ToastContainer position="bottom-right" />
      <Routes>
        <Route path="/login" element={<LoginRedirect user={user} loading={loading} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmailNotice />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute user={user} loading={loading}>
              <DashboardLayout user={user} loading={loading} user_role={user_role} fetchUserRole={fetchUserRole} />
            </PrivateRoute>
          }
        />
        <Route path="/*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;