"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Plus, Minus, UserPlus, Calendar, Phone, Mail, MapPin, Car, Users, Luggage, Plane, Building, Euro } from "lucide-react"

interface VehicleConfig {
  type: string
  passengers: number
  luggage: number
}

interface MeetGreetConfig {
  enabled: boolean
  passengers: number
  children: number
  infants: number
  extraLuggage: number
  extraHours: number
  specialServices: Record<string, boolean>
}

interface AdminBookingFormData {
  customerName: string
  customerEmail: string
  customerPhone: string
  phonePrefix: string
  serviceType: string
  serviceDate: string
  serviceTime: string
  endTime: string
  pickupAddress: string
  destinationAddress: string
  meetAndGreet: boolean
  meetGreetConfig: MeetGreetConfig
  flightInfo: string
  departureCity: string
  vehicleCount: number
  vehicles: VehicleConfig[]
  billingInfo: string
  notes: string
  totalPrice: string
}

const initialFormData: AdminBookingFormData = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  phonePrefix: "+39",
  serviceType: "transfer",
  serviceDate: "",
  serviceTime: "",
  endTime: "",
  pickupAddress: "",
  destinationAddress: "",
  meetAndGreet: false,
  meetGreetConfig: {
    enabled: false,
    passengers: 1,
    children: 0,
    infants: 0,
    extraLuggage: 0,
    extraHours: 0,
    specialServices: {}
  },
  flightInfo: "",
  departureCity: "",
  vehicleCount: 1,
  vehicles: [{ type: "sedan", passengers: 1, luggage: 0 }],
  billingInfo: "",
  notes: "",
  totalPrice: ""
}

const serviceTypes = [
  { value: "transfer", label: "Transfer" },
  { value: "disposizione", label: "Disposizione" },
  { value: "inter-cluster", label: "Inter-Cluster" },
  { value: "ceremony-disposition", label: "Ceremony Disposition" }
]

const vehicleTypes = [
  { value: "sedan", label: "Sedan", maxPassengers: 3, maxLuggage: 2 },
  { value: "minivan", label: "Minivan", maxPassengers: 6, maxLuggage: 6 },
  { value: "van", label: "Van", maxPassengers: 8, maxLuggage: 8 },
  { value: "luxury-sedan", label: "Luxury Sedan", maxPassengers: 2, maxLuggage: 2 }
]

// Using same country codes as customer-info-section.tsx
const countryCodes = [
  { value: "+39", label: "🇮🇹 Italy (+39)", country: "Italy" },
  { value: "+1-US", label: "🇺🇸 United States (+1)", country: "United States" },
  { value: "+1-CA", label: "🇨🇦 Canada (+1)", country: "Canada" },
  { value: "+44", label: "🇬🇧 United Kingdom (+44)", country: "United Kingdom" },
  { value: "+33", label: "🇫🇷 France (+33)", country: "France" },
  { value: "+49", label: "🇩🇪 Germany (+49)", country: "Germany" },
  { value: "+34", label: "🇪🇸 Spain (+34)", country: "Spain" },
  { value: "+7", label: "🇷🇺 Russia (+7)", country: "Russia" },
  { value: "+86", label: "🇨🇳 China (+86)", country: "China" },
  { value: "+81", label: "🇯🇵 Japan (+81)", country: "Japan" },
  { value: "+82", label: "🇰🇷 South Korea (+82)", country: "South Korea" },
  { value: "+91", label: "🇮🇳 India (+91)", country: "India" },
  { value: "+55", label: "🇧🇷 Brazil (+55)", country: "Brazil" },
  { value: "+61", label: "🇦🇺 Australia (+61)", country: "Australia" },
  { value: "+31", label: "🇳🇱 Netherlands (+31)", country: "Netherlands" },
  { value: "+41", label: "🇨🇭 Switzerland (+41)", country: "Switzerland" },
  { value: "+43", label: "🇦🇹 Austria (+43)", country: "Austria" },
  { value: "+32", label: "🇧🇪 Belgium (+32)", country: "Belgium" },
  { value: "+45", label: "🇩🇰 Denmark (+45)", country: "Denmark" },
  { value: "+47", label: "🇳🇴 Norway (+47)", country: "Norway" },
  { value: "+46", label: "🇸🇪 Sweden (+46)", country: "Sweden" },
  { value: "+358", label: "🇫🇮 Finland (+358)", country: "Finland" },
  { value: "+351", label: "🇵🇹 Portugal (+351)", country: "Portugal" },
  { value: "+30", label: "🇬🇷 Greece (+30)", country: "Greece" },
  { value: "+48", label: "🇵🇱 Poland (+48)", country: "Poland" },
  { value: "+420", label: "🇨🇿 Czech Republic (+420)", country: "Czech Republic" },
  { value: "+36", label: "🇭🇺 Hungary (+36)", country: "Hungary" },
  { value: "+40", label: "🇷🇴 Romania (+40)", country: "Romania" },
  { value: "+359", label: "🇧🇬 Bulgaria (+359)", country: "Bulgaria" },
  { value: "+385", label: "🇭🇷 Croatia (+385)", country: "Croatia" },
  { value: "+381", label: "🇷🇸 Serbia (+381)", country: "Serbia" },
  { value: "+386", label: "🇸🇮 Slovenia (+386)", country: "Slovenia" },
  { value: "+421", label: "🇸🇰 Slovakia (+421)", country: "Slovakia" },
  { value: "+372", label: "🇪🇪 Estonia (+372)", country: "Estonia" },
  { value: "+371", label: "🇱🇻 Latvia (+371)", country: "Latvia" },
  { value: "+370", label: "🇱🇹 Lithuania (+370)", country: "Lithuania" }
]

