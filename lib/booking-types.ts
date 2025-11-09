import { z } from "zod"

// Service Types  
export type ServiceType = "transfer" | "disposizione" | "inter-cluster" | "altri-servizi" | "ceremony-disposition"

// Base types
export interface Customer {
  name: string
  email: string
  phone: string
  phonePrefix: string
}

export interface Journey {
  date?: Date
  pickup: {
    address: string
    placeId: string
    coordinates?: { lat: number; lng: number }
    // NEW: Location registry support
    locationId?: string // ID from LOCATION_REGISTRY if selected from listino
    isCustom?: boolean // true if user chose custom input instead of listino
  }
  destination: {
    address: string
    placeId: string
    coordinates?: { lat: number; lng: number }
    // NEW: Location registry support
    locationId?: string // ID from LOCATION_REGISTRY if selected from listino
    isCustom?: boolean // true if user chose custom input instead of listino
  }
  time?: string
  minutes?: string
  timeAmPm?: string
  departureTime?: string // Used for flight/train departure time when destination is airport/station
  departureMinutes?: string
  departureTimeAmPm?: string
  endTime?: string
  endMinutes?: string
  endTimeAmPm?: string
  serviceDuration?: string // For Olympic disposition: "4", "6", "8" hours
  distance?: {
    km: number
    text: string
    duration: string
  }
}

export interface VehicleConfig {
  type: string
  passengers: number
  luggage: number
}

// Enhanced Meet & Greet Configuration Types
export interface MeetGreetConfig {
  enabled: boolean
  serviceId?: string // Now uses specific service IDs like "malpensa-arrivals", "linate-departures", etc.
  selectedService?: string // New property for the selected service type
  passengers: number
  children: number
  infants: number
  extraLuggage: number
  extraHours: number // New property for extra hours
  specialServices?: {
    tarmac?: boolean
    fastTrack?: boolean
    vipLounge?: boolean
    greeterOnly?: boolean
    veniceCombo?: boolean // New property for Venice combo service
  }
}

export interface BookingOptions {
  meetAndGreet: boolean // Keep for backward compatibility
  meetGreetConfig: MeetGreetConfig // New enhanced configuration
  differentVehicles: boolean
  flight?: string
  departureCity?: string
  billingType?: "private" | "company" // UI only - for conditional form display
  billingInfo?: string // Unified field - contains all billing data
  companyName?: string // UI only - gets merged into billingInfo
  companyAddress?: string // UI only - gets merged into billingInfo
  vatNumber?: string // UI only - gets merged into billingInfo
  notes?: string
  privacyAccepted: boolean
  guidelinesAccepted: boolean
}

export interface PricingResult {
  basePrice: number
  totalPrice: number
  breakdown: {
    distanceKm?: number
    durationHours?: number
    pricePerKm?: number
    pricePerHour?: number
    basePrice: number
    vehicleMultiplier: number
    passengerMultiplier: number
    luggageMultiplier: number
    nightSurcharge?: number
    nightSurchargeRate?: number
    vehicleCount: number
    pricePerVehicle: number
    subtotal: number
    vatAmount: number
    vatRate: number
    waterTaxi?: number // Water taxi service cost
  }
  vehicleBreakdowns?: any[]
  meetGreetPrice?: number
  meetGreetBreakdown?: {
    basePrice: number
    extraAdults: number
    children: number
    extraLuggage: number
    nightSurcharge: number
    specialServices: number
    subtotal: number
    vat: number
    total: number
  }
  eventRoute?: {
    name: string
    from: string
    to: string
    notes?: string
  }
  isEventPricing?: boolean
  isOlympicPricing?: boolean
  routeNotFound?: boolean
  routeNotFoundDetails?: {
    attemptedPickup: string
    attemptedDestination: string
  }
}

// Validation schemas
export const customerSchema = z.object({
  name: z.string().min(2, "Nome richiesto (minimo 2 caratteri)"),
  email: z.string().email("Email non valida"),
  phone: z.string().min(1, "Numero di telefono richiesto"),
  phonePrefix: z.string().default("+39"),
})

