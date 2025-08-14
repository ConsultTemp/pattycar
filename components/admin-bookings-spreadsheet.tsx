"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import { Database } from "@/types/database.types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { FileText, Save } from "lucide-react"
import dynamic from "next/dynamic"

type BookingRow = Database['public']['Tables']['bookings']['Row']
type DriverRow = Database['public']['Tables']['drivers']['Row']
type CustomerRow = Database['public']['Tables']['customers']['Row']

interface AdminBookingsSpreadsheetProps {
  bookings: any[]
  dictionary: any
  onBookingsUpdated: () => void
}

// Il componente principale che gestirà jspreadsheet
function SpreadsheetCore({ 
  bookings, 
  dictionary, 
  onBookingsUpdated 
}: AdminBookingsSpreadsheetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const jspreadsheetRef = useRef<any>(null)
  const [drivers, setDrivers] = useState<DriverRow[]>([])
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isJsLoaded, setIsJsLoaded] = useState(false)
  
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

  // Load jspreadsheet dynamically
  useEffect(() => {
    const loadSpreadsheet = async () => {
      try {
        // Carica CSS prima
        const cssLink1 = document.createElement('link')
        cssLink1.rel = 'stylesheet'
        cssLink1.href = 'https://jspreadsheet.com/v4/jspreadsheet.css'
        document.head.appendChild(cssLink1)
        
        const cssLink2 = document.createElement('link')
        cssLink2.rel = 'stylesheet'
        cssLink2.href = 'https://jsuites.net/v4/jsuites.css'
        document.head.appendChild(cssLink2)

        // Carica script
        const script1 = document.createElement('script')
        script1.src = 'https://jsuites.net/v4/jsuites.js'
        script1.onload = () => {
          const script2 = document.createElement('script')
          script2.src = 'https://jspreadsheet.com/v4/jspreadsheet.js'
          script2.onload = () => {
            setIsJsLoaded(true)
          }
          document.head.appendChild(script2)
        }
        document.head.appendChild(script1)
      } catch (error) {
        console.error('Error loading jspreadsheet:', error)
      }
    }

    loadSpreadsheet()
  }, [])

  // Prepare data for spreadsheet - NEW ORDER as per requirements
  const spreadsheetData = useMemo(() => {
    // Sort bookings by service_date chronologically
    const sortedBookings = [...bookings].sort((a, b) => {
      const dateA = new Date(`${a.service_date} ${a.service_time}`)
      const dateB = new Date(`${b.service_date} ${b.service_time}`)
      return dateA.getTime() - dateB.getTime()
    })
    
    return sortedBookings.map(booking => [
      booking.id, // Hidden column for ID
      // 1. data → service_date
      booking.service_date,
      // 2. società → customer name from customer relationship
      booking.customer?.name || booking.customer_name || '',
      // 3. ora → service_time
      booking.service_time,
      // 4. committente → new field (manual entry)
      booking.committente || '',
      // 5. passeggero/i → new field passenger_details (manual text)
      booking.passenger_details || '',
      // 6. da → pickup_address
      booking.pickup_address,
      // 7. a → destination_address  
      booking.destination_address,
      // 8. dispo/destinazione → new field (manual text)
      booking.disposition_destination || '',
      // 9. mezzo → new field vehicle_details (manual text)
      booking.vehicle_details || '',
      // 10. imponibile → net_amount (90% of total)
      booking.net_amount ? booking.net_amount.toFixed(2) : ((booking.amount_total * 0.90) / 100).toFixed(2),
      // 11. iva → vat_amount (10% of total)
      booking.vat_amount ? booking.vat_amount.toFixed(2) : ((booking.amount_total * 0.10) / 100).toFixed(2),
      // 12. tot fattura → amount_total
      (booking.amount_total / 100).toFixed(2),
      // 13. autista → driver name
      booking.driver?.name || '',
      // 14. fatturazione autista → new field (manual entry)
      booking.driver_billing ? booking.driver_billing.toFixed(2) : '',
      // 15. commissioni autista → new field (manual entry)
      booking.driver_commission ? booking.driver_commission.toFixed(2) : '',
      // 16. importo incasso diretto → new field (manual entry)
      booking.direct_collection ? booking.direct_collection.toFixed(2) : '',
      // 17. cash/kk → new field payment_method (manual entry)
      booking.payment_method || '',
      // 18. note → notes
      booking.notes || '',
      // 19. targa → new field license_plate (manual entry)
      booking.license_plate || ''
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
    if (!containerRef.current || !spreadsheetData.length || !drivers.length || !customers.length || !isJsLoaded) {
      return
    }

    // Clean up existing instance
    if (jspreadsheetRef.current) {
      try {
        jspreadsheetRef.current.destroy()
      } catch (e) {
        console.log('Error destroying existing instance:', e)
      }
    }

    // NEW COLUMN STRUCTURE - 19 fields as per requirements
    const columns = [
      { type: 'hidden', width: 0 }, // ID column (hidden)
      // 1. data → Data Servizio (date input)
      { title: 'Data', type: 'calendar', width: 120, options: { format: 'YYYY-MM-DD' } },
      // 2. società → Cliente (dropdown con customers)
      { title: 'Società', type: 'dropdown', width: 180, source: customerOptions },
      // 3. ora → Ora Inizio (time-like text input) 
      { title: 'Ora', type: 'text', width: 80 },
      // 4. committente → Chi ha preso prenotazione (text input)
      { title: 'Committente', type: 'text', width: 150 },
      // 5. passeggero/i → Dettagli passeggeri (text input)
      { title: 'Passeggero/i', type: 'text', width: 150 },
      // 6. da → Indirizzo partenza (text input)
      { title: 'Da', type: 'text', width: 200 },
      // 7. a → Indirizzo arrivo (text input)
      { title: 'A', type: 'text', width: 200 },
      // 8. dispo/destinazione → Campo libero (text input)
      { title: 'Dispo/Destinazione', type: 'text', width: 150 },
      // 9. mezzo → Dettagli mezzo (text input)
      { title: 'Mezzo', type: 'text', width: 120 },
      // 10. imponibile → Prezzo netto (numeric input)
      { title: 'Imponibile', type: 'numeric', width: 100, mask: '#.##' },
      // 11. iva → IVA 10% (numeric input)
      { title: 'IVA', type: 'numeric', width: 80, mask: '#.##' },
      // 12. tot fattura → Totale (numeric input, readonly)
      { title: 'Tot Fattura', type: 'numeric', width: 100, mask: '#.##' },
      // 13. autista → Driver assegnato (dropdown)
      { title: 'Autista', type: 'dropdown', width: 150, source: driverOptions },
      // 14. fatturazione autista → Prezzo autista esterno (numeric input)
      { title: 'Fatt. Autista', type: 'numeric', width: 100, mask: '#.##' },
      // 15. commissioni autista → Commissioni autista (numeric input)
      { title: 'Comm. Autista', type: 'numeric', width: 100, mask: '#.##' },
      // 16. importo incasso diretto → Totale incassato (numeric input)
      { title: 'Incasso Diretto', type: 'numeric', width: 120, mask: '#.##' },
      // 17. cash/kk → Metodo pagamento (dropdown)
      { title: 'Cash/KK', type: 'dropdown', width: 100, source: ['Cash', 'Carta', 'Bonifico', 'Assegno', 'Altro'] },
      // 18. note → Note prenotazione (text input)
      { title: 'Note', type: 'text', width: 200 },
      // 19. targa → Targa veicolo (text input)
      { title: 'Targa', type: 'text', width: 100 }
    ]

    try {
      // @ts-ignore - jspreadsheet è caricato dinamicamente
      jspreadsheetRef.current = jspreadsheet(containerRef.current, {
        data: spreadsheetData,
        columns: columns,
        minDimensions: [20, 10], // Updated for 19 fields + 1 hidden ID column
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
        search: true,
        pagination: false,
        freezeColumns: 4, // Freeze first 4 columns (ID, Data, Società, Ora)
        style: {
          'background-color': '#ffffff',
        },
        onchange: () => {
          setHasChanges(true)
        }
      })
    } catch (error) {
      console.error('Error initializing jspreadsheet:', error)
    }

    return () => {
      if (jspreadsheetRef.current) {
        try {
          jspreadsheetRef.current.destroy()
        } catch (e) {
          console.log('Cleanup error:', e)
        }
      }
    }
  }, [spreadsheetData, driverOptions, customerOptions, isJsLoaded])

  // Save changes to database
  const handleSave = async () => {
    if (!jspreadsheetRef.current || !hasChanges) return
    
    setIsLoading(true)
    
    try {
      const data = jspreadsheetRef.current.getData()
      const updatedBookings = []
      
      // Process each row to find changes
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const bookingId = row[0]
        const originalBooking = bookings.find(b => b.id === bookingId)
        
        if (!originalBooking) continue
        
        // Map spreadsheet data back to booking object - NEW FIELD MAPPING
        const updatedBooking: any = {
          id: bookingId,
          // 1. data → service_date
          service_date: row[1],
          // 2. società → customer will be resolved from name to ID below
          // 3. ora → service_time  
          service_time: row[3],
          // 4. committente → new field
          committente: row[4] || null,
          // 5. passeggero/i → new field passenger_details
          passenger_details: row[5] || null,
          // 6. da → pickup_address
          pickup_address: row[6],
          // 7. a → destination_address
          destination_address: row[7],
          // 8. dispo/destinazione → new field
          disposition_destination: row[8] || null,
          // 9. mezzo → new field vehicle_details
          vehicle_details: row[9] || null,
          // 10. imponibile → net_amount
          net_amount: row[10] ? parseFloat(row[10]) : null,
          // 11. iva → vat_amount
          vat_amount: row[11] ? parseFloat(row[11]) : null,
          // 12. tot fattura → amount_total (convert back to cents)
          amount_total: Math.round(parseFloat(row[12]) * 100),
          // 13. autista → driver will be resolved from name to ID below
          // 14. fatturazione autista → new field
          driver_billing: row[14] ? parseFloat(row[14]) : null,
          // 15. commissioni autista → new field
          driver_commission: row[15] ? parseFloat(row[15]) : null,
          // 16. importo incasso diretto → new field
          direct_collection: row[16] ? parseFloat(row[16]) : null,
          // 17. cash/kk → new field payment_method
          payment_method: row[17] || null,
          // 18. note → notes
          notes: row[18] || null,
          // 19. targa → new field license_plate
          license_plate: row[19] || null
        }
        
        // Find customer_id from name (società - column 2)
        const customerName = row[2]
        const customer = customers.find(c => c.name === customerName)
        updatedBooking.customer_id = customer?.id || null
        
        // Find driver_id from name (autista - column 13)
        const driverName = row[13]
        const driver = drivers.find(d => d.name === driverName)
        updatedBooking.driver_id = driver?.id || null
        
        // Check if booking has changes by comparing all fields
        const hasBookingChanges = 
          originalBooking.service_date !== updatedBooking.service_date ||
          originalBooking.service_time !== updatedBooking.service_time ||
          originalBooking.pickup_address !== updatedBooking.pickup_address ||
          originalBooking.destination_address !== updatedBooking.destination_address ||
          originalBooking.amount_total !== updatedBooking.amount_total ||
          originalBooking.notes !== updatedBooking.notes ||
          originalBooking.driver_id !== updatedBooking.driver_id ||
          originalBooking.customer_id !== updatedBooking.customer_id ||
          // New fields comparison
          originalBooking.committente !== updatedBooking.committente ||
          originalBooking.passenger_details !== updatedBooking.passenger_details ||
          originalBooking.disposition_destination !== updatedBooking.disposition_destination ||
          originalBooking.vehicle_details !== updatedBooking.vehicle_details ||
          originalBooking.net_amount !== updatedBooking.net_amount ||
          originalBooking.vat_amount !== updatedBooking.vat_amount ||
          originalBooking.driver_billing !== updatedBooking.driver_billing ||
          originalBooking.driver_commission !== updatedBooking.driver_commission ||
          originalBooking.direct_collection !== updatedBooking.direct_collection ||
          originalBooking.payment_method !== updatedBooking.payment_method ||
          originalBooking.license_plate !== updatedBooking.license_plate
        
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

  if (!isJsLoaded) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="text-lg">Caricamento jspreadsheet...</div>
            <div className="text-sm text-gray-500 mt-2">Inizializzazione libreria</div>
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
              Tabella con 19 campi per la gestione completa delle prenotazioni - modifica diretta e salvataggio differito
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
          <strong>Istruzioni:</strong> Modifica i campi direttamente in tabella. Usa dropdown per Società/Autista/Metodo Pagamento. 
          I campi numerici (Imponibile, IVA, ecc.) accettano decimali. Il bottone "Salva Modifiche" appare quando ci sono modifiche da salvare.
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

// Export con dynamic import per evitare SSR
const AdminBookingsSpreadsheet = dynamic(
  () => Promise.resolve(SpreadsheetCore),
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