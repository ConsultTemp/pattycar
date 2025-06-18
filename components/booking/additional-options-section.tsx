"use client"

import { memo } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { BookingOptions, ValidationError } from "@/lib/booking-types"
import Link from "next/link"

interface AdditionalOptionsSectionProps {
  options: BookingOptions
  errors: ValidationError[]
  onChange: (options: Partial<BookingOptions>) => void
  dictionary: any
}

export const AdditionalOptionsSection = memo<AdditionalOptionsSectionProps>(({ options, errors, onChange, dictionary }) => {
  const getFieldError = (field: string) => {
    return errors.find((error) => error.field === `options.${field}`)?.message
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">{dictionary.title}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="flight" className="block text-sm text-gray-600 mb-1">
            {dictionary.flightLabel}
          </label>
          <Input
            type="text"
            id="flight"
            value={options.flight || ""}
            onChange={(e) => onChange({ flight: e.target.value })}
            placeholder={dictionary.flightPlaceholder}
          />
        </div>
      </div>

      <div>
        <label htmlFor="billingInfo" className="block text-sm text-gray-600 mb-1">
          {dictionary.billingLabel}
        </label>
        <Textarea
          id="billingInfo"
          value={options.billingInfo || ""}
          onChange={(e) => onChange({ billingInfo: e.target.value })}
          rows={3}
          placeholder={dictionary.billingPlaceholder}
        />
      </div>

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
        <div className="flex items-center space-x-2">
          <Checkbox
            id="meetAndGreet"
            checked={options.meetAndGreet}
            onCheckedChange={(checked) => onChange({ meetAndGreet: checked as boolean })}
          />
          <label htmlFor="meetAndGreet" className="text-sm text-gray-600">
            {dictionary.meetGreetLabel}
          </label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="privacyAccepted"
            checked={options.privacyAccepted}
            onCheckedChange={(checked) => onChange({ privacyAccepted: checked as boolean })}
            className={getFieldError("privacyAccepted") ? "border-red-500" : ""}
          />
          <label htmlFor="privacyAccepted" className="text-sm text-gray-600">
            {dictionary.privacyLabel}{" "}
            <Link className="text-yellow-500 underline" href="/privacy">
              Privacy Policy
            </Link>{" "}
            *
          </label>
        </div>
        {getFieldError("privacyAccepted") && (
          <p className="text-red-500 text-sm ml-6" role="alert">
            {getFieldError("privacyAccepted")}
          </p>
        )}
      </div>
    </div>
  )
})

AdditionalOptionsSection.displayName = "AdditionalOptionsSection"