// Enhanced journey schema with conditional validation
export const createJourneySchema = (serviceType: ServiceType, isOlympicPeriod: boolean = false) => {
  const baseSchema = z.object({
    date: z.date({
      required_error: "Data richiesta",
      invalid_type_error: "Data non valida"
    }),
    time: z.string().min(1, "Ora di inizio richiesta"),
    minutes: z.string().min(1, "Minuti richiesti").default("00"),
    timeAmPm: z.string().optional(),
    endTime: z.string().optional(),
    endMinutes: z.string().optional(),
    endTimeAmPm: z.string().optional(),
    serviceDuration: z.string().optional(), // For Olympic disposition duration
    pickup: z.object({
      address: z.string().min(1, "Indirizzo di partenza richiesto"),
      placeId: z.string().optional(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number()
      }).optional(),
      locationId: z.string().optional(),
      isCustom: z.boolean().optional(),
    }).refine((data) => {
      // Must have either a valid placeId or locationId (indicating a selection was made)
      return (data.placeId && data.placeId !== "") || (data.locationId && data.locationId !== "")
    }, {
      message: "Seleziona un indirizzo di partenza dall'elenco",
    }),
    destination: z.object({
      address: z.string().min(1, "Indirizzo di destinazione richiesto"),
      placeId: z.string().optional(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number()
      }).optional(),
      locationId: z.string().optional(),
      isCustom: z.boolean().optional(),
    }).refine((data) => {
      // Must have either a valid placeId or locationId (indicating a selection was made)
      return (data.placeId && data.placeId !== "") || (data.locationId && data.locationId !== "")
    }, {
      message: "Seleziona un indirizzo di destinazione dall'elenco",
    }),
    distance: z
      .object({
        km: z.number().min(0.1, "Distanza richiesta"),
        text: z.string(),
        duration: z.string(),
      })
      .optional(),
  })

  // Apply conditional validation based on service type
  if (serviceType === "disposizione" || serviceType === "ceremony-disposition") {
    if (isOlympicPeriod) {
      // Olympic period: require serviceDuration
      return baseSchema.extend({
        serviceDuration: z.string().min(1, "Durata del servizio richiesta"),
      })
    } else {
      // Standard period: require endTime and endMinutes
      return baseSchema.extend({
        endTime: z.string().min(1, "Ora di fine richiesta"),
        endMinutes: z.string().min(1, "Minuti di fine richiesti").default("00"),
      })
    }
  }

  return baseSchema
}

// Legacy schema for backward compatibility - use createJourneySchema instead
export const journeySchema = z
  .object({
    date: z.date().optional(),
    time: z.string().optional(),
    minutes: z.string().optional(),
    endTime: z.string().optional(),
    endMinutes: z.string().optional(),
    serviceDuration: z.string().optional(), // For Olympic disposition duration
    pickup: z.object({
      address: z.string().min(1, "Indirizzo di partenza richiesto"),
      placeId: z.string().optional(),
      locationId: z.string().optional(),
      isCustom: z.boolean().optional(),
    }).refine((data) => {
      // Must have either a valid placeId or locationId (indicating a selection was made)
      return (data.placeId && data.placeId !== "") || (data.locationId && data.locationId !== "")
    }, {
      message: "Seleziona un indirizzo di partenza dall'elenco",
    }),
    destination: z.object({
      address: z.string().min(1, "Indirizzo di destinazione richiesto"),
      placeId: z.string().optional(),
      locationId: z.string().optional(),
      isCustom: z.boolean().optional(),
    }).refine((data) => {
      // Must have either a valid placeId or locationId (indicating a selection was made)
      return (data.placeId && data.placeId !== "") || (data.locationId && data.locationId !== "")
    }, {
      message: "Seleziona un indirizzo di destinazione dall'elenco",
    }),
    distance: z
      .object({
        km: z.number().min(0.1, "Distanza richiesta"),
        text: z.string(),
        duration: z.string(),
      })
      .optional(),
  })
  .refine((data) => data.pickup.address !== data.destination.address, {
    message: "Il punto di partenza e di arrivo non possono essere uguali",
    path: ["destination"],
  })

export const vehicleConfigSchema = z.object({
  type: z.string().min(1, "Tipo di veicolo richiesto"),
  passengers: z.number().min(1, "Almeno 1 passeggero richiesto"),
  luggage: z.number().min(0, "Numero bagagli non valido"),
})

export const vehiclesSchema = z.discriminatedUnion("sameType", [
  z.object({
    sameType: z.literal(true),
    count: z.number().min(1, "Almeno 1 veicolo richiesto"),
    config: vehicleConfigSchema,
  }),
  z.object({
    sameType: z.literal(false),
    count: z.number().min(1, "Almeno 1 veicolo richiesto"),
    configs: z.array(vehicleConfigSchema).min(1, "Configurazione veicoli richiesta"),
  }),
])

