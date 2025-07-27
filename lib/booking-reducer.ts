import type { BookingState, BookingAction } from "./booking-types"

export const initialBookingState: BookingState = {
  serviceType: "transfer",
  customer: {
    name: "",
    email: "",
    phone: "",
    phonePrefix: "+39",
  },
  journey: {
    date: undefined,
    time: "",
    minutes: "",
    timeAmPm: "AM",
    endTime: "",
    endMinutes: "",
    endTimeAmPm: "AM",
    pickup: {
      address: "",
      placeId: "",
    },
    destination: {
      address: "",
      placeId: "",
    },
  },
  vehicles: {
    count: 1,
    sameType: true,
    singleConfig: {
      type: "",
      passengers: 0,
      luggage: 0,
    },
    multipleConfigs: [
      {
        type: "",
        passengers: 0,
        luggage: 0,
      },
    ],
  },
  options: {
    meetAndGreet: false,
    meetGreetConfig: {
      enabled: false,
      passengers: 0,
      children: 0,
      infants: 0,
      extraLuggage: 0,
      extraHours: 0,
    },
    differentVehicles: false,
    privacyAccepted: false,
  },
  ui: {
    isSubmitting: false,
    submitStatus: "idle",
    errors: [],
    pricing: null,
    isCalculatingPrice: false,
    hasAttemptedSubmit: false,
  },
}

export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "SET_SERVICE_TYPE":
      return {
        ...state,
        serviceType: action.payload,
        journey: {
          ...state.journey,
          endTime: action.payload === "transfer" ? "" : state.journey.endTime,
          endMinutes: action.payload === "transfer" ? "" : state.journey.endMinutes,
          endTimeAmPm: action.payload === "transfer" ? "AM" : state.journey.endTimeAmPm,
        },
        ui: {
          ...state.ui,
          pricing: null,
        },
      }

    case "SET_CUSTOMER":
      const newCustomer = { ...state.customer, ...action.payload }
      return {
        ...state,
        customer: newCustomer,
      }

    case "SET_JOURNEY":
      // Check if date is being changed
      const isDateChange = action.payload.date !== undefined && 
                          action.payload.date !== state.journey.date

      if (isDateChange) {
        // If date changes, reset everything except customer data
        return {
          ...state,
          journey: { 
            ...initialBookingState.journey, 
            ...action.payload 
          },
          vehicles: { 
            ...initialBookingState.vehicles 
          },
          options: { 
            ...initialBookingState.options 
          },
          ui: {
            ...state.ui,
            pricing: null,
            errors: [],
          },
        }
      }

      return {
        ...state,
        journey: { ...state.journey, ...action.payload },
      }

    case "SET_VEHICLE_COUNT":
      const newCount = action.payload
      const newMultipleConfigs = [...state.vehicles.multipleConfigs]

      // Aggiungi o rimuovi configurazioni veicoli
      while (newMultipleConfigs.length < newCount) {
        newMultipleConfigs.push({
          type: "",
          passengers: 0,
          luggage: 0,
        })
      }
      while (newMultipleConfigs.length > newCount) {
        newMultipleConfigs.pop()
      }

      return {
        ...state,
        vehicles: {
          ...state.vehicles,
          count: newCount,
          multipleConfigs: newMultipleConfigs,
        },
      }

    case "TOGGLE_SAME_VEHICLE_TYPE":
      return {
        ...state,
        vehicles: {
          ...state.vehicles,
          sameType: !state.vehicles.sameType,
        },
      }

    case "UPDATE_SINGLE_VEHICLE_CONFIG":
      return {
        ...state,
        vehicles: {
          ...state.vehicles,
          singleConfig: { ...state.vehicles.singleConfig, ...action.payload },
        },
      }

    case "UPDATE_MULTIPLE_VEHICLE_CONFIG":
      const updatedConfigs = [...state.vehicles.multipleConfigs]
      updatedConfigs[action.payload.index] = {
        ...updatedConfigs[action.payload.index],
        ...action.payload.config,
      }
      return {
        ...state,
        vehicles: {
          ...state.vehicles,
          multipleConfigs: updatedConfigs,
        },
      }

    case "ADD_VEHICLE_CONFIG":
      return {
        ...state,
        vehicles: {
          ...state.vehicles,
          count: state.vehicles.count + 1,
          multipleConfigs: [
            ...state.vehicles.multipleConfigs,
            {
              type: "",
              passengers: 0,
              luggage: 0,
            },
          ],
        },
      }

    case "REMOVE_VEHICLE_CONFIG":
      const filteredConfigs = state.vehicles.multipleConfigs.filter((_, index) => index !== action.payload)
      return {
        ...state,
        vehicles: {
          ...state.vehicles,
          count: Math.max(1, state.vehicles.count - 1),
          multipleConfigs: filteredConfigs.length > 0 ? filteredConfigs : [{ type: "", passengers: 0, luggage: 0 }],
        },
      }

    case "SET_OPTIONS":
      return {
        ...state,
        options: { ...state.options, ...action.payload },
      }

    case "UPDATE_MEET_GREET_CONFIG":
      return {
        ...state,
        options: {
          ...state.options,
          meetGreetConfig: { ...state.options.meetGreetConfig, ...action.payload },
        },
      }

    case "SET_PRICING":
      return {
        ...state,
        ui: { ...state.ui, pricing: action.payload },
      }

    case "SET_CALCULATING_PRICE":
      return {
        ...state,
        ui: { ...state.ui, isCalculatingPrice: action.payload },
      }

    case "SET_VALIDATION_ERRORS":
      return {
        ...state,
        ui: { ...state.ui, errors: action.payload },
      }

    case "SET_SUBMIT_STATUS":
      return {
        ...state,
        ui: {
          ...state.ui,
          submitStatus: action.payload,
          isSubmitting: action.payload === "submitting",
        },
      }

    case "CLEAR_ERRORS":
      return {
        ...state,
        ui: { ...state.ui, errors: [] },
      }

    case "SET_ATTEMPTED_SUBMIT":
      return {
        ...state,
        ui: { ...state.ui, hasAttemptedSubmit: action.payload },
      }

    default:
      return state
  }
}
