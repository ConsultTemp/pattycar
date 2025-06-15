"use client"

import { memo } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Customer, ValidationError } from "@/lib/booking-types"

interface CustomerInfoSectionProps {
  customer: Customer
  errors: ValidationError[]
  onChange: (customer: Partial<Customer>) => void
}

const countryCodes = [
  { value: "+39", label: "🇮🇹 +39" },
  { value: "+44", label: "🇬🇧 +44" },
  { value: "+1", label: "🇺🇸 +1" },
]

export const CustomerInfoSection = memo<CustomerInfoSectionProps>(({ customer, errors, onChange }) => {
  const getFieldError = (field: string) => {
    return errors.find((error) => error.field === `customer.${field}`)?.message
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Informazioni Cliente</h3>

      <div className="md:col-span-2">
        <label htmlFor="name" className="block text-sm text-gray-600 mb-1">
          Nome completo *
        </label>
        <Input
          type="text"
          id="name"
          value={customer.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className={getFieldError("name") ? "border-red-500" : ""}
          aria-describedby={getFieldError("name") ? "name-error" : undefined}
        />
        {getFieldError("name") && (
          <p id="name-error" className="text-red-500 text-sm mt-1" role="alert">
            {getFieldError("name")}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm text-gray-600 mb-1">
            Email *
          </label>
          <Input
            type="email"
            id="email"
            value={customer.email}
            onChange={(e) => onChange({ email: e.target.value })}
            className={getFieldError("email") ? "border-red-500" : ""}
            aria-describedby={getFieldError("email") ? "email-error" : undefined}
          />
          {getFieldError("email") && (
            <p id="email-error" className="text-red-500 text-sm mt-1" role="alert">
              {getFieldError("email")}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm text-gray-600 mb-1">
            Telefono
          </label>
          <div className="flex space-x-2">
            <Select value={customer.phonePrefix} onValueChange={(value) => onChange({ phonePrefix: value })}>
              <SelectTrigger className="w-1/3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countryCodes.map((code) => (
                  <SelectItem key={code.value} value={code.value}>
                    {code.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="tel"
              id="phone"
              className="w-2/3"
              value={customer.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  )
})

CustomerInfoSection.displayName = "CustomerInfoSection"
