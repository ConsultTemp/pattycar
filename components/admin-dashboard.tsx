"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Database } from "@/types/database.types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { adminLogout } from "@/lib/supabase-auth"
import { AdminBookingModal } from "@/components/admin-booking-modal"
import { AdminDeleteModal } from "@/components/admin-delete-modal"
import { 
  CalendarDays, 
  Car, 
  Clock, 
  Euro, 
  LogOut, 
  Mail, 
  MapPin, 
  Phone, 
  Search, 
  Users,
  FileText,
  ExternalLink,
  Plane,
  Luggage,
  Clock2,
  CheckCircle,
  Info
} from "lucide-react"

type BookingRow = Database['public']['Tables']['bookings']['Row']

interface FilterState {
  search: string
  serviceType: string
  dateFrom: string
  dateTo: string
}

interface AdminDashboardProps {
  bookings: BookingRow[]
  lang: string
  dictionary: any
}

export default function AdminDashboard({ bookings, lang, dictionary }: AdminDashboardProps) {
  const router = useRouter()
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    serviceType: "",
    dateFrom: "",
    dateTo: ""
  })
  
  const [sortBy, setSortBy] = useState<keyof BookingRow>("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [refreshKey, setRefreshKey] = useState(0)

  const refreshBookings = () => {
    setRefreshKey(prev => prev + 1)
    // In a real app, this would trigger a data refetch
    window.location.reload()
  }

  // Filter and sort bookings
  const filteredBookings = useMemo(() => {
    let filtered = bookings

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(booking => 
        booking.customer_name.toLowerCase().includes(searchLower) ||
        booking.customer_email.toLowerCase().includes(searchLower) ||
        booking.pickup_address.toLowerCase().includes(searchLower) ||
        booking.destination_address.toLowerCase().includes(searchLower)
      )
    }

    // Apply service type filter
    if (filters.serviceType && filters.serviceType !== "all") {
      filtered = filtered.filter(booking => booking.service_type === filters.serviceType)
    }

    // Apply date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(booking => booking.service_date >= filters.dateFrom)
    }

    if (filters.dateTo) {
      filtered = filtered.filter(booking => booking.service_date <= filters.dateTo)
    }

    // Sort bookings
    filtered.sort((a, b) => {
      const aValue = a[sortBy] || ""
      const bValue = b[sortBy] || ""
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [bookings, filters, sortBy, sortOrder])

  // Get unique service types for filter dropdown
  const serviceTypes = useMemo(() => {
    const types = new Set(bookings.map(booking => booking.service_type))
    return Array.from(types)
  }, [bookings])

  const handleLogout = async () => {
    await adminLogout()
    // Clear cookies via API
    await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' })
    })
    router.push(`/${lang}/admin`)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getServiceBadgeColor = (serviceType: string) => {
    switch (serviceType) {
      case 'transfer':
        return 'bg-blue-100 text-blue-800'
      case 'disposizione':
        return 'bg-yellow-100 text-yellow-800'
      case 'ceremony-disposition':
        return 'bg-purple-100 text-purple-800'
      case 'inter-cluster':
        return 'bg-green-100 text-green-800'
      case 'altri-servizi':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getServiceTypeLabel = (serviceType: string) => {
    return dictionary.admin?.serviceTypes?.[serviceType] || serviceType
  }

  return (
    <div className="space-y-6">
      {/* Header with stats and logout */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">{dictionary.admin?.dashboard?.totalBookings || "Total Bookings"}</span>
              <Badge variant="secondary">{bookings.length}</Badge>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Euro className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">{dictionary.admin?.dashboard?.totalRevenue || "Total Revenue"}</span>
              <Badge variant="secondary">
                {formatCurrency(bookings.reduce((sum, booking) => sum + booking.amount_total, 0))}
              </Badge>
            </div>
          </Card>
        </div>
        <div className="flex items-center space-x-2">
          <AdminBookingModal 
            dictionary={dictionary} 
            onBookingCreated={refreshBookings}
          />
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            {dictionary.admin?.header?.logout || "Logout"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="mr-2 h-5 w-5" />
            {dictionary.admin?.dashboard?.filters || "Filters"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder={dictionary.admin?.dashboard?.searchPlaceholder || "Search bookings..."}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div>
              <Select
                value={filters.serviceType || "all"}
                onValueChange={(value) => setFilters(prev => ({ ...prev, serviceType: value === "all" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={dictionary.admin?.dashboard?.serviceType || "Service Type"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{dictionary.admin?.dashboard?.allServices || "All Services"}</SelectItem>
                  {serviceTypes.map(type => (
                    <SelectItem key={type} value={type}>{getServiceTypeLabel(type)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                type="date"
                placeholder={dictionary.admin?.dashboard?.fromDate || "From Date"}
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            <div>
              <Input
                type="date"
                placeholder={dictionary.admin?.dashboard?.toDate || "To Date"}
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            {dictionary.admin?.dashboard?.bookingsCount?.replace('{count}', filteredBookings.length) || `Bookings (${filteredBookings.length})`}
          </CardTitle>
          <CardDescription>
            {dictionary.admin?.dashboard?.bookingsDescription || "All paid bookings from customers"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => {
                    if (sortBy === "created_at") {
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    } else {
                      setSortBy("created_at")
                      setSortOrder("desc")
                    }
                  }}>
                    <div className="flex items-center">
                      <CalendarDays className="mr-1 h-4 w-4" />
                      {dictionary.admin?.dashboard?.date || "Date"}
                    </div>
                  </TableHead>
                  <TableHead>{dictionary.admin?.dashboard?.customer || "Customer"}</TableHead>
                  <TableHead>{dictionary.admin?.dashboard?.service || "Service"}</TableHead>
                  <TableHead>{dictionary.admin?.dashboard?.route || "Route"}</TableHead>
                  <TableHead>{dictionary.admin?.dashboard?.vehicle || "Vehicle"}</TableHead>
                  <TableHead>{dictionary.admin?.dashboard?.serviceInfo || "Service Info"}</TableHead>
                  <TableHead>{dictionary.admin?.dashboard?.options || "Options"}</TableHead>
                  <TableHead>{dictionary.admin?.dashboard?.amount || "Amount"}</TableHead>
                  <TableHead>{dictionary.admin?.dashboard?.status || "Status"}</TableHead>
                  <TableHead>{dictionary.admin?.dashboard?.actions || "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{booking.service_date}</div>
                        <div className="text-sm text-gray-500">{booking.service_time}</div>
                        {booking.service_end_time && (
                          <div className="text-xs text-gray-500">
                            <Clock2 className="mr-1 h-3 w-3 inline" />
                            {booking.service_end_time}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          {formatDate(booking.created_at)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{booking.customer_name}</div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="mr-1 h-3 w-3" />
                          {booking.customer_email}
                        </div>
                        {booking.customer_phone && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="mr-1 h-3 w-3" />
                            {booking.customer_phone_prefix} {booking.customer_phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className={getServiceBadgeColor(booking.service_type)}>
                          {getServiceTypeLabel(booking.service_type)}
                        </Badge>
                        {booking.service_duration && (
                          <div className="text-xs text-gray-500">
                            {booking.service_duration}h
                          </div>
                        )}
                        {booking.is_olympic_pricing && (
                          <Badge variant="outline" className="text-xs">
                            Olympic
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <MapPin className="mr-1 h-3 w-3" />
                          <span className="truncate max-w-32">{booking.pickup_address}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="mr-1 h-3 w-3" />
                          <span className="truncate max-w-32">{booking.destination_address}</span>
                        </div>
                        {booking.distance && (
                          <div className="text-xs text-gray-500">{booking.distance}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Car className="mr-1 h-3 w-3" />
                          {booking.vehicle_type}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="mr-1 h-3 w-3" />
                          {booking.passengers} {dictionary.admin?.dashboard?.passengers || "passengers"}
                        </div>
                        {booking.luggage > 0 && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Luggage className="mr-1 h-3 w-3" />
                            {booking.luggage} bagagli
                          </div>
                        )}
                        {booking.vehicle_count > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            {booking.vehicle_count} {dictionary.admin?.dashboard?.vehicles || "vehicles"}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {booking.flight_info && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Plane className="mr-1 h-3 w-3" />
                            {booking.flight_info}
                          </div>
                        )}
                        {booking.departure_city && (
                          <div className="text-xs text-gray-500">
                            Da: {booking.departure_city}
                          </div>
                        )}
                        {booking.duration && (
                          <div className="text-xs text-gray-500">
                            <Clock className="mr-1 h-3 w-3 inline" />
                            {booking.duration}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {booking.meet_and_greet && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Meet & Greet
                          </Badge>
                        )}
                        {booking.notes && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Info className="mr-1 h-3 w-3" />
                            <span className="truncate max-w-20">{booking.notes}</span>
                          </div>
                        )}
                        {booking.night_surcharge && (
                          <Badge variant="outline" className="text-xs">
                            Notturno
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-green-600">
                          {formatCurrency(booking.amount_total)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {dictionary.admin?.dashboard?.vatRate || "VAT"} {booking.vat_rate}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        {dictionary.admin?.dashboard?.paid || booking.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <AdminBookingModal 
                          dictionary={dictionary} 
                          onBookingCreated={refreshBookings}
                          booking={booking}
                          mode="edit"
                        />
                        <AdminDeleteModal 
                          booking={booking}
                          onBookingDeleted={refreshBookings}
                          dictionary={dictionary}
                        />
                        {booking.invoice_url && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(booking.invoice_url!, '_blank')}
                          >
                            <ExternalLink className="mr-1 h-3 w-3" />
                            {dictionary.admin?.dashboard?.viewInvoice || "View Invoice"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredBookings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {dictionary.admin?.dashboard?.noBookings || "No bookings found"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 