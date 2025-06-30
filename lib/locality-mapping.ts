import { getAllLocations, type Location } from '@/lib/event-pricing'

// Mappa le località di Google alle nostre location del listino
interface LocalityMapping {
  googleNames: string[]        // Possibili nomi che Google può restituire
  locationId: string          // ID della location nel nostro listino
  priority: number           // Priorità per disambiguare (più alto = prioritario)
  aliases?: string[]         // Alias aggiuntivi (abbreviazioni, nomi alternativi)
}

// Configurazione completa delle mappature
const LOCALITY_MAPPINGS: LocalityMapping[] = [
  // Milano e area metropolitana
  {
    googleNames: ['Milano', 'Milan', 'Milano City'],
    locationId: 'milano',
    priority: 100,
    aliases: ['MI', 'Milan City', 'Milano Centro', 'Centro Milano']
  },
  
  // Località olimpiche principali
  {
    googleNames: ['Bormio'],
    locationId: 'bormio', 
    priority: 90,
    aliases: ['Bormio SO']
  },
  {
    googleNames: ['Livigno'],
    locationId: 'livigno',
    priority: 90,
    aliases: ['Livigno SO']
  },
  {
    googleNames: ['Cortina d\'Ampezzo', 'Cortina'],
    locationId: 'cortina',
    priority: 90,
    aliases: ['Cortina BL', 'Cortina d Ampezzo']
  },
  {
    googleNames: ['Verona'],
    locationId: 'verona',
    priority: 80,
    aliases: ['VR', 'Verona VR']
  },
  
  // Località olimpiche aggiuntive
  {
    googleNames: ['Anterselva', 'Antholz'],
    locationId: 'anterselva',
    priority: 80,
    aliases: ['Anterselva BZ', 'Antholz BZ']
  },
  {
    googleNames: ['Predazzo', 'Tesero', 'Val di Fiemme'],
    locationId: 'val-di-fiemme',
    priority: 80,
    aliases: ['Predazzo TN', 'Tesero TN', 'Fiemme']
  },
  {
    googleNames: ['Tirano'],
    locationId: 'tirano',
    priority: 70,
    aliases: ['Tirano SO']
  },
  {
    googleNames: ['Venezia', 'Venice', 'Venedig'],
    locationId: 'venezia',
    priority: 80,
    aliases: ['VE', 'Venezia VE', 'Venice Italy']
  },
  
  // Aeroporti (mapping preciso) - PRIORITÀ MASSIMA per evitare conflitti geografici
  {
    googleNames: ['Segrate', 'Peschiera Borromeo'], // Zone vicine a Linate
    locationId: 'linate',
    priority: 95,
    aliases: ['Linate', 'Milano Linate']
  },
  {
    googleNames: ['Ferno', 'Somma Lombardo'], // Zone vicine a Malpensa
    locationId: 'malpensa',
    priority: 95,
    aliases: ['Malpensa', 'Milano Malpensa']
  },
  {
    googleNames: ['Orio al Serio', 'Bergamo'],
    locationId: 'orio-al-serio',
    priority: 85,
    aliases: ['Orio', 'BGY', 'Bergamo Orio']
  },
  
  // Stazioni ferroviarie
  {
    googleNames: ['Verona'],
    locationId: 'verona-porta-nuova',
    priority: 70, // Lower priority than city to prefer city match
    aliases: ['Verona Porta Nuova', 'Verona PN']
  },
  
  // Area metropolitana Milano (comuni limitrofi che dovrebbero usare Milano)
  {
    googleNames: [
      'Rho', 'Pero', 'Sesto San Giovanni', 'Cinisello Balsamo', 'Bresso',
      'Cormano', 'Cusano Milanino', 'Paderno Dugnano', 'Nova Milanese',
      'Desio', 'Seregno', 'Monza', 'Brugherio', 'Carugate', 'Agrate Brianza',
      'Concorezzo', 'Vimercate', 'Burago di Molgora', 'Carnate', 'Roncello',
      'San Donato Milanese', 'Peschiera Borromeo', 'Mediglia', 'Pantigliate',
      'Pioltello', 'Segrate', 'Vimodrone', 'Cernusco sul Naviglio',
      'Pessano con Bornago', 'Gessate', 'Bellinzago Lombardo', 'Trucazzano',
      'Cassina de\' Pecchi', 'Caponago', 'Cambiago', 'Basiglio', 'Opera',
      'Rozzano', 'Zibido San Giacomo', 'Noviglio', 'Binasco', 'Lacchiarella',
      'Rosate', 'Gaggiano', 'Trezzano sul Naviglio', 'Cesano Boscone',
      'Corsico', 'Buccinasco', 'Assago', 'Settimo Milanese', 'Baranzate',
      'Bollate', 'Arese', 'Garbagnate Milanese', 'Senago', 'Limbiate'
    ],
    locationId: 'milano',
    priority: 60, // Lower priority to prefer exact Milano match
    aliases: []
  }
]

