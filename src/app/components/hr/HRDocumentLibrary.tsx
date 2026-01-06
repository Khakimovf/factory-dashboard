import { useLanguage } from '../../context/LanguageContext';
import { useFactory } from '../../context/FactoryContext';
import { HRSubNav } from './HRSubNav';
import { Book, FileText, FolderOpen } from 'lucide-react';

interface LibraryFolderProps {
  icon: React.ReactNode;
  title: string;
  count: number;
}

function LibraryFolder({ icon, title, count }: LibraryFolderProps) {
  const { t } = useLanguage();

  return (
    <div className="group border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900/40 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            {icon}
          </div>
          <h4 className="font-medium text-gray-900 dark:text-white text-sm">{title}</h4>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium">
          {count}
        </span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t('hr.documents')}
      </p>
    </div>
  );
}

export function HRDocumentLibrary() {
  const { t } = useLanguage();
  const { hrDocuments } = useFactory();

  return (
    <div className="p-8">
      <div className="mb-6">
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
            {t('hr.title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {t('hr.subtitle')}
          </p>
          <HRSubNav />
        </div>

        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('hr.documentLibrary')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Qo‘llanmalar, siyosatlar, shakllar va ko‘rsatmalar yagona kutubxonasi.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <LibraryFolder
              icon={<Book />}
              title={t('hr.handbooks')}
              count={hrDocuments.filter(d => d.category === 'handbook').length}
            />
            <LibraryFolder
              icon={<FileText />}
              title={t('hr.policies')}
              count={hrDocuments.filter(d => d.category === 'policy').length}
            />
            <LibraryFolder
              icon={<FileText />}
              title={t('hr.forms')}
              count={hrDocuments.filter(d => d.category === 'form').length}
            />
            <LibraryFolder
              icon={<FolderOpen />}
              title={t('hr.manuals')}
              count={hrDocuments.filter(d => d.category === 'manual').length}
            />
          </div>
        </section>
    </div>
  );
}


