/**
 * Mock role utility for frontend-only role checking
 * In production, this should be replaced with actual authentication/authorization
 */

export type UserRole =
  | 'SUPER_ADMIN'
  | 'QC_MANAGER'
  | 'QC_OPERATOR'
  | 'VGM_GUARD'
  | 'CANTEEN_MANAGER'
  | 'ADMIN'
  | 'WAREHOUSE_ADMIN'
  | 'FACTORY_MANAGER'
  | 'system_owner'
  | 'IT_SPECIALIST'
  | 'director'
  | 'hr'
  | 'warehouse'
  | 'maintenance'
  | 'line_master'
  | 'WAREHOUSE_MANAGER'
  | 'WAREHOUSE_STAFF'
  | 'EMPLOYEE'
  | 'canteen';

export type PermissionModule =
  | 'dashboard'
  | 'qc'
  | 'vgm'
  | 'canteen'
  | 'admin'
  | 'warehouse'
  | 'production'
  | 'hr'
  | 'maintenance'
  | 'audit'
  | 'roles';

export type PermissionAction = 'READ' | 'WRITE' | 'ADMIN' | 'view' | 'create' | 'edit' | 'approve';

export interface Permission {
  module: PermissionModule;
  action: PermissionAction;
}

type RolePermissionMap = Record<UserRole, Permission[]>;

const PERMISSIONS_STORAGE_KEY = 'mock_role_permissions_v1';

const ALL_MODULES: PermissionModule[] = [
  'dashboard',
  'qc',
  'vgm',
  'canteen',
  'admin',
  'warehouse',
  'production',
  'hr',
  'maintenance',
  'audit',
  'roles',
];

const ALL_ACTIONS: PermissionAction[] = ['READ', 'WRITE', 'ADMIN'];

const DEFAULT_ROLE_PERMISSIONS: RolePermissionMap = {
  system_owner: ALL_MODULES.flatMap(module =>
    ALL_ACTIONS.map(action => ({ module, action })),
  ),
  IT_SPECIALIST: ALL_MODULES.flatMap(module =>
    ALL_ACTIONS.map(action => ({ module, action })),
  ),
  SUPER_ADMIN: ALL_MODULES.flatMap(module =>
    ALL_ACTIONS.map(action => ({ module, action })),
  ),
  ADMIN: ALL_MODULES.flatMap(module =>
    ALL_ACTIONS.map(action => ({ module, action })),
  ),
  director: [
    { module: 'dashboard', action: 'READ' },
    { module: 'production', action: 'READ' },
    { module: 'hr', action: 'READ' },
    { module: 'hr', action: 'ADMIN' },
  ],
  hr: [
    { module: 'hr', action: 'READ' },
    { module: 'hr', action: 'WRITE' },
    { module: 'hr', action: 'ADMIN' },
  ],
  warehouse: [
    { module: 'warehouse', action: 'READ' },
  ],
  maintenance: [
    { module: 'maintenance', action: 'READ' },
    { module: 'maintenance', action: 'WRITE' },
  ],
  line_master: [
    { module: 'production', action: 'READ' },
    { module: 'production', action: 'WRITE' },
  ],
  WAREHOUSE_MANAGER: [
    { module: 'warehouse', action: 'READ' },
    { module: 'warehouse', action: 'WRITE' },
    { module: 'warehouse', action: 'ADMIN' },
  ],
  WAREHOUSE_STAFF: [
    { module: 'warehouse', action: 'READ' },
    { module: 'warehouse', action: 'WRITE' },
  ],
  EMPLOYEE: [
    { module: 'dashboard', action: 'READ' },
    { module: 'production', action: 'READ' },
  ],
  canteen: [
    { module: 'dashboard', action: 'READ' },
  ],
  QC_OPERATOR: [
    { module: 'dashboard', action: 'READ' },
    { module: 'production', action: 'READ' },
    { module: 'qc', action: 'WRITE' },
  ],
  VGM_GUARD: [
    { module: 'dashboard', action: 'READ' },
    { module: 'vgm', action: 'WRITE' },
  ],
  QC_MANAGER: [
    { module: 'dashboard', action: 'READ' },
    { module: 'production', action: 'READ' },
    { module: 'qc', action: 'ADMIN' },
  ],
  CANTEEN_MANAGER: [
    { module: 'dashboard', action: 'READ' },
    { module: 'canteen', action: 'ADMIN' },
  ],
  WAREHOUSE_ADMIN: [
    { module: 'warehouse', action: 'READ' },
    { module: 'warehouse', action: 'WRITE' },
    { module: 'warehouse', action: 'ADMIN' },
  ],
  FACTORY_MANAGER: [
    { module: 'dashboard', action: 'READ' },
    { module: 'production', action: 'READ' },
    { module: 'hr', action: 'READ' },
    { module: 'maintenance', action: 'READ' },
  ],
};

let cachedPermissions: RolePermissionMap | null = null;

function loadRolePermissions(): RolePermissionMap {
  try {
    const raw = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (!raw) return DEFAULT_ROLE_PERMISSIONS;
    const parsed = JSON.parse(raw) as RolePermissionMap;
    return {
      ...DEFAULT_ROLE_PERMISSIONS,
      ...parsed,
    };
  } catch {
    return DEFAULT_ROLE_PERMISSIONS;
  }
}

function getPermissionMap(): RolePermissionMap {
  if (!cachedPermissions) {
    cachedPermissions = loadRolePermissions();
  }
  return cachedPermissions;
}

export function getAllRolePermissions(): RolePermissionMap {
  return getPermissionMap();
}

export function setAllRolePermissions(map: RolePermissionMap): void {
  cachedPermissions = map;
  try {
    localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors in mock environment
  }
}

export function getRolePermissions(role: UserRole): Permission[] {
  const map = getPermissionMap();
  return map[role] || [];
}

export function hasPermission(module: PermissionModule, action: PermissionAction): boolean {
  const role = getCurrentUserRole();
  const permissions = getRolePermissions(role);
  return permissions.some(p => p.module === module && p.action === action);
}

/**
 * Get current user role (mock implementation)
 * In production, this should come from auth context/API
 */
export function getCurrentUserRole(): UserRole {
  // Mock: Return system_owner for now
  // In production, this should check actual user session/auth
  const mockRole = localStorage.getItem('mock_user_role') as UserRole | null;
  return mockRole || 'system_owner';
}

/**
 * Check if current user is system owner
 */
export function isSystemOwner(): boolean {
  return getCurrentUserRole() === 'system_owner';
}

export function isAdmin(): boolean {
  const role = getCurrentUserRole();
  return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'system_owner' || role === 'IT_SPECIALIST';
}

/**
 * Check if current user is an employee
 */
export function isEmployee(): boolean {
  return getCurrentUserRole() === 'EMPLOYEE';
}

/**
 * Check if current user is a QC operator
 */
export function isQCOperator(): boolean {
  return getCurrentUserRole() === 'QC_OPERATOR';
}

/**
 * Set mock user role (for testing purposes only)
 */
export function setMockUserRole(role: UserRole): void {
  localStorage.setItem('mock_user_role', role);
}

/**
 * Check if user can add materials (ADMIN or WAREHOUSE_MANAGER)
 */
export function canAddMaterials(): boolean {
  return hasPermission('warehouse', 'WRITE');
}

/**
 * Check if user can update material quantities
 */
export function canUpdateQuantities(): boolean {
  return hasPermission('warehouse', 'WRITE');
}

/**
 * Check if user can delete materials (ADMIN only, future feature)
 */
export function canDeleteMaterials(): boolean {
  return hasPermission('warehouse', 'ADMIN');
}

