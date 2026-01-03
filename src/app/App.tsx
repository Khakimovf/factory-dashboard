import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Warehouse } from './components/Warehouse';
import { ProductionLines } from './components/ProductionLines';
import { ProductionLineDetail } from './components/ProductionLineDetail';
import { HRDepartment } from './components/HRDepartment';
import { MaintenanceDashboard } from './components/MaintenanceDashboard';
import { FailureReportList } from './components/FailureReportList';
import { FailureReportDetail } from './components/FailureReportDetail';
import { CreateFailureReport } from './components/CreateFailureReport';
import { UploadPhotoReport } from './components/UploadPhotoReport';
import { SystemAuditLog } from './components/SystemAuditLog';
import { FactoryProvider } from './context/FactoryContext';
import { AuditLogProvider } from './context/AuditLogContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { isSystemOwner } from './utils/roleUtils';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <FactoryProvider>
          <AuditLogProvider>
            <Router>
              <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Header />
                  <main className="flex-1 overflow-y-auto">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/warehouse" element={<Warehouse />} />
                      <Route path="/production-lines" element={<ProductionLines />} />
                      <Route path="/production-lines/:id" element={<ProductionLineDetail />} />
                      <Route path="/hr" element={<HRDepartment />} />
                      <Route path="/maintenance" element={<MaintenanceDashboard />} />
                      <Route path="/maintenance/failure-reports" element={<FailureReportList />} />
                      <Route path="/maintenance/failure-reports/new" element={<CreateFailureReport />} />
                      <Route path="/maintenance/failure-reports/:id" element={<FailureReportDetail />} />
                      <Route path="/maintenance/failure-reports/:id/upload-photos" element={<UploadPhotoReport />} />
                      <Route path="/audit-log" element={<SystemAuditLog />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </Router>
          </AuditLogProvider>
        </FactoryProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}