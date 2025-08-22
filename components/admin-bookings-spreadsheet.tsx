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
  const [modifiedRows, setModifiedRows] = useState(new Set<number>())
  const [isJsLoaded, setIsJsLoaded] = useState(false)

  // Nomi delle colonne per creare l'oggetto (corrispondenti alla struttura attuale)
  const columnNames = [
    'id', // hidden
    'data',
    'società',
    'ora',
    'committente',
    'passeggero_i',
    'da',
    'a',
    'mezzo',
    'imponibile',
    'iva',
    'tot_fattura',
    'autista',
    'fatt_autista',
    'comm_autista',
    'incasso_diretto',
    'cash_kk',
    'note',
    'targa'
  ]

  // Funzione per convertire una riga in oggetto
  const rowToObject = (rowData: any[], rowIndex: number) => {
    const obj: any = {}
    columnNames.forEach((columnName, index) => {
      if (index > 0) { // Skip hidden ID column
        obj[columnName] = rowData[index] || ''
      }
    })
    obj.rowIndex = rowIndex
    return obj
  }
  
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
        // Check if already loaded
        if (typeof window !== 'undefined' && (window as any).jspreadsheet) {
          setIsJsLoaded(true)
          return
        }

        // Carica CSS prima
        const cssLink1 = document.createElement('link')
        cssLink1.rel = 'stylesheet'
        cssLink1.href = 'https://jspreadsheet.com/v4/jspreadsheet.css'
        cssLink1.id = 'jspreadsheet-css'
        if (!document.getElementById('jspreadsheet-css')) {
          document.head.appendChild(cssLink1)
        }
        
        const cssLink2 = document.createElement('link')
        cssLink2.rel = 'stylesheet'
        cssLink2.href = 'https://jsuites.net/v4/jsuites.css'
        cssLink2.id = 'jsuites-css'
        if (!document.getElementById('jsuites-css')) {
          document.head.appendChild(cssLink2)
        }

        // Carica script con error handling migliorato
        const script1 = document.createElement('script')
        script1.src = 'https://jsuites.net/v4/jsuites.js'
        script1.onerror = () => {
          console.error('Failed to load jsuites.js')
        }
        script1.onload = () => {
          const script2 = document.createElement('script')
          script2.src = 'https://jspreadsheet.com/v4/jspreadsheet.js'
          script2.onerror = () => {
            console.error('Failed to load jspreadsheet.js')
          }
          script2.onload = () => {
            // Verifica che jspreadsheet sia disponibile
            if (typeof (window as any).jspreadsheet !== 'undefined') {
              setIsJsLoaded(true)
            } else {
              console.error('jspreadsheet not available after loading')
            }
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

  // Prepare data for spreadsheet with pagination - NEW ORDER as per requirements
  const spreadsheetData = useMemo(() => {
    // Sort bookings by service_date chronologically
    const sortedBookings = [...bookings].sort((a, b) => {
      const dateA = new Date(`${a.service_date} ${a.service_time}`)
      const dateB = new Date(`${b.service_date} ${b.service_time}`)
      return dateA.getTime() - dateB.getTime()
    })
    
    const bookingRows = sortedBookings.map(booking => [
      String(booking.id || ''), // Hidden column for ID - ensure string
      // 1. data → service_date
      String(booking.service_date || ''),
      // 2. società → customer name from customer relationship
      String(booking.customer?.name || booking.customer_name || ''),
      // 3. ora → service_time
      String(booking.service_time || ''),
      // 4. committente → new field (manual entry)
      String(booking.committente || ''),
      // 5. passeggero/i → new field passenger_details (manual text)
      String(booking.passenger_details || ''),
      // 6. da → pickup_address
      String(booking.pickup_address || ''),
      // 7. a → destination_address  
      String(booking.destination_address || ''),
      // 8. mezzo → new field vehicle_details (manual text)
      String(booking.vehicle_details || ''),
      // 9. imponibile → net_amount (90% of total)
      booking.net_amount ? String(booking.net_amount.toFixed(2)) : (booking.amount_total ? String(((booking.amount_total * 0.90) / 100).toFixed(2)) : '0.00'),
      // 10. iva → vat_amount (10% of total)
      booking.vat_amount ? String(booking.vat_amount.toFixed(2)) : (booking.amount_total ? String(((booking.amount_total * 0.10) / 100).toFixed(2)) : '0.00'),
      // 11. tot fattura → amount_total
      booking.amount_total ? String((booking.amount_total / 100).toFixed(2)) : '0.00',
      // 12. autista → driver name
      String(booking.driver?.name || ''),
      // 13. fatturazione autista → new field (manual entry)
      booking.driver_billing ? String(booking.driver_billing.toFixed(2)) : '',
      // 14. commissioni autista → new field (manual entry)
      booking.driver_commission ? String(booking.driver_commission.toFixed(2)) : '',
      // 15. importo incasso diretto → new field (manual entry)
      booking.direct_collection ? String(booking.direct_collection.toFixed(2)) : '',
      // 16. cash/kk → new field payment_method (manual entry)
      String(booking.payment_method || ''),
      // 17. note → notes
      String(booking.notes || ''),
      // 18. targa → new field license_plate (manual entry)
      String(booking.license_plate || '')
    ])
    
    // Ensure we have exactly 50 rows for pagination
    const ROWS_PER_PAGE = 50
    const emptyRow = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''] // 19 empty columns (including hidden ID)
    
    // Fill with empty rows if we have less than 50
    while (bookingRows.length < ROWS_PER_PAGE) {
      bookingRows.push([...emptyRow])
    }
    
    return bookingRows
  }, [bookings])

  // Driver options for dropdown
  const driverOptions = useMemo(() => {
    const options = ['']
    drivers.forEach(driver => {
      if (driver && driver.name) {
        options.push(String(driver.name))
      }
    })
    return options
  }, [drivers])
  
  // Customer options for dropdown
  const customerOptions = useMemo(() => {
    const options = ['']
    customers.forEach(customer => {
      if (customer && customer.name) {
        options.push(String(customer.name))
      }
    })
    return options
  }, [customers])

  // Initialize jspreadsheet
  useEffect(() => {
    // Verifica che tutte le condizioni siano soddisfatte
    if (!containerRef.current || !spreadsheetData.length || !isJsLoaded) {
      console.log('Skipping spreadsheet init:', { 
        hasContainer: !!containerRef.current,
        hasData: !!spreadsheetData.length,
        hasDrivers: !!drivers.length,
        hasCustomers: !!customers.length,
        isJsLoaded,
        jspreadsheetAvailable: typeof (window as any).jspreadsheet !== 'undefined'
      })
      return
    }

    // Verifica che jspreadsheet sia disponibile
    if (typeof (window as any).jspreadsheet === 'undefined') {
      console.error('jspreadsheet is not available')
      return
    }
    
    // Validate spreadsheet data to prevent undefined/null values
    const validatedData = spreadsheetData.map(row => 
      row.map(cell => {
        if (cell === null || cell === undefined) {
          return ''
        }
        // Assicurati che sia sempre una stringa
        const stringValue = String(cell).trim()
        return stringValue
      })
    )
    
    console.log('Initializing spreadsheet with validated data:', validatedData.length, 'rows')
    console.log('Sample row:', validatedData[0])
    console.log('Driver options:', driverOptions)
    console.log('Customer options:', customerOptions)

    // Clean up existing instance
    if (jspreadsheetRef.current) {
      try {
        jspreadsheetRef.current.destroy()
      } catch (e) {
        console.log('Error destroying existing instance:', e)
      }
      jspreadsheetRef.current = null
    }

    // NEW COLUMN STRUCTURE - 19 fields as per requirements
    const columns = [
      { type: 'hidden', width: 0 }, // ID column (hidden)
      // 1. data → Data Servizio (date input)
      { title: 'Data', type: 'calendar', width: 120, options: { format: 'DD-MM-YYYY' } },
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
      // 8. mezzo → Dettagli mezzo (text input)
      { title: 'Mezzo', type: 'text', width: 120 },
      // 9. imponibile → Prezzo netto (numeric input)
      { title: 'Imponibile', type: 'numeric', width: 100, mask: '#.##' },
      // 10. iva → IVA 10% (numeric input)
      { title: 'IVA', type: 'numeric', width: 80, mask: '#.##' },
      // 11. tot fattura → Totale (numeric input, readonly)
      { title: 'Tot Fattura', type: 'numeric', width: 100, mask: '#.##' },
      // 12. autista → Driver assegnato (dropdown)
      { title: 'Autista', type: 'dropdown', width: 150, source: driverOptions },
      // 13. fatturazione autista → Prezzo autista esterno (numeric input)
      { title: 'Fatt. Autista', type: 'numeric', width: 100, mask: '#.##' },
      // 14. commissioni autista → Commissioni autista (numeric input)
      { title: 'Comm. Autista', type: 'numeric', width: 100, mask: '#.##' },
      // 15. importo incasso diretto → Totale incassato (numeric input)
      { title: 'Incasso Diretto', type: 'numeric', width: 120, mask: '#.##' },
      // 16. cash/kk → Metodo pagamento (text libero)
      { title: 'Cash/KK', type: 'text', width: 100 },
      // 17. note → Note prenotazione (text input)
      { title: 'Note', type: 'text', width: 200 },
      // 18. targa → Targa veicolo (text input)
      { title: 'Targa', type: 'text', width: 100 }
    ]

    try {
      const jspreadsheet = (window as any).jspreadsheet
      
      jspreadsheetRef.current = jspreadsheet(containerRef.current, {
        data: validatedData,
        columns: columns,
        minDimensions: [19, 50], // 18 fields + 1 hidden ID column, 50 rows
        allowInsertRow: false,
        allowDeleteRow: false,
        allowInsertColumn: false,
        allowDeleteColumn: false,
        allowRenameColumn: false,
        columnSorting: true,
        columnDrag: false,
        rowResize: true,
        columnResize: true,
        tableOverflow: true, // Enable horizontal scrolling but not vertical
        lazyLoading: false, // Disable lazy loading for fixed 50 rows
        search: false, // Disable search bar
        pagination: false, // We handle pagination manually
        toolbar: false, // Remove toolbar
        freezeColumns: 4, // Freeze first 4 columns (ID, Data, Società, Ora)
        contextMenu: false, // Disable right-click menu
        defaultColWidth: 120,
        defaultRowHeight: 25,
        tableHeight: '1300px', // Set explicit table height
        tableWidth: '100%',
        style: {
          'background-color': '#ffffff',
        },
        license: '', // Remove license message
        tabs: false, // Remove sheet tabs
        onchange: (instance: any, cell: any, x: any, y: any, value: any, oldValue: any) => {
          console.log('Cell changed - onChange triggered:', { cell, x, y, value, oldValue, hasChanges })
          if (value !== oldValue) {
            setHasChanges(true)
            
            // Aggiungi la riga alle righe modificate
            setModifiedRows(prev => new Set(prev).add(y))
            
            // Ottieni tutti i dati della riga corrente
            const rowData = instance.getRowData(y)
            const modifiedRowObject = rowToObject(rowData, y)
            
            console.log('🔥 RIGA MODIFICATA - OGGETTO:', modifiedRowObject)
          }
        },
        oneditionend: (instance: any, cell: any, x: any, y: any, value: any, oldValue: any) => {
          console.log('Edition ended - setting hasChanges to true:', { cell, x, y, value, oldValue })
          if (value !== oldValue) {
            setHasChanges(true)
          }
        },
        onbeforechange: (instance: any, cell: any, x: any, y: any, value: any) => {
          console.log('Before change event:', { cell, x, y, value })
          return true
        },
        onafterchanges: (instance: any, records: any) => {
          console.log('After changes event:', records)
          if (records && records.length > 0) {
            setHasChanges(true)
          }
        },
        onload: (instance: any) => {
          console.log('Spreadsheet loaded successfully')
          // Remove any license messages that might appear
          const licenseElements = document.querySelectorAll('[style*="jexcel"], .jexcel-license')
          licenseElements.forEach(el => el.remove())
          
          // Remove whitespace and improve table styling
          setTimeout(() => {
            const table = containerRef.current?.querySelector('.jexcel') as HTMLElement
            if (table) {
              // Remove any extra margins/padding and set full size
              table.style.margin = '0'
              table.style.padding = '0'
              table.style.border = 'none'
              table.style.height = '100%'
              table.style.width = '100%'
              table.style.overflowX = 'auto'
              table.style.overflowY = 'hidden'
              
              // Remove tabs container if it exists
              const tabsContainer = containerRef.current?.querySelector('.jexcel_tabs') as HTMLElement
              if (tabsContainer) {
                tabsContainer.style.display = 'none'
              }
              
              // Ensure table fits container perfectly
              const tableContainer = containerRef.current?.querySelector('.jexcel_container') as HTMLElement
              if (tableContainer) {
                tableContainer.style.margin = '0'
                tableContainer.style.padding = '0'
                tableContainer.style.height = '100%'
                tableContainer.style.width = '100%'
                tableContainer.style.overflowX = 'auto'
                tableContainer.style.overflowY = 'hidden'
              }
              
              // Allow horizontal scroll for table content
              const tableContent = containerRef.current?.querySelector('.jexcel_content') as HTMLElement
              if (tableContent) {
                tableContent.style.overflowX = 'auto'
                tableContent.style.overflowY = 'hidden'
                tableContent.style.height = '100%'
              }
              
              // Force table body to show all rows
              const tbody = table.querySelector('tbody') as HTMLElement
              if (tbody) {
                tbody.style.height = 'auto'
                tbody.style.overflow = 'visible'
              }
            }
          }, 100)
        }
      })
      
      console.log('Spreadsheet initialized successfully')
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
        jspreadsheetRef.current = null
      }
    }
  }, [spreadsheetData, driverOptions, customerOptions, isJsLoaded])

  // Clean up license messages periodically
  useEffect(() => {
    if (!isJsLoaded) return
    
    const cleanupLicense = () => {
      // Remove license elements
      const licenseElements = document.querySelectorAll('.jexcel-license, [style*="jexcel"], .jss-about')
      licenseElements.forEach(el => {
        if (el.textContent?.includes('License') || el.textContent?.includes('jspreadsheet')) {
          el.remove()
        }
      })
      
      // Hide tabs if they appear
      const tabsElements = document.querySelectorAll('.jexcel_tabs, .jexcel-tabs')
      tabsElements.forEach(el => {
        (el as HTMLElement).style.display = 'none'
      })
      
      // Remove any extra whitespace
      const tables = document.querySelectorAll('.jexcel')
      tables.forEach(table => {
        (table as HTMLElement).style.margin = '0';
        (table as HTMLElement).style.padding = '0'
      })
    }
    
    // Clean immediately and then periodically
    cleanupLicense()
    const interval = setInterval(cleanupLicense, 1000)
    
    return () => clearInterval(interval)
  }, [isJsLoaded])

  // Save changes to database
  const handleSave = async () => {
    if (!jspreadsheetRef.current || !hasChanges) return
    
    setIsLoading(true)
    
    try {
      const data = jspreadsheetRef.current.getData()
      
      // Stampa tutte le righe modificate
      console.log('📋 TUTTE LE RIGHE MODIFICATE:')
      modifiedRows.forEach(rowIndex => {
        const rowData = data[rowIndex]
        if (rowData && rowData[0]) { // Se la riga ha un ID
          const modifiedRowObject = rowToObject(rowData, rowIndex)
          console.log(`Riga ${rowIndex}:`, modifiedRowObject)
        }
      })
      
      const updatedBookings = []
      
      // Process each row to find changes
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const bookingId = row[0]
        
        // Skip empty rows (rows without booking ID)
        if (!bookingId || bookingId === '') continue
        
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
          // 8. mezzo → new field vehicle_details
          vehicle_details: row[8] || null,
          // 9. imponibile → net_amount
          net_amount: row[9] ? parseFloat(row[9]) : null,
          // 10. iva → vat_amount
          vat_amount: row[10] ? parseFloat(row[10]) : null,
          // 11. tot fattura → amount_total (convert back to cents)
          amount_total: Math.round(parseFloat(row[11]) * 100),
          // 12. autista → driver will be resolved from name to ID below
          // 13. fatturazione autista → new field
          driver_billing: row[13] ? parseFloat(row[13]) : null,
          // 14. commissioni autista → new field
          driver_commission: row[14] ? parseFloat(row[14]) : null,
          // 15. importo incasso diretto → new field
          direct_collection: row[15] ? parseFloat(row[15]) : null,
          // 16. cash/kk → new field payment_method
          payment_method: row[16] || null,
          // 17. note → notes
          notes: row[17] || null,
          // 18. targa → new field license_plate
          license_plate: row[18] || null
        }
        
        // Find customer_id from name (società - column 2)
        const customerName = row[2]
        const customer = customers.find(c => c.name === customerName)
        updatedBooking.customer_id = customer?.id || null
        
        // Find driver_id from name (autista - column 12)
        const driverName = row[12]
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
      setModifiedRows(new Set()) // Reset delle righe modificate
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
              {dictionary.admin?.dashboard?.bookingsCount?.replace('{count}', bookings.length) || `Prenotazioni (${bookings.length} su 50 righe)`}
            </CardTitle>
            <CardDescription>
              Tabella con 18 campi per la gestione completa delle prenotazioni - 50 righe fisse, modifica diretta e salvataggio differito
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
            height: '1350px', // Calculated: 50 rows * 25px height + header (~50px) + some padding
            minHeight: '1350px',
            maxHeight: '1350px',
            overflowX: 'auto', // Allow horizontal scrolling
            overflowY: 'hidden', // Block vertical scrolling
            // Remove any padding/margin that creates whitespace
            padding: 0,
            margin: 0
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