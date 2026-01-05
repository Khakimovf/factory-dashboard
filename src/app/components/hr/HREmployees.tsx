import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { HRSubNav } from './HRSubNav';
import { hrEmployees, Employee, EmployeeStatus } from '../../data/hrEmployees';
import { Download, FileText, Eye, Edit2, X } from 'lucide-react';

export function HREmployees() {
  const { t } = useLanguage();
  const [employees, setEmployees] = useState<Employee[]>(hrEmployees);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const handleDelete = (employeeId: string) => {
    if (confirm(t('hr.employees.confirmDelete'))) {
      setEmployees(employees.filter(e => e.employeeId !== employeeId));
    }
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
            {t('hr.title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('hr.subtitle')}
          </p>
          <HRSubNav />
        </div>

        <div className="flex items-center justify-between mb-4 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('hr.employees.title')}
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <span>+ {t('hr.employees.addEmployee')}</span>
          </button>
        </div>

        {employees.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {t('hr.employees.noEmployees')}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('hr.employees.employeeId')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('hr.employees.fullName')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('hr.employees.department')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('hr.employees.position')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('hr.employees.employmentDate')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('hr.employees.status')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('hr.employees.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {employees.map((employee) => (
                  <tr key={employee.employeeId} className="hover:bg-gray-50 dark:hover:bg-gray-800/70">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {employee.employeeId}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {employee.fullName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {employee.department}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {employee.position}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {new Date(employee.employmentDate).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={
                          employee.status === 'active'
                            ? 'inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }
                      >
                        {employee.status === 'active'
                          ? t('hr.employees.statusActive')
                          : t('hr.employees.statusInactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedEmployee(employee)}
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title={t('hr.employees.view')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingEmployee(employee)}
                          className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                          title={t('hr.employees.edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedEmployee && (
          <EmployeeCardModal
            employee={selectedEmployee}
            onClose={() => setSelectedEmployee(null)}
          />
        )}

        {showAddModal && (
          <EmployeeFormModal
            employees={employees}
            onClose={() => setShowAddModal(false)}
            onSave={(employee) => {
              setEmployees([...employees, employee]);
              setShowAddModal(false);
            }}
          />
        )}

        {editingEmployee && (
          <EmployeeFormModal
            employees={employees}
            employee={editingEmployee}
            onClose={() => setEditingEmployee(null)}
            onSave={(updatedEmployee) => {
              setEmployees(employees.map(e => 
                e.employeeId === updatedEmployee.employeeId ? updatedEmployee : e
              ));
              setEditingEmployee(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

interface EmployeeCardModalProps {
  employee: Employee;
  onClose: () => void;
}

function EmployeeCardModal({ employee, onClose }: EmployeeCardModalProps) {
  const { t } = useLanguage();

  const mockDocuments = [
    { id: 'DOC-001', name: t('hr.employees.contract'), type: 'PDF' },
    { id: 'DOC-002', name: t('hr.employees.order'), type: 'PDF' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('hr.employees.cardTitle')} - {employee.fullName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <DetailRow label={t('hr.employees.employeeId')} value={employee.employeeId} />
              <DetailRow label={t('hr.employees.fullName')} value={employee.fullName} />
              <DetailRow label={t('hr.employees.department')} value={employee.department} />
            </div>
            <div className="space-y-3">
              <DetailRow label={t('hr.employees.position')} value={employee.position} />
              <DetailRow
                label={t('hr.employees.employmentDate')}
                value={new Date(employee.employmentDate).toLocaleDateString('uz-UZ')}
              />
              <DetailRow
                label={t('hr.employees.status')}
                value={
                  employee.status === 'active'
                    ? t('hr.employees.statusActive')
                    : t('hr.employees.statusInactive')
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                {t('hr.employees.documents')}
              </h4>
              <div className="space-y-2">
                {mockDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900 dark:text-white">{doc.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({doc.type})
                      </span>
                    </div>
                    <button className="text-xs inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                      <Download className="w-3 h-3" />
                      {t('hr.download')}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                {t('hr.employees.notes')}
              </h4>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder={t('hr.employees.notesPlaceholder')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EmployeeFormModalProps {
  employees: Employee[];
  employee?: Employee;
  onClose: () => void;
  onSave: (employee: Employee) => void;
}

function EmployeeFormModal({ employees, employee, onClose, onSave }: EmployeeFormModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: employee?.fullName || '',
    department: employee?.department || '',
    position: employee?.position || '',
    employmentDate: employee?.employmentDate ? new Date(employee.employmentDate).toISOString().split('T')[0] : '',
    status: (employee?.status || 'active') as EmployeeStatus,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const departments = [
    'HR',
    'Ombor',
    'Ishlab chiqarish',
    'Texnik xizmat',
    'Buxgalteriya',
  ];

  const generateEmployeeId = () => {
    if (employees.length === 0) return 'EMP-001';
    const maxId = Math.max(...employees.map(e => {
      const num = parseInt(e.employeeId.split('-')[1]);
      return isNaN(num) ? 0 : num;
    }), 0);
    return `EMP-${String(maxId + 1).padStart(3, '0')}`;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = t('hr.employees.validation.fullNameRequired');
    }
    if (!formData.department) {
      newErrors.department = t('hr.employees.validation.departmentRequired');
    }
    if (!formData.position.trim()) {
      newErrors.position = t('hr.employees.validation.positionRequired');
    }
    if (!formData.employmentDate) {
      newErrors.employmentDate = t('hr.employees.validation.dateRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const employeeData: Employee = {
      employeeId: employee?.employeeId || generateEmployeeId(),
      fullName: formData.fullName.trim(),
      department: formData.department,
      position: formData.position.trim(),
      employmentDate: new Date(formData.employmentDate).toISOString(),
      status: formData.status,
    };

    onSave(employeeData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {employee ? t('hr.employees.editEmployee') : t('hr.employees.addEmployee')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('hr.employees.fullName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('hr.employees.department')} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.department ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <option value="">{t('hr.employees.selectDepartment')}</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            {errors.department && (
              <p className="mt-1 text-xs text-red-500">{errors.department}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('hr.employees.position')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.position ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.position && (
              <p className="mt-1 text-xs text-red-500">{errors.position}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('hr.employees.employmentDate')} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.employmentDate}
              onChange={(e) => setFormData({ ...formData, employmentDate: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.employmentDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.employmentDate && (
              <p className="mt-1 text-xs text-red-500">{errors.employmentDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('hr.employees.status')}
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as EmployeeStatus })}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t('hr.employees.statusActive')}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.status === 'inactive'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as EmployeeStatus })}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t('hr.employees.statusInactive')}
                </span>
              </label>
            </div>
          </div>

          {employee && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {t('hr.employees.employeeId')}: {employee.employeeId}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
            >
              {t('hr.employees.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {t('hr.employees.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white text-right">
        {value}
      </span>
    </div>
  );
}
