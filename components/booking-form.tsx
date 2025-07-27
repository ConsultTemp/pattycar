"use client"

import React from "react"
import { useState, useEffect, useCallback } from "react"
import { useLanguage } from "@/components/language-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { CalendarIcon, Eye, Luggage, RefreshCw, User2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface LocationSearchProps {
  locations: Array<{ value: string; label: string }>;
  onSelect: (value: string) => void;
  dictionary: any;
}

const LocationSearch = React.memo(({ locations, onSelect, dictionary }: LocationSearchProps) => {
  const [search, setSearch] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  const filteredLocations = React.useMemo(() =>
    locations.filter(location =>
      location.label.toLowerCase().includes(search.toLowerCase())
    ),
    [locations, search]
  );

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <Input
        placeholder={dictionary.searchDepartureLocation || "Cerca luogo di partenza"}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setIsOpen(true)}
        className="w-full"
      />
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {search.trim() !== "" && !filteredLocations.some(loc =>
            loc.label.toLowerCase() === search.toLowerCase()
          ) && (
              <div
                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSelect(search)}
              >
                {search}
              </div>
            )}
          {filteredLocations.map((location) => (
            <div
              key={location.value}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSelect(location.value)}
            >
              {location.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

LocationSearch.displayName = "LocationSearch";

// Simple CAPTCHA generator
const generateCaptcha = () => {
  // Generate a random string of 5-6 characters (letters and numbers)
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  const length = Math.floor(Math.random() * 2) + 5; // 5-6 characters
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export default function BookingForm({ dictionary }: { dictionary: any }) {
  const { lang } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState("")
  const [minutes, setMinutes] = useState("")
  const [differentVehicles, setDifferentVehicles] = useState(false)
  const [openPickupLocation, setOpenPickupLocation] = useState(false)
  const [pickupLocation, setPickupLocation] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  
  // CAPTCHA states
  const [captchaText, setCaptchaText] = useState("")
  const [userCaptchaInput, setUserCaptchaInput] = useState("")
  const [captchaError, setCaptchaError] = useState(false)
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false)
  const [formData, setFormData] = useState<HTMLFormElement | null>(null)
  const [csrfToken, setCsrfToken] = useState("")

  // Generate initial CAPTCHA on component mount
  useEffect(() => {
    setCaptchaText(generateCaptcha());
  }, []);

  // Generate CSRF token on component mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/submit-form')
        const data = await response.json()
        setCsrfToken(data.token)
      } catch (error) {
        }
    }
    fetchCsrfToken()
  }, [])

  // Refresh the CAPTCHA
  const refreshCaptcha = () => {
    setCaptchaText(generateCaptcha());
    setUserCaptchaInput("");
    setCaptchaError(false);
  };

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

  const handleLocationSelect = useCallback((value: string) => {
    setPickupLocation(value)
    setOpenPickupLocation(false)
  }, [])

  // Mock data for pickup locations
  const locations = [
    { value: "malpensa", label: "Aereoporto Malpensa" },
    { value: "orioal-serio", label: "Aereoporto Orio al Serio" },
    { value: "stazione-centrale", label: "Stazione Centrale" },
    { value: "stazione-garibaldi", label: "Stazione Garibaldi" },
    { value: "aereoporto-venenzia", label: "Aeroporto Venezia Marco Polo" },
    { value: "stazione-venezia", label: "Stazione Venezia Santa Lucia" }
  ]

  // Country codes for phone prefixes
  const countryCodes = [
    { value: "+39", label: "Italy (+39)" },
    { value: "+1", label: "USA (+1)" },
    { value: "+44", label: "UK (+44)" },
    { value: "+33", label: "France (+33)" },
    { value: "+49", label: "Germany (+49)" },
    { value: "+34", label: "Spain (+34)" },
    { value: "+41", label: "Switzerland (+41)" },
    { value: "+43", label: "Austria (+43)" },
    { value: "+31", label: "Netherlands (+31)" },
    { value: "+32", label: "Belgium (+32)" }
  ]

  // Hours for time selection
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0')
    return { value: hour, label: hour }
  })

  // Minutes for time selection
  const minutesOptions = Array.from({ length: 12 }, (_, i) => {
    const minute = (i * 5).toString().padStart(2, '0')
    return { value: minute, label: minute }
  })

  // Get filtered locations based on search query
  const filteredLocations = locations.filter(location =>
    location.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if search query doesn't match any predefined location
  const isCustomLocation = searchQuery.trim() !== "" &&
    !locations.some(loc =>
      loc.label.toLowerCase() === searchQuery.toLowerCase() ||
      loc.value.toLowerCase() === searchQuery.toLowerCase()
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if privacy is accepted
    if (!privacyAccepted) {
      alert(dictionary.privacyRequired || "You must accept the data processing terms to proceed")
      return
    }

    // Store the form data for later submission
    setFormData(e.target as HTMLFormElement)
    
    // Show the CAPTCHA confirmation step instead of submitting directly
    setShowFinalConfirmation(true)
  }

  const handleCaptchaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (userCaptchaInput.toLowerCase() === captchaText.toLowerCase()) {
      // CAPTCHA is correct, proceed with form submission
      setCaptchaError(false)
      setIsSubmitting(true)
      
      try {
        if (formData) {
          // Create FormData object
          const formDataObj = new FormData(formData)

          // Add date value
          if (date) {
            formDataObj.append("date", format(date, "yyyy-MM-dd"))
          }

          // Add time value with minutes
          if (time) {
            formDataObj.append("time", `${time}:${minutes || '00'}`)
          }

          // Add pickup location value
          if (pickupLocation) {
            formDataObj.append("pickupLocation", pickupLocation)
          }

          // Add CSRF token
          formDataObj.append("_csrf", csrfToken)

          // Send to our API endpoint first
          const response = await fetch('/api/submit-form', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              formData: Object.fromEntries(formDataObj),
              captcha: userCaptchaInput,
              csrfToken
            })
          })
if (!response.ok) {
            throw new Error('Form submission failed')
          }

          // If successful, update UI
          setIsSubmitting(false)
          setSubmitStatus("success")
          setShowFinalConfirmation(false)
        }
      } catch (error) {
        setIsSubmitting(false)
        setSubmitStatus("error")
      }
    } else {
      // CAPTCHA is incorrect
      setCaptchaError(true)
      refreshCaptcha()
    }
  }

  // Handle canceling the CAPTCHA confirmation
  const handleCancelConfirmation = () => {
    setShowFinalConfirmation(false)
    refreshCaptcha()
  }

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl text-center mb-8 atacama">{dictionary.title}</h2>
        <p className="text-center text-darkGray font-light mb-12">{dictionary.subtitle}</p>

        {submitStatus === "success" ? (
          <div className="max-w-4xl mx-auto p-8 bg-green-50 border border-green-200 text-center fade-in">
            <h3 className="text-xl mb-4 text-green-800">{dictionary.successMessage}</h3>
            <p className="text-green-700 mb-6">
              {dictionary.successDescription || "We will contact you shortly to confirm your booking."}
            </p>
            <button
              onClick={() => setSubmitStatus("idle")}
              className="bg-black text-white px-6 py-2 hover:bg-gray-800 transition-colors duration-300"
            >
              {dictionary.newBooking || "Make another booking"}
            </button>
          </div>
        ) : showFinalConfirmation ? (
          <div className="max-w-4xl mx-auto p-8 bg-gray-50 border border-gray-200 text-center fade-in">
            <h3 className="text-xl mb-4">{dictionary.captchaVerification || "Please verify you are human"}</h3>
            
            <div className="mb-6 flex flex-col items-center">
              <div className="relative bg-gray-100 p-4 rounded-md mb-4 select-none">
                <div className="text-2xl font-bold tracking-wider opacity-85 select-none"
                  style={{ 
                    fontFamily: "monospace", 
                    letterSpacing: "0.2em",
                    transform: "skew(-10deg, 2deg)",
                    textShadow: "1px 1px 1px #00000030"
                  }}>
                  {captchaText}
                </div>
                <button 
                  type="button"
                  onClick={refreshCaptcha}
                  className="absolute right-2 top-4 text-gray-500 hover:text-black"
                  aria-label="Refresh CAPTCHA"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleCaptchaSubmit} className="w-full max-w-xs">
                <div className="mb-4">
                  <Input 
                    type="text" 
                    value={userCaptchaInput}
                    onChange={(e) => setUserCaptchaInput(e.target.value)}
                    placeholder={dictionary.enterCaptcha || "Enter text shown above"}
                    className={captchaError ? "border-red-500" : ""}
                    autoFocus
                  />
                  {captchaError && (
                    <p className="text-sm text-red-500 mt-1">
                      {dictionary.captchaError || "Incorrect verification code. Please try again."}
                    </p>
                  )}
                </div>
                
                <div className="flex space-x-4 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelConfirmation}
                    className="px-4 py-2"
                    disabled={isSubmitting}
                  >
                    {dictionary.cancel || "Cancel"}
                  </Button>
                  <Button
                    type="submit"
                    className="bg-black text-white px-6 py-2 hover:bg-gray-800 transition-colors"
                    disabled={isSubmitting || !userCaptchaInput}
                  >
                    {isSubmitting ? 
                      (dictionary.submitting || "Submitting...") : 
                      (dictionary.confirm || "Confirm Booking")}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Remove FormSubmit configuration fields */}
            <input type="hidden" name="_csrf" value={csrfToken} />

            {/* Full width name field */}
            <div className="md:col-span-2 transition-all duration-300 ">
              <label htmlFor="name" className="block text-sm text-gray-600 mb-1">
                {dictionary.nameLabel}
              </label>
              <Input type="text" id="name" name="name" required />
              <p className="text-xs text-gray-500 mt-1">{dictionary.nameHelperText}</p>
            </div>

            {/* Email and phone on the same row */}
            <div className="transition-all duration-300 ">
              <label htmlFor="email" className="block text-sm text-gray-600 mb-1">
                {dictionary.emailLabel}
              </label>
              <Input type="email" id="email" name="email" required />
            </div>

            <div className="transition-all duration-300 ">
              <label htmlFor="phone" className="block text-sm text-gray-600 mb-1">
                {dictionary.phoneLabel}
              </label>
              <div className="flex space-x-2">
                <Select name="phonePrefix">
                  <SelectTrigger className="w-1/3">
                    <SelectValue placeholder="+39" defaultValue="+39" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryCodes.map((code) => (
                      <SelectItem key={code.value} value={code.value}>
                        {code.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="tel" id="phone" name="phoneNumber" className="w-2/3" required />
              </div>
            </div>

            <div className="transition-all duration-300 ">
              <label htmlFor="vehicleType" className="block text-sm text-gray-600 mb-1">
                {dictionary.vehicleTypeLabel}
              </label>
              <Select name="vehicleType" required>
                <SelectTrigger id="vehicleType">
                  <SelectValue placeholder={dictionary.selectVehicle} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedan"> <div className="flex flex-row items-center">Sedan ( 3 <User2 className="w-4 h-4 mr-2" strokeWidth={2}/>   3 <Luggage className="w-4 h-4 mr-1" strokeWidth={2}/> ) </div></SelectItem>
                  <SelectItem value="van"> <div className="flex flex-row items-center">Van ( 4-6 <User2 className="w-4 h-4 mr-2" strokeWidth={2}/>   6 <Luggage className="w-4 h-4 mr-1" strokeWidth={2}/> ) </div></SelectItem>
                  <SelectItem value="minibus"> <div className="flex flex-row items-center">Mini Bus ( 8 <User2 className="w-4 h-4 mr-2" strokeWidth={2}/>   8 <Luggage className="w-4 h-4 mr-1" strokeWidth={2}/>) </div></SelectItem>
                  <SelectItem value="luxury-sedan"> <div className="flex flex-row items-center">Luxury Sedan ( 2 <User2 className="w-4 h-4 mr-2" strokeWidth={2}/>   2 <Luggage className="w-4 h-4 mr-1" strokeWidth={2}/> ) </div></SelectItem>

                </SelectContent>
              </Select>
            </div>

            <div className="transition-all duration-300 ">
              <label htmlFor="vehicleCount" className="block text-sm text-gray-600 mb-1">
                {dictionary.vehicleCountLabel}
              </label>
              <Select name="vehicleCount" defaultValue="1">
                <SelectTrigger id="vehicleCount">
                  <SelectValue placeholder="1" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="transition-all duration-300 ">
              <label htmlFor="date" className="block text-sm text-gray-600 mb-1">
                {dictionary.dateLabel}
              </label>
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-gray-100 border-transparent hover:bg-gray-200",
                        !date && "text-gray-500",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : ""}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} className="bg-white" />
                  </PopoverContent>
                </Popover>
                <Select name="time" onValueChange={setTime}>
                  <SelectTrigger className="w-1/3">
                    <SelectValue placeholder={dictionary.timeLabel || "Hour"} />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((hour) => (
                      <SelectItem key={hour.value} value={hour.value}>
                        {hour.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select name="minutes" onValueChange={setMinutes}>
                  <SelectTrigger className="w-1/3">
                    <SelectValue placeholder={dictionary.minlabel || "Min"} />
                  </SelectTrigger>
                  <SelectContent>
                    {minutesOptions.map((minute) => (
                      <SelectItem key={minute.value} value={minute.value}>
                        {minute.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="transition-all duration-300 ">
              <label htmlFor="pickupLocation" className="block text-sm text-gray-600 mb-1">
                {dictionary.departureLocationLabel || "Luogo di partenza"}
              </label>
              <Popover open={openPickupLocation} onOpenChange={setOpenPickupLocation}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openPickupLocation}
                    className="w-full justify-between font-normal bg-gray-100 border-transparent hover:bg-gray-200"
                  >
                    {pickupLocation ? (
                      locations.find((location) => location.value === pickupLocation)?.label || pickupLocation
                    ) : (
                      dictionary.selectDepartureLocation || "Seleziona luogo di partenza"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <LocationSearch
                    locations={locations}
                    onSelect={handleLocationSelect}
                    dictionary={dictionary}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="transition-all duration-300 ">
              <label htmlFor="passengers" className="block text-sm text-gray-600 mb-1">
                {dictionary.passengersLabel}
              </label>
              <Input type="number" id="passengers" name="passengers" min="1" required />
            </div>

            <div className="transition-all duration-300 ">
              <label htmlFor="destination" className="block text-sm text-gray-600 mb-1">
                {dictionary.destinationLabel}
              </label>
              <Input type="text" id="destination" name="destination" required />
            </div>

            <div className="transition-all duration-300 ">
              <label htmlFor="luggage" className="block text-sm text-gray-600 mb-1">
                {dictionary.luggageLabel}
              </label>
              <Input type="number" id="luggage" name="luggage" min="0" required />
            </div>

            <div className="transition-all duration-300 ">
              <label htmlFor="flight" className="block text-sm text-gray-600 mb-1">
                {dictionary.flightTrainLabel}
              </label>
              <Input type="text" id="flight" name="flight" />
            </div>

            <div className="md:col-span-2 transition-all duration-300 ">
              <label htmlFor="billingInfo" className="block text-sm text-gray-600 mb-1">
                {dictionary.billingInfoLabel}
              </label>
              <Textarea id="billingInfo" name="billingInfo" rows={4} />
            </div>

            <div className="md:col-span-2">
              <div className="md:col-span-2 mb-6 flex flex-row">
                <div className="flex items-center transition-all duration-300 p-2 w-fit">
                  <Checkbox
                    id="meetAndGreet" name="meetAndGreet" value="yes"
                    className="mr-2"
                  />

                </div>
                <label htmlFor="privacyAccepted" className="text-sm text-gray-600 flex flex-row items-center gap-2">
                {dictionary.meetAndGreetLabel}
                </label>
              </div>

              <div className="md:col-span-2 mb-6 flex flex-row">
                <div className="flex items-center transition-all duration-300 p-2 w-fit">
                  <Checkbox
                    id="differentVehicles"
                    name="differentVehicles"
                    value="yes"
                    className="mr-2"
                    checked={differentVehicles}
                    onCheckedChange={(checked) => setDifferentVehicles(checked as boolean)}
                  />

                </div>
                <label htmlFor="privacyAccepted" className="text-sm text-gray-600 flex flex-row items-center gap-2">
                  {dictionary.differentVehiclesLabel}
                </label>
              </div>

              {differentVehicles && (
                <p className="text-xs text-gray-500 ml-6 mb-4">{dictionary.differentVehiclesHelperText}</p>
              )}
            </div>

            <div className="md:col-span-2 transition-all duration-300 ">
              <label htmlFor="notes" className="block text-sm text-gray-600 mb-1">
                {dictionary.notesLabel}
              </label>
              <Textarea id="notes" name="notes" rows={4} />
            </div>

            {/* Privacy policy acceptance checkbox */}
            <div className="md:col-span-2 mb-6 flex flex-row">
              <div className="flex items-center transition-all duration-300 p-2 w-fit">
                <Checkbox
                  id="privacyAccepted"
                  name="privacyAccepted"
                  checked={privacyAccepted}
                  onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                  required
                  className="mr-2"
                />

              </div>
              <label htmlFor="privacyAccepted" className="text-sm text-gray-600 flex flex-row items-center gap-2">
                {dictionary.privacyPolicyLabel || "I accept the processing of my personal data according to the"}<Link className="text-yellow-500" href={"/privacy"}>Privacy policy</Link>
              </label>
            </div>

            <div className="md:col-span-2 text-center">
              <button
                type="submit"
                disabled={isSubmitting || !privacyAccepted}
                className={`bg-black text-white px-8 py-3 hover:bg-gray-800 transition-all duration-300 ${(isSubmitting || !privacyAccepted) ? "opacity-70 cursor-not-allowed" : ""
                  }`}
              >
                {isSubmitting ? <span>{dictionary.submitting || "Submitting..."}</span> : dictionary.submitButton}
              </button>

              {submitStatus === "error" && (
                <p className="text-red-600 mt-4 fade-in">
                  {dictionary.errorMessage || "There was an error submitting your form. Please try again."}
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  )
}