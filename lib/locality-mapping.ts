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
  // Milano Centrale - NUOVO MAPPING SPECIFICO
  {
    googleNames: ['Milano Centrale', 'Stazione Centrale Milano', 'Milano Central Station', 'Centrale Milano'],
    locationId: 'milano-centrale',
    priority: 95,
    aliases: ['Milano Centrale FS', 'Stazione Milano Centrale', 'Central Station Milan']
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
    googleNames: [
      'Anterselva', 'Antholz',
      'Anterselva di Mezzo', 'Anterselva di Sopra', 'Anterselva di Sotto', "Rasun Anterselva", "Rasun Antholz",
      'Rasun', 'Antholz Mittertal', 'Antholz Obertal', 'Antholz Niedertal',
      'Casteldarne', 'Karneid'
    ],
    locationId: 'anterselva',
    priority: 80,
    aliases: [
      'Anterselva BZ', 'Antholz BZ',
      'Anterselva di Mezzo BZ', 'Anterselva di Sopra BZ', 'Anterselva di Sotto BZ',
      'Antholz Mittertal BZ', 'Antholz Obertal BZ', 'Antholz Niedertal BZ',
      'Casteldarne BZ', 'Karneid BZ', 'Casteldarne, BZ', 'Karneid, BZ'
    ]
  },
  {
    googleNames: ['Predazzo', 'Tesero', 'Val di Fiemme', 'Fiemme', 'Cavalese', 'Ziano di Fiemme', 'Panchià', 'Daiano', 'Varena', 'Carano', 'Sover', 'Segonzano', 'Lona-Lases', 'Albiano', 'Roverè della Luna'],
    locationId: 'val-di-fiemme',
    priority: 80,
    aliases: ['Predazzo TN', 'Predazzo, TN', 'Tesero TN', 'Tesero, TN', 'Fiemme', 'Val di Fiemme TN', 'Cavalese TN', 'Cavalese, TN', 'Ziano di Fiemme TN', 'Ziano di Fiemme, TN']
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
  {
    googleNames: ['Treviso'],
    locationId: 'treviso',
    priority: 80,
    aliases: ['TV', 'Treviso TV']
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
  
  // FIXED: MEET & GREET LOCATION MAPPINGS - NON DEGRADARE A CITTÀ BASE!
  {
    googleNames: ['Venezia Marco Polo', 'Marco Polo Airport', 'Venice Airport'],
    locationId: 'venezia-marco-polo', // CORRETTO: mantieni location specifica con Meet & Greet
    priority: 95,
    aliases: ['VCE', 'Venezia VCE', 'Marco Polo', 'Venice Marco Polo', 'venezia-marco-polo']
  },
  {
    googleNames: ['Treviso Airport', 'Antonio Canova Airport'],
    locationId: 'treviso',
    priority: 95,
    aliases: ['TSF', 'Treviso TSF', 'Canova Airport']
  },
  {
    googleNames: ['Venezia Santa Lucia', 'Santa Lucia Station', 'Venice Santa Lucia'],
    locationId: 'venezia-santa-lucia', // CORRETTO: mantieni location specifica con Meet & Greet
    priority: 95,
    aliases: ['Santa Lucia', 'Venezia SL', 'Venice Station', 'venezia-santa-lucia']
  },

  // Stazioni ferroviarie - CORRETTI per mantenere Meet & Greet
  {
    googleNames: ['Milano Centrale', 'Stazione Centrale Milano', 'Milano Central Station', 'Centrale Milano'],
    locationId: 'milano-centrale', // CORRETTO: mantieni location specifica con Meet & Greet
    priority: 98, // PRIORITÀ ALTA per evitare degrading a "milano"
    aliases: ['Milano Centrale FS', 'Stazione Milano Centrale', 'Central Station Milan', 'milano-centrale']
  },
  {
    googleNames: ['Verona Porta Nuova', 'Stazione di Verona', 'Verona Station', 'Porta Nuova Verona'],
    locationId: 'verona-porta-nuova', // CORRETTO: mantieni location specifica con Meet & Greet
    priority: 98, // PRIORITÀ ALTA per evitare degrading a "verona" 
    aliases: ['Verona PN', 'Stazione Verona', 'Verona Stazione', 'verona-porta-nuova']
  },

  // Area metropolitana Milano (comuni limitrofi che dovrebbero usare Milano) - PRIORITÀ AUMENTATA
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
    priority: 70, // Increased from 60 to 70
    aliases: []
  },
  
  // Area Venezia (comuni limitrofi e isole che dovrebbero usare Venezia) - PRIORITÀ MIGLIORATA PER MESTRE
  {
    googleNames: [
      'Mestre', 'Marghera', 'Chirignago', 'Zelarino', 'Carpenedo', 'Bissuola',
      'Favaro Veneto', 'Ca\' Noghera', 'Tessera', 'Campalto', 'San Giuliano',
      'Murano', 'Burano', 'Torcello', 'Lido di Venezia', 'Pellestrina',
      'Giudecca', 'San Giorgio Maggiore', 'Sacca Fisola', 'Santa Marta',
      'Castello', 'Cannaregio', 'San Polo', 'Santa Croce', 'Dorsoduro',
      'San Marco', 'Spinea', 'Mirano', 'Salzano', 'Noale', 'Scorzè',
      'Martellago', 'Quarto d\'Altino', 'Musile di Piave', 'San Donà di Piave'
    ],
    locationId: 'venezia',
    priority: 75, // Increased from 60 to 75 (especially for Mestre)
    aliases: ['Mestre VE', 'Venezia Mestre']
  },
  
  // Area Treviso (comuni limitrofi che dovrebbero usare Treviso)
  {
    googleNames: [
      'Preganziol', 'Zero Branco', 'Morgano', 'Arcade', 'Spresiano',
      'Villorba', 'Carbonera', 'Silea', 'Roncade', 'San Biagio di Callalta',
      'Breda di Piave', 'Ponte di Piave', 'Salgareda', 'Chiarano',
      'Cessalto', 'Meduna di Livenza', 'Motta di Livenza', 'Monastier di Treviso',
      'Zenson di Piave', 'Fossalta di Piave', 'Noventa di Piave',
      'San Donà di Piave', 'Musile di Piave', 'Jesolo', 'Eraclea',
      'Torre di Mosto', 'Ceggia', 'Concordia Sagittaria'
    ],
    locationId: 'treviso',
    priority: 70, // Increased from 60 to 70
    aliases: []
  }
]

