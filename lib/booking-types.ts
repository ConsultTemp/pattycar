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
  billingInfo?: string
  notes?: string
  privacyAccepted: boolean
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
}

// Validation schemas
export const customerSchema = z.object({
  name: z.string().min(2, "Nome richiesto (minimo 2 caratteri)"),
  email: z.string().email("Email non valida"),
  phone: z.string().min(1, "Numero di telefono richiesto"),
  phonePrefix: z.string().default("+39"),
})

export const journeySchema = z
  .object({
    date: z.date().optional(),
    time: z.string().optional(),
    minutes: z.string().optional(),
    endTime: z.string().optional(),
    endMinutes: z.string().optional(),
    pickup: z.object({
      address: z.string().min(1, "Indirizzo di partenza richiesto"),
      placeId: z.string().optional(),
    }),
    destination: z.object({
      address: z.string().min(1, "Indirizzo di destinazione richiesto"),
      placeId: z.string().optional(),
    }),
    distance: z
      .object({
        km: z.number().min(1, "Distanza richiesta"),
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
  flight: z.string().optional(),
  departureCity: z.string().optional(),
  billingInfo: z.string().min(1, "Informazioni di fatturazione richieste"),
  notes: z.string().optional(),
  privacyAccepted: z.boolean().refine((val) => val === true, {
    message: "Accettazione privacy policy richiesta",
  }),
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
  }
  options: BookingOptions
  ui: {
    isSubmitting: boolean
    submitStatus: "idle" | "success" | "error" | "submitting"
    errors: ValidationError[]
    pricing: PricingResult | null
    isCalculatingPrice: boolean
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
  | { type: "SET_OPTIONS"; payload: Partial<BookingOptions> }
  | { type: "UPDATE_MEET_GREET_CONFIG"; payload: Partial<MeetGreetConfig> }
  | { type: "SET_PRICING"; payload: PricingResult | null }
  | { type: "SET_CALCULATING_PRICE"; payload: boolean }
  | { type: "SET_VALIDATION_ERRORS"; payload: ValidationError[] }
  | { type: "SET_SUBMIT_STATUS"; payload: "idle" | "submitting" | "success" | "error" }
  | { type: "CLEAR_ERRORS" }
