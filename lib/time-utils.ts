/**
 * UNIFIED TIME CONVERSION UTILITIES
 * Single source of truth for all time conversions in the app
 */

export interface TimeConversion {
  hour24: number
  totalMinutes: number
}

export interface Time12h {
  hour12: string
  ampm: string
}

export const timeUtils = {
  /**
   * Convert any time to 24h format and total minutes
   * Handles both 12h (with AM/PM) and 24h formats
   */
  to24h: (hour: string, minutes: string, ampm?: string): TimeConversion => {
    const mins = parseInt(minutes) || 0
    let hour24 = parseInt(hour) || 0
    
    if (ampm) {
      // Source is 12h format
      if (ampm === "PM" && hour24 !== 12) {
        hour24 += 12  // 1-11 PM = 13-23
      } else if (ampm === "AM" && hour24 === 12) {
        hour24 = 0    // 12 AM = 00 (mezzanotte)
      }
      // 12 PM stays 12 (mezzogiorno)
    }
    // If no ampm, it's already 24h format
    
    return { hour24, totalMinutes: hour24 * 60 + mins }
  },
  
  /**
   * Convert 24h hour to 12h format
   */
  to12h: (hour24: number): Time12h => {
    if (hour24 === 0) return { hour12: "12", ampm: "AM" }      // 00 = 12 AM
    if (hour24 < 12) return { hour12: hour24.toString(), ampm: "AM" }  // 01-11 = 1-11 AM
    if (hour24 === 12) return { hour12: "12", ampm: "PM" }     // 12 = 12 PM
    return { hour12: (hour24 - 12).toString(), ampm: "PM" }    // 13-23 = 1-11 PM
  },

  /**
   * Check if a time is during night hours (19:30-07:30)
   * Uses the exact logic from the original pricing system
   */
  isNightTime: (hour: string, minutes: string, ampm?: string): boolean => {
    const { totalMinutes } = timeUtils.to24h(hour, minutes, ampm)
    // Night time: 19:30 (1170 minutes) to 07:30 (450 minutes)
    return totalMinutes >= 1170 || totalMinutes <= 450
  }
} 