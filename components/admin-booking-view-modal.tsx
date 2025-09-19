"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Eye, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Car, 
  Users, 
  Luggage, 
  Plane, 
  Euro, 
  CheckCircle, 
  Info,
  FileText,
  ExternalLink,
  UserCheck,
  UserX,
  Clock2,
  Settings,
  Bell,
  Star,
  Shield,
  Zap,
  X,
  Baby,
  UserPlus,
  Briefcase,
  Timer
} from "lucide-react"

interface BookingViewModalProps {
  booking: any
  dictionary: any
}

export function AdminBookingViewModal({ booking, dictionary }: BookingViewModalProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Not specified"
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    } catch {
      return dateStr
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount / 100)
  }

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'transfer': 'Transfer',
      'disposizione': 'Disposition',
      'inter-cluster': 'Transfer between cities',
      'ceremony-disposition': 'Ceremony Disposition',
      'altri-servizi': 'Other Services'
    }
    return labels[type] || type
  }

  const getServiceBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      'transfer': 'bg-blue-100 text-blue-800',
      'disposizione': 'bg-green-100 text-green-800',
      'inter-cluster': 'bg-purple-100 text-purple-800',
      'ceremony-disposition': 'bg-orange-100 text-orange-800',
      'altri-servizi': 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  // Parse individual vehicles if available
  const individualVehicles = booking.individual_vehicles ? 
    (typeof booking.individual_vehicles === 'string' ? 
      JSON.parse(booking.individual_vehicles) : 
      booking.individual_vehicles) : null

  // Parse meet & greet config if available
  const meetGreetConfig = booking.meet_greet_config ? 
    (typeof booking.meet_greet_config === 'string' ? 
      JSON.parse(booking.meet_greet_config) : 
      booking.meet_greet_config) : null

  // Parse raw metadata if available
  const rawMetadata = booking.raw_metadata ? 
    (typeof booking.raw_metadata === 'string' ? 
      JSON.parse(booking.raw_metadata) : 
      booking.raw_metadata) : null

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="mr-1 h-3 w-3" />
          {dictionary.admin?.dashboard?.view || "View"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl bg-white max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            {dictionary.admin?.dashboard?.bookingDetails || "Booking Details"} - {booking.id}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Booking Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {dictionary.admin?.dashboard?.bookingInfo || "Booking Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Booking ID:</span>
                  <p className="font-mono text-sm">{booking.id}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Payment Status:</span>
                  <Badge className="ml-2 bg-green-100 text-green-800">{booking.payment_status}</Badge>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Amount:</span>
                  <p className="font-semibold text-green-600">{formatCurrency(booking.amount_total)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Currency:</span>
                  <p className="uppercase">{booking.currency}</p>
                </div>
              </div>
              {booking.invoice_url && (
                <div>
                  <span className="text-sm text-gray-500">Invoice:</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="ml-2"
                    onClick={() => window.open(booking.invoice_url, '_blank')}
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    View Invoice
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <User className="mr-2 h-5 w-5" />
                {dictionary.admin?.dashboard?.customerInfo || "Customer Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Name:</span>
                  <p className="font-medium">{booking.customer_name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Email:</span>
                  <p className="flex items-center">
                    <Mail className="mr-1 h-3 w-3" />
                    {booking.customer_email}
                  </p>
                </div>
                {booking.customer_phone && (
                  <div>
                    <span className="text-sm text-gray-500">Phone:</span>
                    <p className="flex items-center">
                      <Phone className="mr-1 h-3 w-3" />
                      {booking.customer_phone_prefix} {booking.customer_phone}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Service Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                {dictionary.admin?.dashboard?.serviceInfo || "Service Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Service Type:</span>
                  <Badge className={`ml-2 ${getServiceBadgeColor(booking.service_type)}`}>
                    {getServiceTypeLabel(booking.service_type)}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Date:</span>
                  <p className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    {booking.service_date}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Start Time:</span>
                  <p className="flex items-center">
                    <Clock className="mr-1 h-3 w-3" />
                    {booking.service_time}
                  </p>
                </div>
                {booking.service_end_time && (
                  <div>
                    <span className="text-sm text-gray-500">End Time:</span>
                    <p className="flex items-center">
                      <Clock2 className="mr-1 h-3 w-3" />
                      {booking.service_end_time}
                    </p>
                  </div>
                )}
                {booking.service_duration && (
                  <div>
                    <span className="text-sm text-gray-500">Duration:</span>
                    <p className="flex items-center">
                      <Timer className="mr-1 h-3 w-3" />
                      {booking.service_duration}h
                    </p>
                  </div>
                )}
                {booking.is_olympic_pricing && (
                  <div>
                    <span className="text-sm text-gray-500">Olympic Pricing:</span>
                    <Badge variant="outline" className="ml-2">
                      <Star className="mr-1 h-3 w-3" />
                      Olympic
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Journey Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                {dictionary.admin?.dashboard?.journeyInfo || "Journey Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Pickup Address:</span>
                <p className="flex items-center">
                  <MapPin className="mr-1 h-3 w-3 text-green-600" />
                  {booking.pickup_address}
                </p>
                {booking.pickup_location_id && (
                  <p className="text-xs text-gray-500 ml-4">Location ID: {booking.pickup_location_id}</p>
                )}
                {booking.pickup_is_custom && (
                  <Badge variant="outline" className="ml-4 text-xs">Custom Location</Badge>
                )}
              </div>
              <div>
                <span className="text-sm text-gray-500">Destination Address:</span>
                <p className="flex items-center">
                  <MapPin className="mr-1 h-3 w-3 text-red-600" />
                  {booking.destination_address}
                </p>
                {booking.destination_location_id && (
                  <p className="text-xs text-gray-500 ml-4">Location ID: {booking.destination_location_id}</p>
                )}
                {booking.destination_is_custom && (
                  <Badge variant="outline" className="ml-4 text-xs">Custom Location</Badge>
                )}
              </div>
              {booking.distance && (
                <div>
                  <span className="text-sm text-gray-500">Distance:</span>
                  <p>{booking.distance}</p>
                </div>
              )}
              {booking.duration && (
                <div>
                  <span className="text-sm text-gray-500">Travel Duration:</span>
                  <p>{booking.duration}</p>
                </div>
              )}
              {booking.event_route && (
                <div>
                  <span className="text-sm text-gray-500">Event Route:</span>
                  <p>{booking.event_route}</p>
                </div>
              )}
              {booking.transfer_route && (
                <div>
                  <span className="text-sm text-gray-500">Transfer Route:</span>
                  <p>{booking.transfer_route}</p>
                </div>
              )}
              {booking.transfer_cost && (
                <div>
                  <span className="text-sm text-gray-500">Transfer Cost:</span>
                  <p>{booking.transfer_cost}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Car className="mr-2 h-5 w-5" />
                Informazioni Dettagliate Veicoli
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Vehicle Count:</span>
                  <p className="font-medium">{booking.vehicle_count}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Same Vehicle Type:</span>
                  <Badge variant={booking.same_vehicle_type ? "default" : "secondary"} className="ml-2">
                    {booking.same_vehicle_type ? "Yes" : "No"}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Total Passengers:</span>
                  <p className="flex items-center">
                    <Users className="mr-1 h-3 w-3" />
                    {booking.passengers}
                  </p>
                </div>
              </div>

              {booking.same_vehicle_type || booking.vehicle_count === 1 ? (
                /* Single Vehicle Configuration */
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-3">Configurazione Veicolo Unico</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Tipo:</span>
                      <p className="font-medium">{booking.vehicle_type}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Passeggeri:</span>
                      <p className="flex items-center">
                        <Users className="mr-1 h-3 w-3" />
                        {booking.passengers}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Bagagli:</span>
                      <p className="flex items-center">
                        <Luggage className="mr-1 h-3 w-3" />
                        {booking.luggage || 0}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Multiple Vehicle Configuration */
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Configurazioni Veicoli Individuali</h4>
                  {individualVehicles && individualVehicles.length > 0 ? (
                    individualVehicles.map((vehicle: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-800 mb-2">Veicolo {index + 1}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <span className="text-sm text-gray-600">Tipo:</span>
                            <p className="font-medium">{vehicle.type}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Passeggeri:</span>
                            <p className="flex items-center">
                              <Users className="mr-1 h-3 w-3" />
                              {vehicle.passengers}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Bagagli:</span>
                            <p className="flex items-center">
                              <Luggage className="mr-1 h-3 w-3" />
                              {vehicle.luggage || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>Nessuna configurazione individuale disponibile</p>
                      <p className="text-sm">Veicoli multipli con tipo: {booking.vehicle_type}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Driver Information */}
              <Separator />
              <div>
                <span className="text-sm text-gray-500">Assigned Driver:</span>
                {booking.driver_id && booking.driver ? (
                  <p className="flex items-center">
                    <User className="mr-1 h-3 w-3 text-blue-600" />
                    {booking.driver.name}
                  </p>
                ) : (
                  <p className="text-gray-400">
                    {dictionary.admin?.drivers?.noDriverAssigned || "No driver assigned"}
                  </p>
                )}
              </div>
              <div>
                <span className="text-sm text-gray-500">Assigned Customer:</span>
                {booking.customer_id && booking.customer ? (
                  <p className="flex items-center">
                    <User className="mr-1 h-3 w-3 text-green-600" />
                    {booking.customer.name}
                  </p>
                ) : (
                  <p className="text-gray-400">
                    {dictionary.admin?.customers?.noCustomerAssigned || "No customer assigned"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Meet & Greet Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Configurazione Completa Meet & Greet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Meet & Greet Enabled:</span>
                  {booking.meet_and_greet ? (
                    <Badge  className="ml-2 b-gray-100 text-white">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Yes
                    </Badge>
                  ) : (
                    <Badge  className="ml-2 b-gray-100 text-white">
                      <X className="mr-1 h-3 w-3" />
                      No
                    </Badge>
                  )}
                </div>
              </div>

              {booking.meet_and_greet && (
                <div className="bg-green-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium text-green-900 mb-3">Meet & Greet Configuration</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(booking as any).meet_greet_service_id && (
                      <div>
                        <span className="text-sm text-gray-600">Service ID:</span>
                        <p className="font-medium">{(booking as any).meet_greet_service_id}</p>
                      </div>
                    )}
                    {(booking as any).meet_greet_selected_service && (
                      <div>
                        <span className="text-sm text-gray-600">Selected Service:</span>
                        <p className="font-medium">{(booking as any).meet_greet_selected_service}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Adults:</span>
                      <p className="flex items-center">
                        <Users className="mr-1 h-3 w-3" />
                        {(booking as any).meet_greet_passengers || 0}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Children:</span>
                      <p className="flex items-center">
                        <Baby className="mr-1 h-3 w-3" />
                        {(booking as any).meet_greet_children || 0}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Infants:</span>
                      <p className="flex items-center">
                        <UserPlus className="mr-1 h-3 w-3" />
                        {(booking as any).meet_greet_infants || 0}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Extra Luggage:</span>
                      <p className="flex items-center">
                        <Briefcase className="mr-1 h-3 w-3" />
                        {(booking as any).meet_greet_extra_luggage || 0}
                      </p>
                    </div>
                  </div>

                  {(booking as any).meet_greet_extra_hours && (booking as any).meet_greet_extra_hours > 0 && (
                    <div>
                      <span className="text-sm text-gray-600">Extra Hours:</span>
                      <p className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {(booking as any).meet_greet_extra_hours}h
                      </p>
                    </div>
                  )}

                  {(booking as any).meet_greet_special_services && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-2">Special Services:</span>
                      <div className="flex flex-wrap gap-2">
                        {(booking as any).meet_greet_special_services.tarmac && (
                          <Badge variant="outline" className="bg-blue-50">
                            <Plane className="mr-1 h-3 w-3" />
                            Tarmac Access
                          </Badge>
                        )}
                        {(booking as any).meet_greet_special_services.fastTrack && (
                          <Badge variant="outline" className="bg-green-50">
                            <Zap className="mr-1 h-3 w-3" />
                            Fast Track
                          </Badge>
                        )}
                        {(booking as any).meet_greet_special_services.vipLounge && (
                          <Badge variant="outline" className="bg-purple-50">
                            <Star className="mr-1 h-3 w-3" />
                            VIP Lounge
                          </Badge>
                        )}
                        {(booking as any).meet_greet_special_services.greeterOnly && (
                          <Badge variant="outline" className="bg-gray-50">
                            <User className="mr-1 h-3 w-3" />
                            Greeter Only
                          </Badge>
                        )}
                        {(booking as any).meet_greet_special_services.veniceCombo && (
                          <Badge variant="outline" className="bg-orange-50">
                            <Shield className="mr-1 h-3 w-3" />
                            Venice Combo
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="bg-white p-3 rounded border">
                    <span className="text-sm text-gray-600 block mb-1">Summary:</span>
                    <p className="text-sm">
                      Total passengers: {((booking as any).meet_greet_passengers || 0) + ((booking as any).meet_greet_children || 0) + ((booking as any).meet_greet_infants || 0)} 
                      ({(booking as any).meet_greet_passengers || 0} adults, {(booking as any).meet_greet_children || 0} children, {(booking as any).meet_greet_infants || 0} infants)
                      {(booking as any).meet_greet_extra_luggage > 0 && ` • Extra luggage: ${(booking as any).meet_greet_extra_luggage}`}
                      {(booking as any).meet_greet_extra_hours > 0 && ` • Extra hours: ${(booking as any).meet_greet_extra_hours}h`}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Info className="mr-2 h-5 w-5" />
                {dictionary.admin?.dashboard?.additionalInfo || "Additional Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {booking.flight_info && (
                  <div>
                    <span className="text-sm text-gray-500">Flight/Train Info:</span>
                    <p className="flex items-center">
                      <Plane className="mr-1 h-3 w-3" />
                      {booking.flight_info}
                    </p>
                  </div>
                )}
                {booking.departure_city && (
                  <div>
                    <span className="text-sm text-gray-500">Departure City:</span>
                    <p>{booking.departure_city}</p>
                  </div>
                )}
                {booking.night_surcharge && (
                  <div>
                    <span className="text-sm text-gray-500">Night Surcharge:</span>
                    <Badge variant="outline" className="ml-2">
                      {booking.night_surcharge}
                    </Badge>
                  </div>
                )}
                {booking.service_badge && (
                  <div>
                    <span className="text-sm text-gray-500">Service Badge:</span>
                    <Badge variant="outline" className="ml-2">
                      {booking.service_badge}
                    </Badge>
                  </div>
                )}
              </div>
              
              {booking.notes && (
                <div>
                  <span className="text-sm text-gray-500">Notes:</span>
                  <div className="bg-gray-50 p-3 rounded mt-1">
                    <p className="whitespace-pre-wrap">{booking.notes}</p>
                  </div>
                </div>
              )}
              
              {booking.billing_info && (
                <div>
                  <span className="text-sm text-gray-500">Billing Info:</span>
                  <div className="bg-gray-50 p-3 rounded mt-1">
                    <p className="whitespace-pre-wrap">{booking.billing_info}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Euro className="mr-2 h-5 w-5" />
                {dictionary.admin?.dashboard?.pricingDetails || "Pricing Details"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Total Amount:</span>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(booking.amount_total)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">VAT Rate:</span>
                  <p>{booking.vat_rate}%</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Currency:</span>
                  <p className="uppercase">{booking.currency}</p>
                </div>
                {booking.payment_intent_id && (
                  <div>
                    <span className="text-sm text-gray-500">Payment Intent ID:</span>
                    <p className="font-mono text-sm">{booking.payment_intent_id}</p>
                  </div>
                )}
              </div>
              
              {booking.price_breakdown && (
                <div>
                  <span className="text-sm text-gray-500">Price Breakdown:</span>
                  <div className="bg-gray-50 p-3 rounded mt-1">
                    <p className="text-sm whitespace-pre-wrap">{booking.price_breakdown}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Raw Metadata (if available) */}
          {rawMetadata && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Raw Metadata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-3 rounded">
                  <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(rawMetadata, null, 2)}</pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <UserCheck className="mr-2 h-5 w-5" />
                {dictionary.admin?.dashboard?.auditInfo || "Audit Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Created:</span>
                  <p className="text-sm">{formatDate(booking.created_at)}</p>
                  {booking.created_by_email && (
                    <p className="text-sm text-blue-600 flex items-center">
                      <UserCheck className="mr-1 h-3 w-3" />
                      {booking.created_by_email}
                    </p>
                  )}
                </div>
                <div>
                  <span className="text-sm text-gray-500">Last Modified:</span>
                  <p className="text-sm">{formatDate(booking.updated_at)}</p>
                  {booking.modified_by_email && (
                    <p className="text-sm text-orange-600 flex items-center">
                      <UserX className="mr-1 h-3 w-3" />
                      {booking.modified_by_email}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
} 