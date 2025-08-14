# Admin Bookings Spreadsheet - Tabella Excel-like

## Panoramica

La nuova tabella delle prenotazioni amministrative utilizza `jspreadsheet-ce` per fornire un'esperienza simile a Excel/Google Sheets, permettendo la modifica diretta delle celle senza aprire modal.

## Funzionalità Principali

### 🚀 Funzionalità Excel-like

- **Navigazione con frecce**: Usa le frecce direzionali per spostarti tra le celle
- **Modifica diretta**: Clicca su una cella per modificarla immediatamente
- **Selezione multipla**: Seleziona più celle trascinando o usando Shift+click
- **Ridimensionamento colonne**: Trascina i bordi delle colonne per ridimensionarle
- **Ordinamento**: Clicca sulle intestazioni delle colonne per ordinare
- **Ricerca integrata**: Usa la funzione di ricerca per trovare dati specifici

### 📊 Colonne Disponibili

1. **Data Servizio** - Calendar picker integrato
2. **Ora Inizio/Fine** - Campi di testo per orari
3. **Cliente** - Nome, email e telefono
4. **Tipo Servizio** - Dropdown con opzioni predefinite
5. **Indirizzi** - Partenza e destinazione
6. **Veicolo** - Tipo, passeggeri, bagagli
7. **Importo** - In euro con conversione automatica
8. **Driver Assegnato** - Dropdown con driver disponibili
9. **Customer Assegnato** - Dropdown con clienti disponibili
10. **Status e Opzioni** - Meet & greet, stato pagamento, etc.

### 🎯 Dropdown Dinamici

- **Driver**: Lista aggiornata automaticamente dai driver nel sistema
- **Clienti**: Lista aggiornata automaticamente dai clienti nel sistema  
- **Tipi Servizio**: transfer, hourly, airport, event, tour
- **Tipi Veicolo**: Classe E, Classe S, Classe V, Sprinter, Ducato
- **Stato Pagamento**: paid, pending, failed, cancelled

### ⚡ Ordinamento Cronologico

Le prenotazioni sono automaticamente ordinate per:
1. **Data servizio** (crescente)
2. **Ora servizio** (crescente)

Questo permette di vedere le prenotazioni in ordine temporale di esecuzione.

### 💾 Sistema di Salvataggio

- **Rilevamento Automatico**: Il sistema rileva automaticamente le modifiche
- **Indicatore Visivo**: Badge giallo mostra modifiche non salvate  
- **Salvataggio Batch**: Tutte le modifiche vengono salvate insieme
- **Feedback**: Toast notifications per confermare salvataggio o errori

## Utilizzo

### Modifica Rapida
1. Clicca su una cella per attivarla
2. Inizia a digitare per modificare il valore
3. Premi Enter o cambia cella per confermare
4. Clicca "Salva Modifiche" quando hai finito

### Assegnazione Driver/Clienti
1. Clicca sulla cella "Driver Assegnato" o "Customer Assegnato"
2. Seleziona dal dropdown
3. Il sistema farà automaticamente il mapping con l'ID corretto

### Gestione Importi
- Gli importi sono mostrati in euro (€)
- Il sistema converte automaticamente in centesimi per il database
- Usa formato decimale (es: 150.50)

## Caratteristiche Tecniche

- **SSR Safe**: Caricamento dinamico per evitare problemi server-side
- **Performance**: Lazy loading e ottimizzazioni per grandi dataset
- **Responsive**: Scroll orizzontale per schermi piccoli
- **Column Freezing**: Prime 5 colonne fissate per migliore UX
- **Validation**: Controlli sui tipi di dato (numerico, date, email)

## Compatibilità

- ✅ Chrome/Edge (raccomandato)
- ✅ Firefox  
- ✅ Safari
- ⚠️ Mobile (limitato - meglio su desktop)

## Limitazioni

- Non supporta aggiunta/rimozione righe dalla tabella
- Alcune funzionalità avanzate di Excel non sono disponibili
- Richiede JavaScript abilitato
- Performance può degradare con >1000 prenotazioni

## Trouble Shooting

### La tabella non carica
- Verifica che JavaScript sia abilitato
- Controlla la console per errori di rete
- Ricarica la pagina

### Modifiche non salvate
- Assicurati che tutti i campi obbligatori siano compilati
- Verifica la connessione di rete
- Controlla i toast di errore per dettagli

### Dropdown vuoti
- Verifica che ci siano driver/clienti nel sistema
- Controlla le API `/api/admin/drivers` e `/api/admin/customers`

## Supporto

Per problemi o feature requests, contatta il team di sviluppo.