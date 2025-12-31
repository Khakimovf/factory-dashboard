import { useState } from 'react';
import { useFactory } from '../context/FactoryContext';
import { useLanguage } from '../context/LanguageContext';
import { FileText, FolderOpen, Book, CheckCircle, Clock, FileEdit, Archive, Search } from 'lucide-react';

export function HRDepartment() {
  const { hrDocuments, updateDocumentStatus } = useFactory();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const categories = ['all', 'policy', 'handbook', 'form', 'manual'];
  const statuses = ['all', 'draft', 'pending', 'approved', 'archived'];

  const filteredDocuments = hrDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'draft':
        return <FileEdit className="w-4 h-4" />;
      case 'archived':
        return <Archive className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'archived':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'handbook':
        return <Book className="w-5 h-5" />;
      case 'policy':
        return <FileText className="w-5 h-5" />;
      case 'manual':
        return <FolderOpen className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">{t('hr.title')}</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('hr.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<FileText className="w-6 h-6" />}
          title={t('hr.totalDocuments')}
          value={hrDocuments.length}
          color="blue"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          title={t('hr.pendingApproval')}
          value={hrDocuments.filter(d => d.status === 'pending').length}
          color="yellow"
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6" />}
          title={t('hr.approved')}
          value={hrDocuments.filter(d => d.status === 'approved').length}
          color="green"
        />
        <StatCard
          icon={<FileEdit className="w-6 h-6" />}
          title={t('hr.draft')}
          value={hrDocuments.filter(d => d.status === 'draft').length}
          color="gray"
        />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('hr.searchDocuments')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? t('hr.all') : t(`hr.${cat}`)}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? t('hr.all') : t(`hr.${status}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Document Workflow Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <WorkflowColumn
          title={t('hr.inProcess')}
          count={hrDocuments.filter(d => d.status === 'pending' || d.status === 'draft').length}
          documents={filteredDocuments.filter(d => d.status === 'pending' || d.status === 'draft')}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          getCategoryIcon={getCategoryIcon}
          onStatusChange={updateDocumentStatus}
        />
        <WorkflowColumn
          title={t('hr.approved')}
          count={hrDocuments.filter(d => d.status === 'approved').length}
          documents={filteredDocuments.filter(d => d.status === 'approved')}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          getCategoryIcon={getCategoryIcon}
          onStatusChange={updateDocumentStatus}
        />
        <WorkflowColumn
          title={t('hr.archived')}
          count={hrDocuments.filter(d => d.status === 'archived').length}
          documents={filteredDocuments.filter(d => d.status === 'archived')}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          getCategoryIcon={getCategoryIcon}
          onStatusChange={updateDocumentStatus}
        />
      </div>

      {/* Document Library */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('hr.documentLibrary')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <LibraryFolder icon={<Book />} title={t('hr.handbooks')} count={hrDocuments.filter(d => d.category === 'handbook').length} />
          <LibraryFolder icon={<FileText />} title={t('hr.policies')} count={hrDocuments.filter(d => d.category === 'policy').length} />
          <LibraryFolder icon={<FileText />} title={t('hr.forms')} count={hrDocuments.filter(d => d.category === 'form').length} />
          <LibraryFolder icon={<FolderOpen />} title={t('hr.manuals')} count={hrDocuments.filter(d => d.category === 'manual').length} />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: 'blue' | 'yellow' | 'green' | 'gray';
}

function StatCard({ icon, title, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    gray: 'bg-gray-50 text-gray-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{title}</p>
          <p className="text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface WorkflowColumnProps {
  title: string;
  count: number;
  documents: any[];
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  getCategoryIcon: (category: string) => React.ReactNode;
  onStatusChange: (id: string, status: any) => void;
}

function WorkflowColumn({ title, count, documents, getStatusIcon, getStatusColor, getCategoryIcon, onStatusChange }: WorkflowColumnProps) {
  const { t } = useLanguage();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
          {count}
        </span>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {documents.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">{t('hr.noDocuments')}</p>
        ) : (
          documents.map(doc => (
            <div key={doc.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                  {getCategoryIcon(doc.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">{doc.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(doc.date).toLocaleDateString()}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                      {getStatusIcon(doc.status)}
                      {t(`hr.${doc.status}`)}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                      {t(`hr.${doc.category}`)}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {doc.status === 'pending' && (
                      <button
                        onClick={() => onStatusChange(doc.id, 'approved')}
                        className="text-xs px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                      >
                        {t('hr.approve')}
                      </button>
                    )}
                    {doc.status === 'approved' && (
                      <button
                        onClick={() => onStatusChange(doc.id, 'archived')}
                        className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        {t('hr.archive')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface LibraryFolderProps {
  icon: React.ReactNode;
  title: string;
  count: number;
}

function LibraryFolder({ icon, title, count }: LibraryFolderProps) {
  const { t } = useLanguage();
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{count} {t('hr.documents')}</p>
    </div>
  );
}
