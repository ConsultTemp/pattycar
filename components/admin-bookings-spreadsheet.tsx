"use client"

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { Database } from "@/types/database.types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { FileText, Save, Plus, RefreshCw } from "lucide-react"
import dynamic from "next/dynamic"

type BookingRow = Database['public']['Tables']['bookings']['Row']
type DriverRow = Database['public']['Tables']['drivers']['Row']
type CustomerRow = Database['public']['Tables']['customers']['Row']

interface AdminBookingsSpreadsheetProps {
  bookings: any[]
  dictionary: any
  onBookingsUpdated: () => void
}

interface ModifiedBooking {
  id: string | null // null for new bookings
  data: any
  isNew: boolean
  rowIndex: number
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
  const [modifiedBookings, setModifiedBookings] = useState<ModifiedBooking[]>([])
  const [newRowsCount, setNewRowsCount] = useState(0)
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
  const rowToObject = useCallback((rowData: any[], rowIndex: number) => {
    const obj: any = {}
    columnNames.forEach((columnName, index) => {
      if (index > 0) { // Skip hidden ID column
        obj[columnName] = rowData[index] || ''
      }
    })
    obj.rowIndex = rowIndex
    return obj
  }, [])

  // Funzione per aggiungere una nuova riga
  const addNewRow = useCallback(() => {
    if (!jspreadsheetRef.current) return
    
    try {
      // Crea una nuova riga vuota con ID temporaneo
      const tempId = `new_${Date.now()}_${newRowsCount}`
      const newRowData = [tempId, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
      
      // Inserisci la riga all'inizio (dopo l'header)
      jspreadsheetRef.current.insertRow(newRowData, 0)
      
      // Aggiungi la nuova riga a modifiedBookings
      const newBooking: ModifiedBooking = {
        id: null, // null indica che è una nuova prenotazione
        data: rowToObject(newRowData, 0),
        isNew: true,
        rowIndex: 0
      }
      
      setModifiedBookings(prev => [newBooking, ...prev])
      setNewRowsCount(prev => prev + 1)
      setHasChanges(true)
      
      // Evidenzia la riga come nuova
      setTimeout(() => {
        const firstRow = containerRef.current?.querySelector('tbody tr:first-child')
        if (firstRow) {
          firstRow.style.backgroundColor = '#e8f5e8'
          firstRow.style.border = '2px solid #4ade80'
        }
      }, 100)
      
      toast({
        title: "Nuova riga aggiunta",
        description: "È stata aggiunta una nuova riga in cima alla tabella",
      })
      
    } catch (error) {
      console.error('Error adding new row:', error)
      toast({
        title: "Errore",
        description: "Impossibile aggiungere una nuova riga",
        variant: "destructive",
      })
    }
  }, [newRowsCount, rowToObject])

  // Funzione per tracciare le modifiche
  const trackModification = useCallback((rowIndex: number, rowData: any[]) => {
    const bookingId = rowData[0]
    const isNewBooking = !bookingId || bookingId.startsWith('new_')
    
    const modifiedBooking: ModifiedBooking = {
      id: isNewBooking ? null : bookingId,
      data: rowToObject(rowData, rowIndex),
      isNew: isNewBooking,
      rowIndex
    }
    
    setModifiedBookings(prev => {
      // Rimuovi duplicati basati su rowIndex
      const filtered = prev.filter(mb => mb.rowIndex !== rowIndex)
      return [...filtered, modifiedBooking]
    })
    
    setHasChanges(true)
    console.log('🔥 PRENOTAZIONE MODIFICATA/NUOVA:', modifiedBooking)
  }, [rowToObject])
  
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
        allowInsertRow: true, // Allow adding new rows
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
          console.log('Cell changed - onChange triggered:', { cell, x, y, value, oldValue })
          if (value !== oldValue) {
            // Ottieni tutti i dati della riga corrente
            const rowData = instance.getRowData(y)
            trackModification(y, rowData)
            
            // Aggiungi la riga alle righe modificate per evidenziazione visiva
            setModifiedRows(prev => new Set(prev).add(y))
          }
        },
        oneditionend: (instance: any, cell: any, x: any, y: any, value: any, oldValue: any) => {
          console.log('Edition ended:', { cell, x, y, value, oldValue })
          if (value !== oldValue) {
            const rowData = instance.getRowData(y)
            trackModification(y, rowData)
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
  }, [spreadsheetData, driverOptions, customerOptions, isJsLoaded, trackModification])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S to save
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault()
        if (hasChanges && modifiedBookings.length > 0) {
          handleSave()
        }
      }
      
      // Ctrl+N to add new row
      if (event.ctrlKey && event.key === 'n') {
        event.preventDefault()
        addNewRow()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [hasChanges, modifiedBookings.length, handleSave, addNewRow])

  // Clean up license messages and apply visual indicators
  useEffect(() => {
    if (!isJsLoaded) return
    
    const cleanupAndStyle = () => {
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

      // Apply visual indicators for modified rows
      if (containerRef.current && modifiedRows.size > 0) {
        const tbody = containerRef.current.querySelector('tbody')
        if (tbody) {
          const rows = tbody.querySelectorAll('tr')
          
          // Reset all row styles first
          rows.forEach(row => {
            row.style.backgroundColor = ''
            row.style.borderLeft = ''
          })
          
          // Apply styling to modified rows
          modifiedRows.forEach(rowIndex => {
            const row = rows[rowIndex]
            if (row) {
              // Check if it's a new booking (starts with 'new_')
              const firstCell = row.querySelector('td')
              const isNewRow = firstCell?.textContent?.startsWith('new_')
              
              if (isNewRow) {
                row.style.backgroundColor = '#f0fdf4' // Light green for new rows
                row.style.borderLeft = '4px solid #22c55e' // Green border
              } else {
                row.style.backgroundColor = '#fef3c7' // Light yellow for modified rows
                row.style.borderLeft = '4px solid #f59e0b' // Orange border
              }
            }
          })
        }
      }
    }
    
    // Clean and style immediately and then periodically
    cleanupAndStyle()
    const interval = setInterval(cleanupAndStyle, 1000)
    
    return () => clearInterval(interval)
  }, [isJsLoaded, modifiedRows])

  // Funzione per convertire dati modificati in formato API
  const prepareBookingForAPI = useCallback((modifiedBooking: ModifiedBooking) => {
    const data = modifiedBooking.data
    
    // Find customer_id from name (società - column 2)
    const customerName = data.società
    const customer = customers.find(c => c.name === customerName)
    
    // Find driver_id from name (autista - column 12)
    const driverName = data.autista
    const driver = drivers.find(d => d.name === driverName)
    
    // Calculate amounts
    const netAmount = parseFloat(data.imponibile) || 0
    const vatAmount = parseFloat(data.iva) || 0
    const totalAmount = parseFloat(data.tot_fattura) || (netAmount + vatAmount)
    
    if (modifiedBooking.isNew) {
      // Prepare data for new booking creation
      return {
        // Required fields for new booking
        customer_name: customerName || 'Cliente Generico',
        customer_email: customer?.email || 'admin@pattycar.com',
        customer_phone: customer?.phone || null,
        customer_phone_prefix: customer?.phone_prefix || null,
        service_type: 'transfer', // Default service type
        service_label: 'Transfer Service',
        pickup_address: data.da || 'Indirizzo non specificato',
        destination_address: data.a || 'Destinazione non specificata',
        service_date: data.data || new Date().toISOString().split('T')[0],
        service_time: data.ora || '09:00',
        vehicle_type: data.mezzo || 'Class E',
        passengers: 1, // Default
        amount_total: Math.round(totalAmount * 100), // Convert to cents
        currency: 'EUR',
        
        // Optional fields from spreadsheet
        notes: data.note || null,
        driver_id: driver?.id || null,
        customer_id: customer?.id || null,
        
        // New spreadsheet fields
        committente: data.committente || null,
        passenger_details: data.passeggero_i || null,
        vehicle_details: data.mezzo || null,
        net_amount: netAmount || null,
        vat_amount: vatAmount || null,
        driver_billing: parseFloat(data.fatt_autista) || null,
        driver_commission: parseFloat(data.comm_autista) || null,
        direct_collection: parseFloat(data.incasso_diretto) || null,
        payment_method: data.cash_kk || null,
        license_plate: data.targa || null
      }
    } else {
      // Prepare data for existing booking update
      return {
        id: modifiedBooking.id,
        // 1. data → service_date
        service_date: data.data,
        // 3. ora → service_time  
        service_time: data.ora,
        // 4. committente → new field
        committente: data.committente || null,
        // 5. passeggero/i → new field passenger_details
        passenger_details: data.passeggero_i || null,
        // 6. da → pickup_address
        pickup_address: data.da,
        // 7. a → destination_address
        destination_address: data.a,
        // 8. mezzo → new field vehicle_details
        vehicle_details: data.mezzo || null,
        // 9. imponibile → net_amount
        net_amount: netAmount || null,
        // 10. iva → vat_amount
        vat_amount: vatAmount || null,
        // 11. tot fattura → amount_total (convert back to cents)
        amount_total: Math.round(totalAmount * 100),
        // 13. fatturazione autista → new field
        driver_billing: parseFloat(data.fatt_autista) || null,
        // 14. commissioni autista → new field
        driver_commission: parseFloat(data.comm_autista) || null,
        // 15. importo incasso diretto → new field
        direct_collection: parseFloat(data.incasso_diretto) || null,
        // 16. cash/kk → new field payment_method
        payment_method: data.cash_kk || null,
        // 17. note → notes
        notes: data.note || null,
        // 18. targa → new field license_plate
        license_plate: data.targa || null,
        // ID references
        customer_id: customer?.id || null,
        driver_id: driver?.id || null
      }
    }
  }, [customers, drivers])

  // Save changes to database - BATCH API LOGIC
  const handleSave = async () => {
    if (!jspreadsheetRef.current || !hasChanges || modifiedBookings.length === 0) return
    
    setIsLoading(true)
    
    try {
      console.log('📋 SAVING MODIFIED BOOKINGS:', modifiedBookings)
      
      // Separate new bookings from existing ones
      const updates = []
      const creates = []
      
      for (const modifiedBooking of modifiedBookings) {
        const apiData = prepareBookingForAPI(modifiedBooking)
        
        if (modifiedBooking.isNew) {
          creates.push(apiData)
        } else {
          updates.push(apiData)
        }
      }
      
      // Send batch request to new endpoint
      const response = await fetch('/api/admin/batch-save-bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates,
          creates
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore durante il salvataggio')
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Operazione fallita')
      }
      
      const { updated, created, errors } = result.results
      
      // Show success message
      toast({
        title: "Prenotazioni salvate",
        description: `${updated} modifiche e ${created} nuove prenotazioni salvate con successo` + 
                    (errors > 0 ? ` (${errors} errori)` : ''),
        variant: errors > 0 ? "destructive" : "default"
      })
      
      // Log any errors for debugging
      if (errors > 0) {
        console.warn('Some operations failed:', result.results.details.errors)
      }
      
      // Reset state
      setHasChanges(false)
      setModifiedRows(new Set())
      setModifiedBookings([])
      setNewRowsCount(0)
      
      // Refresh data
      onBookingsUpdated()
      
    } catch (error) {
      console.error('Error saving bookings:', error)
      toast({
        title: "Errore nel salvataggio",
        description: error instanceof Error ? error.message : "Si è verificato un errore durante il salvataggio delle prenotazioni",
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
              Tabella con 18 campi per la gestione completa delle prenotazioni - modifica diretta e salvataggio differito
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={addNewRow} 
              variant="outline"
              disabled={isLoading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi Riga
            </Button>
            {hasChanges && modifiedBookings.length > 0 && (
              <Button 
                onClick={handleSave} 
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  `Salva Modifiche (${modifiedBookings.length})`
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-sm text-gray-600">
          <strong>Istruzioni:</strong> Modifica i campi direttamente in tabella. Usa dropdown per Società/Autista. 
          I campi numerici (Imponibile, IVA, ecc.) accettano decimali. 
          <strong>Nuove righe:</strong> Clicca "Aggiungi Riga" per creare nuove prenotazioni (solo la data è obbligatoria).
          <br />
          <strong>Scorciatoie:</strong> <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+S</kbd> per salvare, 
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+N</kbd> per aggiungere riga.
          <br />
          <strong>Indicatori:</strong> <span className="inline-block w-3 h-3 bg-green-100 border-l-4 border-green-500 mr-1"></span> Nuove righe • 
          <span className="inline-block w-3 h-3 bg-yellow-100 border-l-4 border-orange-500 mr-1"></span> Righe modificate
        </div>
        
        {/* Status indicator */}
        {hasChanges && modifiedBookings.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800 font-medium">
                  📝 {modifiedBookings.length} modifiche in attesa di salvataggio
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {modifiedBookings.filter(mb => mb.isNew).length} nuove prenotazioni • {modifiedBookings.filter(mb => !mb.isNew).length} modifiche esistenti
                </p>
              </div>
              <Button onClick={handleSave} disabled={isLoading} size="sm">
                Salva Ora
              </Button>
            </div>
          </div>
        )}
        
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