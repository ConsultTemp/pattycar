"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { ValidationError } from "@/lib/booking-types"

interface DateSectionProps {
  date?: Date
  errors: ValidationError[]
  hasAttemptedSubmit: boolean
  onChange: (date: Date | undefined) => void
  dictionary: any
}

export function DateSection({ date, errors, hasAttemptedSubmit, onChange, dictionary }: DateSectionProps) {
  const getFieldError = (field: string) => {
    const error = errors.find((error) => error.field.includes(field))
    if (!error) return undefined
    
    // Return translated messages instead of raw Zod messages
    switch (field) {
      case "date":
        return dictionary.dateRequired
      default:
        return error.message
    }
  }

  const hasFieldError = (field: string) => {
    return hasAttemptedSubmit && !!getFieldError(field)
  }

  const handleDateChange = (selectedDate: Date | undefined) => {
    onChange(selectedDate)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          {dictionary.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Important notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {dictionary.dateImportance || "La data è fondamentale: da essa dipendono i prezzi e la disponibilità dei servizi. Seleziona prima la data per procedere."}
          </AlertDescription>
        </Alert>

        {/* Date picker */}
        <div className="space-y-2">
          <Label htmlFor="date" className={hasFieldError("date") ? "text-red-500" : ""}>{dictionary.dateLabel} *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal ${
                  !date && "text-muted-foreground"
                } ${hasFieldError("date") ? "border-red-500" : ""}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: it }) : dictionary.selectDate}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {hasFieldError("date") && (
            <p className="text-red-500 text-sm mt-1" role="alert">
              {getFieldError("date")}
            </p>
          )}
        </div>

        {/* Show message when date is selected */}
        {date && (
          <Alert className="bg-green-50 border-green-200">
            <CalendarIcon className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {dictionary.dateSelected || "Data selezionata! Ora puoi procedere con la configurazione del viaggio."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 