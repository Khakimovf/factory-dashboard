/**
 * Shift Management Service
 * Handles shift assignments, line masters, and production tracking
 * Backend-ready structure for API integration
 */

import { ShiftType } from '../utils/shiftUtils';

export interface LineMaster {
  employeeId: string;
  fullName: string;
  position: string;
  department: string;
}

export interface ShiftAssignment {
  id: string;
  lineId: string;
  lineName: string;
  shiftType: ShiftType;
  lineMaster: LineMaster | null;
  workersCount: number;
  maxWorkers: number;
  shiftStartTime: string; // ISO string
  shiftEndTime: string; // ISO string
  status: 'active' | 'completed' | 'not_completed';
  createdAt: string; // ISO string
  updatedAt: string; // ISO string;
}

export interface ProductionEvent {
  id: string;
  lineId: string;
  shiftAssignmentId: string;
  eventType: 'part_detected' | 'defect_detected' | 'line_stopped' | 'line_resumed';
  partNumber?: string;
  timestamp: string; // ISO string
  metadata?: Record<string, any>;
}

export interface ShiftSummary {
  shiftAssignmentId: string;
  lineId: string;
  shiftType: ShiftType;
  plannedQuantity: number;
  producedQuantity: number;
  remainingQuantity: number;
  completionPercentage: number;
  status: 'completed' | 'not_completed';
  shiftStartTime: string;
  shiftEndTime: string;
  lineMaster: LineMaster | null;
  eventsCount: number;
  defectsCount: number;
}

/**
 * Mock API functions (replace with actual API calls)
 */

// Get current shift assignment for a line
export async function getCurrentShiftAssignment(lineId: string): Promise<ShiftAssignment | null> {
  // TODO: Replace with actual API call
  // GET /api/production/lines/{lineId}/shifts/current
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null); // Mock: no assignment yet
    }, 300);
  });
}

// Create or update shift assignment
export async function assignShiftMaster(
  lineId: string,
  shiftType: ShiftType,
  lineMaster: LineMaster,
  workersCount: number
): Promise<ShiftAssignment> {
  // TODO: Replace with actual API call
  // POST /api/production/shifts/assign
  return new Promise((resolve) => {
    setTimeout(() => {
      const now = new Date();
      const shiftStart = new Date(now);
      shiftStart.setHours(shiftType === 'morning' ? 8 : 20, 0, 0, 0);
      
      const shiftEnd = new Date(now);
      if (shiftType === 'night') {
        shiftEnd.setDate(shiftEnd.getDate() + 1);
      }
      shiftEnd.setHours(shiftType === 'morning' ? 19 : 7, shiftType === 'morning' ? 50 : 50, 0, 0);

      resolve({
        id: `shift-${Date.now()}`,
        lineId,
        lineName: `Line ${lineId}`,
        shiftType,
        lineMaster,
        workersCount,
        maxWorkers: 16,
        shiftStartTime: shiftStart.toISOString(),
        shiftEndTime: shiftEnd.toISOString(),
        status: 'active',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }, 300);
  });
}

// Record production event (camera detection)
export async function recordProductionEvent(
  lineId: string,
  shiftAssignmentId: string,
  eventType: ProductionEvent['eventType'],
  partNumber?: string,
  metadata?: Record<string, any>
): Promise<ProductionEvent> {
  // TODO: Replace with actual API call
  // POST /api/production/events
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: `event-${Date.now()}`,
        lineId,
        shiftAssignmentId,
        eventType,
        partNumber,
        timestamp: new Date().toISOString(),
        metadata,
      });
    }, 100);
  });
}

// Get shift summary
export async function getShiftSummary(shiftAssignmentId: string): Promise<ShiftSummary | null> {
  // TODO: Replace with actual API call
  // GET /api/production/shifts/{shiftAssignmentId}/summary
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null); // Mock
    }, 300);
  });
}

// End shift and generate summary
export async function endShift(shiftAssignmentId: string): Promise<ShiftSummary> {
  // TODO: Replace with actual API call
  // POST /api/production/shifts/{shiftAssignmentId}/end
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Not implemented'));
    }, 300);
  });
}
