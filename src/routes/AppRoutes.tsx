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
import Profile from '@/pages/Profile';
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
import ReceivingShell from '@/shared/layouts/ReceivingShell';
import ReceivingDashboard from '@/pages/receiving/Dashboard';
import ReceivingBatchDetail from '@/pages/receiving/BatchDetail';
import ReceivingProcessRequest from '@/pages/receiving/ProcessRequest';
import RoleRoute from '@/routes/RoleRoute';

// Classification Staff pages
import ClassificationShell from '@/shared/layouts/ClassificationShell';
import ClassificationDashboard from '@/pages/classification/Dashboard';
import ClassifyBatch from '@/pages/classification/ClassifyBatch';
import ConfirmBatch from '@/pages/classification/ConfirmBatch';
import ClassifiedBatchDetail from '@/pages/classification/ClassifiedBatchDetail';
import GroupedBatches from '@/pages/classification/GroupedBatches';
import GroupedBatchDetail from '@/pages/classification/GroupedBatchDetail';

// Warehouse Staff pages
import WarehouseShell from '@/shared/layouts/WarehouseShell';
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
        path="/profile"
        element={
          <MainLayout>
            <Profile />
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
            <ReceivingShell>
              <ReceivingDashboard />
            </ReceivingShell>
          </RoleRoute>
        }
      />
      <Route
        path="/receiving/batch/:id"
        element={
          <RoleRoute role="ReceivingStaff">
            <ReceivingShell>
              <ReceivingBatchDetail />
            </ReceivingShell>
          </RoleRoute>
        }
      />
      <Route
        path="/receiving/request/:id"
        element={
          <RoleRoute role="ReceivingStaff">
            <ReceivingShell>
              <ReceivingProcessRequest />
            </ReceivingShell>
          </RoleRoute>
        }
      />

      {/* Classification Staff pages */}
      <Route
        path="/classification"
        element={
          <RoleRoute role="ClassificationStaff">
            <ClassificationShell><ClassificationDashboard /></ClassificationShell>
          </RoleRoute>
        }
      />
      <Route
        path="/classification/classify/:batchId"
        element={
          <RoleRoute role="ClassificationStaff">
            <ClassificationShell><ClassifyBatch /></ClassificationShell>
          </RoleRoute>
        }
      />
      <Route
        path="/classification/confirm/:batchId"
        element={
          <RoleRoute role="ClassificationStaff">
            <ClassificationShell><ConfirmBatch /></ClassificationShell>
          </RoleRoute>
        }
      />
      <Route
        path="/classification/batches/:batchId"
        element={
          <RoleRoute role="ClassificationStaff">
            <ClassificationShell><ClassifiedBatchDetail /></ClassificationShell>
          </RoleRoute>
        }
      />
      <Route path="/classification/groups" element={<RoleRoute role="ClassificationStaff"><ClassificationShell><GroupedBatches /></ClassificationShell></RoleRoute>} />
      <Route path="/classification/groups/:groupId" element={<RoleRoute role="ClassificationStaff"><ClassificationShell><GroupedBatchDetail /></ClassificationShell></RoleRoute>} />

      {/* Warehouse Staff pages */}
      <Route
        path="/warehouse"
        element={
          <WarehouseShell>
            <WarehouseDashboard />
          </WarehouseShell>
        }
      />
      <Route
        path="/warehouse/receive/:batchId"
        element={
          <WarehouseShell>
            <ReceiveBatch />
          </WarehouseShell>
        }
      />
      <Route
        path="/warehouse/storage/:batchId"
        element={
          <WarehouseShell>
            <StorageAlloc />
          </WarehouseShell>
        }
      />
      <Route
        path="/warehouse/distribute/:requestId"
        element={
          <WarehouseShell>
            <DistributePrep />
          </WarehouseShell>
        }
      />
      <Route
        path="/warehouse/tracking/:trackingCode"
        element={
          <WarehouseShell>
            <WarehouseTracking />
          </WarehouseShell>
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
