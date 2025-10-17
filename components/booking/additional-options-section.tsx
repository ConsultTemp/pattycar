"use client"

import { memo } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import type { BookingOptions, ValidationError } from "@/lib/booking-types"
import Link from "next/link"

interface AdditionalOptionsSectionProps {
  options: BookingOptions
  errors: ValidationError[]
  hasAttemptedSubmit: boolean
  onChange: (options: Partial<BookingOptions>) => void
  dictionary: any
}

export const AdditionalOptionsSection = memo<AdditionalOptionsSectionProps>(({ options, errors, hasAttemptedSubmit, onChange, dictionary }) => {
  const getFieldError = (field: string) => {
    const error = errors.find((error) => error.field === `options.${field}`)
    if (!error) return undefined
    
    // Return translated messages - first check if it's a validation key
    if (dictionary.validationErrors && dictionary.validationErrors[error.message]) {
      return dictionary.validationErrors[error.message]
    }
    
    // Fallback to existing dictionary keys for backward compatibility
    switch (field) {
      case "billingInfo":
        return dictionary.billingRequired || dictionary.billingAddressRequired
      case "companyName":
        return dictionary.companyNameRequired
      case "companyAddress":
        return dictionary.companyAddressRequired
      case "vatNumber":
        return dictionary.vatNumberRequired
      case "privacyAccepted":
        return dictionary.privacyRequired
      case "guidelinesAccepted":
        return dictionary.guidelinesRequired
      default:
        return error.message
    }
  }

  const hasFieldError = (field: string) => {
    return hasAttemptedSubmit && !!errors.find((error) => error.field === `options.${field}`)
  }

  const billingType = options.billingType || "company"

  // Function to update billingInfo when individual fields change
  const updateBillingInfo = (updates: Partial<BookingOptions>) => {
    const newOptions = { ...options, ...updates }
    
    // Auto-generate unified billingInfo from individual fields ONLY if all required fields are present
    if (newOptions.billingType === "company") {
      // Always update the individual fields first
      onChange(updates)
      
      // Then update billingInfo only if we have all required company fields
      if (newOptions.companyName && newOptions.companyAddress && newOptions.vatNumber) {
        const parts: string[] = []
        parts.push(`Società: ${newOptions.companyName}`)
        parts.push(`Indirizzo: ${newOptions.companyAddress}`)
        parts.push(`P.IVA: ${newOptions.vatNumber}`)
        // Update billingInfo in a separate call to avoid conflicts
        setTimeout(() => {
          onChange({ billingInfo: parts.join('\n') })
        }, 0)
      }
    } else if (updates.billingType === "private") {
      // When switching to private, clear company fields and reset billingInfo
      updates.companyName = ""
      updates.companyAddress = ""
      updates.vatNumber = ""
      updates.billingInfo = ""
      onChange(updates)
    } else {
      // For other updates, just pass them through
      onChange(updates)
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">{dictionary.title}</h3>

      {/* Billing Type Selection */}
      <div>
        <label htmlFor="billingType" className="block text-sm mb-2 text-gray-600">
          {dictionary.billingTypeLabel || "Billing Type"} *
        </label>
        <Select
          value={billingType}
          onValueChange={(value: "private" | "company") => {
            if (value === "private") {
              // Clear company fields when switching to private
              onChange({ 
                billingType: value,
                companyName: "",
                companyAddress: "",
                vatNumber: "",
                billingInfo: ""
              })
            } else {
              // Just set the type when switching to company
              onChange({ billingType: value })
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={dictionary.selectBillingType || "Select billing type"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">{dictionary.privateBilling || "Private"}</SelectItem>
            <SelectItem value="company">{dictionary.companyBilling || "Company"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conditional Billing Fields */}
      {billingType === "private" ? (
        /* Private Billing - Only Address */
        <div>
          <label htmlFor="billingInfo" className={`block text-sm mb-1 ${hasFieldError("billingInfo") ? "text-red-500" : "text-gray-600"}`}>
            {dictionary.billingAddressLabel || "Billing Address"} *
          </label>
          <Textarea
            id="billingInfo"
            value={options.billingInfo || ""}
            onChange={(e) => onChange({ billingInfo: e.target.value })}
            rows={3}
            placeholder={dictionary.billingAddressPlaceholder || "Enter billing address"}
            className={hasFieldError("billingInfo") ? "border-red-500" : ""}
          />
          <p className="text-xs text-gray-500 mt-1">{dictionary.billingAddressHelperText || "This address will be used for invoicing"}</p>
          {hasFieldError("billingInfo") && (
            <p className="text-red-500 text-sm mt-1" role="alert">
              {getFieldError("billingInfo")}
            </p>
          )}
        </div>
      ) : (
        /* Company Billing - Company Name, Address, VAT */
        <div className="space-y-4">
          {/* Company Name */}
          <div>
            <label htmlFor="companyName" className={`block text-sm mb-1 ${hasFieldError("companyName") ? "text-red-500" : "text-gray-600"}`}>
              {dictionary.companyNameLabel || "Company Name"} *
            </label>
            <Input
              id="companyName"
              type="text"
              value={options.companyName || ""}
              onChange={(e) => {
                const value = e.target.value
                onChange({ companyName: value })
                // Auto-update billingInfo if all fields are present
                if (value && options.companyAddress && options.vatNumber) {
                  const parts: string[] = [`Società: ${value}`, `Indirizzo: ${options.companyAddress}`, `P.IVA: ${options.vatNumber}`]
                  setTimeout(() => onChange({ billingInfo: parts.join('\n') }), 0)
                }
              }}
              placeholder={dictionary.companyNamePlaceholder || "Enter company name"}
              className={hasFieldError("companyName") ? "border-red-500" : ""}
            />
            {hasFieldError("companyName") && (
              <p className="text-red-500 text-sm mt-1" role="alert">
                {getFieldError("companyName")}
              </p>
            )}
          </div>

          {/* Company Address */}
          <div>
            <label htmlFor="companyAddress" className={`block text-sm mb-1 ${hasFieldError("companyAddress") ? "text-red-500" : "text-gray-600"}`}>
              {dictionary.companyAddressLabel || "Company Address"} *
            </label>
            <Textarea
              id="companyAddress"
              value={options.companyAddress || ""}
              onChange={(e) => {
                const value = e.target.value
                onChange({ companyAddress: value })
                // Auto-update billingInfo if all fields are present
                if (options.companyName && value && options.vatNumber) {
                  const parts: string[] = [`Società: ${options.companyName}`, `Indirizzo: ${value}`, `P.IVA: ${options.vatNumber}`]
                  setTimeout(() => onChange({ billingInfo: parts.join('\n') }), 0)
                }
              }}
              rows={3}
              placeholder={dictionary.companyAddressPlaceholder || "Enter company address"}
              className={hasFieldError("companyAddress") ? "border-red-500" : ""}
            />
            <p className="text-xs text-gray-500 mt-1">{dictionary.companyAddressHelperText || "This address will be used for invoicing"}</p>
            {hasFieldError("companyAddress") && (
              <p className="text-red-500 text-sm mt-1" role="alert">
                {getFieldError("companyAddress")}
              </p>
            )}
          </div>

          {/* VAT Number */}
          <div>
            <label htmlFor="vatNumber" className={`block text-sm mb-1 ${hasFieldError("vatNumber") ? "text-red-500" : "text-gray-600"}`}>
              {dictionary.vatNumberLabel || "VAT Number"} *
            </label>
            <Input
              id="vatNumber"
              type="text"
              value={options.vatNumber || ""}
              onChange={(e) => {
                const value = e.target.value
                onChange({ vatNumber: value })
                // Auto-update billingInfo if all fields are present
                if (options.companyName && options.companyAddress && value) {
                  const parts: string[] = [`Società: ${options.companyName}`, `Indirizzo: ${options.companyAddress}`, `P.IVA: ${value}`]
                  setTimeout(() => onChange({ billingInfo: parts.join('\n') }), 0)
                }
              }}
              placeholder={dictionary.vatNumberPlaceholder || "Enter VAT number"}
              className={hasFieldError("vatNumber") ? "border-red-500" : ""}
            />
            <p className="text-xs text-gray-500 mt-1">{dictionary.vatNumberHelperText || "Enter company VAT number"}</p>
            {hasFieldError("vatNumber") && (
              <p className="text-red-500 text-sm mt-1" role="alert">
                {getFieldError("vatNumber")}
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="notes" className="block text-sm text-gray-600 mb-1">
          {dictionary.notesLabel}
        </label>
        <Textarea
          id="notes"
          value={options.notes || ""}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={3}
          placeholder={dictionary.notesPlaceholder}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="privacyAccepted"
            checked={options.privacyAccepted}
            onCheckedChange={(checked) => onChange({ privacyAccepted: checked as boolean })}
            className={hasFieldError("privacyAccepted") ? "border-red-500" : ""}
          />
          <label htmlFor="privacyAccepted" className={`text-sm ${hasFieldError("privacyAccepted") ? "text-red-500" : "text-gray-600"}`}>
            {dictionary.privacyLabel}{" "}
            <Link className="text-yellow-500 underline" href="/privacy">
              Privacy Policy
            </Link>{" "}
            *
          </label>
        </div>
        {hasFieldError("privacyAccepted") && (
          <p className="text-red-500 text-sm ml-6" role="alert">
            {getFieldError("privacyAccepted")}
          </p>
        )}

        <div className="flex items-start space-x-2">
          <Checkbox
            id="guidelinesAccepted"
            checked={options.guidelinesAccepted}
            onCheckedChange={(checked) => onChange({ guidelinesAccepted: checked as boolean })}
            className={hasFieldError("guidelinesAccepted") ? "border-red-500" : ""}
          />
          <label htmlFor="guidelinesAccepted" className={`text-sm ${hasFieldError("guidelinesAccepted") ? "text-red-500" : "text-gray-600"}`}>
            {dictionary.guidelinesLabel}{" "}
            <Link className="text-yellow-500 underline" href="/guidelines">
              {dictionary.guidelinesLink}
            </Link>{" "}
            *
          </label>
        </div>
        {hasFieldError("guidelinesAccepted") && (
          <p className="text-red-500 text-sm ml-6" role="alert">
            {getFieldError("guidelinesAccepted")}
          </p>
        )}
      </div>
    </div>
  )
})

AdditionalOptionsSection.displayName = "AdditionalOptionsSection"
