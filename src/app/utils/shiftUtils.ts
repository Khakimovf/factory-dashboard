/**
 * Shift utility functions for factory production lines
 * Morning: 08:00 - 19:50
 * Night: 20:00 - 07:50
 */

export type ShiftType = 'morning' | 'night';

export interface ShiftInfo {
  type: ShiftType;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  startDateTime: Date;
  endDateTime: Date;
}

/**
 * Get current shift based on current time
 * Morning: 08:00 - 19:50
 * Night: 20:00 - 07:50 (next day)
 */
export function getCurrentShift(): ShiftType {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes; // minutes since midnight

  // Morning shift: 08:00 (480 min) to 19:50 (1190 min)
  // Night shift: 20:00 (1200 min) to 07:50 (470 min next day)
  
  if (currentTime >= 480 && currentTime < 1200) {
    return 'morning';
  } else {
    return 'night';
  }
}

/**
 * Get shift information for current shift
 */
export function getCurrentShiftInfo(): ShiftInfo {
  const now = new Date();
  const shiftType = getCurrentShift();
  
  if (shiftType === 'morning') {
    const startDateTime = new Date(now);
    startDateTime.setHours(8, 0, 0, 0);
    
    const endDateTime = new Date(now);
    endDateTime.setHours(19, 50, 0, 0);
    
    return {
      type: 'morning',
      startTime: '08:00',
      endTime: '19:50',
      startDateTime,
      endDateTime,
    };
  } else {
    // Night shift: starts today at 20:00, ends tomorrow at 07:50
    const startDateTime = new Date(now);
    startDateTime.setHours(20, 0, 0, 0);
    
    const endDateTime = new Date(now);
    endDateTime.setDate(endDateTime.getDate() + 1);
    endDateTime.setHours(7, 50, 0, 0);
    
    return {
      type: 'night',
      startTime: '20:00',
      endTime: '07:50',
      startDateTime,
      endDateTime,
    };
  }
}

/**
 * Check if current time is within shift hours
 */
export function isWithinShiftHours(): boolean {
  const now = new Date();
  const shiftInfo = getCurrentShiftInfo();
  
  return now >= shiftInfo.startDateTime && now <= shiftInfo.endDateTime;
}

/**
 * Check if shift has ended
 */
export function hasShiftEnded(): boolean {
  const now = new Date();
  const shiftInfo = getCurrentShiftInfo();
  
  return now > shiftInfo.endDateTime;
}

/**
 * Get time remaining until shift end (in minutes)
 */
export function getTimeUntilShiftEnd(): number {
  const now = new Date();
  const shiftInfo = getCurrentShiftInfo();
  
  if (now > shiftInfo.endDateTime) {
    return 0; // Shift already ended
  }
  
  const diffMs = shiftInfo.endDateTime.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60));
}

/**
 * Format shift label
 */
export function getShiftLabel(shift: ShiftType): string {
  return shift === 'morning' ? 'Kunduzi' : 'Tungi';
}
