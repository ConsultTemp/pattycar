"use client"

import { useCallback } from "react"
import type { BookingError } from "@/lib/booking-types"

export function useErrorHandler() {
  const handleError = useCallback((error: unknown): BookingError => {
    if (error instanceof Error) {
      if (error.message.includes("network") || error.message.includes("fetch")) {
        return {
          type: "NETWORK_ERROR",
          message: "Errore di connessione. Verifica la tua connessione internet.",
          retryable: true,
        }
      }

      if (error.message.includes("validation")) {
        return {
          type: "VALIDATION_ERROR",
          field: "general",
          message: error.message,
        }
      }

      return {
        type: "SERVER_ERROR",
        status: 500,
        message: error.message || "Errore del server",
      }
    }

    return {
      type: "SERVER_ERROR",
      status: 500,
      message: "Errore sconosciuto",
    }
  }, [])

  const isRetryableError = useCallback((error: BookingError): boolean => {
    return error.type === "NETWORK_ERROR" && "retryable" in error && error.retryable
  }, [])

  const getErrorMessage = useCallback((error: BookingError): string => {
    switch (error.type) {
      case "VALIDATION_ERROR":
        return error.message
      case "NETWORK_ERROR":
        return error.message
      case "PAYMENT_ERROR":
        return `Errore pagamento: ${error.message}`
      case "SERVER_ERROR":
        return `Errore server (${error.status}): ${error.message}`
      case "PRICING_ERROR":
        return `Errore calcolo prezzo: ${error.message}`
      default:
        return "Errore sconosciuto"
    }
  }, [])

  return {
    handleError,
    isRetryableError,
    getErrorMessage,
  }
}
