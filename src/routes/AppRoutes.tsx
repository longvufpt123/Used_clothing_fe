import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import Home from '@/pages/Home';
import Products from '@/pages/Products';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
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
import ManagerShiftCalendar from '@/pages/manager/ShiftCalendar';
import ManagerDispatchOperations from '@/pages/manager/DispatchOperations';
import ManagerClassificationDispatch from '@/pages/manager/ClassificationDispatch';
import ManagerCharityInventory from '@/pages/manager/CharityInventory';
import ManagerCampaigns from '@/pages/manager/Campaigns';
import ManagerUsers from '@/pages/manager/Users';
import ManagerCategories from '@/pages/manager/Categories';
import ManagerConditionCriteria from '@/pages/manager/ConditionCriteria';
import AdminLayout from '@/shared/layouts/AdminLayout';

// Receiving Staff pages
import ReceivingShell from '@/shared/layouts/ReceivingShell';
import ReceivingDashboard from '@/pages/receiving/Dashboard';
import ReceivingBatchDetail from '@/pages/receiving/BatchDetail';
import ReceivingProcessRequest from '@/pages/receiving/ProcessRequest';
import ReceivingTeam from '@/pages/receiving/Team';
import ReceivingArea from '@/pages/receiving/ReceivingArea';
import RoleRoute, { RoleHomeRedirect } from '@/routes/RoleRoute';
import StaffProfile from '@/pages/staff/Profile';

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
import WarehouseInventoryPage from '@/pages/warehouse/Inventory';
import WarehouseTransactions from '@/pages/warehouse/Transactions';
import WarehouseAreas from '@/pages/warehouse/WarehouseAreas';
import DistributePrep from '@/pages/warehouse/DistributePrep';
import WarehouseTracking from '@/pages/warehouse/Tracking';
import DistributionPortal from '@/pages/distribution/DistributionPortal';
import OrganizationShell from '@/shared/layouts/OrganizationShell';
import Vouchers from '@/pages/Vouchers';
import ManagerVouchers from '@/pages/manager/Vouchers';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Front-office pages wrapped in MainLayout */}
      <Route
        path="/vouchers"
        element={<RoleRoute role="Donor"><MainLayout><Vouchers /></MainLayout></RoleRoute>}
      />
      <Route
        path="/"
        element={
          <MainLayout>
            <Home />
          </MainLayout>
        }
      />
      <Route
        path="/manager/vouchers"
        element={<RoleRoute role="Manager"><AdminLayout><ManagerVouchers /></AdminLayout></RoleRoute>}
      />
      <Route
        path="/products"
        element={
          <RoleRoute role="Donor">
            <MainLayout>
              <Products />
            </MainLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/map"
        element={
          <RoleRoute role="Donor">
            <MainLayout>
              <Map />
            </MainLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <RoleRoute role="Donor">
            <MainLayout>
              <Leaderboard />
            </MainLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/account"
        element={
          <RoleRoute role="Donor">
            <MainLayout>
              <Account />
            </MainLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <RoleRoute role="Donor">
            <MainLayout>
              <Profile />
            </MainLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/my-orders"
        element={
          <RoleRoute role="Donor">
            <MainLayout>
              <MyOrders />
            </MainLayout>
          </RoleRoute>
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
      <Route
        path="/forgot-password"
        element={
          <MainLayout>
            <ForgotPassword />
          </MainLayout>
        }
      />

      {/* Back-office pages */}
      <Route
        path="/admin"
        element={
          <RoleRoute role="Admin">
            <Dashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RoleRoute role="Admin">
            <Users />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/schedule"
        element={
          <RoleRoute role="Admin">
            <CollectionSchedule />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/classification"
        element={
          <RoleRoute role="Admin">
            <DetailedClassification />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/inventory"
        element={
          <RoleRoute role="Admin">
            <CharityInventory />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/campaigns"
        element={
          <RoleRoute role="Admin">
            <Campaigns />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <RoleRoute role="Admin">
            <AdminLayout>
              <StaffProfile />
            </AdminLayout>
          </RoleRoute>
        }
      />

      <Route
        path="/manager"
        element={
          <RoleRoute role="Manager">
            <ManagerDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/manager/users"
        element={
          <RoleRoute role="Manager">
            <ManagerUsers />
          </RoleRoute>
        }
      />
      <Route
        path="/manager/schedule"
        element={
          <RoleRoute role="Manager">
            <ManagerCollectionSchedule />
          </RoleRoute>
        }
      />
      <Route
        path="/manager/shifts"
        element={
          <RoleRoute role="Manager">
            <ManagerShiftCalendar />
          </RoleRoute>
        }
      />
      <Route
        path="/manager/dispatch"
        element={
          <RoleRoute role="Manager">
            <ManagerDispatchOperations />
          </RoleRoute>
        }
      />
      <Route
        path="/manager/inventory"
        element={
          <RoleRoute role="Manager">
            <ManagerCharityInventory />
          </RoleRoute>
        }
      />
      <Route
        path="/manager/classification-dispatch"
        element={
          <RoleRoute role="Manager">
            <ManagerClassificationDispatch />
          </RoleRoute>
        }
      />
      <Route
        path="/manager/campaigns"
        element={
          <RoleRoute role="Manager">
            <ManagerCampaigns />
          </RoleRoute>
        }
      />
      <Route
        path="/manager/categories"
        element={
          <RoleRoute role="Manager">
            <ManagerCategories />
          </RoleRoute>
        }
      />
      <Route
        path="/manager/condition-criteria"
        element={
          <RoleRoute role="Manager">
            <ManagerConditionCriteria />
          </RoleRoute>
        }
      />
      <Route
        path="/manager/profile"
        element={
          <RoleRoute role="Manager">
            <AdminLayout>
              <StaffProfile />
            </AdminLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/manager/distributions"
        element={
          <RoleRoute role="Manager">
            <AdminLayout>
              <DistributionPortal mode="manager" />
            </AdminLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/organization/distributions"
        element={
          <RoleRoute role="CharityOrganization">
            <OrganizationShell>
              <DistributionPortal mode="organization" />
            </OrganizationShell>
          </RoleRoute>
        }
      />
      <Route
        path="/organization/distributions/:requestId"
        element={
          <RoleRoute role="CharityOrganization">
            <OrganizationShell>
              <DistributionPortal mode="organization" />
            </OrganizationShell>
          </RoleRoute>
        }
      />
      <Route
        path="/organization/profile"
        element={
          <RoleRoute role="CharityOrganization">
            <OrganizationShell>
              <StaffProfile />
            </OrganizationShell>
          </RoleRoute>
        }
      />

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
        path="/receiving/receiving-area"
        element={
          <RoleRoute role="ReceivingStaff">
            <ReceivingShell>
              <ReceivingArea />
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

      <Route
        path="/receiving/profile"
        element={
          <RoleRoute role="ReceivingStaff">
            <ReceivingShell>
              <StaffProfile />
            </ReceivingShell>
          </RoleRoute>
        }
      />

      {/* Classification Staff pages */}
      <Route
        path="/classification"
        element={
          <RoleRoute role="ClassificationStaff">
            <ClassificationShell>
              <ClassificationDashboard />
            </ClassificationShell>
          </RoleRoute>
        }
      />
      <Route
        path="/classification/classify/:batchId"
        element={
          <RoleRoute role="ClassificationStaff">
            <ClassificationShell>
              <ClassifyBatch />
            </ClassificationShell>
          </RoleRoute>
        }
      />
      <Route
        path="/classification/confirm/:batchId"
        element={
          <RoleRoute role="ClassificationStaff">
            <ClassificationShell>
              <ConfirmBatch />
            </ClassificationShell>
          </RoleRoute>
        }
      />
      <Route
        path="/classification/batches/:batchId"
        element={
          <RoleRoute role="ClassificationStaff">
            <ClassificationShell>
              <ClassifiedBatchDetail />
            </ClassificationShell>
          </RoleRoute>
        }
      />
      <Route
        path="/receiving/team"
        element={
          <RoleRoute role="ReceivingStaff">
            <ReceivingShell>
              <ReceivingTeam />
            </ReceivingShell>
          </RoleRoute>
        }
      />
      <Route
        path="/classification/groups"
        element={
          <RoleRoute role="ClassificationStaff">
            <ClassificationShell>
              <GroupedBatches />
            </ClassificationShell>
          </RoleRoute>
        }
      />
      <Route
        path="/classification/warehouse-handoffs"
        element={
          <RoleRoute role="ClassificationStaff">
            <ClassificationShell>
              <GroupedBatches view="sent" />
            </ClassificationShell>
          </RoleRoute>
        }
      />
      <Route
        path="/classification/groups/:groupId"
        element={
          <RoleRoute role="ClassificationStaff">
            <ClassificationShell>
              <GroupedBatchDetail />
            </ClassificationShell>
          </RoleRoute>
        }
      />
      <Route
        path="/classification/classified-groups/:groupId"
        element={
          <RoleRoute role="ClassificationStaff">
            <ClassificationShell>
              <GroupedBatchDetail />
            </ClassificationShell>
          </RoleRoute>
        }
      />

      <Route
        path="/classification/profile"
        element={
          <RoleRoute role="ClassificationStaff">
            <ClassificationShell>
              <StaffProfile />
            </ClassificationShell>
          </RoleRoute>
        }
      />

      {/* Warehouse Staff pages */}
      <Route
        path="/warehouse"
        element={
          <RoleRoute role="WarehouseStaff">
            <WarehouseShell>
              <WarehouseDashboard />
            </WarehouseShell>
          </RoleRoute>
        }
      />
      <Route
        path="/warehouse/receive/:batchId"
        element={
          <RoleRoute role="WarehouseStaff">
            <WarehouseShell>
              <ReceiveBatch />
            </WarehouseShell>
          </RoleRoute>
        }
      />
      <Route
        path="/warehouse/storage/:batchId"
        element={
          <RoleRoute role="WarehouseStaff">
            <WarehouseShell>
              <StorageAlloc />
            </WarehouseShell>
          </RoleRoute>
        }
      />
      <Route
        path="/warehouse/inventory"
        element={
          <RoleRoute role="WarehouseStaff">
            <WarehouseShell>
              <WarehouseInventoryPage />
            </WarehouseShell>
          </RoleRoute>
        }
      />
      <Route
        path="/warehouse/transactions"
        element={
          <RoleRoute role="WarehouseStaff">
            <WarehouseShell>
              <WarehouseTransactions />
            </WarehouseShell>
          </RoleRoute>
        }
      />
      <Route
        path="/warehouse/areas"
        element={
          <RoleRoute role="WarehouseStaff">
            <WarehouseShell>
              <WarehouseAreas />
            </WarehouseShell>
          </RoleRoute>
        }
      />
      <Route
        path="/warehouse/profile"
        element={
          <RoleRoute role="WarehouseStaff">
            <WarehouseShell>
              <StaffProfile />
            </WarehouseShell>
          </RoleRoute>
        }
      />
      <Route
        path="/warehouse/distributions"
        element={
          <RoleRoute role="WarehouseStaff">
            <WarehouseShell>
              <DistributionPortal mode="warehouse" />
            </WarehouseShell>
          </RoleRoute>
        }
      />
      <Route
        path="/warehouse/distribute/:requestId"
        element={
          <RoleRoute role="WarehouseStaff">
            <WarehouseShell>
              <DistributePrep />
            </WarehouseShell>
          </RoleRoute>
        }
      />
      <Route
        path="/warehouse/tracking/:trackingCode"
        element={
          <RoleRoute role="WarehouseStaff">
            <WarehouseShell>
              <WarehouseTracking />
            </WarehouseShell>
          </RoleRoute>
        }
      />

      {/* Fallback redirect */}
      <Route path="*" element={<RoleHomeRedirect />} />
    </Routes>
  );
};
export default AppRoutes;
