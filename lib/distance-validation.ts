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
  if (!coordinates) {
    console.log("📍 No coordinates provided for Milano check")
    return false
  }
  
  const distanceFromMilano = calculateDistanceKm(MILANO_CENTER_COORDINATES, coordinates)
  const isInProvince = distanceFromMilano <= MILANO_PROVINCE_RADIUS_KM
  
  console.log("🏢 Milano province check:", {
    coordinates,
    distanceFromMilano: distanceFromMilano.toFixed(1),
    radiusLimit: MILANO_PROVINCE_RADIUS_KM,
    isInProvince
  })
  
  return isInProvince
}

// Check if an address contains Milano
function addressContainsMilano(address: string): boolean {
  if (!address) {
    console.log("📝 No address provided for Milano text check")
    return false
  }
  
  const extractedCity = extractCityFromAddress(address)
  const isMilano = extractedCity === 'Milano'
  
  console.log("📝 Address Milano check:", {
    address,
    extractedCity,
    isMilano
  })
  
  return isMilano
}

// Check if either pickup or destination is in Milano province
function isEitherLocationInMilano(
  pickup: { address: string; coordinates?: { lat: number; lng: number } },
  destination: { address: string; coordinates?: { lat: number; lng: number } }
): boolean {
  console.log("🏢 Checking Milano involvement:", {
    pickupAddress: pickup.address,
    destinationAddress: destination.address,
    pickupCoords: pickup.coordinates,
    destinationCoords: destination.coordinates
  })

  // Check coordinates first (more reliable)
  const pickupInMilano = isInMilanoProvince(pickup.coordinates)
  const destinationInMilano = isInMilanoProvince(destination.coordinates)
  
  console.log("📍 Coordinate-based Milano check:", {
    pickupInMilano,
    destinationInMilano
  })

  if (pickupInMilano || destinationInMilano) {
    console.log("✅ Milano detected via coordinates")
    return true
  }
  
  // Fallback to address analysis
  const pickupAddressMilano = addressContainsMilano(pickup.address)
  const destinationAddressMilano = addressContainsMilano(destination.address)
  
  console.log("📝 Address-based Milano check:", {
    pickupAddressMilano,
    destinationAddressMilano
  })
  
  if (pickupAddressMilano || destinationAddressMilano) {
    console.log("✅ Milano detected via address")
    return true
  }
  
  console.log("❌ No Milano detected")
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
  console.log("🔍 DISTANCE VALIDATION DEBUG:", {
    distanceKm,
    pickup: pickup?.address,
    destination: destination?.address,
    pickupCoords: pickup?.coordinates,
    destinationCoords: destination?.coordinates
  })

  // If we don't have pickup/destination info, we can't validate
  if (!pickup || !destination) {
    console.log("❌ Missing pickup/destination info")
    return { isValid: true }
  }

  // If no distance available but we have coordinates, try to determine if Milano is involved
  if (!distanceKm) {
    console.log("⚠️ No distance available, checking Milano involvement...")
    // If we can determine that Milano is involved from address/coordinates, allow it
    const hasMillanoLocation = isEitherLocationInMilano(pickup, destination)
    console.log("🏢 Milano check result:", hasMillanoLocation)
    
    if (hasMillanoLocation) {
      console.log("✅ Milano detected, allowing without distance")
      return { isValid: true }
    }
    
    // If we can't determine distance AND can't confirm Milano involvement, block it
    console.log("❌ No distance AND no Milano -> BLOCKING")
    return {
      isValid: false,
      errorMessage: "Impossibile calcolare la distanza del viaggio. Per viaggi sotto 80km è necessario che almeno uno dei punti sia nella provincia di Milano. Riprova o contatta il supporto."
    }
  }
  
  console.log("📏 Distance available:", distanceKm, "km")
  
  // If distance is >= 80km, always valid
  if (distanceKm >= MINIMUM_DISTANCE_KM) {
    console.log("✅ Distance >= 80km -> VALID")
    return { isValid: true }
  }
  
  // If distance is < 80km, check if either location is in Milano province
  console.log("⚠️ Distance < 80km, checking Milano...")
  const hasMillanoLocation = isEitherLocationInMilano(pickup, destination)
  console.log("🏢 Milano check result:", hasMillanoLocation)
  
  if (hasMillanoLocation) {
    console.log("✅ Distance < 80km BUT Milano detected -> VALID")
    return { isValid: true }
  }
  
  // Distance < 80km and no Milano location = invalid
  console.log("❌ Distance < 80km AND no Milano -> BLOCKING")
  return {
    isValid: false,
    errorMessage: `Il viaggio deve essere di almeno ${MINIMUM_DISTANCE_KM}km a meno che uno dei punti non sia nella provincia di Milano. Distanza attuale: ${distanceKm.toFixed(1)}km.`
  }
}

export { MINIMUM_DISTANCE_KM, MILANO_PROVINCE_RADIUS_KM }