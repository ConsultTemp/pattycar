import { z } from "zod"

// Base types
export interface Customer {
  name: string
  email: string
  phone: string
  phonePrefix: string
}

export interface Journey {
  date?: Date
  time: string
  minutes: string
  endTime?: string
  endMinutes?: string
  pickup: {
    address: string
    placeId: string
  }
  destination: {
    address: string
    placeId: string
  }
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

export interface BookingOptions {
  meetAndGreet: boolean
  differentVehicles: boolean
  flight?: string
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
    vehicleCount: number
    pricePerVehicle: number
  }
  vehicleBreakdowns?: any[]
}

// Validation schemas
export const customerSchema = z.object({
  name: z.string().min(2, "Nome richiesto (minimo 2 caratteri)"),
  email: z.string().email("Email non valida"),
  phone: z.string().optional(),
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

export const optionsSchema = z.object({
  meetAndGreet: z.boolean().default(false),
  differentVehicles: z.boolean().default(false),
  flight: z.string().optional(),
  billingInfo: z.string().optional(),
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
  serviceType: "transfer" | "disposizione"
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
  | { type: "SET_SERVICE_TYPE"; payload: "transfer" | "disposizione" }
  | { type: "SET_CUSTOMER"; payload: Partial<Customer> }
  | { type: "SET_JOURNEY"; payload: Partial<Journey> }
  | { type: "SET_VEHICLE_COUNT"; payload: number }
  | { type: "TOGGLE_SAME_VEHICLE_TYPE" }
  | { type: "UPDATE_SINGLE_VEHICLE_CONFIG"; payload: Partial<VehicleConfig> }
  | { type: "UPDATE_MULTIPLE_VEHICLE_CONFIG"; payload: { index: number; config: Partial<VehicleConfig> } }
  | { type: "ADD_VEHICLE_CONFIG" }
  | { type: "REMOVE_VEHICLE_CONFIG"; payload: number }
  | { type: "SET_OPTIONS"; payload: Partial<BookingOptions> }
  | { type: "SET_PRICING"; payload: PricingResult | null }
  | { type: "SET_CALCULATING_PRICE"; payload: boolean }
  | { type: "SET_VALIDATION_ERRORS"; payload: ValidationError[] }
  | { type: "SET_SUBMIT_STATUS"; payload: "idle" | "submitting" | "success" | "error" }
  | { type: "CLEAR_ERRORS" }
