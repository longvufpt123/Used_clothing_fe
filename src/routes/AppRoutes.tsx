import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import Home from '@/pages/Home';
import Products from '@/pages/Products';
import Login from '@/pages/Login';
import Dashboard from '@/pages/admin/Dashboard';
import Map from '@/pages/Map';
import Leaderboard from '@/pages/Leaderboard';
import CollectionSchedule from '@/pages/admin/CollectionSchedule';
import DetailedClassification from '@/pages/admin/DetailedClassification';
import CharityInventory from '@/pages/admin/CharityInventory';
import Campaigns from '@/pages/admin/Campaigns';
import Users from '@/pages/admin/Users';

// Manager pages
import ManagerDashboard from '@/pages/manager/Dashboard';
import ManagerCollectionSchedule from '@/pages/manager/CollectionSchedule';
import ManagerCharityInventory from '@/pages/manager/CharityInventory';
import ManagerCampaigns from '@/pages/manager/Campaigns';
import ManagerUsers from '@/pages/manager/Users';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Front-office pages wrapped in MainLayout */}
      <Route
        path="/"
        element={
          <MainLayout>
            <Home />
          </MainLayout>
        }
      />
      <Route
        path="/products"
        element={
          <MainLayout>
            <Products />
          </MainLayout>
        }
      />
      <Route
        path="/map"
        element={
          <MainLayout>
            <Map />
          </MainLayout>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <MainLayout>
            <Leaderboard />
          </MainLayout>
        }
      />
      <Route
        path="/login"
        element={
          <MainLayout>
            <Login />
          </MainLayout>
        }
      />

      {/* Back-office pages */}
      <Route path="/admin" element={<Dashboard />} />
      <Route path="/admin/users" element={<Users />} />
      <Route path="/admin/schedule" element={<CollectionSchedule />} />
      <Route path="/admin/classification" element={<DetailedClassification />} />
      <Route path="/admin/inventory" element={<CharityInventory />} />
      <Route path="/admin/campaigns" element={<Campaigns />} />

      <Route path="/manager" element={<ManagerDashboard />} />
      <Route path="/manager/users" element={<ManagerUsers />} />
      <Route path="/manager/schedule" element={<ManagerCollectionSchedule />} />
      <Route path="/manager/inventory" element={<ManagerCharityInventory />} />
      <Route path="/manager/campaigns" element={<ManagerCampaigns />} />

      {/* Fallback redirect */}
      <Route
        path="*"
        element={
          <MainLayout>
            <Home />
          </MainLayout>
        }
      />
    </Routes>
  );
};
export default AppRoutes;