// Configurazione raggio geografico - MIGILORATA
const GEOGRAPHICAL_SEARCH_RADIUS_KM = 15 // Increased from 10 to 15
const GEOGRAPHICAL_CONFIDENCE_MULTIPLIER = 0.95 // Increased from 0.9 to 0.95
const GEOGRAPHICAL_PRIORITY_BONUS = 0.3 // Increased from 0.25 to 0.3

// Funzione per normalizzare il testo per il matching - MIGLIORATA
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[''`]/g, '') // Remove apostrophes
    .replace(/[,\.]/g, ' ') // Replace commas and dots with spaces
    .replace(/\s+/g, ' ') // Normalize multiple spaces
    .trim()
}

// NEW: Funzione per estrarre città da indirizzi complessi
function extractCityFromAddress(address: string): string | null {
  const normalizedAddress = normalizeText(address)
  
  // Pattern per riconoscere città negli indirizzi
  const cityPatterns = [
    // Milano patterns
    { pattern: /\b(milano|milan)\b/, city: 'Milano' },
    { pattern: /\b(mi)\b/, city: 'Milano' }, // Abbreviation
    
    // Venezia patterns
    { pattern: /\b(venezia|venice|mestre)\b/, city: 'Venezia' },
    { pattern: /\b(ve)\b/, city: 'Venezia' }, // Abbreviation
    
    // Verona patterns
    { pattern: /\b(verona)\b/, city: 'Verona' },
    { pattern: /\b(vr)\b/, city: 'Verona' }, // Abbreviation
    
    // Treviso patterns
    { pattern: /\b(treviso)\b/, city: 'Treviso' },
    { pattern: /\b(tv)\b/, city: 'Treviso' }, // Abbreviation
  ]
  
  for (const { pattern, city } of cityPatterns) {
    if (pattern.test(normalizedAddress)) {
      return city
    }
  }
  
  return null
}

// Calcola la distanza tra due coordinate in km (Haversine formula)
function calculateDistanceKm(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
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


  return nearbyLocations
}

// LOCATION SPECIFICHE MEET & GREET CHE NON DEVONO ESSERE DEGRADATE
const MEET_GREET_LOCATIONS = [
  'venezia-marco-polo',
  'milano-centrale', 
  'verona-porta-nuova',
  'venezia-santa-lucia',
  'malpensa',
  'linate'
]

// Trova il match migliore per una località Google - CORRETTO PER MEET & GREET
export function findLocationByLocality(
  googleLocality: string | null,
  addressComponents: any[] = [],
  skipExtraction: boolean = false // NEW: Flag per evitare ricorsione infinita
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

  let bestMatch: {
    mapping: LocalityMapping
    confidence: number
    matchType: 'exact' | 'fuzzy' | 'alias'
    matchedText: string
  } | null = null

  // CORRETTO: NON degradare location Meet & Greet specifiche
  if (!skipExtraction && !MEET_GREET_LOCATIONS.includes(googleLocality.toLowerCase())) {
    const extractedCity = extractCityFromAddress(googleLocality)
    if (extractedCity && extractedCity !== googleLocality) { // Evita ricorsione se è la stessa città
      
      // Retry matching with extracted city (con flag per evitare ricorsione)
      const cityMatch = findLocationByLocality(extractedCity, addressComponents, true)
      if (cityMatch.confidence > 0) {
        return {
          ...cityMatch,
          confidence: Math.min(cityMatch.confidence * 0.9, 1.0), // Slightly reduce confidence for extracted matches
          matchedText: `${cityMatch.matchedText} (extracted from: ${googleLocality})`
        }
      }
    }
  } else if (MEET_GREET_LOCATIONS.includes(googleLocality.toLowerCase())) {
  }

  // 1. Cerca match esatti (unchanged)
  for (const mapping of LOCALITY_MAPPINGS) {
    // Check googleNames
    for (const name of mapping.googleNames) {
      const similarity = calculateSimilarity(googleLocality, name)
      if (similarity >= 0.95) { // 95% similarity = exact match
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

  // 2. Se non trovato match esatto, cerca fuzzy match (SOGLIA ABBASSATA)
  if (!bestMatch) {
    for (const mapping of LOCALITY_MAPPINGS) {
      for (const name of mapping.googleNames) {
        const similarity = calculateSimilarity(googleLocality, name)
        if (similarity >= 0.65 && similarity < 0.95) { // Lowered from 0.7 to 0.65
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

    return {
      locationId: bestMatch.mapping.locationId,
      location: location || null,
      confidence: bestMatch.confidence,
      matchType: bestMatch.matchType,
      matchedText: bestMatch.matchedText
    }
  }

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


  const nearbyLocations = findLocationsByGeography(coordinates)

  if (nearbyLocations.length > 0) {
    const best = nearbyLocations[0]

    return {
      locationId: best.location.id,
      location: best.location,
      confidence: best.confidence,
      distance: best.distance,
      matchType: 'geographical'
    }
  }

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

// UPDATED: Funzione principale con sistema a cascata (Località → Geografia) - MIGLIORATA
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

  // FASE 1: Tentativo di match per località
  const localityMatch = findLocationByLocality(googleLocality, addressComponents, false)

  // SOGLIA DINAMICA: abbassa la soglia per località in area metropolitana
  let effectiveMinimumConfidence = minimumConfidence
  if (localityMatch.locationId && 
      (localityMatch.locationId === 'milano' || 
       localityMatch.locationId === 'venezia' || 
       localityMatch.locationId === 'verona' ||
       localityMatch.locationId === 'treviso')) {
    effectiveMinimumConfidence = 0.6 // Lower threshold for metropolitan areas
  }

  if (localityMatch.confidence >= effectiveMinimumConfidence) { 
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
    const geographyMatch = findLocationByGeography(coordinates)

    // SOGLIA GEOGRAFICA DINAMICA: più permissiva per aree metropolitane note
    let effectiveGeographyThreshold = minimumConfidence
    if (geographyMatch.locationId && 
        (geographyMatch.locationId === 'milano' || 
         geographyMatch.locationId === 'venezia' || 
         geographyMatch.locationId === 'verona' ||
         geographyMatch.locationId === 'treviso')) {
      effectiveGeographyThreshold = 0.5 // Even lower for geography
    }

    if (geographyMatch.confidence >= effectiveGeographyThreshold) {
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

  // FASE 3: ULTIMO TENTATIVO - Match parziale su parole chiave
  if (googleLocality && coordinates) {
    
    // Check for common city keywords in the locality name
    const localityLower = normalizeText(googleLocality)
    const cityKeywords = [
      { keywords: ['milano', 'milan'], locationId: 'milano' },
      { keywords: ['venezia', 'venice', 'mestre'], locationId: 'venezia' },
      { keywords: ['verona'], locationId: 'verona' },
      { keywords: ['treviso'], locationId: 'treviso' },
    ]

    for (const cityInfo of cityKeywords) {
      if (cityInfo.keywords.some(keyword => localityLower.includes(keyword))) {
        
        // Try geographical match for this specific city
        const cityGeographyMatch = findLocationByGeography(coordinates)
        if (cityGeographyMatch.locationId === cityInfo.locationId && cityGeographyMatch.confidence >= 0.3) {
          return {
            useListino: true,
            locationId: cityGeographyMatch.locationId,
            location: cityGeographyMatch.location,
            confidence: Math.max(cityGeographyMatch.confidence, 0.7), // Boost confidence
            distance: cityGeographyMatch.distance,
            matchType: 'geographical',
            reason: `Found keyword-based geographical match for ${cityInfo.locationId} with enhanced confidence`
          }
        }
      }
    }
  }

  // FASE 4: Nessun match trovato
  const reason = localityMatch.confidence > 0
    ? `Locality match found but confidence too low (${(localityMatch.confidence * 100).toFixed(1)}% < ${effectiveMinimumConfidence * 100}%)${coordinates ? ' and no nearby locations' : ''}`
    : coordinates
      ? 'No locality match and no nearby locations found'
      : 'No locality match found and no coordinates available'

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

  for (const test of testCases) {
    const result = shouldUseListinoPricing(test.name, [], test.coords)
  }
} 