// Configurazione raggio geografico
const GEOGRAPHICAL_SEARCH_RADIUS_KM = 10
const GEOGRAPHICAL_CONFIDENCE_MULTIPLIER = 0.9 // Increased from 0.8 to 0.9
const GEOGRAPHICAL_PRIORITY_BONUS = 0.25 // Increased from 0.2 to 0.25

// Funzione per normalizzare il testo per il matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[''`]/g, '') // Remove apostrophes
    .replace(/\s+/g, ' ')
    .trim()
}

// Calcola la distanza tra due coordinate in km (Haversine formula)
function calculateDistanceKm(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c // Distance in kilometers
  return distance
}

// Calcola la similarità tra due stringhe (Levenshtein distance normalizzata)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1)
  const s2 = normalizeText(str2)
  
  if (s1 === s2) return 1.0
  
  const len1 = s1.length
  const len2 = s2.length
  
  if (len1 === 0) return 0
  if (len2 === 0) return 0
  
  // Levenshtein distance matrix
  const matrix = []
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }
  
  const distance = matrix[len2][len1]
  const maxLen = Math.max(len1, len2)
  return (maxLen - distance) / maxLen
}

// NEW: Trova location entro il raggio geografico
function findLocationsByGeography(
  coordinates: { lat: number; lng: number }
): Array<{
  location: Location
  distance: number
  confidence: number
}> {
  const allLocations = getAllLocations()
  const nearbyLocations = []

  for (const location of allLocations) {
    if (!location.coordinates) continue
    
    const distance = calculateDistanceKm(coordinates, location.coordinates)
    
    if (distance <= GEOGRAPHICAL_SEARCH_RADIUS_KM) {
      // Calcola confidence basata sulla distanza
      const distanceConfidence = (GEOGRAPHICAL_SEARCH_RADIUS_KM - distance) / GEOGRAPHICAL_SEARCH_RADIUS_KM
      const finalConfidence = distanceConfidence * GEOGRAPHICAL_CONFIDENCE_MULTIPLIER
      
      // Trova priorità da mapping se esiste
      const mapping = LOCALITY_MAPPINGS.find(m => m.locationId === location.id)
      const priority = mapping ? mapping.priority : 50 // Default priority
      
      // Confidence finale include priorità della location
      const priorityBonus = (priority / 100) * GEOGRAPHICAL_PRIORITY_BONUS
      const totalConfidence = Math.min(finalConfidence + priorityBonus, 1.0)
      
      nearbyLocations.push({
        location,
        distance,
        confidence: totalConfidence
      })
    }
  }

  // Ordina per confidence (distanza + priorità)
  nearbyLocations.sort((a, b) => b.confidence - a.confidence)

  console.log(`🌍 Found ${nearbyLocations.length} locations within ${GEOGRAPHICAL_SEARCH_RADIUS_KM}km:`, 
    nearbyLocations.map(l => `${l.location.id} (${l.distance.toFixed(1)}km, ${(l.confidence * 100).toFixed(1)}%)`))

  return nearbyLocations
}

