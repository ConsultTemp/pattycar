import type { BookingState, BookingAction } from "./booking-types"

export const initialBookingState: BookingState = {
  customer: {
    name: "",
    email: "",
    phone: "",
    phonePrefix: "+39",
  },
  journey: {
    time: "",
    minutes: "",
    departure: { city: "", location: "" },
    destination: { city: "", location: "" },
  },
  vehicles: {
    count: 0,
    sameType: true,
    singleConfig: { type: "", passengers: 0, luggage: 0 },
    multipleConfigs: [],
  },
  options: {
    meetAndGreet: false,
    differentVehicles: false,
    privacyAccepted: false,
  },
  ui: {
    isSubmitting: false,
    submitStatus: "idle",
    errors: [],
    pricing: null,
    isCalculatingPrice: false,
  },
}

export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "SET_CUSTOMER":
      return {
        ...state,
        customer: { ...state.customer, ...action.payload },
      }

    case "SET_JOURNEY":
      return {
        ...state,
        journey: { ...state.journey, ...action.payload },
      }

    case "SET_VEHICLE_COUNT":
      const count = action.payload
      const newMultipleConfigs =
        count > state.vehicles.multipleConfigs.length
          ? [
              ...state.vehicles.multipleConfigs,
              ...Array(count - state.vehicles.multipleConfigs.length)
                .fill(null)
                .map(() => ({
                  type: "",
                  passengers: 0,
                  luggage: 0,
                })),
            ]
          : state.vehicles.multipleConfigs.slice(0, count)

      return {
        ...state,
        vehicles: {
          ...state.vehicles,
          count,
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
      const { index, config } = action.payload
      const updatedConfigs = [...state.vehicles.multipleConfigs]
      updatedConfigs[index] = { ...updatedConfigs[index], ...config }

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
          multipleConfigs: [...state.vehicles.multipleConfigs, { type: "", passengers: 0, luggage: 0 }],
        },
      }

    case "REMOVE_VEHICLE_CONFIG":
      const filteredConfigs = state.vehicles.multipleConfigs.filter((_, i) => i !== action.payload)
      return {
        ...state,
        vehicles: {
          ...state.vehicles,
          count: Math.max(1, state.vehicles.count - 1),
          multipleConfigs: filteredConfigs,
        },
      }

    case "SET_OPTIONS":
      return {
        ...state,
        options: { ...state.options, ...action.payload },
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
        ui: { ...state.ui, submitStatus: action.payload, isSubmitting: action.payload === "submitting" },
      }

    case "CLEAR_ERRORS":
      return {
        ...state,
        ui: { ...state.ui, errors: [] },
      }

    default:
      return state
  }
}
