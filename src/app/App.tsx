import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Warehouse } from './components/Warehouse';
import { ProductionLines } from './components/ProductionLines';
import { ProductionLineDetail } from './components/ProductionLineDetail';
import { HRDepartment } from './components/HRDepartment';
import { FactoryProvider } from './context/FactoryContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <FactoryProvider>
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
                  </Routes>
                </main>
              </div>
            </div>
          </Router>
        </FactoryProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}