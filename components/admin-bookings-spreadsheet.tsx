"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import { Database } from "@/types/database.types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { FileText, Save, Plus } from "lucide-react"
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
  const [debugLog, setDebugLog] = useState<string[]>([])

  // Debug function
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    console.log(`[${timestamp}] ${message}`)
    setDebugLog(prev => [...prev.slice(-4), `[${timestamp}] ${message}`])
  }

  // Load drivers and customers
  useEffect(() => {
    const fetchDriversAndCustomers = async () => {
      try {
        addDebugLog('🔄 Caricamento drivers e customers...')
        const [driversResponse, customersResponse] = await Promise.all([
          fetch('/api/admin/drivers'),
          fetch('/api/admin/customers')
        ])
        
        if (driversResponse.ok) {
          const driversResult = await driversResponse.json()
          if (driversResult.success) {
            setDrivers(driversResult.data)
            addDebugLog(`✅ Caricati ${driversResult.data.length} drivers`)
          }
        }
        
        if (customersResponse.ok) {
          const customersResult = await customersResponse.json()
          if (customersResult.success) {
            setCustomers(customersResult.data)
            addDebugLog(`✅ Caricati ${customersResult.data.length} customers`)
          }
        }
      } catch (error) {
        addDebugLog(`❌ Errore caricamento: ${error}`)
      }
    }
    
    fetchDriversAndCustomers()
  }, [])

  // Load jspreadsheet dynamically
  useEffect(() => {
    addDebugLog('🔄 Inizializzazione jspreadsheet...')
    
    const loadSpreadsheet = async () => {
      try {
        // Check if already loaded
        if (typeof window !== 'undefined' && (window as any).jspreadsheet) {
          addDebugLog('✅ jspreadsheet già caricato')
          setIsJsLoaded(true)
          return
        }

        addDebugLog('🔄 Caricamento CSS e JS...')

        // Load CSS
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

        // Load scripts
        const script1 = document.createElement('script')
        script1.src = 'https://jsuites.net/v4/jsuites.js'
        script1.onerror = () => {
          addDebugLog('❌ Errore caricamento jsuites.js')
        }
        script1.onload = () => {
          addDebugLog('✅ jsuites.js caricato')
          const script2 = document.createElement('script')
          script2.src = 'https://jspreadsheet.com/v4/jspreadsheet.js'
          script2.onerror = () => {
            addDebugLog('❌ Errore caricamento jspreadsheet.js')
          }
          script2.onload = () => {
            if (typeof (window as any).jspreadsheet !== 'undefined') {
              addDebugLog('✅ jspreadsheet.js caricato e disponibile')
              setIsJsLoaded(true)
            } else {
              addDebugLog('❌ jspreadsheet non disponibile dopo caricamento')
            }
          }
          document.head.appendChild(script2)
        }
        document.head.appendChild(script1)
      } catch (error) {
        addDebugLog(`❌ Errore generale: ${error}`)
      }
    }

    loadSpreadsheet()
  }, [])

  // Prepare data for spreadsheet
  const spreadsheetData = useMemo(() => {
    addDebugLog(`🔄 Preparazione dati: ${bookings.length} prenotazioni`)
    
    const bookingRows = bookings.slice(0, 10).map(booking => [
      String(booking.id || ''),
      String(booking.service_date || ''),
      String(booking.customer?.name || booking.customer_name || ''),
      String(booking.service_time || ''),
      String(booking.pickup_address || ''),
      String(booking.destination_address || ''),
      booking.amount_total ? String((booking.amount_total / 100).toFixed(2)) : '0.00',
      String(booking.driver?.name || ''),
      String(booking.notes || '')
    ])
    
    // Add empty rows to reach 20 total
    while (bookingRows.length < 20) {
      bookingRows.push(['', '', '', '', '', '', '', '', ''])
    }
    
    addDebugLog(`✅ Dati preparati: ${bookingRows.length} righe`)
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
    addDebugLog(`✅ Driver options: ${options.length}`)
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
    addDebugLog(`✅ Customer options: ${options.length}`)
    return options
  }, [customers])

  // Add new row function - SIMPLIFIED
  const addNewRow = () => {
    addDebugLog('🔄 Tentativo aggiunta riga...')
    
    if (!jspreadsheetRef.current) {
      addDebugLog('❌ jspreadsheetRef non disponibile')
      return
    }
    
    try {
      const tempId = `new_${Date.now()}`
      const newRowData = [tempId, '', '', '', '', '', '', '', '']
      
      addDebugLog('🔄 Inserimento riga con insertRow()')
      jspreadsheetRef.current.insertRow(newRowData, 0)
      addDebugLog('✅ Riga inserita con successo')
      
      setHasChanges(true)
      
      toast({
        title: "Riga aggiunta",
        description: "Nuova riga inserita in cima",
      })
      
    } catch (error) {
      addDebugLog(`❌ Errore insertRow: ${error}`)
      toast({
        title: "Errore",
        description: `Errore: ${error}`,
        variant: "destructive",
      })
    }
  }

  // Initialize jspreadsheet - SIMPLIFIED
  useEffect(() => {
    if (!containerRef.current || !spreadsheetData.length || !isJsLoaded) {
      addDebugLog(`⏸️ Skip init: container=${!!containerRef.current}, data=${spreadsheetData.length}, jsLoaded=${isJsLoaded}`)
      return
    }

    if (typeof (window as any).jspreadsheet === 'undefined') {
      addDebugLog('❌ jspreadsheet non disponibile nel window')
      return
    }
    
    addDebugLog('🔄 Inizializzazione spreadsheet...')

    // Clean up existing instance
    if (jspreadsheetRef.current) {
      try {
        jspreadsheetRef.current.destroy()
      } catch (e) {
        addDebugLog(`⚠️ Cleanup error: ${e}`)
      }
      jspreadsheetRef.current = null
    }

    // SIMPLIFIED COLUMNS - only 9 for testing
    const columns = [
      { type: 'hidden', width: 0 }, // ID
      { title: 'Data', type: 'text', width: 120 },
      { title: 'Società', type: 'dropdown', width: 180, source: customerOptions },
      { title: 'Ora', type: 'text', width: 80 },
      { title: 'Da', type: 'text', width: 200 },
      { title: 'A', type: 'text', width: 200 },
      { title: 'Totale', type: 'text', width: 100 },
      { title: 'Autista', type: 'dropdown', width: 150, source: driverOptions },
      { title: 'Note', type: 'text', width: 200 }
    ]

    try {
      const jspreadsheet = (window as any).jspreadsheet
      
      addDebugLog('🔄 Creazione istanza jspreadsheet...')
      
      jspreadsheetRef.current = jspreadsheet(containerRef.current, {
        data: spreadsheetData,
        columns: columns,
        minDimensions: [9, 20],
        allowInsertRow: true,
        allowDeleteRow: false,
        allowInsertColumn: false,
        allowDeleteColumn: false,
        allowRenameColumn: false,
        editable: true, // FONDAMENTALE - permette modifiche
        tableHeight: '600px',
        tableWidth: '100%',
        columnSorting: false,
        columnDrag: false,
        rowResize: false,
        columnResize: true,
        contextMenu: true, // Menu destro per debug
        
        // EVENT HANDLERS - ULTRA SIMPLIFIED
        onchange: function(instance, cell, x, y, value, oldValue) {
          addDebugLog(`🔥 CHANGE DETECTED: cell[${x},${y}] = "${value}" (was "${oldValue}")`)
          console.log('🔥 CHANGE DETECTED:', { cell, x, y, value, oldValue })
          
          if (value !== oldValue) {
            setHasChanges(true)
            addDebugLog('✅ hasChanges = true')
          }
        },
        
        oneditionstart: function(instance, cell, x, y) {
          addDebugLog(`📝 EDITION START: cell[${x},${y}]`)
          console.log('📝 EDITION START:', { cell, x, y })
        },
        
        oneditionend: function(instance, cell, x, y, value, oldValue) {
          addDebugLog(`📝 EDITION END: cell[${x},${y}] = "${value}" (was "${oldValue}")`)
          console.log('📝 EDITION END:', { cell, x, y, value, oldValue })
        },
        
        onclick: function(instance, cell, x, y, value, event) {
          addDebugLog(`👆 CELL CLICK: cell[${x},${y}] = "${value}"`)
          console.log('👆 CELL CLICK:', { cell, x, y, value })
        },
        
        onload: function(instance) {
          addDebugLog('✅ Spreadsheet caricato con successo!')
          console.log('✅ Spreadsheet loaded:', instance)
          
          // Test che le celle siano editabili
          setTimeout(() => {
            addDebugLog('🔍 Test editabilità celle...')
            const firstDataCell = containerRef.current?.querySelector('tbody tr:first-child td:nth-child(2)')
            if (firstDataCell) {
              addDebugLog(`✅ Prima cella data trovata: ${firstDataCell.textContent}`)
            } else {
              addDebugLog('❌ Prima cella data non trovata')
            }
          }, 500)
        },
        
        onerror: function(instance, error) {
          addDebugLog(`❌ Spreadsheet error: ${error}`)
          console.error('❌ Spreadsheet error:', error)
        }
      })
      
      addDebugLog('✅ Spreadsheet inizializzato!')
      
    } catch (error) {
      addDebugLog(`❌ Errore inizializzazione: ${error}`)
      console.error('❌ Error initializing jspreadsheet:', error)
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

  // Simple save function
  const handleSave = async () => {
    if (!jspreadsheetRef.current || !hasChanges) {
      addDebugLog('❌ Cannot save: no spreadsheet or no changes')
      return
    }
    
    addDebugLog('🔄 Inizio salvataggio...')
    setIsLoading(true)
    
    try {
      const data = jspreadsheetRef.current.getData()
      addDebugLog(`📊 Dati ottenuti: ${data.length} righe`)
      console.log('📊 Current spreadsheet data:', data)
      
      // For now, just show success
      toast({
        title: "Test salvataggio",
        description: `Rilevate ${data.length} righe di dati`,
      })
      
      setHasChanges(false)
      addDebugLog('✅ Salvataggio completato (test)')
      
    } catch (error) {
      addDebugLog(`❌ Errore salvataggio: ${error}`)
      toast({
        title: "Errore",
        description: `Errore: ${error}`,
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
            <div className="text-sm text-gray-500 mt-2">
              {debugLog.length > 0 && (
                <div className="text-left mt-4">
                  {debugLog.map((log, index) => (
                    <div key={index} className="text-xs font-mono">{log}</div>
                  ))}
                </div>
              )}
            </div>
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
              Spreadsheet Test - {bookings.length} prenotazioni
            </CardTitle>
            <CardDescription>
              Test di base con 9 campi semplificati
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={addNewRow} variant="outline" disabled={isLoading}>
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi Riga
            </Button>
            {hasChanges && (
              <Button onClick={handleSave} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Salvataggio...' : 'Salva Test'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        
        {/* DEBUG LOG */}
        {debugLog.length > 0 && (
          <div className="mb-4 p-2 bg-gray-50 rounded text-xs font-mono">
            <strong>Debug Log:</strong>
            {debugLog.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        )}

        {hasChanges && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <strong>⚠️ MODIFICHE RILEVATE!</strong> Clicca "Salva Test" per testare.
          </div>
        )}
        
        <div>
          <strong>Istruzioni Test:</strong> Modifica qualsiasi cella per testare il rilevamento modifiche. 
          Clicca "Aggiungi Riga" per testare l'inserimento.
        </div>
        
        <div 
          ref={containerRef} 
          className="w-full border rounded-lg mt-4"
          style={{ 
            height: '650px',
            overflowX: 'auto',
            overflowY: 'auto'
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
          </div>
        </CardContent>
      </Card>
    )
  }
)

export default AdminBookingsSpreadsheet