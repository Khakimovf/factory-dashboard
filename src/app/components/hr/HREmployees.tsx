import { useMemo, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { HRSubNav } from './HRSubNav';
import { hrEmployees, Employee, EmployeeStatus } from '../../data/hrEmployees';
import { Download, FileText, Eye, Edit2, X, Search } from 'lucide-react';

export function HREmployees() {
  const { t } = useLanguage();
  const [employees, setEmployees] = useState<Employee[]>(hrEmployees);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | EmployeeStatus>('all');

  const handleDelete = (employeeId: string) => {
    if (confirm(t('hr.employees.confirmDelete'))) {
      setEmployees(employees.filter(e => e.employeeId !== employeeId));
    }
  };

  // Distinct lists for dropdowns, derived from the current employee list
  const departments = useMemo(
    () => Array.from(new Set(employees.map(e => e.department))).sort(),
    [employees],
  );
  const positions = useMemo(
    () => Array.from(new Set(employees.map(e => e.position))).sort(),
    [employees],
  );

  // Combined filtering logic: search + department + position + status
  const filteredEmployees = useMemo(
    () =>
      employees.filter((employee) => {
        const term = searchTerm.trim().toLowerCase();

        const matchesSearch =
          term.length === 0 ||
          employee.employeeId.toLowerCase().includes(term) ||
          employee.fullName.toLowerCase().includes(term) ||
          employee.position.toLowerCase().includes(term);

        const matchesDepartment =
          departmentFilter === 'all' || employee.department === departmentFilter;

        const matchesPosition =
          positionFilter === 'all' || employee.position === positionFilter;

        const matchesStatus =
          statusFilter === 'all' || employee.status === statusFilter;

        return matchesSearch && matchesDepartment && matchesPosition && matchesStatus;
      }),
    [employees, searchTerm, departmentFilter, positionFilter, statusFilter],
  );

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    departmentFilter !== 'all' ||
    positionFilter !== 'all' ||
    statusFilter !== 'all';

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

        <div className="flex items-center justify-between mb-5 mt-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('hr.employees.title')}
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <span>+ {t('hr.employees.addEmployee')}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
            {/* Global search */}
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ID, F.I.Sh. yoki lavozim bo‘yicha qidirish"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Dropdown filters */}
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
              >
                <option value="all">Barcha bo‘limlar</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
              >
                <option value="all">Barcha lavozimlar</option>
                {positions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | EmployeeStatus)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
              >
                <option value="all">{t('hr.all')}</option>
                <option value="active">{t('hr.employees.statusActive')}</option>
                <option value="inactive">{t('hr.employees.statusInactive')}</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setDepartmentFilter('all');
                    setPositionFilter('all');
                    setStatusFilter('all');
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Filtrlarni tozalash
                </button>
              )}
            </div>
          </div>
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
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      Mos keladigan xodim topilmadi
                    </td>
                  </tr>
                )}
                {filteredEmployees.map((employee) => (
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
                            : employee.status === 'sick'
                            ? 'inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                            : employee.status === 'vacation'
                            ? 'inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                            : employee.status === 'absent'
                            ? 'inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                            : 'inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }
                      >
                        {employee.status === 'active'
                          ? t('hr.employees.statusActive')
                          : employee.status === 'sick'
                          ? t('hr.employees.statusSick')
                          : employee.status === 'vacation'
                          ? t('hr.employees.statusVacation')
                          : employee.status === 'absent'
                          ? t('hr.employees.statusAbsent')
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
  );
}

interface EmployeeCardModalProps {
  employee: Employee;
  onClose: () => void;
}

function EmployeeCardModal({ employee, onClose }: EmployeeCardModalProps) {
  const { t } = useLanguage();

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
                    : employee.status === 'sick'
                    ? t('hr.employees.statusSick')
                    : employee.status === 'vacation'
                    ? t('hr.employees.statusVacation')
                    : employee.status === 'absent'
                    ? t('hr.employees.statusAbsent')
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
                {/* Labor contract document (if uploaded) */}
                {employee.laborContract ? (
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900/40">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {t('hr.employees.contract')}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        (PDF)
                      </span>
                    </div>
                    {/* In this mock setup we only have file name, but keep download button for UX parity */}
                    <button className="text-xs inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                      <Download className="w-3 h-3" />
                      {t('hr.download')}
                    </button>
                  </div>
                ) : null}

                {/* Hiring order document (if uploaded) */}
                {employee.hiringOrder ? (
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900/40">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {t('hr.employees.order')}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        (PDF)
                      </span>
                    </div>
                    {/* Same as above – mock download action */}
                    <button className="text-xs inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                      <Download className="w-3 h-3" />
                      {t('hr.download')}
                    </button>
                  </div>
                ) : null}

                {/* If no documents are attached, show explicit message */}
                {!employee.laborContract && !employee.hiringOrder && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Hujjat yuklanmagan
                  </p>
                )}
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
  // Local state for optional document uploads (PDF files)
  const [documents, setDocuments] = useState<{
    laborContract: File | null;
    hiringOrder: File | null;
  }>({
    laborContract: null,
    hiringOrder: null,
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
      // In this mock implementation we persist only the file name as a reference
      laborContract: documents.laborContract?.name || employee?.laborContract,
      hiringOrder: documents.hiringOrder?.name || employee?.hiringOrder,
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

          {/* Optional employee documents (local-only, PDF) */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('hr.employees.documents')}
            </label>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Mehnat shartnomasi (PDF)
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) =>
                  setDocuments((prev) => ({
                    ...prev,
                    laborContract: e.target.files?.[0] || null,
                  }))
                }
                className="w-full text-xs text-gray-700 dark:text-gray-300 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {documents.laborContract && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {documents.laborContract.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Qabul qilish buyrug‘i (PDF)
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) =>
                  setDocuments((prev) => ({
                    ...prev,
                    hiringOrder: e.target.files?.[0] || null,
                  }))
                }
                className="w-full text-xs text-gray-700 dark:text-gray-300 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {documents.hiringOrder && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {documents.hiringOrder.name}
                </p>
              )}
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
