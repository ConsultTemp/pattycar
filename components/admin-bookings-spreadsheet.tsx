"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { Database } from "@/types/database.types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { FileText, Save } from "lucide-react"

type BookingRow = Database['public']['Tables']['bookings']['Row']
type DriverRow = Database['public']['Tables']['drivers']['Row']
type CustomerRow = Database['public']['Tables']['customers']['Row']

interface AdminBookingsSpreadsheetProps {
  bookings: any[]
  dictionary: any
  onBookingsUpdated: () => void
}

// Component that will be dynamically loaded
function SpreadsheetComponent({ 
  bookings, 
  dictionary, 
  onBookingsUpdated 
}: AdminBookingsSpreadsheetProps) {
  const jspreadsheetRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [drivers, setDrivers] = useState<DriverRow[]>([])
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [jspreadsheet, setJspreadsheet] = useState<any>(null)
  
  // Load jspreadsheet on client side
  useEffect(() => {
    const loadJspreadsheet = async () => {
      try {
        const jss = await import('jspreadsheet-ce')
        // Also load CSS
        await import('jspreadsheet-ce/dist/jspreadsheet.css')
        await import('jsuites/dist/jsuites.css')
        setJspreadsheet(jss.default || jss)
      } catch (error) {
        console.error('Failed to load jspreadsheet:', error)
      }
    }
    
    loadJspreadsheet()
  }, [])
  
  // Load drivers and customers
  useEffect(() => {
    const fetchDriversAndCustomers = async () => {
      try {
        const [driversResponse, customersResponse] = await Promise.all([
          fetch('/api/admin/drivers'),
          fetch('/api/admin/customers')
        ])
        
        if (driversResponse.ok) {
          const driversResult = await driversResponse.json()
          if (driversResult.success) {
            setDrivers(driversResult.data)
          }
        }
        
        if (customersResponse.ok) {
          const customersResult = await customersResponse.json()
          if (customersResult.success) {
            setCustomers(customersResult.data)
          }
        }
      } catch (error) {
        console.error('Error fetching drivers/customers:', error)
      }
    }
    
    fetchDriversAndCustomers()
  }, [])

  // Prepare data for spreadsheet
  const spreadsheetData = useMemo(() => {
    // Sort bookings by service_date chronologically
    const sortedBookings = [...bookings].sort((a, b) => {
      const dateA = new Date(`${a.service_date} ${a.service_time}`)
      const dateB = new Date(`${b.service_date} ${b.service_time}`)
      return dateA.getTime() - dateB.getTime()
    })
    
    return sortedBookings.map(booking => [
      booking.id, // Hidden column for ID
      booking.service_date,
      booking.service_time,
      booking.service_end_time || '',
      booking.customer_name,
      booking.customer_email,
      booking.customer_phone ? `${booking.customer_phone_prefix || ''} ${booking.customer_phone}`.trim() : '',
      booking.service_type,
      booking.service_duration || '',
      booking.pickup_address,
      booking.destination_address,
      booking.vehicle_type,
      booking.passengers || 1,
      booking.luggage || 0,
      booking.vehicle_count || 1,
      (booking.amount_total / 100).toFixed(2), // Convert from cents to euros
      booking.currency || 'EUR',
      booking.driver?.name || '',
      booking.customer?.name || '',
      booking.payment_status,
      booking.meet_and_greet ? 'Sì' : 'No',
      booking.flight_info || '',
      booking.notes || '',
      booking.distance || '',
      booking.duration || '',
      booking.night_surcharge || '',
      booking.is_olympic_pricing ? 'Sì' : 'No'
    ])
  }, [bookings])

  // Driver options for dropdown
  const driverOptions = useMemo(() => {
    const options = ['']
    drivers.forEach(driver => {
      options.push(driver.name)
    })
    return options
  }, [drivers])
  
  // Customer options for dropdown
  const customerOptions = useMemo(() => {
    const options = ['']
    customers.forEach(customer => {
      options.push(customer.name)
    })
    return options
  }, [customers])

  // Initialize jspreadsheet
  useEffect(() => {
    if (!containerRef.current || !spreadsheetData.length || !drivers.length || !customers.length || !jspreadsheet) {
      return
    }

    // Clean up existing instance
    if (jspreadsheetRef.current) {
      jspreadsheetRef.current.destroy()
    }

    const columns = [
      { type: 'hidden', width: 0 }, // ID column (hidden)
      { title: 'Data Servizio', type: 'calendar', width: 120, options: { format: 'YYYY-MM-DD' } },
      { title: 'Ora Inizio', type: 'text', width: 80 },
      { title: 'Ora Fine', type: 'text', width: 80 },
      { title: 'Nome Cliente', type: 'text', width: 150 },
      { title: 'Email Cliente', type: 'text', width: 200 },
      { title: 'Telefono Cliente', type: 'text', width: 120 },
      { title: 'Tipo Servizio', type: 'dropdown', width: 120, source: ['transfer', 'hourly', 'airport', 'event', 'tour'] },
      { title: 'Durata (ore)', type: 'numeric', width: 80, mask: '#.##' },
      { title: 'Indirizzo Partenza', type: 'text', width: 200 },
      { title: 'Indirizzo Destinazione', type: 'text', width: 200 },
      { title: 'Tipo Veicolo', type: 'dropdown', width: 120, source: ['Classe E', 'Classe S', 'Classe V', 'Sprinter', 'Ducato'] },
      { title: 'Passeggeri', type: 'numeric', width: 80, mask: '#' },
      { title: 'Bagagli', type: 'numeric', width: 80, mask: '#' },
      { title: 'N. Veicoli', type: 'numeric', width: 80, mask: '#' },
      { title: 'Importo (€)', type: 'numeric', width: 100, mask: '#.##' },
      { title: 'Valuta', type: 'dropdown', width: 80, source: ['EUR', 'USD', 'GBP'] },
      { title: 'Driver Assegnato', type: 'dropdown', width: 150, source: driverOptions },
      { title: 'Customer Assegnato', type: 'dropdown', width: 150, source: customerOptions },
      { title: 'Stato Pagamento', type: 'dropdown', width: 120, source: ['paid', 'pending', 'failed', 'cancelled'] },
      { title: 'Meet & Greet', type: 'dropdown', width: 100, source: ['Sì', 'No'] },
      { title: 'Info Volo', type: 'text', width: 150 },
      { title: 'Note', type: 'text', width: 200 },
      { title: 'Distanza', type: 'text', width: 100 },
      { title: 'Durata Viaggio', type: 'text', width: 100 },
      { title: 'Sovrapprezzo Notturno', type: 'text', width: 120 },
      { title: 'Prezzi Olimpici', type: 'dropdown', width: 100, source: ['Sì', 'No'] }
    ]

    // Initialize jspreadsheet
    jspreadsheetRef.current = jspreadsheet(containerRef.current, {
      data: spreadsheetData,
      columns: columns,
      minDimensions: [27, 10], // 27 columns, minimum 10 rows
      allowInsertRow: false,
      allowDeleteRow: false,
      allowInsertColumn: false,
      allowDeleteColumn: false,
      allowRenameColumn: false,
      columnSorting: true,
      columnDrag: false,
      rowResize: true,
      columnResize: true,
      tableOverflow: true,
      lazyLoading: true,
      loadingSpin: true,
      search: true,
      pagination: false,
      freezeColumns: 5, // Freeze first 5 columns for better UX
      style: {
        'background-color': '#ffffff',
      },
      onchange: () => {
        setHasChanges(true)
      },
      onselection: (instance: any, x1: number, y1: number, x2: number, y2: number) => {
        // Handle selection changes if needed
      }
    })

    return () => {
      if (jspreadsheetRef.current) {
        jspreadsheetRef.current.destroy()
      }
    }
  }, [spreadsheetData, driverOptions, customerOptions, jspreadsheet])

  // Save changes to database
  const handleSave = async () => {
    if (!jspreadsheetRef.current || !hasChanges || !jspreadsheet) return
    
    setIsLoading(true)
    
    try {
      const data = jspreadsheetRef.current.getData()
      const updatedBookings = []
      
      // Process each row to find changes
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const bookingId = row[0] // Hidden ID column
        const originalBooking = bookings.find(b => b.id === bookingId)
        
        if (!originalBooking) continue
        
        // Map spreadsheet data back to booking object
        const updatedBooking: any = {
          id: bookingId,
          service_date: row[1],
          service_time: row[2],
          service_end_time: row[3] || null,
          customer_name: row[4],
          customer_email: row[5],
          customer_phone: row[6] ? row[6].replace(/^\+?\d+\s*/, '') : null, // Extract phone without prefix
          customer_phone_prefix: row[6] ? row[6].match(/^\+?\d+/)?.[0] : null,
          service_type: row[7],
          service_duration: row[8] ? parseFloat(row[8]) : null,
          pickup_address: row[9],
          destination_address: row[10],
          vehicle_type: row[11],
          passengers: parseInt(row[12]) || 1,
          luggage: parseInt(row[13]) || 0,
          vehicle_count: parseInt(row[14]) || 1,
          amount_total: Math.round(parseFloat(row[15]) * 100), // Convert to cents
          currency: row[16] || 'EUR',
          payment_status: row[19],
          meet_and_greet: row[20] === 'Sì',
          flight_info: row[21] || null,
          notes: row[22] || null,
          distance: row[23] || null,
          duration: row[24] || null,
          night_surcharge: row[25] || null,
          is_olympic_pricing: row[26] === 'Sì'
        }
        
        // Find driver_id from name
        const driverName = row[17]
        const driver = drivers.find(d => d.name === driverName)
        updatedBooking.driver_id = driver?.id || null
        
        // Find customer_id from name
        const customerName = row[18]
        const customer = customers.find(c => c.name === customerName)
        updatedBooking.customer_id = customer?.id || null
        
        // Check if booking has changes by comparing key fields
        const hasBookingChanges = 
          originalBooking.service_date !== updatedBooking.service_date ||
          originalBooking.service_time !== updatedBooking.service_time ||
          originalBooking.customer_name !== updatedBooking.customer_name ||
          originalBooking.customer_email !== updatedBooking.customer_email ||
          originalBooking.service_type !== updatedBooking.service_type ||
          originalBooking.pickup_address !== updatedBooking.pickup_address ||
          originalBooking.destination_address !== updatedBooking.destination_address ||
          originalBooking.vehicle_type !== updatedBooking.vehicle_type ||
          originalBooking.passengers !== updatedBooking.passengers ||
          originalBooking.luggage !== updatedBooking.luggage ||
          originalBooking.amount_total !== updatedBooking.amount_total ||
          originalBooking.driver_id !== updatedBooking.driver_id ||
          originalBooking.customer_id !== updatedBooking.customer_id ||
          originalBooking.payment_status !== updatedBooking.payment_status ||
          originalBooking.meet_and_greet !== updatedBooking.meet_and_greet ||
          originalBooking.notes !== updatedBooking.notes ||
          originalBooking.is_olympic_pricing !== updatedBooking.is_olympic_pricing
        
        if (hasBookingChanges) {
          updatedBookings.push(updatedBooking)
        }
      }
      
      // Update each changed booking
      const updatePromises = updatedBookings.map(booking => 
        fetch('/api/admin/update-booking', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(booking),
        })
      )
      
      const responses = await Promise.all(updatePromises)
      const failedUpdates = responses.filter(response => !response.ok)
      
      if (failedUpdates.length > 0) {
        throw new Error(`${failedUpdates.length} prenotazioni non sono state aggiornate correttamente`)
      }
      
      toast({
        title: "Prenotazioni salvate",
        description: `${updatedBookings.length} prenotazioni sono state aggiornate con successo`,
      })
      
      setHasChanges(false)
      onBookingsUpdated()
      
    } catch (error) {
      console.error('Error saving bookings:', error)
      toast({
        title: "Errore nel salvataggio",
        description: "Si è verificato un errore durante il salvataggio delle prenotazioni",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while jspreadsheet is loading
  if (!jspreadsheet) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="text-lg">Caricamento tabella...</div>
            <div className="text-sm text-gray-500 mt-2">Inizializzazione del foglio di calcolo</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              {dictionary.admin?.dashboard?.bookingsCount?.replace('{count}', bookings.length) || `Prenotazioni (${bookings.length})`}
            </CardTitle>
            <CardDescription>
              {dictionary.admin?.dashboard?.bookingsDescription || "Tabella Excel-like per modificare le prenotazioni direttamente"}
            </CardDescription>
          </div>
          {hasChanges && (
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className="ml-4"
            >
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Salvataggio...' : 'Salva Modifiche'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-sm text-gray-600">
          <strong>Istruzioni:</strong> Usa le frecce per navigare, clicca per modificare, i dropdown per selezionare driver/clienti. 
          Tutte le modifiche vengono salvate facendo clic su "Salva Modifiche".
        </div>
        <div 
          ref={containerRef} 
          className="w-full border rounded-lg"
          style={{ 
            height: 'calc(100vh - 400px)', 
            minHeight: '500px',
            overflow: 'auto' 
          }}
        />
        {hasChanges && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Ci sono modifiche non salvate. Clicca su "Salva Modifiche" per applicarle.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Export the dynamically imported component
const AdminBookingsSpreadsheet = dynamic(
  () => Promise.resolve(SpreadsheetComponent),
  { 
    ssr: false,
    loading: () => (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="text-lg">Caricamento...</div>
            <div className="text-sm text-gray-500 mt-2">Inizializzazione componente</div>
          </div>
        </CardContent>
      </Card>
    )
  }
)

export default AdminBookingsSpreadsheet