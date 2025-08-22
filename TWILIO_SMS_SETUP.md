# Twilio SMS Notifications Setup

Questa guida spiega come configurare il sistema completo di notifiche SMS con Twilio per PatyCar.

## 1. Configurazione Account Twilio

### Creare Account Twilio
1. Vai su [https://www.twilio.com](https://www.twilio.com)
2. Crea un account o accedi se già esistente
3. Vai alla Console di Twilio
4. Ottieni le credenziali dalla sezione "Account Info":
   - **Account SID**
   - **Auth Token**

### Acquistare Numero Twilio
1. Nella console Twilio, vai su **Phone Numbers** > **Buy a number**
2. Seleziona un numero italiano (+39) per l'invio SMS
3. Assicurati che il numero supporti SMS
4. Acquista e configura il numero

## 2. Variabili di Ambiente

Aggiungi queste variabili al tuo file `.env.local`:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+39xxxxxxxxxx

# Optional: Per sicurezza cron job (consigliato in produzione)
CRON_SECRET=your_random_secret_string_here
```

### Variabili di Produzione (Vercel)
Nel dashboard Vercel, vai su **Settings** > **Environment Variables** e aggiungi:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN` 
- `TWILIO_PHONE_NUMBER`
- `CRON_SECRET` (opzionale)

## 3. Migrazione Database

### Aggiungere Campo Telefono ai Driver
Esegui questa migrazione SQL nel tuo database Supabase:

```sql
-- Add phone field to drivers table for SMS notifications
ALTER TABLE drivers ADD COLUMN phone VARCHAR(20);

-- Add index for better performance when querying by phone
CREATE INDEX IF NOT EXISTS idx_drivers_phone ON drivers(phone);

-- Update drivers table comment
COMMENT ON COLUMN drivers.phone IS 'Phone number for SMS notifications';
```

### Aggiornare Tipi TypeScript
Il file `types/database.types.ts` è già stato aggiornato per includere il campo `phone` nei driver.

## 4. Funzionalità Implementate

### 🤖 Notifiche Clienti Automatiche (Cron Job)

**Endpoint:** `/api/cron/notify-customers`
**Schedule:** Ogni giorno alle 18:00 (definito in `vercel.json`)

**Comportamento:**
- Invia SMS ai clienti **7 giorni prima** del servizio alle 18:00
- Invia SMS ai clienti **1 giorno prima** del servizio alle 18:00
- Utilizza i numeri di telefono già presenti nei dati delle prenotazioni (`customer_phone` + `customer_phone_prefix`)
- Funziona solo per prenotazioni pagate (`payment_status = 'paid'`)

**Messaggio 7 giorni prima:**
```
🚗 PatyCar: Gentile [Nome], le ricordiamo il suo servizio del [Data] alle [Ora].
Da: [Indirizzo partenza]
A: [Indirizzo arrivo]
Autista: [Nome autista]
Per modifiche: +39 123 456 789
```

**Messaggio 1 giorno prima:**
```
🚗 PatyCar: Gentile [Nome], le ricordiamo che domani ([Data]) alle [Ora] è previsto il suo servizio.
Da: [Indirizzo partenza]
A: [Indirizzo arrivo]
Autista: [Nome autista] / Autista da confermare
Per emergenze: +39 123 456 789
```

### 📱 Notifiche Driver da Interfaccia Admin

**Posizione:** Componente `admin-bookings-spreadsheet.tsx`
**Funzionalità:**

1. **Selezione per Date:**
   - Bottone "Notifica Drivers" nell'header del spreadsheet
   - Dialog con lista delle date disponibili
   - Mostra numero di servizi per ogni data
   - Notifica tutti i driver assegnati ai servizi nelle date selezionate

2. **Selezione per Righe:**
   - Seleziona righe specifiche trascinando sulla tabella spreadsheet
   - Notifica solo i driver delle righe selezionate
   - Visualizzazione del numero di righe selezionate

**Messaggio Driver:**
```
🚗 PatyCar: Nuovo servizio assegnato!
📅 Data: [Data] alle [Ora]
👤 Cliente: [Nome cliente]
📍 Da: [Indirizzo partenza]
📍 A: [Indirizzo arrivo]
👥 Passeggeri: [Numero]
🚗 Veicolo: [Tipo veicolo]
📝 Note: [Note aggiuntive]

Per conferma/info: +39 123 456 789
```

## 5. API Endpoints

### `/api/cron/notify-customers` (GET/POST)
- **Scopo:** Cron job automatico per notifiche clienti
- **Autenticazione:** Bearer token opzionale (`CRON_SECRET`)
- **Parametri:** Nessuno (usa data corrente)
- **Response:** Statistiche invii (successi/errori)

### `/api/admin/notify-drivers` (POST)
- **Scopo:** Notifiche driver manuali dall'admin
- **Autenticazione:** Admin auth required
- **Parametri:**
  ```json
  {
    "dates": ["2024-01-15", "2024-01-16"], // Opzionale
    "bookingIds": ["uuid1", "uuid2"]        // Opzionale
  }
  ```
- **Response:** Risultati invii batch

## 6. Gestione Driver

### Aggiungere Numero Telefono ai Driver
1. Vai alla sezione **Drivers Management** nell'admin dashboard
2. Quando crei/modifichi un driver, inserisci il numero di telefono
3. Il campo telefono è opzionale ma necessario per ricevere notifiche SMS

### Formato Numero Telefono
- **Formato:** Solo cifre, es. `3331234567`
- **Prefisso:** Automaticamente aggiunto (+39 per Italia)
- **Validazione:** 6-15 cifre, solo numeri

## 7. Rate Limiting e Sicurezza

### Rate Limiting Twilio
- Le notifiche batch sono inviate 5 alla volta con delay di 1 secondo
- Previene il superamento dei limiti di Twilio
- Gestione errori per ogni singolo SMS

### Sicurezza
- Tutte le API richiedono autenticazione admin
- Cron job può usare `CRON_SECRET` per autenticazione Bearer
- Log dettagliati per debugging
- Validazione numeri di telefono

## 8. Testing

### Test Manuale Cron Job
```bash
# Test locale (se CRON_SECRET configurato)
curl -X POST http://localhost:3000/api/cron/notify-customers \
  -H "Authorization: Bearer your_cron_secret"

# Test senza autenticazione
curl -X POST http://localhost:3000/api/cron/notify-customers
```

### Test Notifiche Driver
1. Accedi all'admin dashboard
2. Vai al spreadsheet prenotazioni
3. Clicca "Notifica Drivers"
4. Seleziona date o righe specifiche
5. Clicca "Invia Notifiche"

### Test da Script
```bash
# Test con script automatico
./scripts/setup-twilio.sh

# Test singolo SMS cliente
pnpm test:sms customer +393331234567 "Mario Rossi"

# Test singolo SMS driver
pnpm test:sms driver +393331234567 "Giuseppe Verdi"

# Test TypeScript (più dettagliato)
pnpm test:sms:ts customer +393331234567 "Mario Rossi"
```

## 9. Monitoring e Debug

### Log Console
- Tutti gli invii SMS sono loggati in console
- Include Twilio message SID per tracciamento
- Errori dettagliati per debugging

### Vercel Functions Log
- Le funzioni cron sono visibili nei log Vercel
- Timeout configurato a 300 secondi per batch grandi
- Metriche di successo/errore disponibili

## 10. Troubleshooting

### Errori Comuni

**"Missing TWILIO_ACCOUNT_SID"**
- Verifica che le variabili d'ambiente siano configurate
- Riavvia il server dopo aver aggiunto le variabili

**"No drivers have phone numbers"**
- Aggiungi numeri di telefono ai driver nell'interfaccia admin
- Verifica che i numeri siano nel formato corretto

**"Rate limit exceeded"**
- Il sistema già gestisce il rate limiting automaticamente
- In caso di grandi volumi, considera di aumentare i delay

**"Invalid phone number"**
- Verifica il formato del numero (solo cifre)
- Controlla che prefisso + numero siano validi

### Supporto
Per problemi con Twilio:
1. Controlla i log della console Twilio
2. Verifica il credito account Twilio
3. Assicurati che il numero mittente sia verificato

## 11. Costi

### Twilio SMS Pricing (2024)
- **SMS Italia:** ~€0.075 per SMS
- **Numero telefono:** ~€1/mese
- **Costi aggiuntivi:** Verifiche numero, supporto

### Stima Costi Mensili
- 100 prenotazioni/mese × 2 SMS clienti = 200 SMS × €0.075 = €15
- 50 notifiche driver/mese × €0.075 = €3.75
- Numero telefono = €1
- **Totale stimato:** ~€20/mese per 100 prenotazioni

## 12. Personalizzazione

### Messaggi SMS
Modifica i template in `/lib/twilio-service.ts`:
- `notifyCustomer()` per messaggi clienti
- `notifyDriver()` per messaggi driver

### Orari Notifiche
Modifica il cron schedule in `vercel.json`:
- Attuale: `"0 18 * * *"` (18:00 ogni giorno)
- Esempio 9:00: `"0 9 * * *"`
- Esempio due volte al giorno: `["0 9 * * *", "0 18 * * *"]`

### Timing Notifiche Clienti
Modifica in `/app/api/cron/notify-customers/route.ts`:
- Attuale: 7 giorni e 1 giorno prima
- Personalizza le date nel calcolo delle notifiche