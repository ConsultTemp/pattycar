# Guida Completa - Admin Bookings Spreadsheet

## 🎯 Panoramica

Il componente `admin-bookings-spreadsheet.tsx` fornisce un'interfaccia avanzata per la gestione delle prenotazioni tramite un foglio di calcolo interattivo con 18 campi specifici per le esigenze operative.

## ✨ Funzionalità Principali

### 1. **Tracciamento Modifiche Intelligente**
- ✅ Ogni modifica viene tracciata automaticamente nell'array `modifiedBookings`
- ✅ Nessun duplicato: le modifiche multiple sulla stessa riga aggiornano l'entry esistente
- ✅ Distinzione automatica tra modifiche e nuove prenotazioni

### 2. **Creazione Nuove Prenotazioni**
- ✅ Bottone "Aggiungi Riga" inserisce una nuova riga in cima alla tabella
- ✅ Le nuove righe sono evidenziate in verde con bordo verde
- ✅ Solo la data è obbligatoria per creare una nuova prenotazione

### 3. **Salvataggio Batch Ottimizzato**
- ✅ Endpoint dedicato `/api/admin/batch-save-bookings` per operazioni atomiche
- ✅ Gestione separata di updates e creates in una singola transazione
- ✅ Feedback dettagliato su successi ed errori

### 4. **Indicatori Visivi**
- 🟢 **Righe nuove**: Sfondo verde chiaro, bordo verde
- 🟡 **Righe modificate**: Sfondo giallo chiaro, bordo arancione
- 📊 **Contatore modifiche**: Badge con numero di modifiche in attesa

## 🚀 Come Utilizzare

### Modifica Prenotazioni Esistenti
1. Clicca su qualsiasi cella per modificare il contenuto
2. Le modifiche vengono salvate automaticamente nel tracking locale
3. La riga diventa gialla per indicare che è stata modificata
4. Usa i dropdown per Società e Autista

### Creare Nuove Prenotazioni
1. Clicca "Aggiungi Riga" o usa **Ctrl+N**
2. Compila almeno la data (altri campi opzionali)
3. La riga apparirà in verde per indicare che è nuova
4. Completa i campi necessari

### Salvare le Modifiche
1. Il bottone "Salva Modifiche" appare automaticamente quando ci sono modifiche
2. Clicca il bottone o usa **Ctrl+S** per salvare
3. Tutte le modifiche vengono inviate in batch al backend
4. Lo stato viene pulito automaticamente dopo il salvataggio

## ⌨️ Scorciatoie da Tastiera

| Combinazione | Azione |
|-------------|--------|
| **Ctrl+S** | Salva tutte le modifiche |
| **Ctrl+N** | Aggiungi nuova riga |

## 📋 Struttura Campi (18 Colonne)

| # | Campo | Tipo | Descrizione |
|---|-------|------|-------------|
| 1 | **Data** | Date | Data del servizio (obbligatoria) |
| 2 | **Società** | Dropdown | Cliente/Azienda (da database) |
| 3 | **Ora** | Text | Ora inizio servizio |
| 4 | **Committente** | Text | Chi ha preso la prenotazione |
| 5 | **Passeggero/i** | Text | Dettagli passeggeri |
| 6 | **Da** | Text | Indirizzo partenza |
| 7 | **A** | Text | Indirizzo destinazione |
| 8 | **Mezzo** | Text | Dettagli veicolo |
| 9 | **Imponibile** | Numeric | Importo netto (€) |
| 10 | **IVA** | Numeric | Importo IVA (€) |
| 11 | **Tot Fattura** | Numeric | Totale fattura (€) |
| 12 | **Autista** | Dropdown | Autista assegnato (da database) |
| 13 | **Fatt. Autista** | Numeric | Fatturazione autista esterno (€) |
| 14 | **Comm. Autista** | Numeric | Commissioni autista (€) |
| 15 | **Incasso Diretto** | Numeric | Importo incassato direttamente (€) |
| 16 | **Cash/KK** | Text | Metodo di pagamento |
| 17 | **Note** | Text | Note aggiuntive |
| 18 | **Targa** | Text | Targa del veicolo |

## 🔧 Setup Tecnico

### 1. Database Schema
Eseguire la migrazione in `database-migration-spreadsheet-fields.sql` per aggiungere i nuovi campi:

```sql
-- Eseguire in Supabase SQL Editor
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS committente TEXT,
ADD COLUMN IF NOT EXISTS passenger_details TEXT,
-- ... altri campi (vedi migration file)
```

### 2. API Endpoints
Il componente utilizza questi endpoint:

- **GET** `/api/admin/drivers` - Carica lista autisti
- **GET** `/api/admin/customers` - Carica lista clienti  
- **POST** `/api/admin/batch-save-bookings` - Salva modifiche batch (nuovo)
- **PUT** `/api/admin/update-booking` - Aggiorna singola prenotazione (fallback)
- **POST** `/api/admin/create-booking` - Crea singola prenotazione (fallback)

### 3. Componenti UI
- Utilizza `jspreadsheet` v4 caricato dinamicamente
- Componenti Tailwind/shadcn per l'interfaccia
- Toast notifications per feedback utente

## 📊 Gestione Stato

### Stati React Principali:
```typescript
modifiedBookings: ModifiedBooking[]  // Array delle prenotazioni modificate
hasChanges: boolean                  // Indica se ci sono modifiche da salvare
modifiedRows: Set<number>           // Set degli indici righe modificate (per UI)
newRowsCount: number               // Contatore nuove righe aggiunte
```

### Interfaccia ModifiedBooking:
```typescript
interface ModifiedBooking {
  id: string | null    // null per nuove prenotazioni
  data: any           // Dati della riga in formato oggetto
  isNew: boolean      // true se è una nuova prenotazione
  rowIndex: number    // Indice della riga nel spreadsheet
}
```

## 🚨 Note Importanti

1. **Backup Database**: Prima di utilizzare in produzione, eseguire un backup della tabella bookings
2. **Campi Obbligatori**: Per nuove prenotazioni è obbligatoria solo la data
3. **Validazione**: I campi numerici vengono validati automaticamente
4. **Performance**: Il sistema è ottimizzato per 50 righe fisse con scrolling orizzontale
5. **Transazioni**: Le operazioni batch garantiscono consistenza dei dati

## 🔍 Troubleshooting

### Problemi Comuni:
- **jspreadsheet non si carica**: Controlla la connessione internet per i CDN
- **Campi non si salvano**: Verifica che la migrazione database sia stata eseguita
- **Dropdown vuoti**: Controlla che drivers e customers siano caricati correttamente
- **Errori TypeScript**: Rigenera i tipi database dopo la migrazione

### Debug:
- Controlla la console browser per log dettagliati
- Verifica le chiamate API nel Network tab
- I dati modificati sono loggati con prefisso `🔥`

## 📈 Performance

- **Caricamento**: ~2-3 secondi per inizializzazione completa
- **Modifiche**: Tracking in tempo reale senza lag
- **Salvataggio**: Operazioni batch per ottimizzare le chiamate DB
- **Memoria**: Gestione automatica cleanup e garbage collection