"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox, ComboboxOption } from "@/components/ui/combobox"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Database } from "@/types/database.types"

type BookingRow = Database['public']['Tables']['bookings']['Row']
type DriverRow = Database['public']['Tables']['drivers']['Row']

interface BookingModalProps {
  dictionary: any
  onBookingCreated: () => void
  booking?: BookingRow | null
  mode?: 'create' | 'edit'
}

export function AdminBookingModal({ dictionary, onBookingCreated, booking, mode = 'create' }: BookingModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [drivers, setDrivers] = useState<DriverRow[]>([])
  const [loadingDrivers, setLoadingDrivers] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const { toast } = useToast()
  
  const getInitialFormData = () => {
    if (mode === 'edit' && booking) {
      return {
        customer_name: booking.customer_name || "",
        customer_email: booking.customer_email || "",
        customer_phone: booking.customer_phone || "",
        customer_phone_prefix: booking.customer_phone_prefix || "+39",
        service_type: booking.service_type || "transfer",
        pickup_address: booking.pickup_address || "",
        destination_address: booking.destination_address || "",
        service_date: booking.service_date || "",
        service_time: booking.service_time || "",
        service_end_time: booking.service_end_time || "",
        service_duration: booking.service_duration || "",
        vehicle_type: booking.vehicle_type || "Mercedes-Benz Classe E",
        vehicle_count: booking.vehicle_count || 1,
        passengers: booking.passengers || 1,
        luggage: booking.luggage || 0,
        meet_and_greet: booking.meet_and_greet || false,
        flight_info: booking.flight_info || "",
        departure_city: booking.departure_city || "",
        notes: booking.notes || "",
        billing_info: booking.billing_info || "",
        amount_total: booking.amount_total ? booking.amount_total / 100 : 0,
        vat_rate: booking.vat_rate || "22",
        is_olympic_pricing: booking.is_olympic_pricing || false,
        driver_id: (booking as any).driver_id || "none",
        customer_id: (booking as any).customer_id || "none"
      }
    }
    
    return {
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      customer_phone_prefix: "+39",
      service_type: "transfer",
      pickup_address: "",
      destination_address: "",
      service_date: "",
      service_time: "",
      service_end_time: "",
      service_duration: "",
      vehicle_type: "Mercedes-Benz Classe E",
      vehicle_count: 1,
      passengers: 1,
      luggage: 0,
      meet_and_greet: false,
      flight_info: "",
      departure_city: "",
      notes: "",
      billing_info: "",
      amount_total: 0,
      vat_rate: "22",
      is_olympic_pricing: false,
      driver_id: "none",
      customer_id: "none"
    }
  }

  const [formData, setFormData] = useState(getInitialFormData())

  // Fetch drivers
  const fetchDrivers = async () => {
    try {
      setLoadingDrivers(true)
      const response = await fetch('/api/admin/drivers')
      const result = await response.json()

      if (result.success) {
        setDrivers(result.data)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch drivers",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch drivers",
        variant: "destructive"
      })
    } finally {
      setLoadingDrivers(false)
    }
  }

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true)
      const response = await fetch('/api/admin/customers')
      const result = await response.json()

      if (result.success) {
        setCustomers(result.data)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch customers",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive"
      })
    } finally {
      setLoadingCustomers(false)
    }
  }

  // Update form data when booking changes
  useEffect(() => {
    setFormData(getInitialFormData())
  }, [booking, mode])

  // Fetch drivers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDrivers()
      fetchCustomers()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const endpoint = mode === 'edit' ? '/api/admin/update-booking' : '/api/admin/create-booking'
      const method = mode === 'edit' ? 'PUT' : 'POST'
      
      const requestBody: any = {
        ...formData,
        amount_total: Math.round(formData.amount_total * 100), // Convert to cents
        driver_id: formData.driver_id === "none" ? null : formData.driver_id, // Convert "none" to null
        customer_id: formData.customer_id === "none" ? null : formData.customer_id, // Convert "none" to null
      }

      // For edit mode, include the booking ID
      if (mode === 'edit' && booking) {
        requestBody.id = booking.id
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${mode === 'edit' ? 'update' : 'create'} booking`)
      }

      const result = await response.json()
      
      toast({
        title: mode === 'edit' ? "Prenotazione aggiornata" : "Prenotazione creata",
        description: mode === 'edit' 
          ? "La prenotazione è stata aggiornata con successo"
          : "La prenotazione è stata creata con successo",
      })

      // Reset form only for create mode
      if (mode === 'create') {
        setFormData(getInitialFormData())
      }

      setIsOpen(false)
      onBookingCreated()
    } catch (error) {
      toast({
        title: "Errore",
        description: `Errore durante ${mode === 'edit' ? 'l\'aggiornamento' : 'la creazione'} della prenotazione`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="text-white" size="sm">
          {mode === 'edit' ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {mode === 'edit' ? 'Modifica' : 'Nuova Prenotazione'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Modifica Prenotazione' : 'Crea Nuova Prenotazione'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informazioni Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Nome Cliente *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => handleInputChange('customer_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customer_email">Email Cliente *</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => handleInputChange('customer_email', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customer_phone_prefix">Prefisso</Label>
                <Input
                  id="customer_phone_prefix"
                  value={formData.customer_phone_prefix}
                  onChange={(e) => handleInputChange('customer_phone_prefix', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="customer_phone">Telefono</Label>
                <Input
                  id="customer_phone"
                  value={formData.customer_phone}
                  onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Service Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informazioni Servizio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service_type">Tipo Servizio *</Label>
                <Select value={formData.service_type} onValueChange={(value) => handleInputChange('service_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="disposizione">Disposizione</SelectItem>
                    <SelectItem value="inter-cluster">Inter-Cluster</SelectItem>
                    <SelectItem value="ceremony-disposition">Ceremony Disposition</SelectItem>
                    <SelectItem value="altri-servizi">Altri Servizi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="service_date">Data Servizio *</Label>
                <Input
                  id="service_date"
                  type="date"
                  value={formData.service_date}
                  onChange={(e) => handleInputChange('service_date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="service_time">Ora Servizio *</Label>
                <Input
                  id="service_time"
                  type="time"
                  value={formData.service_time}
                  onChange={(e) => handleInputChange('service_time', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="service_end_time">Ora Fine</Label>
                <Input
                  id="service_end_time"
                  type="time"
                  value={formData.service_end_time}
                  onChange={(e) => handleInputChange('service_end_time', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Journey Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informazioni Viaggio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickup_address">Indirizzo Partenza *</Label>
                <Input
                  id="pickup_address"
                  value={formData.pickup_address}
                  onChange={(e) => handleInputChange('pickup_address', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="destination_address">Indirizzo Destinazione *</Label>
                <Input
                  id="destination_address"
                  value={formData.destination_address}
                  onChange={(e) => handleInputChange('destination_address', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Vehicle Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Configurazione Veicolo</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="vehicle_type">Tipo Veicolo *</Label>
                <Select value={formData.vehicle_type} onValueChange={(value) => handleInputChange('vehicle_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mercedes-Benz Classe E">Mercedes-Benz Classe E</SelectItem>
                    <SelectItem value="Mercedes-Benz Classe V">Mercedes-Benz Classe V</SelectItem>
                    <SelectItem value="Mercedes-Benz Sprinter">Mercedes-Benz Sprinter</SelectItem>
                    <SelectItem value="Fiat Ducato">Fiat Ducato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicle_count">Numero Veicoli</Label>
                <Input
                  id="vehicle_count"
                  type="number"
                  min="1"
                  value={formData.vehicle_count}
                  onChange={(e) => handleInputChange('vehicle_count', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="passengers">Passeggeri *</Label>
                <Input
                  id="passengers"
                  type="number"
                  min="1"
                  value={formData.passengers}
                  onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="luggage">Bagagli</Label>
                <Input
                  id="luggage"
                  type="number"
                  min="0"
                  value={formData.luggage}
                  onChange={(e) => handleInputChange('luggage', parseInt(e.target.value))}
                />
              </div>
            </div>
            
            {/* Driver and Customer Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="driver_id">{dictionary.admin?.drivers?.assignedDriver || "Assigned Driver"}</Label>
                <Combobox
                  options={[
                    { value: "none", label: dictionary.admin?.drivers?.noDriverAssigned || "No driver assigned" },
                    ...drivers.map(driver => ({ 
                      value: driver.id, 
                      label: driver.name 
                    }))
                  ]}
                  value={formData.driver_id || "none"}
                  onChange={(value) => handleInputChange('driver_id', value === "none" ? "" : value)}
                  placeholder={loadingDrivers ? "Loading drivers..." : dictionary.admin?.drivers?.selectDriver || "Select driver"}
                  searchPlaceholder={dictionary.admin?.dashboard?.searchDrivers || "Search drivers..."}
                  emptyMessage={dictionary.admin?.dashboard?.noDriversFound || "No drivers found"}
                />
              </div>
              <div>
                <Label htmlFor="customer_id">{dictionary.admin?.customers?.assignedCustomer || "Assigned Customer"}</Label>
                <Combobox
                  options={[
                    { value: "none", label: dictionary.admin?.customers?.noCustomerAssigned || "No customer assigned" },
                    ...customers.map(customer => ({ 
                      value: customer.id, 
                      label: customer.name 
                    }))
                  ]}
                  value={formData.customer_id || "none"}
                  onChange={(value) => handleInputChange('customer_id', value === "none" ? "" : value)}
                  placeholder={loadingCustomers ? "Loading customers..." : dictionary.admin?.customers?.selectCustomer || "Select customer"}
                  searchPlaceholder={dictionary.admin?.dashboard?.searchCustomers || "Search customers..."}
                  emptyMessage={dictionary.admin?.dashboard?.noCustomersFound || "No customers found"}
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informazioni Aggiuntive</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="flight_info">Info Volo</Label>
                <Input
                  id="flight_info"
                  value={formData.flight_info}
                  onChange={(e) => handleInputChange('flight_info', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="departure_city">Città Partenza</Label>
                <Input
                  id="departure_city"
                  value={formData.departure_city}
                  onChange={(e) => handleInputChange('departure_city', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="billing_info">Info Fatturazione</Label>
              <Textarea
                id="billing_info"
                value={formData.billing_info}
                onChange={(e) => handleInputChange('billing_info', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Prezzo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount_total">Importo Totale (€) *</Label>
                <Input
                  id="amount_total"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount_total}
                  onChange={(e) => handleInputChange('amount_total', parseFloat(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="vat_rate">Aliquota IVA (%)</Label>
                <Input
                  id="vat_rate"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.vat_rate}
                  onChange={(e) => handleInputChange('vat_rate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-black text-white hover:bg-gray-800">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'edit' ? 'Aggiornando...' : 'Creando...'}
                </>
              ) : (
                mode === 'edit' ? 'Aggiorna Prenotazione' : 'Crea Prenotazione'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 