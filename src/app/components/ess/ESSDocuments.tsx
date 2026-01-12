import { useLanguage } from '../../context/LanguageContext';
import { mockDocuments } from '../../data/essData';
import { FileText, Download, Eye, File } from 'lucide-react';

export function ESSDocuments() {
  const { t } = useLanguage();

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'contract':
        return t('ess.documents.typeContract');
      case 'order':
        return t('ess.documents.typeOrder');
      case 'certificate':
        return t('ess.documents.typeCertificate');
      default:
        return t('ess.documents.typeOther');
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'contract':
      case 'order':
      case 'certificate':
        return FileText;
      default:
        return File;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('ess.documents.title')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('ess.documents.subtitle')}
          </p>
        </div>

        {mockDocuments.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{t('ess.documents.noDocuments')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {mockDocuments.map((doc) => {
              const Icon = getDocumentIcon(doc.type);
              return (
                <div
                  key={doc.id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex-shrink-0">
                        <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          {doc.name}
                        </h4>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{getDocumentTypeLabel(doc.type)}</span>
                          {doc.size && <span>• {doc.size}</span>}
                          <span>
                            • {new Date(doc.uploadDate).toLocaleDateString('uz-UZ', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => {
                          // TODO: Implement view document when backend API is ready
                          alert(t('ess.documents.viewPlaceholder'));
                        }}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title={t('ess.documents.view')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          // TODO: Implement download document when backend API is ready
                          alert(t('ess.documents.downloadPlaceholder'));
                        }}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title={t('ess.documents.download')}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
