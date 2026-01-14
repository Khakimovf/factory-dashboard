/**
 * Mock role utility for frontend-only role checking
 * In production, this should be replaced with actual authentication/authorization
 */

export type UserRole =
  | 'system_owner'
  | 'director'
  | 'hr'
  | 'warehouse'
  | 'maintenance'
  | 'line_master'
  | 'ADMIN'
  | 'WAREHOUSE_MANAGER'
  | 'WAREHOUSE_STAFF'
  | 'EMPLOYEE'
  | 'canteen';

export type PermissionModule =
  | 'dashboard'
  | 'warehouse'
  | 'production'
  | 'hr'
  | 'maintenance'
  | 'audit'
  | 'roles';

export type PermissionAction = 'view' | 'create' | 'edit' | 'approve';

export interface Permission {
  module: PermissionModule;
  action: PermissionAction;
}

type RolePermissionMap = Record<UserRole, Permission[]>;

const PERMISSIONS_STORAGE_KEY = 'mock_role_permissions_v1';

const ALL_MODULES: PermissionModule[] = [
  'dashboard',
  'warehouse',
  'production',
  'hr',
  'maintenance',
  'audit',
  'roles',
];

const ALL_ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'approve'];

const DEFAULT_ROLE_PERMISSIONS: RolePermissionMap = {
  system_owner: ALL_MODULES.flatMap(module =>
    ALL_ACTIONS.map(action => ({ module, action })),
  ),
  ADMIN: ALL_MODULES.flatMap(module =>
    ALL_ACTIONS.map(action => ({ module, action })),
  ),
  director: [
    { module: 'dashboard', action: 'view' },
    { module: 'production', action: 'view' },
    { module: 'hr', action: 'view' },
    { module: 'hr', action: 'approve' },
    { module: 'audit', action: 'view' },
  ],
  hr: [
    { module: 'hr', action: 'view' },
    { module: 'hr', action: 'create' },
    { module: 'hr', action: 'edit' },
  ],
  warehouse: [
    { module: 'warehouse', action: 'view' },
  ],
  maintenance: [
    { module: 'maintenance', action: 'view' },
    { module: 'maintenance', action: 'create' },
  ],
  line_master: [
    { module: 'production', action: 'view' },
    { module: 'production', action: 'create' },
  ],
  WAREHOUSE_MANAGER: [
    { module: 'warehouse', action: 'view' },
    { module: 'warehouse', action: 'create' },
    { module: 'warehouse', action: 'edit' },
  ],
  WAREHOUSE_STAFF: [
    { module: 'warehouse', action: 'view' },
    { module: 'warehouse', action: 'edit' },
  ],
  EMPLOYEE: [
    { module: 'dashboard', action: 'view' },
    { module: 'production', action: 'view' },
  ],
  canteen: [
    { module: 'dashboard', action: 'view' },
    // Canteen role has read-only access to canteen module (handled in component)
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
  return role === 'ADMIN' || role === 'system_owner';
}

/**
 * Check if current user is an employee
 */
export function isEmployee(): boolean {
  return getCurrentUserRole() === 'EMPLOYEE';
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
  return hasPermission('warehouse', 'create');
}

/**
 * Check if user can update material quantities
 */
export function canUpdateQuantities(): boolean {
  return hasPermission('warehouse', 'edit');
}

/**
 * Check if user can delete materials (ADMIN only, future feature)
 */
export function canDeleteMaterials(): boolean {
  return hasPermission('warehouse', 'approve');
}

