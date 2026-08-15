import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import PersonalDashboard from './pages/PersonalDashboard';
import Expenses from './pages/Expenses';
import Invest from './pages/Invest';
import PriceComparison from './pages/PriceComparison';
import Transactions from './pages/Transactions';
import SendMoney from './pages/SendMoney';
import Profile from './pages/Profile';
import BusinessDashboard from './pages/BusinessDashboard';
import BusinessEmployees from './pages/BusinessEmployees';
import BusinessAudit from './pages/BusinessAudit';
import BusinessLimits from './pages/BusinessLimits';

function RequireAuth({ children, businessOnly = false }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div className="center-screen">
        <div className="spinner" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (businessOnly && user.mode !== 'business') return <Navigate to="/app/personal" replace />;
  if (!businessOnly && user.mode === 'business') return <Navigate to="/app/business" replace />;
  return children;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (user) {
    return <Navigate to={user.mode === 'business' ? '/app/business' : '/app/personal'} replace />;
  }
  return <Landing />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/app/personal" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<PersonalDashboard />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="invest" element={<Invest />} />
        <Route path="prices" element={<PriceComparison />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="send" element={<SendMoney />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="/app/business" element={<RequireAuth businessOnly><Layout /></RequireAuth>}>
        <Route index element={<BusinessDashboard />} />
        <Route path="employees" element={<BusinessEmployees />} />
        <Route path="audit" element={<BusinessAudit />} />
        <Route path="limits" element={<BusinessLimits />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="send" element={<SendMoney />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
