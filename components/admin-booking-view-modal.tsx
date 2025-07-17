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
  UserX
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
      'inter-cluster': 'Inter-Cluster',
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="mr-1 h-3 w-3" />
          {dictionary.admin?.dashboard?.view || "View"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            {dictionary.admin?.dashboard?.bookingDetails || "Booking Details"}
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
                  <span className="text-sm text-gray-500">Stripe Session:</span>
                  <p className="font-mono text-sm">{booking.stripe_session_id}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Payment Status:</span>
                  <Badge className="ml-2 bg-green-100 text-green-800">{booking.payment_status}</Badge>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Amount:</span>
                  <p className="font-semibold text-green-600">{formatCurrency(booking.amount_total)}</p>
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
                <Car className="mr-2 h-5 w-5" />
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
                  <span className="text-sm text-gray-500">Time:</span>
                  <p className="flex items-center">
                    <Clock className="mr-1 h-3 w-3" />
                    {booking.service_time}
                    {booking.service_end_time && ` - ${booking.service_end_time}`}
                  </p>
                </div>
                {booking.service_duration && (
                  <div>
                    <span className="text-sm text-gray-500">Duration:</span>
                    <p>{booking.service_duration}h</p>
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
              </div>
              <div>
                <span className="text-sm text-gray-500">Destination Address:</span>
                <p className="flex items-center">
                  <MapPin className="mr-1 h-3 w-3 text-red-600" />
                  {booking.destination_address}
                </p>
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
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Car className="mr-2 h-5 w-5" />
                {dictionary.admin?.dashboard?.vehicleInfo || "Vehicle Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Vehicle Type:</span>
                  <p className="font-medium">{booking.vehicle_type}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Vehicle Count:</span>
                  <p>{booking.vehicle_count}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Passengers:</span>
                  <p className="flex items-center">
                    <Users className="mr-1 h-3 w-3" />
                    {booking.passengers}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Luggage:</span>
                  <p className="flex items-center">
                    <Luggage className="mr-1 h-3 w-3" />
                    {booking.luggage || 0}
                  </p>
                </div>
              </div>
              
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
                <div>
                  <span className="text-sm text-gray-500">Meet & Greet:</span>
                  {booking.meet_and_greet ? (
                    <Badge variant="outline" className="ml-2">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Yes
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="ml-2">
                      No
                    </Badge>
                  )}
                </div>
                {booking.is_olympic_pricing && (
                  <div>
                    <span className="text-sm text-gray-500">Olympic Pricing:</span>
                    <Badge variant="outline" className="ml-2">
                      Olympic
                    </Badge>
                  </div>
                )}
              </div>
              
              {booking.notes && (
                <div>
                  <span className="text-sm text-gray-500">Notes:</span>
                  <p className="bg-gray-50 p-3 rounded mt-1">{booking.notes}</p>
                </div>
              )}
              
              {booking.billing_info && (
                <div>
                  <span className="text-sm text-gray-500">Billing Info:</span>
                  <p className="bg-gray-50 p-3 rounded mt-1">{booking.billing_info}</p>
                </div>
              )}
            </CardContent>
          </Card>

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
                {booking.night_surcharge && (
                  <div>
                    <span className="text-sm text-gray-500">Night Surcharge:</span>
                    <Badge variant="outline" className="ml-2">
                      Yes
                    </Badge>
                  </div>
                )}
              </div>
              
              {booking.price_breakdown && (
                <div>
                  <span className="text-sm text-gray-500">Price Breakdown:</span>
                  <p className="bg-gray-50 p-3 rounded mt-1 text-sm">{booking.price_breakdown}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
} 