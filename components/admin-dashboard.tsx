"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Database } from "@/types/database.types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox, ComboboxOption } from "@/components/ui/combobox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { adminLogout } from "@/lib/supabase-auth"
import { AdminBookingViewModal } from "@/components/admin-booking-view-modal"
import { AdminBookingModal } from "@/components/admin-booking-modal"
import { AdminDeleteBookingModal } from "@/components/admin-delete-booking-modal"
import { format } from "date-fns"
import { it } from "date-fns/locale"
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
  User,
  FileText,
  ExternalLink,
  Plane,
  Luggage,
  Clock2,
  CheckCircle,
  Info,
  CalendarIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type BookingRow = Database['public']['Tables']['bookings']['Row']

interface FilterState {
  search: string
  dateFrom: Date | undefined
  dateTo: Date | undefined
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
    dateFrom: undefined,
    dateTo: undefined
  })
  
  const [sortBy, setSortBy] = useState<keyof BookingRow>("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15


  const refreshBookings = () => {
    setRefreshKey(prev => prev + 1)
    // In a real app, this would trigger a data refetch
    window.location.reload()
  }


  // Function to reset all filters
  const resetFilters = () => {
    setFilters({
      search: "",
      dateFrom: undefined,
      dateTo: undefined
    })
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

    // Apply date filters
    if (filters.dateFrom) {
      const fromDate = format(filters.dateFrom, "yyyy-MM-dd")
      filtered = filtered.filter(booking => booking.service_date >= fromDate)
    }

    if (filters.dateTo) {
      const toDate = format(filters.dateTo, "yyyy-MM-dd")
      filtered = filtered.filter(booking => booking.service_date <= toDate)
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

  // Pagination functions
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

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

  return (
    <div className="space-y-6">
      {/* Header with stats and logout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <Card className="p-4 flex-1 sm:flex-initial">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">{dictionary.admin?.dashboard?.totalBookings || "Total Bookings"}</span>
              <Badge variant="secondary">{bookings.length}</Badge>
            </div>
          </Card>
        </div>
        <div className="flex items-center space-x-2">
          <AdminBookingModal onBookingCreated={refreshBookings} dictionary={dictionary} />
          <Button variant="outline" onClick={handleLogout} className="flex-shrink-0">
            <LogOut className="mr-2 h-4 w-4" />
            {dictionary.admin?.header?.logout || "Logout"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Search className="mr-2 h-5 w-5" />
              {dictionary.admin?.dashboard?.filters || "Filters"}
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              {dictionary.admin?.dashboard?.resetFilters || "Reset Filters"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder={dictionary.admin?.dashboard?.searchPlaceholder || "Search bookings..."}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(filters.dateFrom, "PPP", { locale: it }) : (dictionary.admin?.dashboard?.fromDate || "From Date")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                    disabled={(date) => date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(filters.dateTo, "PPP", { locale: it }) : (dictionary.admin?.dashboard?.toDate || "To Date")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                    disabled={(date) => date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => {
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
                  <TableHead className="whitespace-nowrap">{dictionary.admin?.dashboard?.customer || "Customer"}</TableHead>
                  <TableHead className="whitespace-nowrap">{dictionary.admin?.dashboard?.service || "Service"}</TableHead>
                  <TableHead className="whitespace-nowrap">{dictionary.admin?.dashboard?.route || "Route"}</TableHead>
                  <TableHead className="whitespace-nowrap">{dictionary.admin?.dashboard?.vehicle || "Vehicle"}</TableHead>
                  <TableHead className="whitespace-nowrap">{dictionary.admin?.dashboard?.serviceInfo || "Service Info"}</TableHead>
                  <TableHead className="whitespace-nowrap">{dictionary.admin?.dashboard?.options || "Options"}</TableHead>
                  <TableHead className="whitespace-nowrap">{dictionary.admin?.dashboard?.amount || "Amount"}</TableHead>
                  <TableHead className="whitespace-nowrap">{dictionary.admin?.dashboard?.createdBy || "Created By"}</TableHead>
                  <TableHead className="whitespace-nowrap">{dictionary.admin?.dashboard?.modifiedBy || "Modified By"}</TableHead>
                  <TableHead className="whitespace-nowrap">{dictionary.admin?.dashboard?.status || "Status"}</TableHead>
                  <TableHead className="whitespace-nowrap">{dictionary.admin?.dashboard?.actions || "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="whitespace-nowrap">
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
                    <TableCell className="whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="font-medium">{booking.customer_name}</div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="mr-1 h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{booking.customer_email}</span>
                        </div>
                        {booking.customer_phone && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="mr-1 h-3 w-3 flex-shrink-0" />
                            <span>{booking.customer_phone_prefix} {booking.customer_phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="space-y-1">
                        <Badge className={getServiceBadgeColor(booking.service_type)}>
                          {booking.service_type}
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
                    <TableCell className="whitespace-nowrap">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center text-sm">
                          <MapPin className="mr-1 h-3 w-3 flex-shrink-0 text-green-600" />
                          <span className="truncate max-w-40">{booking.pickup_address}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="mr-1 h-3 w-3 flex-shrink-0 text-red-600" />
                          <span className="truncate max-w-40">{booking.destination_address}</span>
                        </div>
                        {booking.distance && (
                          <div className="text-xs text-gray-500">{booking.distance}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Car className="mr-1 h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{booking.vehicle_type}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="mr-1 h-3 w-3 flex-shrink-0" />
                          <span>{booking.passengers} pax</span>
                        </div>
                        {booking.luggage > 0 && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Luggage className="mr-1 h-3 w-3 flex-shrink-0" />
                            <span>{booking.luggage} bagagli</span>
                          </div>
                        )}
                        {booking.vehicle_count > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            {booking.vehicle_count} veicoli
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="space-y-1">
                        {booking.flight_info && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Plane className="mr-1 h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{booking.flight_info}</span>
                          </div>
                        )}
                        {booking.departure_city && (
                          <div className="text-xs text-gray-500">
                            Da: {booking.departure_city}
                          </div>
                        )}
                        {booking.duration && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="mr-1 h-3 w-3 flex-shrink-0" />
                            <span>{booking.duration}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="space-y-1">
                        {booking.meet_and_greet && (
                          <div>
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Meet & Greet
                            </Badge>
                            {/* Show detailed M&G info if available */}
                            {((booking as any).meet_greet_passengers > 0 || (booking as any).meet_greet_children > 0 || (booking as any).meet_greet_infants > 0) && (
                              <div className="text-xs text-green-600 mt-1">
                                {((booking as any).meet_greet_passengers || 0) + ((booking as any).meet_greet_children || 0) + ((booking as any).meet_greet_infants || 0)} pax
                                {(booking as any).meet_greet_extra_luggage > 0 && ` | +${(booking as any).meet_greet_extra_luggage} luggage`}
                                {(booking as any).meet_greet_extra_hours > 0 && ` | +${(booking as any).meet_greet_extra_hours}h`}
                              </div>
                            )}
                            {(booking as any).meet_greet_special_services && Object.keys((booking as any).meet_greet_special_services).some((key: string) => (booking as any).meet_greet_special_services[key]) && (
                              <div className="text-xs text-purple-600 mt-1">
                                Special services
                              </div>
                            )}
                          </div>
                        )}
                        {booking.water_taxi && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Water Taxi
                          </Badge>
                        )}
                        {booking.notes && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Info className="mr-1 h-3 w-3 flex-shrink-0" />
                            <span className="truncate max-w-24">{booking.notes}</span>
                          </div>
                        )}
                        {booking.night_surcharge && (
                          <Badge variant="outline" className="text-xs">
                            Notturno
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="font-medium text-green-600">
                          {formatCurrency(booking.amount_total)}
                        </div>
                        <div className="text-xs text-gray-500">
                          IVA {booking.vat_rate}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="space-y-1">
                        {(booking as any).created_by_email ? (
                          <div className="text-xs text-gray-600 truncate max-w-32">
                            {(booking as any).created_by_email}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="space-y-1">
                        {(booking as any).modified_by_email ? (
                          <div className="text-xs text-gray-600 truncate max-w-32">
                            {(booking as any).modified_by_email}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge className="bg-green-100 text-green-800">
                        {dictionary.admin?.dashboard?.paid || booking.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <AdminBookingViewModal 
                          booking={booking}
                          dictionary={dictionary}
                        />
                        <AdminDeleteBookingModal
                          booking={{
                            id: booking.id,
                            customer_name: booking.customer_name,
                            service_date: booking.service_date,
                            service_time: booking.service_time,
                            pickup_address: booking.pickup_address,
                            destination_address: booking.destination_address
                          }}
                          onBookingDeleted={refreshBookings}
                        />
                        {booking.invoice_url && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(booking.invoice_url!, '_blank')}
                          >
                            <ExternalLink className="mr-1 h-3 w-3" />
                            Ricevuta di pagamento
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
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} bookings
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current page
                    const showPage = page === 1 || page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    
                    if (!showPage && page === 2 && currentPage > 4) {
                      return <span key={page} className="px-2 text-gray-400">...</span>
                    }
                    
                    if (!showPage && page === totalPages - 1 && currentPage < totalPages - 3) {
                      return <span key={page} className="px-2 text-gray-400">...</span>
                    }
                    
                    if (!showPage) {
                      return null
                    }
                    
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className={cn("min-w-[2rem]", currentPage === page ? "text-white" : "")}
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
} 