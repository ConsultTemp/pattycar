import { google } from 'googleapis'

// Initialize Google Sheets API
const sheets = google.sheets('v4')

// Create auth client with service account
function createAuthClient() {
  if (!process.env.GOOGLE_SHEETS_PRIVATE_KEY || !process.env.GOOGLE_SHEETS_CLIENT_EMAIL) {
    throw new Error('Google Sheets credentials not configured')
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return auth
}

// Interface for booking data to be sent to Google Sheets
// Matches the exact structure of the CSV: data,società,ora,committente,passeggero/i,da,dispo / destinazione,mezzo,imponibile,iva,tot fattura,autista,fatturazione autista,commissioni autista,importo incasso diretto,cash/kk,,note...
export interface GoogleSheetsBookingData {
  // Main booking data
  service_date: string        // data (colonna A)
  company: string             // società (colonna B) 
  service_time: string        // ora (colonna C)
  customer_name: string       // committente (colonna D)
  passengers_info: string     // passeggero/i (colonna E)
  pickup_address: string      // da (colonna F)
  destination_address: string // dispo / destinazione (colonna G)
  vehicle_type: string        // mezzo (colonna H)
  taxable_amount: number      // imponibile (colonna I)
  vat_amount: number          // iva (colonna J)
  total_invoice: number       // tot fattura (colonna K)
  driver_name?: string        // autista (colonna L)
  driver_billing?: string     // fatturazione autista (colonna M)
  driver_commission?: string  // commissioni autista (colonna N)
  direct_collection?: number  // importo incasso diretto (colonna O)
  payment_method?: string     // cash/kk (colonna P)
  // colonna Q vuota
  notes?: string              // note (colonna R)
  
  // Additional fields for internal tracking
  id?: string
  customer_email?: string
  customer_phone?: string
  amount_total?: number
  payment_status?: string
}

// Add booking to Google Sheets by reading headers and mapping data correctly
export async function addBookingToGoogleSheets(bookingData: GoogleSheetsBookingData): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔧 Creating Google Sheets auth client...')
    const auth = createAuthClient()
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

    if (!spreadsheetId) {
      throw new Error('Google Sheets spreadsheet ID not configured')
    }

    console.log('📋 Reading sheet headers...')
    // First, read the headers to understand the column structure
    const headersResponse = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: 'Sheet1!1:1', // Get the first row (headers)
    })

    const headers = headersResponse.data.values?.[0] || []
    console.log(`📊 Found ${headers.length} headers in sheet`)

    // Create a mapping object for the data based on column names
    const columnMapping: { [key: string]: any } = {}
    
    console.log('🗂️ Mapping booking data to columns...')
    // Map the booking data to the correct column names
    headers.forEach((header: string, index: number) => {
      const headerName = header ? header.toLowerCase().trim() : ''
      
      switch (headerName) {
        case 'data':
          columnMapping[index] = bookingData.service_date
          break
        case 'società':
          columnMapping[index] = bookingData.company
          break
        case 'ora':
          columnMapping[index] = bookingData.service_time
          break
        case 'committente':
          columnMapping[index] = bookingData.customer_name
          break
        case 'passeggero/i':
          columnMapping[index] = bookingData.passengers_info
          break
        case 'da':
          columnMapping[index] = bookingData.pickup_address
          break
        case 'dispo / destinazione':
          columnMapping[index] = bookingData.destination_address
          break
        case 'mezzo':
          // Only map to the first "mezzo" column (index 10), not the second one (index 21)
          if (index === 10) {
            columnMapping[index] = bookingData.vehicle_type
          } else {
            columnMapping[index] = '' // Leave the second MEZZO column empty
          }
          break
        case 'imponibile':
          columnMapping[index] = bookingData.taxable_amount
          break
        case 'iva':
          columnMapping[index] = bookingData.vat_amount
          break
        case 'tot fattura':
          columnMapping[index] = bookingData.total_invoice
          break
        case 'autista':
          columnMapping[index] = bookingData.driver_name || ''
          break
        case 'fatturazione autista':
          columnMapping[index] = bookingData.driver_billing || ''
          break
        case 'commissioni autista':
          columnMapping[index] = bookingData.driver_commission || ''
          break
        case 'importo incasso diretto':
          columnMapping[index] = bookingData.direct_collection || ''
          break
        case 'cash/kk':
          columnMapping[index] = bookingData.payment_method || ''
          break
        case 'note':
          columnMapping[index] = bookingData.notes || ''
          break
        default:
          // For all other columns, leave empty
          columnMapping[index] = ''
          break
      }
    })

    // Create the row array based on the mapping
    const row: any[] = []
    for (let i = 0; i < headers.length; i++) {
      row[i] = columnMapping[i] || ''
    }

    console.log('💾 Finding next available row in Google Sheets...')

    // Get all data to find the actual last row with content
    const dataResponse = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: 'Sheet1!A:ZZ', // Get all data to find the real last row
    })

    const existingData = dataResponse.data.values || []
    
    // Find the last row that has any content
    let lastRowWithData = 0
    for (let i = existingData.length - 1; i >= 0; i--) {
      const row = existingData[i]
      // Check if row has any non-empty cells
      if (row && row.some(cell => cell && cell.toString().trim() !== '')) {
        lastRowWithData = i + 1 // +1 because array is 0-indexed but sheets are 1-indexed
        break
      }
    }
    
    let nextRow = lastRowWithData + 1
    console.log(`📍 Last row with data: ${lastRowWithData}, checking row: ${nextRow}`)

    // Double-check that the target row is actually empty
    const targetRowCheck = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: `Sheet1!A${nextRow}:ZZ${nextRow}`,
    })
    
    const targetRowData = targetRowCheck.data.values?.[0] || []
    const hasExistingData = targetRowData.some(cell => cell && cell.toString().trim() !== '')
    
    if (hasExistingData) {
      console.log(`⚠️ Row ${nextRow} has existing data, finding next truly empty row...`)
      // Find the next truly empty row
      let emptyRow = nextRow + 1
      while (emptyRow <= lastRowWithData + 10) { // Check up to 10 rows ahead
        const checkResponse = await sheets.spreadsheets.values.get({
          auth,
          spreadsheetId,
          range: `Sheet1!A${emptyRow}:ZZ${emptyRow}`,
        })
        const checkData = checkResponse.data.values?.[0] || []
        if (!checkData.some(cell => cell && cell.toString().trim() !== '')) {
          nextRow = emptyRow
          break
        }
        emptyRow++
      }
      console.log(`📍 Using truly empty row: ${nextRow}`)
    }

    // Insert the row at the specific position using UPDATE instead of APPEND
    const response = await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId,
      range: `Sheet1!A${nextRow}:ZZ${nextRow}`, // Specific row range
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row]
      }
    })

    console.log('✅ Google Sheets booking inserted successfully')
    return { success: true }

  } catch (error) {
    console.error('Error adding booking to Google Sheets:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Get headers for the Google Sheet (call this once to set up the sheet)
// These headers match exactly the CSV structure you provided
export async function setupGoogleSheetsHeaders(): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = createAuthClient()
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

    if (!spreadsheetId) {
      throw new Error('Google Sheets spreadsheet ID not configured')
    }

    // Headers that match exactly the CSV structure
    const headers = [
      '', // Empty first column
      '', // Empty second column
      '', // Empty third column
      'data', // D
      'società', // E
      'ora', // F
      'committente', // G
      'passeggero/i', // H
      'da', // I
      'dispo / destinazione', // J
      'mezzo', // K
      'imponibile', // L
      'iva', // M
      'tot fattura', // N
      'autista', // O
      'fatturazione autista', // P
      'commissioni autista', // Q
      'importo incasso diretto', // R
      'cash/kk', // S
      '', // T - empty
      'note', // U
      'MEZZO', // V
      'KM INIZIALI', // W
      'GASOLIO INIZIALE', // X
      'KM FINALI', // Y
      'GASOLIO FINALE', // Z
      'LITRI GASOLIO', // AA
      'COSTO GASOLIO', // AB
      'GESTORE', // AC
      'SCONTRINO RIFORNIMENTO', // AD
      'IMPORTO SPESE GENERICHE', // AE
      'MOTIVAZIONE SPESE', // AF
      'NOTE AUTISTA', // AG
      'DA (ORA)', // AH
      'A (ORA)', // AI
      '', // AJ - empty
      'DA (ORA)', // AK
      'A (ORA)', // AL
      'DA (ORA)', // AM
      'A (ORA)', // AN
      'DA (ORA)', // AO
      'A (ORA)', // AP
      'TOT ORE GIORNALIERE', // AQ
      'TOT ORE GIORNALIERE', // AR
      'NOTE AUTISTA' // AS
    ]

    // Add headers to the first row
    const response = await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId,
      range: 'Sheet1!A1:AS1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [headers]
      }
    })

    console.log('Successfully set up Google Sheets headers:', response.data)
    return { success: true }

  } catch (error) {
    console.error('Error setting up Google Sheets headers:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Get all driver and customer names from the database to populate Google Sheets dropdowns
export async function getDriversAndCustomersForGoogleSheets(): Promise<{ drivers: string[], customers: string[] }> {
  // This will be called from the API route where we have access to the database
  return { drivers: [], customers: [] }
}