// Trova il match migliore per una località Google
export function findLocationByLocality(
  googleLocality: string | null, 
  addressComponents: any[] = []
): {
  locationId: string | null
  location: Location | null
  confidence: number
  matchType: 'exact' | 'fuzzy' | 'alias' | 'none'
  matchedText?: string
} {
  if (!googleLocality) {
    return {
      locationId: null,
      location: null,
      confidence: 0,
      matchType: 'none'
    }
  }

  console.log('🔍 Finding location match for locality:', googleLocality)
  console.log('📍 Address components:', addressComponents)

  let bestMatch: {
    mapping: LocalityMapping
    confidence: number
    matchType: 'exact' | 'fuzzy' | 'alias'
    matchedText: string
  } | null = null

  // 1. Cerca match esatti
  for (const mapping of LOCALITY_MAPPINGS) {
    // Check googleNames
    for (const name of mapping.googleNames) {
      const similarity = calculateSimilarity(googleLocality, name)
      if (similarity >= 0.95) { // 95% similarity = exact match
        console.log(`✅ Exact match found: "${googleLocality}" -> "${name}" (${mapping.locationId})`)
        const confidence = similarity * (mapping.priority / 100)
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = {
            mapping,
            confidence,
            matchType: 'exact',
            matchedText: name
          }
        }
      }
    }
    
    // Check aliases
    if (mapping.aliases) {
      for (const alias of mapping.aliases) {
        const similarity = calculateSimilarity(googleLocality, alias)
        if (similarity >= 0.95) {
          console.log(`✅ Alias match found: "${googleLocality}" -> "${alias}" (${mapping.locationId})`)
          const confidence = similarity * (mapping.priority / 100) * 0.9 // Slightly lower for aliases
          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = {
              mapping,
              confidence,
              matchType: 'alias',
              matchedText: alias
            }
          }
        }
      }
    }
  }

  // 2. Se non trovato match esatto, cerca fuzzy match (solo se confidence > 0.7)
  if (!bestMatch) {
    for (const mapping of LOCALITY_MAPPINGS) {
      for (const name of mapping.googleNames) {
        const similarity = calculateSimilarity(googleLocality, name)
        if (similarity >= 0.7 && similarity < 0.95) {
          console.log(`🔍 Fuzzy match found: "${googleLocality}" -> "${name}" (${mapping.locationId}) - similarity: ${similarity}`)
          const confidence = similarity * (mapping.priority / 100) * 0.8 // Lower confidence for fuzzy
          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = {
              mapping,
              confidence,
              matchType: 'fuzzy',
              matchedText: name
            }
          }
        }
      }
    }
  }

  if (bestMatch) {
    const location = getAllLocations().find(loc => loc.id === bestMatch!.mapping.locationId)
    console.log(`🎯 Final match: "${googleLocality}" -> ${bestMatch.mapping.locationId} (confidence: ${bestMatch.confidence.toFixed(2)})`)
    
    return {
      locationId: bestMatch.mapping.locationId,
      location: location || null,
      confidence: bestMatch.confidence,
      matchType: bestMatch.matchType,
      matchedText: bestMatch.matchedText
    }
  }

  console.log(`❌ No location match found for: "${googleLocality}"`)
  return {
    locationId: null,
    location: null,
    confidence: 0,
    matchType: 'none'
  }
}

// NEW: Trova il match migliore usando coordinate geografiche
export function findLocationByGeography(
  coordinates: { lat: number; lng: number } | null
): {
  locationId: string | null
  location: Location | null
  confidence: number
  distance?: number
  matchType: 'geographical' | 'none'
} {
  if (!coordinates) {
    return {
      locationId: null,
      location: null,
      confidence: 0,
      matchType: 'none'
    }
  }

  console.log(`🌍 Searching for locations within ${GEOGRAPHICAL_SEARCH_RADIUS_KM}km of:`, coordinates)

  const nearbyLocations = findLocationsByGeography(coordinates)
  
  if (nearbyLocations.length > 0) {
    const best = nearbyLocations[0]
    console.log(`🎯 Best geographical match: ${best.location.id} (${best.distance.toFixed(1)}km away, ${(best.confidence * 100).toFixed(1)}% confidence)`)
    
    return {
      locationId: best.location.id,
      location: best.location,
      confidence: best.confidence,
      distance: best.distance,
      matchType: 'geographical'
    }
  }

  console.log(`❌ No locations found within ${GEOGRAPHICAL_SEARCH_RADIUS_KM}km radius`)
  return {
    locationId: null,
    location: null,
    confidence: 0,
    matchType: 'none'
  }
}

