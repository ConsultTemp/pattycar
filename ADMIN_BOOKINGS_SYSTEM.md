# Sistema di Gestione Prenotazioni Excel-like

## Panoramica

Il nuovo sistema di gestione prenotazioni utilizza **jspreadsheet-ce** per fornire un'interfaccia familiare e potente, simile a Excel/Google Fogli. Questo permette agli amministratori di gestire le prenotazioni con facilità e velocità.

## Caratteristiche Principali

### ✅ Editing Inline
- Modifica diretta delle celle senza aprire modali
- Supporto per tutti i tipi di campo (testo, numeri, dropdown, date)
- Validazione automatica dei dati

### ✅ Esperienza Excel-like
- Navigazione con frecce direzionali
- Selezione multipla di celle
- Copia/incolla con Ctrl+C/Ctrl+V
- Scorciatoie da tastiera familiari

### ✅ Dropdown Intelligenti
- **Veicoli**: Sedan, Van, Mini Bus, Luxury Sedan
- **Status**: Pending, Confirmed, Cancelled
- **Autisti**: Lista dinamica degli autisti disponibili
- **Luoghi di partenza**: Aeroporti e stazioni principali

### ✅ Ordinamento Cronologico
- Le prenotazioni sono automaticamente ordinate per data e ora
- Visualizzazione chiara della sequenza temporale

### ✅ Operazioni CRUD Complete
- **Create**: Aggiungi nuove prenotazioni
- **Read**: Visualizza tutte le prenotazioni
- **Update**: Modifica qualsiasi campo direttamente
- **Delete**: Elimina prenotazioni con conferma

## Struttura dei File

```
components/
├── admin-bookings-spreadsheet.tsx    # Componente principale della tabella
├── admin-bookings-manager.tsx        # Container con statistiche e azioni
└── ...

hooks/
└── use-bookings-data.ts             # Hook per gestione dati

app/
└── admin-bookings-test/
    └── page.tsx                      # Pagina di test
```

## Campi della Tabella

| Campo | Tipo | Descrizione | Editing |
|-------|------|-------------|---------|
| Nome | Testo | Nome del cliente | Inline |
| Email | Testo | Email del cliente | Inline |
| Telefono | Testo | Numero di telefono | Inline |
| Veicolo | Dropdown | Tipo di veicolo | Select |
| Qty | Numerico | Numero di veicoli | Inline |
| Data | Data | Data del servizio | Calendar picker |
| Ora | Testo | Ora del servizio | Inline |
| Partenza | Dropdown | Luogo di partenza | Select |
| Destinazione | Testo | Luogo di destinazione | Inline |
| Pass. | Numerico | Numero passeggeri | Inline |
| Bagagli | Numerico | Numero bagagli | Inline |
| Volo/Treno | Testo | Info volo/treno | Inline |
| Status | Dropdown | Stato prenotazione | Select |
| Autista | Dropdown | Autista assegnato | Select |
| Prezzo € | Numerico | Prezzo servizio | Inline |
| Note | Testo | Note aggiuntive | Inline |

## Scorciatoie da Tastiera

### Navigazione
- **↑↓←→**: Muovi tra le celle
- **Tab**: Prossima cella (destra)
- **Shift+Tab**: Cella precedente (sinistra)  
- **Enter**: Cella sotto
- **Shift+Enter**: Cella sopra

### Editing
- **F2**: Entra in modalità edit
- **Escape**: Annulla modifiche correnti
- **Doppio click**: Inizia editing

### Operazioni
- **Ctrl+C**: Copia celle selezionate
- **Ctrl+V**: Incolla
- **Ctrl+S**: Conferma salvataggio (mostra notifica)
- **Ctrl+Z**: Annulla ultima azione
- **Ctrl+Y**: Ripeti ultima azione

### Selezione
- **Click+Trascina**: Seleziona area
- **Shift+Click**: Estendi selezione
- **Ctrl+Click**: Selezione multipla

## Menu Contestuale (Click Destro)

- **Inserisci riga sopra**: Aggiunge nuova prenotazione sopra
- **Inserisci riga sotto**: Aggiunge nuova prenotazione sotto
- **Elimina riga**: Rimuove prenotazione (con conferma)

## Funzionalità Dashboard

### Statistiche in Tempo Reale
- Contatore prenotazioni totali
- Prenotazioni confermate
- Prenotazioni in attesa
- Valore totale dei servizi

### Azioni Rapide
- **Aggiorna**: Ricarica i dati dal server
- **Esporta CSV**: Download dei dati in formato Excel

## Integrazione API

Il sistema è pronto per integrazione con API reali:

```typescript
// Esempio di integrazione API
const updateBooking = async (id: string, updates: Partial<Booking>) => {
  const response = await fetch(`/api/admin/bookings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return response.json();
};
```

## Personalizzazione

### Aggiungere Nuovi Campi
1. Aggiorna l'interfaccia `Booking` in `use-bookings-data.ts`
2. Aggiungi colonna in `admin-bookings-spreadsheet.tsx`
3. Aggiorna il mapping in `onchange`

### Modificare Dropdown
```typescript
// In admin-bookings-spreadsheet.tsx
const vehicleTypes = [
  { value: 'new-type', label: 'Nuovo Tipo' },
  // ...
];
```

### Stili Personalizzati
Gli stili CSS sono in `app/globals.css` sotto il commento `/* jspreadsheet-ce styles */`

## Test e Sviluppo

### Pagina di Test
Accedi a `/admin-bookings-test` per testare il sistema con dati mock.

### Dati Mock
I dati di test sono definiti in `use-bookings-data.ts` e includono vari scenari di prenotazioni.

### Build e Deploy
```bash
# Test compilazione
npm run build

# Sviluppo
npm run dev
```

## Considerazioni Future

1. **Autenticazione**: Aggiungere controlli di accesso admin
2. **Filtri**: Implementare filtri per data, status, autista
3. **Esportazione**: Aggiungere formati PDF, Excel nativo
4. **Notifiche**: Sistema di notifiche per modifiche
5. **Log delle Modifiche**: Tracciamento delle modifiche
6. **Backup**: Sistema di backup automatico

## Supporto

Per domande o problemi:
1. Controlla la console del browser per errori
2. Verifica che jspreadsheet-ce sia caricato correttamente
3. Testa con dati mock prima di integrare API reali

---

**Note**: Questo sistema è progettato per essere familiare agli utenti di Excel, mantenendo la potenza e flessibilità necessaria per la gestione professionale delle prenotazioni.