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
import AdminDriversManagement from "@/components/admin-drivers-management"
import AdminCustomersManagement from "@/components/admin-customers-management"
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
  MessageSquare,
  UserCheck,
  UsersIcon
} from "lucide-react"

type BookingRow = Database['public']['Tables']['bookings']['Row']

interface FilterState {
  search: string
  dateFrom: Date | undefined
  dateTo: Date | undefined
  driverId: string
  customerId: string
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
    dateTo: undefined,
    driverId: "",
    customerId: ""
  })
  
  const [sortBy, setSortBy] = useState<keyof BookingRow>("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [refreshKey, setRefreshKey] = useState(0)
  const [drivers, setDrivers] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  
  // Selection state for bulk SMS
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set())
  const [isSelectAll, setIsSelectAll] = useState(false)
  const [isSendingSMS, setIsSendingSMS] = useState(false)

  // Load drivers on component mount
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await fetch('/api/admin/drivers')
        const result = await response.json()

        if (result.success) {
          setDrivers(result.data)
        }
      } catch (error) {
        console.error('Error fetching drivers:', error)
      }
    }

    fetchDrivers()
  }, []) // Remove refreshKey dependency

  // Load customers on component mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/admin/customers')
        const result = await response.json()

        if (result.success) {
          setCustomers(result.data)
        }
      } catch (error) {
        console.error('Error fetching customers:', error)
      }
    }

    fetchCustomers()
  }, []) // Remove refreshKey dependency

  const refreshBookings = () => {
    setRefreshKey(prev => prev + 1)
    // In a real app, this would trigger a data refetch
    window.location.reload()
  }

  // Function to refresh drivers list (called from AdminDriversManagement)
  const refreshDrivers = async () => {
    try {
      const response = await fetch('/api/admin/drivers')
      const result = await response.json()

      if (result.success) {
        setDrivers(result.data)
      }
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  // Function to refresh customers list (called from AdminCustomersManagement)
  const refreshCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers')
      const result = await response.json()

      if (result.success) {
        setCustomers(result.data)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  // Function to reset all filters
  const resetFilters = () => {
    setFilters({
      search: "",
      dateFrom: undefined,
      dateTo: undefined,
      driverId: "",
      customerId: ""
    })
  }

  // Selection functions
  const handleSelectBooking = (bookingId: string, checked: boolean) => {
    const newSelected = new Set(selectedBookings)
    if (checked) {
      newSelected.add(bookingId)
    } else {
      newSelected.delete(bookingId)
    }
    setSelectedBookings(newSelected)
    setIsSelectAll(newSelected.size === filteredBookings.length && filteredBookings.length > 0)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredBookings.map(booking => booking.id))
      setSelectedBookings(allIds)
      setIsSelectAll(true)
    } else {
      setSelectedBookings(new Set())
      setIsSelectAll(false)
    }
  }

  // SMS sending functions
  const sendSMSToDrivers = async () => {
    setIsSendingSMS(true)
    try {
      const selectedBookingData = filteredBookings.filter(booking => selectedBookings.has(booking.id))
      const response = await fetch('/api/admin/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'drivers',
          bookings: selectedBookingData
        })
      })

      const result = await response.json()
      if (result.success) {
        alert(`SMS inviati con successo a ${result.sentCount} driver!`)
      } else {
        alert(`Errore nell'invio SMS: ${result.error}`)
      }
    } catch (error) {
      alert('Errore nell\'invio SMS')
    } finally {
      setIsSendingSMS(false)
    }
  }

  const sendSMSToCustomers = async () => {
    setIsSendingSMS(true)
    try {
      const selectedBookingData = filteredBookings.filter(booking => selectedBookings.has(booking.id))
      const response = await fetch('/api/admin/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'customers',
          bookings: selectedBookingData
        })
      })

      const result = await response.json()
      if (result.success) {
        alert(`SMS inviati con successo a ${result.sentCount} clienti!`)
      } else {
        alert(`Errore nell'invio SMS: ${result.error}`)
      }
    } catch (error) {
      alert('Errore nell\'invio SMS')
    } finally {
      setIsSendingSMS(false)
    }
  }

  const sendSMSToAll = async () => {
    setIsSendingSMS(true)
    try {
      const selectedBookingData = filteredBookings.filter(booking => selectedBookings.has(booking.id))
      const response = await fetch('/api/admin/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'all',
          bookings: selectedBookingData
        })
      })

      const result = await response.json()
      if (result.success) {
        alert(`SMS inviati con successo a ${result.sentCount} contatti!`)
      } else {
        alert(`Errore nell'invio SMS: ${result.error}`)
      }
    } catch (error) {
      alert('Errore nell\'invio SMS')
    } finally {
      setIsSendingSMS(false)
    }
  }

  const testReminders = async () => {
    setIsSendingSMS(true)
    try {
      const response = await fetch('/api/admin/test-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()
      if (result.success) {
        const { results } = result
        alert(`Test reminder completato!\n\nDomani: ${results.tomorrow.sentCount} inviati, ${results.tomorrow.failedCount} falliti\n7 giorni: ${results.sevenDays.sentCount} inviati, ${results.sevenDays.failedCount} falliti\n\nTotale: ${results.totalSent} SMS inviati`)
      } else {
        alert(`Errore nel test reminder: ${result.error}`)
      }
    } catch (error) {
      alert('Errore nel test reminder')
    } finally {
      setIsSendingSMS(false)
    }
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

    // Apply driver filter
    if (filters.driverId && filters.driverId !== "all") {
      if (filters.driverId === "none") {
        filtered = filtered.filter(booking => !(booking as any).driver_id)
      } else {
        filtered = filtered.filter(booking => (booking as any).driver_id === filters.driverId)
      }
    }

    // Apply customer filter
    if (filters.customerId && filters.customerId !== "all") {
      if (filters.customerId === "none") {
        filtered = filtered.filter(booking => !(booking as any).customer_id)
      } else {
        filtered = filtered.filter(booking => (booking as any).customer_id === filters.customerId)
      }
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <div>
              <Combobox
                options={[
                  { value: "all", label: dictionary.admin?.dashboard?.allDrivers || "All Drivers" },
                  { value: "none", label: dictionary.admin?.dashboard?.noDriver || "No Driver" },
                  ...drivers.map(driver => ({ 
                    value: driver.id, 
                    label: driver.name 
                  }))
                ]}
                value={filters.driverId || "all"}
                onChange={(value) => setFilters(prev => ({ ...prev, driverId: value === "all" ? "" : value }))}
                placeholder={dictionary.admin?.drivers?.assignedDriver || "Driver"}
                searchPlaceholder={dictionary.admin?.dashboard?.searchDrivers || "Search drivers..."}
                emptyMessage={dictionary.admin?.dashboard?.noDriversFound || "No drivers found"}
              />
            </div>
            <div>
              <Combobox
                options={[
                  { value: "all", label: dictionary.admin?.dashboard?.allCustomers || "All Customers" },
                  { value: "none", label: dictionary.admin?.dashboard?.noCustomer || "No Customer" },
                  ...customers.map(customer => ({ 
                    value: customer.id, 
                    label: customer.name 
                  }))
                ]}
                value={filters.customerId || "all"}
                onChange={(value) => setFilters(prev => ({ ...prev, customerId: value === "all" ? "" : value }))}
                placeholder={dictionary.admin?.customers?.assignedCustomer || "Customer"}
                searchPlaceholder={dictionary.admin?.dashboard?.searchCustomers || "Search customers..."}
                emptyMessage={dictionary.admin?.dashboard?.noCustomersFound || "No customers found"}
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
          
          {/* SMS Action Buttons */}
          {selectedBookings.size > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 p-4 bg-blue-50 rounded-lg border">
              <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
                <MessageSquare className="h-4 w-4" />
                {selectedBookings.size} prenotazioni selezionate
              </div>
              <div className="flex flex-wrap gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={sendSMSToDrivers}
                  disabled={isSendingSMS}
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Contatta Driver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={sendSMSToCustomers}
                  disabled={isSendingSMS}
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <User className="mr-2 h-4 w-4" />
                  Contatta Cliente
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={sendSMSToAll}
                  disabled={isSendingSMS}
                  className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                >
                  <UsersIcon className="mr-2 h-4 w-4" />
                  Contatta Tutti
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testReminders}
                  disabled={isSendingSMS}
                  className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Test Reminder
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={isSelectAll}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-xs">Tutti</span>
                    </div>
                  </TableHead>
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
                  <TableHead className="whitespace-nowrap">{dictionary.admin?.drivers?.assignedDriver || "Driver"}</TableHead>
                  <TableHead className="whitespace-nowrap">{dictionary.admin?.customers?.assignedCustomer || "Assigned Customer"}</TableHead>
                  <TableHead className="whitespace-nowrap">{dictionary.admin?.dashboard?.createdBy || "Created By"}</TableHead>
                  <TableHead className="whitespace-nowrap">{dictionary.admin?.dashboard?.modifiedBy || "Modified By"}</TableHead>
                  <TableHead className="whitespace-nowrap">{dictionary.admin?.dashboard?.status || "Status"}</TableHead>
                  <TableHead className="whitespace-nowrap">{dictionary.admin?.dashboard?.actions || "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="w-12">
                      <Checkbox
                        checked={selectedBookings.has(booking.id)}
                        onCheckedChange={(checked) => handleSelectBooking(booking.id, checked as boolean)}
                      />
                    </TableCell>
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
                        {(booking as any).driver_id ? (
                          <Badge variant="secondary" className="text-xs">
                            <User className="mr-1 h-3 w-3" />
                            {(booking as any).driver?.name || "Driver"}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Nessun driver
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="space-y-1">
                        {(booking as any).customer_id ? (
                          <Badge variant="secondary" className="text-xs">
                            <User className="mr-1 h-3 w-3" />
                            {(booking as any).customer?.name || "Customer"}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Nessun customer
                          </span>
                        )}
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
        </CardContent>
      </Card>

      {/* Drivers Management */}
      <AdminDriversManagement dictionary={dictionary} onDriversUpdated={refreshDrivers} />

      {/* Customers Management */}
      <AdminCustomersManagement dictionary={dictionary} onCustomersUpdated={refreshCustomers} />
    </div>
  )
} 