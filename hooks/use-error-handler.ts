"use client"

import { useCallback } from "react"

// Error types for the booking system
export interface BookingError {
  type: 'validation' | 'network' | 'pricing' | 'payment' | 'system'
  message: string
  field?: string
  details?: any
}

// Common error patterns
const ERROR_PATTERNS = {
  network: /network|fetch|connection|timeout/i,
  payment: /payment|stripe|checkout|card/i,
  pricing: /price|calculation|rate|cost/i,
  validation: /required|invalid|missing|format/i
}

export function useErrorHandler() {
  const handleError = useCallback((error: any): BookingError => {
    console.error("🚨 Error caught:", error)

    // Handle different error types
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      
      // Network errors
      if (ERROR_PATTERNS.network.test(message)) {
        return {
          type: 'network',
          message: 'Connection error. Please check your internet connection and try again.',
          details: error.message
        }
      }
      
      // Payment errors
      if (ERROR_PATTERNS.payment.test(message)) {
        return {
          type: 'payment',
          message: 'Payment processing error. Please try again or contact support.',
          details: error.message
        }
      }
      
      // Pricing errors
      if (ERROR_PATTERNS.pricing.test(message)) {
        return {
          type: 'pricing',
          message: 'Unable to calculate pricing. Please check your booking details.',
          details: error.message
        }
      }
      
      // Validation errors
      if (ERROR_PATTERNS.validation.test(message)) {
        return {
          type: 'validation',
          message: 'Please check your booking information and try again.',
          details: error.message
        }
      }
      
      // Generic system error
      return {
        type: 'system',
        message: 'An unexpected error occurred. Please try again.',
        details: error.message
      }
    }

    // Handle HTTP response errors
    if (typeof error === 'object' && error !== null) {
      if ('status' in error) {
        const status = error.status as number
        
        switch (status) {
          case 400:
            return {
              type: 'validation',
              message: 'Invalid request. Please check your booking details.',
              details: error
            }
          case 401:
            return {
              type: 'system',
              message: 'Authentication required. Please refresh the page.',
              details: error
            }
          case 403:
            return {
              type: 'system',
              message: 'Access denied. Please contact support.',
              details: error
            }
          case 404:
            return {
              type: 'system',
              message: 'Service not found. Please try again.',
              details: error
            }
          case 429:
            return {
              type: 'network',
              message: 'Too many requests. Please wait a moment and try again.',
              details: error
            }
          case 500:
            return {
              type: 'system',
              message: 'Server error. Please try again later.',
              details: error
            }
          default:
            return {
              type: 'network',
              message: `Service error (${status}). Please try again.`,
              details: error
            }
        }
      }

      // Handle custom error objects
      if ('error' in error) {
        return handleError(error.error)
      }

      if ('message' in error) {
        return handleError(new Error(error.message as string))
      }
    }

    // Handle string errors
    if (typeof error === 'string') {
      return handleError(new Error(error))
    }

    // Unknown error type
    return {
      type: 'system',
      message: 'An unexpected error occurred. Please try again.',
      details: error
    }
  }, [])

  const getErrorMessage = useCallback((error: BookingError): string => {
    return error.message
  }, [])

  const getErrorType = useCallback((error: BookingError): BookingError['type'] => {
    return error.type
  }, [])

  const isRetryableError = useCallback((error: BookingError): boolean => {
    return error.type === 'network' || error.type === 'system'
  }, [])

  const shouldShowDetails = useCallback((error: BookingError): boolean => {
    // Only show details for validation errors in development
    return error.type === 'validation' && process.env.NODE_ENV === 'development'
  }, [])

  return {
    handleError,
    getErrorMessage,
    getErrorType,
    isRetryableError,
    shouldShowDetails
  }
}