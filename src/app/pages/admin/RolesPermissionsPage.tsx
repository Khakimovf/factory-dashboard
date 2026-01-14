import { useState } from 'react';
import { Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  UserRole,
  PermissionModule,
  PermissionAction,
  Permission,
  getAllRolePermissions,
  setAllRolePermissions,
} from '../../utils/roleUtils';

const ROLE_DEFINITIONS: { key: UserRole; label: string }[] = [
  { key: 'ADMIN', label: 'Admin' },
  { key: 'director', label: 'Director' },
  { key: 'hr', label: 'HR' },
  { key: 'line_master', label: 'Operator' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'maintenance', label: 'Technician' },
];

const MODULES: PermissionModule[] = ['dashboard', 'warehouse', 'production', 'hr', 'maintenance', 'audit', 'roles'];

const ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'approve'];

type PermissionState = Record<UserRole, Set<string>>;

function makeKey(module: PermissionModule, action: PermissionAction): string {
  return `${module}:${action}`;
}

export function RolesPermissionsPage() {
  const { t } = useLanguage();

  const [permissions, setPermissions] = useState<PermissionState>(() => {
    const all = getAllRolePermissions();
    const initial: PermissionState = {} as PermissionState;

    ROLE_DEFINITIONS.forEach(role => {
      const rolePerms = (all[role.key] || []) as Permission[];
      initial[role.key] = new Set(rolePerms.map(p => makeKey(p.module, p.action)));
    });

    return initial;
  });

  const handleToggle = (role: UserRole, module: PermissionModule, action: PermissionAction) => {
    const key = makeKey(module, action);
    setPermissions(prev => {
      const current = prev[role] ? new Set(prev[role]) : new Set<string>();
      if (current.has(key)) {
        current.delete(key);
      } else {
        current.add(key);
      }

      const next: PermissionState = { ...prev, [role]: current };

      // Persist to role utils as structured data
      const nextMap = { ...getAllRolePermissions() } as Record<UserRole, Permission[]>;
      ROLE_DEFINITIONS.forEach(r => {
        const roleSet = next[r.key] || new Set<string>();
        const list: Permission[] = [];
        roleSet.forEach(value => {
          const [mod, act] = value.split(':') as [PermissionModule, PermissionAction];
          list.push({ module: mod, action: act });
        });
        nextMap[r.key] = list;
      });

      setAllRolePermissions(nextMap as any);

      return next;
    });
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Rollar va ruxsatlar</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('header.auditLog') /* reuse subtle label style */} – mock role management for frontend only
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Rol</th>
                {MODULES.map(module => (
                  <th key={module} className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                    {module.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {ROLE_DEFINITIONS.map(role => (
                <tr key={role.key}>
                  <td className="px-4 py-3 align-top">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">{role.label}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {role.key}
                    </div>
                  </td>
                  {MODULES.map(module => (
                    <td key={module} className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {ACTIONS.map(action => {
                          const key = makeKey(module, action);
                          const checked = permissions[role.key]?.has(key) ?? false;
                          return (
                            <label
                              key={action}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={checked}
                                onChange={() => handleToggle(role.key, module, action)}
                              />
                              <span className="text-[10px] uppercase text-gray-600 dark:text-gray-300">
                                {action}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