export const meetGreetConfigSchema = z.object({
  enabled: z.boolean().default(false),
  serviceId: z.string().optional(),
  selectedService: z.string().optional(),
  passengers: z.number().min(0).default(0),
  children: z.number().min(0).default(0),
  infants: z.number().min(0).default(0),
  extraLuggage: z.number().min(0).default(0),
  extraHours: z.number().min(0).default(0),
  specialServices: z.object({
    tarmac: z.boolean().optional(),
    fastTrack: z.boolean().optional(),
    vipLounge: z.boolean().optional(),
    greeterOnly: z.boolean().optional(),
    veniceCombo: z.boolean().optional(),
  }).optional(),
})

export const optionsSchema = z.object({
  meetAndGreet: z.boolean().default(false),
  meetGreetConfig: meetGreetConfigSchema,
  differentVehicles: z.boolean().default(false),
  flight: z.string().min(1, "Numero volo/treno richiesto"),
  departureCity: z.string().optional(),
  billingType: z.enum(["private", "company"]).optional().default("company"),
  billingInfo: z.string().optional(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  vatNumber: z.string().optional(),
  notes: z.string().optional(),
  privacyAccepted: z.boolean().refine((val) => val === true, {
    message: "privacyPolicyRequired",
  }),
  guidelinesAccepted: z.boolean().refine((val) => val === true, {
    message: "guidelinesRequired",
  }),
}).superRefine((data, ctx) => {
  // Conditional validation based on billingType
  if (data.billingType === "company") {
    // When company billing, all three fields are required
    if (!data.companyName || data.companyName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "companyNameRequired",
        path: ["companyName"],
      })
    }
    if (!data.companyAddress || data.companyAddress.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "companyAddressRequired",
        path: ["companyAddress"],
      })
    }
    if (!data.vatNumber || data.vatNumber.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "vatNumberRequired",
        path: ["vatNumber"],
      })
    }
  } else if (data.billingType === "private") {
    // When private billing, only billingInfo is required
    if (!data.billingInfo || data.billingInfo.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "billingInfoRequired",
        path: ["billingInfo"],
      })
    }
  }
})

// Error types
export type ValidationError = {
  field: string
  message: string
}

export type BookingError =
  | { type: "VALIDATION_ERROR"; field: string; message: string }
  | { type: "PRICING_ERROR"; message: string }
  | { type: "NETWORK_ERROR"; message: string; retryable: boolean }
  | { type: "PAYMENT_ERROR"; code: string; message: string }
  | { type: "SERVER_ERROR"; status: number; message: string }

// State types
export interface BookingState {
  serviceType: ServiceType
  customer: Customer
  journey: Journey
  vehicles: {
    count: number
    sameType: boolean
    singleConfig: VehicleConfig
    multipleConfigs: VehicleConfig[]
    waterTaxi: boolean // Water taxi service for Venice locations (excluding airport/station)
  }
  options: BookingOptions
  ui: {
    isSubmitting: boolean
    submitStatus: "idle" | "success" | "error" | "submitting"
    errors: ValidationError[]
    pricing: PricingResult | null
    isCalculatingPrice: boolean
    hasAttemptedSubmit: boolean
  }
}

// Action types
export type BookingAction =
  | { type: "SET_SERVICE_TYPE"; payload: ServiceType }
  | { type: "SET_CUSTOMER"; payload: Partial<Customer> }
  | { type: "SET_JOURNEY"; payload: Partial<Journey> }
  | { type: "SET_VEHICLE_COUNT"; payload: number }
  | { type: "TOGGLE_SAME_VEHICLE_TYPE" }
  | { type: "UPDATE_SINGLE_VEHICLE_CONFIG"; payload: Partial<VehicleConfig> }
  | { type: "UPDATE_MULTIPLE_VEHICLE_CONFIG"; payload: { index: number; config: Partial<VehicleConfig> } }
  | { type: "ADD_VEHICLE_CONFIG" }
  | { type: "REMOVE_VEHICLE_CONFIG"; payload: number }
  | { type: "RESET_VEHICLE_CONFIG" }
  | { type: "SET_OPTIONS"; payload: Partial<BookingOptions> }
  | { type: "UPDATE_MEET_GREET_CONFIG"; payload: Partial<MeetGreetConfig> }
  | { type: "SET_WATER_TAXI"; payload: boolean }
  | { type: "SET_PRICING"; payload: PricingResult | null }
  | { type: "SET_CALCULATING_PRICE"; payload: boolean }
  | { type: "SET_VALIDATION_ERRORS"; payload: ValidationError[] }
  | { type: "SET_SUBMIT_STATUS"; payload: "idle" | "submitting" | "success" | "error" }
  | { type: "SET_ATTEMPTED_SUBMIT"; payload: boolean }
  | { type: "CLEAR_ERRORS" }
