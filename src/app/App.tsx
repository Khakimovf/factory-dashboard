import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Toaster } from './components/ui/sonner';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import Warehouse from './components/warehouse/Index';
import { MaterialRequests } from './components/MaterialRequests';
import { ProductionLines } from './components/ProductionLines';
import { ProductionLineDetail } from './components/ProductionLineDetail';
import { ProductionLivePage } from './pages/production/ProductionLivePage';
import { LineBufferPage } from './pages/production/LineBufferPage';
import { LineAnalyticsPage } from './pages/production/LineAnalyticsPage';
import { OperatorDailyLinePlan } from './components/production/OperatorDailyLinePlan';
import { OperatorLinePlanPage } from './pages/production/OperatorLinePlanPage';
import { SAPInpanelCockpit } from './pages/production/SAPInpanelCockpit';
import { TPAMoldingCockpit } from './pages/production/TPAMoldingCockpit';
import { HRDepartment } from './components/HRDepartment';
import { DailyProductionPlanForm } from './components/DailyProductionPlanForm';
import { DailyLinePlanEntry } from './components/hr/DailyLinePlanEntry';
import { HREmployees } from './components/hr/HREmployees';
import { HRStatsPage } from './components/hr/HRStatsPage';
import { HRDocumentLibrary } from './components/hr/HRDocumentLibrary';
import { EmployeeCabinet } from './components/EmployeeCabinet';
import { EmployeeCabinetPage } from './pages/employee/EmployeeCabinetPage';
import { EmployeeSelfService } from './components/ess/EmployeeSelfService';
import { MaintenanceDashboard } from './components/MaintenanceDashboard';
import { FailureReportList } from './components/FailureReportList';
import { FailureReportDetail } from './components/FailureReportDetail';
import { CreateFailureReport } from './components/CreateFailureReport';
import { UploadPhotoReport } from './components/UploadPhotoReport';
import { SystemAuditLog } from './components/SystemAuditLog';
import { RolesPermissionsPage } from './pages/admin/RolesPermissionsPage';
import { SuppliersPage } from './pages/suppliers/SuppliersPage';
import { SupplierDetailPage } from './pages/suppliers/SupplierDetailPage';
import { SuppliersLayout } from './pages/suppliers/SuppliersLayout';
import { QualityControlPage } from './pages/qc/QualityControlPage';
import { LogisticsGatePage } from './pages/logistics/LogisticsGatePage';
import { FinishedGoodsPage } from './pages/finished-goods/FinishedGoodsPage';
import { WarehouseReceivingPage } from './pages/warehouse/WarehouseReceivingPage';
import { InventoryReconciliationDashboard } from './components/warehouse/InventoryReconciliationDashboard';
import { CanteenPage } from './pages/canteen/CanteenPage';
import AdministrationPage from './pages/admin/AdministrationPage';
import AuditLogPage from './pages/admin/AuditLogPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import LoginPage from './pages/auth/LoginPage';
import ReportsPage from './pages/reports/ReportsPage';
import { FinancePage } from './pages/finance/FinancePage';
import { ContractsPage } from './pages/finance/ContractsPage';
import { ProcurementPage } from './pages/procurement/ProcurementPage';
import { MRPPage } from './pages/production/MRPPage';
import { ShiftSchedulePage } from './pages/hr/ShiftSchedulePage';
import { TraceabilityPage } from './pages/production/TraceabilityPage';
import { BrakRecyclingPage } from './pages/production/BrakRecyclingPage';
// Sales route removed and merged into Finished Goods
import { ProtectedRoute } from './components/ProtectedRoute';
import { FactoryProvider } from './context/FactoryContext';
import { WarehouseProvider } from './context/WarehouseContext';
import { AuditLogProvider } from './context/AuditLogContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { DailyProductionPlanProvider } from './context/DailyProductionPlanContext';
import { QCProvider } from './context/QCContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SalesProvider } from './context/SalesContext';
import { ContainerLogisticsLayout } from './pages/logistics/ContainerLogistics/ContainerLogisticsLayout';
import { ContainerLogisticsDashboard } from './pages/logistics/ContainerLogistics/ContainerLogisticsDashboard';
import { ImportManagementPage } from './pages/logistics/ContainerLogistics/ImportManagementPage';
import { ExportManagementPage } from './pages/logistics/ContainerLogistics/ExportManagementPage';
import { SystemSettingsRoot } from './pages/admin/SystemSettingsPage';
import { MaintenanceProvider } from './context/MaintenanceContext';
import { MaintenanceGuard } from './components/MaintenanceGuard';
import DetailManagementPage from './pages/admin/DetailManagementPage';
import FatherDetailInfoPage from './pages/admin/details/FatherDetailInfoPage';
import FatherChildrenPage from './pages/admin/details/FatherChildrenPage';
import ChildDetailListPage from './pages/admin/details/ChildDetailListPage';
import ChildDetailInfoPage from './pages/admin/details/ChildDetailInfoPage';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MaintenanceProvider>
            <FactoryProvider>
              <WarehouseProvider>
                <SalesProvider>
                  <DailyProductionPlanProvider>
                    <QCProvider>
                      <AuditLogProvider>
                        <Router>
                          <Routes>
                            {/* Public route */}
                            <Route path="/login" element={<LoginPage />} />
                            {/* All protected routes */}
                            <Route
                              path="/*"
                              element={
                                <ProtectedRoute>
                                  <AppLayout />
                                </ProtectedRoute>
                              }
                            />
                          </Routes>
                        </Router>
                        <Toaster />
                      </AuditLogProvider>
                    </QCProvider>
                  </DailyProductionPlanProvider>
                </SalesProvider>
              </WarehouseProvider>
            </FactoryProvider>
          </MaintenanceProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Redirect first-time logins to change password
  if (user?.isFirstLogin && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-transparent h-full">
        <Header />
        <MaintenanceGuard>
        <main className={`flex-1 relative z-10 h-[calc(100vh-64px)] ${location.pathname === '/' ? 'overflow-hidden bg-transparent' : 'overflow-y-auto bg-background'}`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/warehouse" element={<Warehouse />} />
            <Route path="/warehouse/requests" element={<MaterialRequests />} />
            <Route path="/warehouse/receiving" element={<WarehouseReceivingPage />} />
            <Route path="/warehouse/inventory-reconciliation" element={<InventoryReconciliationDashboard />} />
            <Route path="/production-lines" element={<ProductionLines />} />
            <Route path="/production-lines/operator-plans" element={<OperatorDailyLinePlan />} />
            <Route path="/operator-plans/:lineId" element={<OperatorLinePlanPage />} />
            <Route path="/production-lines/:id/live" element={<ProductionLivePage />} />
            <Route path="/production-lines/:lineId/buffer" element={<LineBufferPage />} />
            <Route path="/production-lines/:id/analytics" element={<LineAnalyticsPage />} />
            <Route path="/production-lines/:id/sap-cockpit" element={<SAPInpanelCockpit />} />
            <Route path="/production-lines/:id/tpa-cockpit" element={<TPAMoldingCockpit />} />
            <Route path="/production-lines/:id" element={<ProductionLineDetail />} />
            <Route path="/qc" element={<QualityControlPage />} />
            <Route path="/logistics-gate" element={<LogisticsGatePage />} />
            <Route path="/finished-goods" element={<FinishedGoodsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/hr" element={<HRDepartment />} />
            <Route path="/hr/employees" element={<HREmployees />} />
            <Route path="/canteen" element={<CanteenPage />} />
            <Route path="/hr/stats" element={<HRStatsPage />} />
            <Route path="/hr/library" element={<HRDocumentLibrary />} />
            <Route path="/hr/production-plan" element={<DailyProductionPlanForm />} />
            <Route path="/hr/line-plans" element={<DailyLinePlanEntry />} />
            <Route path="/worker-cabinet" element={<EmployeeCabinetPage />} />
            <Route path="/profile" element={<EmployeeCabinetPage />} />
            <Route path="/employee/cabinet" element={<Navigate to="/worker-cabinet" replace />} />
            <Route path="/ess" element={<EmployeeSelfService />} />
            <Route path="/maintenance" element={<MaintenanceDashboard />} />
            <Route path="/maintenance/failure-reports" element={<FailureReportList />} />
            <Route path="/maintenance/failure-reports/new" element={<CreateFailureReport />} />
            <Route path="/maintenance/failure-reports/:id" element={<FailureReportDetail />} />
            <Route path="/maintenance/failure-reports/:id/upload-photos" element={<UploadPhotoReport />} />
            <Route path="/audit-log" element={<SystemAuditLog />} />
            <Route path="/admin" element={<AdministrationPage />} />
            <Route path="/admin/system" element={<AdministrationPage />} />
            <Route path="/admin/audit-log" element={<AuditLogPage />} />
            <Route path="/admin/details" element={<DetailManagementPage />} />
            <Route path="/admin/details/fathers/:id" element={<FatherDetailInfoPage />} />
            <Route path="/admin/details/fathers/:id/children" element={<FatherChildrenPage />} />
            <Route path="/admin/details/children" element={<ChildDetailListPage />} />
            <Route path="/admin/details/children/:id" element={<ChildDetailInfoPage />} />
            <Route path="/roles-permissions" element={<RolesPermissionsPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/finance/contracts" element={<ContractsPage />} />
            <Route path="/procurement" element={<ProcurementPage />} />
            {/* Sales route has been migrated to Finished Goods Warehouse */}
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route path="/mrp" element={<MRPPage />} />
            <Route path="/shift-schedule" element={<ShiftSchedulePage />} />
            <Route path="/system-settings" element={<SystemSettingsRoot />} />
            <Route path="/traceability" element={<TraceabilityPage />} />
            <Route path="/brak-recycling" element={<BrakRecyclingPage />} />
            <Route path="/suppliers" element={<SuppliersLayout />}>
              <Route index element={<SuppliersPage />} />
              <Route path=":id" element={<SupplierDetailPage />} />
            </Route>
            <Route path="/container-logistics" element={<ContainerLogisticsLayout />}>
              <Route index element={<ContainerLogisticsDashboard />} />
              <Route path="import" element={<ImportManagementPage />} />
              <Route path="export" element={<ExportManagementPage />} />
            </Route>
          </Routes>
        </main>
        </MaintenanceGuard>
      </div>
    </div>
  );
}