// Estrae tutte le possibili località dai componenti indirizzo di Google
export function extractLocalitiesFromComponents(addressComponents: any[]): string[] {
  const localities = []
  
  for (const component of addressComponents) {
    if (component.types?.includes('locality')) {
      localities.push(component.longText)
    } else if (component.types?.includes('administrative_area_level_3')) {
      localities.push(component.longText)
    } else if (component.types?.includes('administrative_area_level_2')) {
      localities.push(component.longText)
    }
  }
  
  // Remove duplicates
  return [...new Set(localities)]
}

// UPDATED: Funzione principale con sistema a cascata (Località → Geografia)
export function shouldUseListinoPricing(
  googleLocality: string | null,
  addressComponents: any[] = [],
  coordinates: { lat: number; lng: number } | null = null,
  minimumConfidence: number = 0.7
): {
  useListino: boolean
  locationId: string | null
  location: Location | null
  confidence: number
  distance?: number
  matchType: 'exact' | 'fuzzy' | 'alias' | 'geographical' | 'none'
  reason: string
} {
  console.log('🎯 Checking if should use listino pricing for:', { googleLocality, coordinates })
  
  // FASE 1: Tentativo di match per località
  const localityMatch = findLocationByLocality(googleLocality, addressComponents)
  
  if (localityMatch.confidence >= minimumConfidence) {
    console.log('✅ LOCALITY MATCH SUCCESS - Using textual match')
    return {
      useListino: true,
      locationId: localityMatch.locationId,
      location: localityMatch.location,
      confidence: localityMatch.confidence,
      matchType: localityMatch.matchType,
      reason: `Found ${localityMatch.matchType} locality match with ${(localityMatch.confidence * 100).toFixed(1)}% confidence`
    }
  }

  // FASE 2: Fallback a match geografico se disponibili coordinate
  if (coordinates) {
    console.log('🌍 LOCALITY MATCH FAILED - Trying geographical fallback')
    const geographyMatch = findLocationByGeography(coordinates)
    
    if (geographyMatch.confidence >= minimumConfidence) {
      console.log('✅ GEOGRAPHY MATCH SUCCESS - Using geographical match')
      return {
        useListino: true,
        locationId: geographyMatch.locationId,
        location: geographyMatch.location,
        confidence: geographyMatch.confidence,
        distance: geographyMatch.distance,
        matchType: 'geographical',
        reason: `Found geographical match ${geographyMatch.distance?.toFixed(1)}km away with ${(geographyMatch.confidence * 100).toFixed(1)}% confidence`
      }
    }
  }

  // FASE 3: Nessun match trovato
  const reason = localityMatch.confidence > 0 
    ? `Locality match found but confidence too low (${(localityMatch.confidence * 100).toFixed(1)}% < ${minimumConfidence * 100}%)${coordinates ? ' and no nearby locations' : ''}`
    : coordinates 
      ? 'No locality match and no nearby locations found'
      : 'No locality match found and no coordinates available'

  console.log('❌ NO MATCH - Using distance calculation')

  return {
    useListino: false,
    locationId: null,
    location: null,
    confidence: 0,
    matchType: 'none',
    reason
  }
}

// Test della funzione con esempi comuni
export function testLocalityMapping() {
  const testCases = [
    { name: 'Milano', coords: { lat: 45.4642, lng: 9.1900 } },
    { name: 'Via Roma, Milano', coords: { lat: 45.4642, lng: 9.1900 } },
    { name: 'Bormio', coords: { lat: 46.4669, lng: 10.3700 } },
    { name: 'Hotel Palace, Bormio', coords: { lat: 46.4669, lng: 10.3700 } },
    { name: 'Corsico', coords: { lat: 45.4459, lng: 9.1102 } }, // 8km da Milano
    { name: 'Ponte di Legno', coords: { lat: 46.2564, lng: 10.5167 } }, // 25km da Bormio
    { name: 'Unknown City', coords: { lat: 40.7128, lng: -74.0060 } } // New York
  ]

  console.log('🧪 Testing locality + geography mapping:')
  for (const test of testCases) {
    const result = shouldUseListinoPricing(test.name, [], test.coords)
    console.log(`"${test.name}" -> ${result.useListino ? `${result.locationId} (${result.matchType})` : 'distance'} - ${result.reason}`)
  }
} 