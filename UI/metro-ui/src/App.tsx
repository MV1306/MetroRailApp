import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/shared/Navbar';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import LinesPage from './pages/admin/LinesPage';
import StationsPage from './pages/admin/StationsPage';
import LineStationsPage from './pages/admin/LineStationsPage';
import ConnectionsPage from './pages/admin/ConnectionsPage';
import InterchangesPage from './pages/admin/InterchangesPage';
import FaresPage from './pages/admin/FaresPage';
import StationFacilitiesPage from './pages/admin/StationFacilitiesPage';
import TimetablePage from './pages/admin/TimetablePage';
import TicketValidationPage from './pages/admin/TicketValidationPage';
import JourneyPlanner from './pages/user/JourneyPlanner';
import StationSearch from './pages/user/StationSearch';
import FareCalculator from './pages/user/FareCalculator';
import MetroMap from './pages/user/MetroMap';
import HomePage from './pages/user/HomePage';
import TicketBooking from './pages/user/TicketBooking';

export default function App() {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1565c0' } }}>
      <AuthProvider>
        <BrowserRouter>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <div style={{ flex: 1 }}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<HomePage />} />

                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="lines" element={<LinesPage />} />
                  <Route path="stations" element={<StationsPage />} />
                  <Route path="line-stations" element={<LineStationsPage />} />
                  <Route path="connections" element={<ConnectionsPage />} />
                  <Route path="interchanges" element={<InterchangesPage />} />
                  <Route path="fares" element={<FaresPage />} />
                  <Route path="facilities" element={<StationFacilitiesPage />} />
                  <Route path="timetable" element={<TimetablePage />} />
                  <Route path="tickets" element={<TicketValidationPage />} />
                </Route>

                <Route path="/journey" element={<JourneyPlanner />} />
                <Route path="/stations" element={<StationSearch />} />
                <Route path="/fare" element={<FareCalculator />} />
                <Route path="/map" element={<MetroMap />} />
                <Route path="/tickets" element={<ProtectedRoute><TicketBooking /></ProtectedRoute>} />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}
