import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Milan center coordinates (Duomo di Milano)
const MILAN_CENTER = { lat: 45.4642, lng: 9.1900 }
const MILAN_RADIUS_KM = 20
const MIN_TRIP_DISTANCE_KM = 80

/**
 * Calculate the distance between two points using the Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistanceBetweenPoints(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371 // Earth's radius in kilometers
  
  const dLat = toRadians(point2.lat - point1.lat)
  const dLng = toRadians(point2.lng - point1.lng)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Check if a location is within Milan metropolitan area (20km radius)
 */
export function isLocationNearMilan(coordinates: { lat: number; lng: number }): boolean {
  const distanceFromMilan = calculateDistanceBetweenPoints(coordinates, MILAN_CENTER)
  return distanceFromMilan <= MILAN_RADIUS_KM
}

/**
 * Validate if a trip meets the minimum distance requirements
 * Trip must be >= 80km UNLESS at least one point is near Milan (within 20km)
 */
export function validateTripDistance(
  tripDistanceKm: number,
  pickupCoordinates?: { lat: number; lng: number },
  destinationCoordinates?: { lat: number; lng: number }
): { isValid: boolean; reason?: string } {
  // If we don't have coordinates for both points, we cannot validate the Milan exception
  if (!pickupCoordinates || !destinationCoordinates) {
    // Default to standard validation if coordinates are missing
    return {
      isValid: tripDistanceKm >= MIN_TRIP_DISTANCE_KM,
      reason: tripDistanceKm < MIN_TRIP_DISTANCE_KM 
        ? `La distanza minima richiesta è ${MIN_TRIP_DISTANCE_KM}km. Distanza attuale: ${tripDistanceKm.toFixed(1)}km`
        : undefined
    }
  }
  
  const isPickupNearMilan = isLocationNearMilan(pickupCoordinates)
  const isDestinationNearMilan = isLocationNearMilan(destinationCoordinates)
  
  // If at least one point is near Milan, trip can be any distance
  if (isPickupNearMilan || isDestinationNearMilan) {
    return { isValid: true }
  }
  
  // If neither point is near Milan, must be >= 80km
  const isValid = tripDistanceKm >= MIN_TRIP_DISTANCE_KM
  return {
    isValid,
    reason: isValid ? undefined : 
      `I viaggi devono essere di almeno ${MIN_TRIP_DISTANCE_KM}km se non includono Milano. ` +
      `Distanza attuale: ${tripDistanceKm.toFixed(1)}km. ` +
      `Per viaggi più brevi, almeno un punto deve essere nell'area di Milano (entro ${MILAN_RADIUS_KM}km dal centro).`
  }
}