interface AdminBookingModalProps {
  onBookingCreated?: () => void
  dictionary?: any
}

export function AdminBookingModal({ onBookingCreated, dictionary }: AdminBookingModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState<AdminBookingFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [countryOpen, setCountryOpen] = useState(false)
  const [selectedCountryCode, setSelectedCountryCode] = useState("+39")

  // Function to get the actual prefix (removes suffixes like -US, -CA, etc.)
  const getActualPrefix = (value: string) => {
    if (value === "+1-US" || value === "+1-CA") return "+1"
    if (value === "+7-RU" || value === "+7-KZ") return "+7"
    return value
  }

  const updateFormData = (field: keyof AdminBookingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateMeetGreetConfig = (field: keyof MeetGreetConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      meetGreetConfig: {
        ...prev.meetGreetConfig,
        [field]: value
      }
    }))
  }

  const updateVehicle = (index: number, field: keyof VehicleConfig, value: any) => {
    const newVehicles = [...formData.vehicles]
    newVehicles[index] = { ...newVehicles[index], [field]: value }
    setFormData(prev => ({ ...prev, vehicles: newVehicles }))
  }

  const addVehicle = () => {
    const newVehicleCount = formData.vehicleCount + 1
    const newVehicles = [...formData.vehicles, { type: "sedan", passengers: 1, luggage: 0 }]
    setFormData(prev => ({
      ...prev,
      vehicleCount: newVehicleCount,
      vehicles: newVehicles
    }))
  }

  const removeVehicle = (index: number) => {
    if (formData.vehicleCount > 1) {
      const newVehicleCount = formData.vehicleCount - 1
      const newVehicles = formData.vehicles.filter((_, i) => i !== index)
      setFormData(prev => ({
        ...prev,
        vehicleCount: newVehicleCount,
        vehicles: newVehicles
      }))
    }
  }

  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!formData.customerName.trim()) errors.push("Nome cliente è obbligatorio")
    if (!formData.customerEmail.trim()) errors.push("Email cliente è obbligatoria")
    if (!formData.customerPhone.trim()) errors.push("Telefono cliente è obbligatorio")
    if (!formData.serviceDate) errors.push("Data servizio è obbligatoria")
    if (!formData.serviceTime) errors.push("Ora servizio è obbligatoria")
    if (!formData.pickupAddress.trim()) errors.push("Indirizzo di partenza è obbligatorio")
    if (!formData.destinationAddress.trim()) errors.push("Indirizzo di destinazione è obbligatorio")
    if (!formData.totalPrice.trim()) errors.push("Prezzo totale è obbligatorio")
    
    // Validate end time for disposizione
    if (formData.serviceType === "disposizione" && !formData.endTime) {
      errors.push("Ora fine è obbligatoria per il servizio disposizione")
    }

    // Validate vehicles
    formData.vehicles.forEach((vehicle, index) => {
      if (vehicle.passengers < 1) {
        errors.push(`Veicolo ${index + 1}: Numero passeggeri deve essere almeno 1`)
      }
    })

    return errors
  }

  const handleSubmit = async () => {
    setErrors([])
    const validationErrors = validateForm()
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const bookingData = {
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        customer_phone_prefix: formData.phonePrefix,
        service_type: formData.serviceType,
        service_date: formData.serviceDate,
        service_time: formData.serviceTime,
        service_end_time: formData.endTime || null,
        pickup_address: formData.pickupAddress,
        destination_address: formData.destinationAddress,
        passengers: formData.vehicles.reduce((sum, v) => sum + v.passengers, 0),
        vehicle_type: formData.vehicleCount === 1 ? formData.vehicles[0].type : "multiple",
        vehicle_count: formData.vehicleCount,
        luggage: formData.vehicles.reduce((sum, v) => sum + v.luggage, 0),
        meet_and_greet: formData.meetAndGreet,
        meet_greet_config: formData.meetAndGreet ? formData.meetGreetConfig : null,
        flight_info: formData.flightInfo || null,
        departure_city: formData.departureCity || null,
        notes: formData.notes || null,
        billing_info: formData.billingInfo || null,
        amount_total: Math.round(parseFloat(formData.totalPrice) * 100), // Convert to cents
        payment_status: "paid",
        individual_vehicles: formData.vehicleCount > 1 ? formData.vehicles.map((v, i) => ({
          id: `vehicle-${i + 1}`,
          type: v.type,
          passengers: v.passengers,
          luggage: v.luggage
        })) : null
      }

      const response = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      })

      const result = await response.json()
      
      if (result.success) {
        setIsOpen(false)
        setFormData(initialFormData)
        onBookingCreated?.()
        alert('Prenotazione creata con successo!')
      } else {
        setErrors([result.error || 'Errore nella creazione della prenotazione'])
      }
    } catch (error) {
      setErrors(['Errore di connessione. Riprova più tardi.'])
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setErrors([])
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={resetForm} className="bg-green-600 hover:bg-green-700">
          <UserPlus className="mr-2 h-4 w-4" />
          Aggiungi Prenotazione
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Aggiungi Nuova Prenotazione
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-red-800 font-medium mb-2">Errori di validazione:</h4>
              <ul className="text-red-700 text-sm space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Informazioni Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <Label htmlFor="customerName">Nome e Cognome *</Label>
                <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => updateFormData("customerName", e.target.value)}
                    placeholder="Mario Rossi"
                />
              </div>
              <div>
                  <Label htmlFor="customerEmail">Email *</Label>
                <Input
                    id="customerEmail"
                  type="email"
                    value={formData.customerEmail}
                    onChange={(e) => updateFormData("customerEmail", e.target.value)}
                    placeholder="mario.rossi@email.com"
                />
              </div>
              <div>
                  <Label htmlFor="phonePrefix">Prefisso *</Label>
                  <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={countryOpen}
                        className="w-full justify-between"
                      >
                        {selectedCountryCode ? 
                          countryCodes.find(c => c.value === selectedCountryCode)?.label.split(' ')[0] + ' ' + getActualPrefix(selectedCountryCode) : 
                          "Seleziona..."
                        }
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Cerca paese..." />
                        <CommandList>
                          <CommandEmpty>Nessun paese trovato.</CommandEmpty>
                          <CommandGroup>
                            {countryCodes.map((country) => (
                              <CommandItem
                                key={country.country}
                                value={`${country.country} ${country.value}`}
                                onSelect={() => {
                                  setSelectedCountryCode(country.value)
                                  updateFormData("phonePrefix", getActualPrefix(country.value))
                                  setCountryOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCountryCode === country.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {country.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
              </div>
              <div>
                  <Label htmlFor="customerPhone">Telefono *</Label>
                <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => updateFormData("customerPhone", e.target.value)}
                    placeholder="3331234567"
                />
              </div>
            </div>
            </CardContent>
          </Card>

          {/* Service Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Informazioni Servizio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                  <Label htmlFor="serviceType">Tipo Servizio *</Label>
                  <Select value={formData.serviceType} onValueChange={(value) => updateFormData("serviceType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      {serviceTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                  <Label htmlFor="serviceDate">Data *</Label>
                <Input
                    id="serviceDate"
                  type="date"
                    value={formData.serviceDate}
                    onChange={(e) => updateFormData("serviceDate", e.target.value)}
                />
              </div>
              <div>
                  <Label htmlFor="serviceTime">Ora Inizio *</Label>
                <Input
                    id="serviceTime"
                  type="time"
                    value={formData.serviceTime}
                    onChange={(e) => updateFormData("serviceTime", e.target.value)}
                />
                </div>
              </div>
              
              {formData.serviceType === "disposizione" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                    <Label htmlFor="endTime">Ora Fine *</Label>
                <Input
                      id="endTime"
                  type="time"
                      value={formData.endTime}
                      onChange={(e) => updateFormData("endTime", e.target.value)}
                />
              </div>
            </div>
              )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <Label htmlFor="pickupAddress">Indirizzo Partenza *</Label>
                <Input
                    id="pickupAddress"
                    value={formData.pickupAddress}
                    onChange={(e) => updateFormData("pickupAddress", e.target.value)}
                    placeholder="Via Roma 1, Milano"
                />
              </div>
              <div>
                  <Label htmlFor="destinationAddress">Indirizzo Destinazione *</Label>
                <Input
                    id="destinationAddress"
                    value={formData.destinationAddress}
                    onChange={(e) => updateFormData("destinationAddress", e.target.value)}
                    placeholder="Aeroporto Malpensa, Milano"
                />
              </div>
            </div>
            </CardContent>
          </Card>

          {/* Additional Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-4 w-4" />
                Opzioni Aggiuntive
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="meetAndGreet"
                  checked={formData.meetAndGreet}
                  onCheckedChange={(checked) => {
                    updateFormData("meetAndGreet", checked)
                    updateMeetGreetConfig("enabled", checked)
                  }}
                />
                <Label htmlFor="meetAndGreet">Meet & Greet</Label>
              </div>

              {/* Meet & Greet Configuration */}
              {formData.meetAndGreet && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-3">Configurazione Meet & Greet</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                      <Label htmlFor="mgPassengers">Adulti</Label>
                <Input
                        id="mgPassengers"
                  type="number"
                  min="1"
                        max="8"
                        value={formData.meetGreetConfig.passengers}
                        onChange={(e) => updateMeetGreetConfig("passengers", parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                      <Label htmlFor="mgChildren">Bambini (tariffa ridotta)</Label>
                <Input
                        id="mgChildren"
                  type="number"
                        min="0"
                        max="6"
                        value={formData.meetGreetConfig.children}
                        onChange={(e) => updateMeetGreetConfig("children", parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                      <Label htmlFor="mgInfants">Neonati (gratuiti)</Label>
                <Input
                        id="mgInfants"
                  type="number"
                  min="0"
                        max="3"
                        value={formData.meetGreetConfig.infants}
                        onChange={(e) => updateMeetGreetConfig("infants", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                      <Label htmlFor="mgExtraLuggage">Bagagli Extra</Label>
                      <Input
                        id="mgExtraLuggage"
                        type="number"
                        min="0"
                        max="10"
                        value={formData.meetGreetConfig.extraLuggage}
                        onChange={(e) => updateMeetGreetConfig("extraLuggage", parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                      <Label htmlFor="mgExtraHours">Ore Extra (per ritardi)</Label>
                      <Input
                        id="mgExtraHours"
                        type="number"
                        min="0"
                        max="12"
                        value={formData.meetGreetConfig.extraHours}
                        onChange={(e) => updateMeetGreetConfig("extraHours", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

                  <div className="mt-4">
                    <Label className="text-sm font-medium">Servizi Speciali</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="fastTrack"
                          checked={!!formData.meetGreetConfig.specialServices?.fastTrack}
                          onCheckedChange={(checked) => {
                            const newServices = { ...formData.meetGreetConfig.specialServices }
                            if (checked) {
                              newServices.fastTrack = true
                            } else {
                              delete newServices.fastTrack
                            }
                            updateMeetGreetConfig("specialServices", newServices)
                          }}
                        />
                        <Label htmlFor="fastTrack" className="text-sm">Fast Track</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="vipLounge"
                          checked={!!formData.meetGreetConfig.specialServices?.vipLounge}
                          onCheckedChange={(checked) => {
                            const newServices = { ...formData.meetGreetConfig.specialServices }
                            if (checked) {
                              newServices.vipLounge = true
                            } else {
                              delete newServices.vipLounge
                            }
                            updateMeetGreetConfig("specialServices", newServices)
                          }}
                        />
                        <Label htmlFor="vipLounge" className="text-sm">VIP Lounge</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="greeterOnly"
                          checked={!!formData.meetGreetConfig.specialServices?.greeterOnly}
                          onCheckedChange={(checked) => {
                            const newServices = { ...formData.meetGreetConfig.specialServices }
                            if (checked) {
                              newServices.greeterOnly = true
                            } else {
                              delete newServices.greeterOnly
                            }
                            updateMeetGreetConfig("specialServices", newServices)
                          }}
                        />
                        <Label htmlFor="greeterOnly" className="text-sm">Greeter Only</Label>
                      </div>
                    </div>
                  </div>
          </div>
              )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <Label htmlFor="flightInfo">Informazioni Volo</Label>
                <Input
                    id="flightInfo"
                    value={formData.flightInfo}
                    onChange={(e) => updateFormData("flightInfo", e.target.value)}
                    placeholder="AZ123"
                />
              </div>
              <div>
                  <Label htmlFor="departureCity">Città di Provenienza</Label>
                <Input
                    id="departureCity"
                    value={formData.departureCity}
                    onChange={(e) => updateFormData("departureCity", e.target.value)}
                    placeholder="Roma"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Configurazione Veicoli ({formData.vehicleCount})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.vehicles.map((vehicle, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Veicolo {index + 1}</h4>
                    {formData.vehicleCount > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeVehicle(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Tipo Veicolo</Label>
                      <Select
                        value={vehicle.type}
                        onValueChange={(value) => updateVehicle(index, "type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicleTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
            </div>
            <div>
                      <Label>Passeggeri</Label>
                      <Input
                        type="number"
                        min="1"
                        max={vehicleTypes.find(t => t.value === vehicle.type)?.maxPassengers || 8}
                        value={vehicle.passengers}
                        onChange={(e) => updateVehicle(index, "passengers", parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
                      <Label>Bagagli</Label>
                      <Input
                        type="number"
                        min="0"
                        max={vehicleTypes.find(t => t.value === vehicle.type)?.maxLuggage || 8}
                        value={vehicle.luggage}
                        onChange={(e) => updateVehicle(index, "luggage", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addVehicle}
                className="w-full border-dashed"
              >
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi Veicolo
              </Button>
            </CardContent>
          </Card>

          {/* Billing and Price */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Fatturazione e Prezzo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="totalPrice">Prezzo Totale (€) *</Label>
                <Input
                  id="totalPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalPrice}
                  onChange={(e) => updateFormData("totalPrice", e.target.value)}
                  placeholder="150.00"
                />
              </div>
              
              <div>
                <Label htmlFor="billingInfo">Informazioni Fatturazione</Label>
                <Textarea
                  id="billingInfo"
                  value={formData.billingInfo}
                  onChange={(e) => updateFormData("billingInfo", e.target.value)}
                  placeholder="Ragione sociale, P.IVA, indirizzo..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Note</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateFormData("notes", e.target.value)}
                  placeholder="Note aggiuntive..."
                  rows={3}
                />
            </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSubmit} className="text-white" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crea Prenotazione"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 