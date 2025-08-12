// Distance validation utility for booking form
import { extractCityFromAddress } from './locality-mapping'

// Milano center coordinates (Duomo)
const MILANO_CENTER_COORDINATES = { lat: 45.4642, lng: 9.1900 }

// Radius for Milano province (more generous than internal transfers)
const MILANO_PROVINCE_RADIUS_KM = 35 // Covers the whole metropolitan area including Monza, etc.

// Minimum distance requirement
const MINIMUM_DISTANCE_KM = 80

// Calculate distance between two coordinates using Haversine formula
function calculateDistanceKm(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Check if a location is in Milano province based on coordinates
function isInMilanoProvince(coordinates?: { lat: number; lng: number }): boolean {
  if (!coordinates) return false
  
  const distanceFromMilano = calculateDistanceKm(MILANO_CENTER_COORDINATES, coordinates)
  return distanceFromMilano <= MILANO_PROVINCE_RADIUS_KM
}

// Check if an address contains Milano
function addressContainsMilano(address: string): boolean {
  if (!address) return false
  
  const extractedCity = extractCityFromAddress(address)
  return extractedCity === 'Milano'
}

// Check if either pickup or destination is in Milano province
function isEitherLocationInMilano(
  pickup: { address: string; coordinates?: { lat: number; lng: number } },
  destination: { address: string; coordinates?: { lat: number; lng: number } }
): boolean {
  // Check coordinates first (more reliable)
  if (isInMilanoProvince(pickup.coordinates) || isInMilanoProvince(destination.coordinates)) {
    return true
  }
  
  // Fallback to address analysis
  if (addressContainsMilano(pickup.address) || addressContainsMilano(destination.address)) {
    return true
  }
  
  return false
}

// Main validation function
export function validateDistanceRequirement(
  distanceKm?: number,
  pickup?: { address: string; coordinates?: { lat: number; lng: number } },
  destination?: { address: string; coordinates?: { lat: number; lng: number } }
): {
  isValid: boolean
  errorMessage?: string
} {
  // If no distance available, we can't validate (assume valid for now)
  if (!distanceKm || !pickup || !destination) {
    return { isValid: true }
  }
  
  // If distance is >= 80km, always valid
  if (distanceKm >= MINIMUM_DISTANCE_KM) {
    return { isValid: true }
  }
  
  // If distance is < 80km, check if either location is in Milano province
  const hasMillanoLocation = isEitherLocationInMilano(pickup, destination)
  
  if (hasMillanoLocation) {
    return { isValid: true }
  }
  
  // Distance < 80km and no Milano location = invalid
  return {
    isValid: false,
    errorMessage: `Il viaggio deve essere di almeno ${MINIMUM_DISTANCE_KM}km a meno che uno dei punti non sia nella provincia di Milano. Distanza attuale: ${distanceKm.toFixed(1)}km.`
  }
}

export { MINIMUM_DISTANCE_KM, MILANO_PROVINCE_RADIUS_KM }