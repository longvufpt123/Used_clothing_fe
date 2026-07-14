import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import Home from '@/pages/Home';
import Products from '@/pages/Products';
import Login from '@/pages/Login';
import Dashboard from '@/pages/admin/Dashboard';
import Map from '@/pages/Map';
import Leaderboard from '@/pages/Leaderboard';
import Account from '@/pages/Account';
import MyOrders from '@/pages/MyOrders';
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

// Receiving Staff pages
import ReceivingLayout from '@/shared/layouts/ReceivingLayout';
import ReceivingDashboard from '@/pages/receiving/Dashboard';
import ReceivingBatchDetail from '@/pages/receiving/BatchDetail';
import ReceivingProcessRequest from '@/pages/receiving/ProcessRequest';
import RoleRoute from '@/routes/RoleRoute';

// Classification Staff pages
import StaffOpsLayout from '@/shared/layouts/StaffOpsLayout';
import ClassificationDashboard from '@/pages/classification/Dashboard';
import ClassifyBatch from '@/pages/classification/ClassifyBatch';
import HandoffBatch from '@/pages/classification/HandoffBatch';

// Warehouse Staff pages
import WarehouseDashboard from '@/pages/warehouse/Dashboard';
import ReceiveBatch from '@/pages/warehouse/ReceiveBatch';
import StorageAlloc from '@/pages/warehouse/StorageAlloc';
import DistributePrep from '@/pages/warehouse/DistributePrep';
import WarehouseTracking from '@/pages/warehouse/Tracking';

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
        path="/account"
        element={
          <MainLayout>
            <Account />
          </MainLayout>
        }
      />
      <Route
        path="/my-orders"
        element={
          <MainLayout>
            <MyOrders />
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

      {/* Receiving Staff pages */}
      <Route
        path="/receiving"
        element={
          <RoleRoute role="ReceivingStaff">
            <ReceivingLayout>
              <ReceivingDashboard />
            </ReceivingLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/receiving/batch/:id"
        element={
          <RoleRoute role="ReceivingStaff">
            <ReceivingLayout>
              <ReceivingBatchDetail />
            </ReceivingLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/receiving/request/:id"
        element={
          <RoleRoute role="ReceivingStaff">
            <ReceivingLayout>
              <ReceivingProcessRequest />
            </ReceivingLayout>
          </RoleRoute>
        }
      />

      {/* Classification Staff pages */}
      <Route
        path="/classification"
        element={
          <StaffOpsLayout homePath="/classification" roleLabel="Nhân viên Phân loại" brandSuffix="Classify">
            <ClassificationDashboard />
          </StaffOpsLayout>
        }
      />
      <Route
        path="/classification/classify/:batchId"
        element={
          <StaffOpsLayout homePath="/classification" roleLabel="Nhân viên Phân loại" brandSuffix="Classify">
            <ClassifyBatch />
          </StaffOpsLayout>
        }
      />
      <Route
        path="/classification/handoff/:batchId"
        element={
          <StaffOpsLayout homePath="/classification" roleLabel="Nhân viên Phân loại" brandSuffix="Classify">
            <HandoffBatch />
          </StaffOpsLayout>
        }
      />

      {/* Warehouse Staff pages */}
      <Route
        path="/warehouse"
        element={
          <StaffOpsLayout homePath="/warehouse" roleLabel="Nhân viên Kho" brandSuffix="Warehouse">
            <WarehouseDashboard />
          </StaffOpsLayout>
        }
      />
      <Route
        path="/warehouse/receive/:batchId"
        element={
          <StaffOpsLayout homePath="/warehouse" roleLabel="Nhân viên Kho" brandSuffix="Warehouse">
            <ReceiveBatch />
          </StaffOpsLayout>
        }
      />
      <Route
        path="/warehouse/storage/:batchId"
        element={
          <StaffOpsLayout homePath="/warehouse" roleLabel="Nhân viên Kho" brandSuffix="Warehouse">
            <StorageAlloc />
          </StaffOpsLayout>
        }
      />
      <Route
        path="/warehouse/distribute/:requestId"
        element={
          <StaffOpsLayout homePath="/warehouse" roleLabel="Nhân viên Kho" brandSuffix="Warehouse">
            <DistributePrep />
          </StaffOpsLayout>
        }
      />
      <Route
        path="/warehouse/tracking/:trackingCode"
        element={
          <StaffOpsLayout homePath="/warehouse" roleLabel="Nhân viên Kho" brandSuffix="Warehouse">
            <WarehouseTracking />
          </StaffOpsLayout>
        }
      />

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
