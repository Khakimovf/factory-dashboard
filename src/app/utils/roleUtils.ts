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
  | 'line_master';

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

/**
 * Set mock user role (for testing purposes only)
 */
export function setMockUserRole(role: UserRole): void {
  localStorage.setItem('mock_user_role', role);
}

