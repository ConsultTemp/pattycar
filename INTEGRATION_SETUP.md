# Guida alla Configurazione delle Integrazioni

Questa guida spiega come configurare le integrazioni con Google Sheets e Twilio per il sistema di prenotazioni Patty Car.

## 1. Configurazione Google Sheets

### Prerequisiti
1. Account Google con accesso a Google Sheets
2. Google Cloud Platform project con Google Sheets API abilitata

### Passaggi di configurazione

#### 1.1 Creare un Service Account
1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Seleziona il tuo progetto o creane uno nuovo
3. Vai su "IAM & Admin" > "Service Accounts"
4. Clicca "Create Service Account"
5. Inserisci un nome (es. "pattycar-sheets")
6. Assegna il ruolo "Editor"
7. Clicca "Create Key" e scarica il file JSON

#### 1.2 Abilitare Google Sheets API
1. Vai su "APIs & Services" > "Library"
2. Cerca "Google Sheets API"
3. Clicca "Enable"

#### 1.3 Creare il foglio Google
1. Crea un nuovo Google Sheet
2. Copia l'ID del foglio dall'URL (la parte tra `/d/` e `/edit`)
3. Condividi il foglio con l'email del service account (con permessi di editor)

#### 1.4 Configurare le variabili d'ambiente
Aggiungi al file `.env.local`:

```env
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL="pattycar-sheets@your-project.iam.gserviceaccount.com"
GOOGLE_SHEETS_SPREADSHEET_ID="your-spreadsheet-id"
```

#### 1.5 Configurare gli header del foglio
Dopo il deployment, chiama l'endpoint:
```bash
POST /api/admin/setup-google-sheets
```

## 2. Configurazione Twilio

### Prerequisiti
1. Account Twilio
2. Numero di telefono Twilio per l'invio SMS

### Passaggi di configurazione

#### 2.1 Ottenere le credenziali Twilio
1. Vai su [Twilio Console](https://console.twilio.com/)
2. Copia Account SID e Auth Token dal Dashboard
3. Vai su "Phone Numbers" > "Manage" > "Active numbers"
4. Copia il tuo numero Twilio

#### 2.2 Configurare le variabili d'ambiente
Aggiungi al file `.env.local`:

```env
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

## 3. Configurazione Database

### Aggiungere campi telefono alle tabelle

Esegui queste query SQL nel tuo database Supabase:

```sql
-- Aggiungere campo phone alla tabella drivers
ALTER TABLE drivers ADD COLUMN phone TEXT;

-- Aggiungere campo phone alla tabella customers
ALTER TABLE customers ADD COLUMN phone TEXT;
```

## 4. Configurazione Cron Job (Vercel)

### 4.1 Configurare il secret del cron (opzionale)
Aggiungi al file `.env.local`:

```env
CRON_SECRET="your-secret-key-for-cron-security"
```

### 4.2 Il file vercel.json è già configurato
Il cron job è impostato per eseguire ogni giorno alle 17:00:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-reminders",
      "schedule": "0 17 * * *"
    }
  ]
}
```

## 5. Test delle Funzionalità

### 5.1 Test Google Sheets
1. Completa una prenotazione sul sito
2. Verifica che appaia nel Google Sheet

### 5.2 Test SMS
1. Vai nel gestionale admin
2. Seleziona alcune prenotazioni
3. Clicca "Contatta Driver" o "Contatta Cliente"
4. Verifica che gli SMS vengano inviati

### 5.3 Test Reminder automatici
1. Nel gestionale admin, clicca "Test Reminder"
2. Verifica che vengano inviati i reminder per le prenotazioni di domani e tra 7 giorni

## 6. Popolamento Dati Driver e Clienti

### 6.1 Aggiungere Driver con numeri di telefono
Nel gestionale admin, sezione "Gestione Driver":
1. Aggiungi i tuoi driver
2. Includi i numeri di telefono

### 6.2 Aggiungere Clienti con numeri di telefono
Nel gestionale admin, sezione "Gestione Clienti":
1. Aggiungi i tuoi clienti aziendali
2. Includi i numeri di telefono

### 6.3 Configurare dropdown in Google Sheets
1. Seleziona la colonna "Driver" nel foglio
2. Vai su Data > Data validation
3. Scegli "List of items" e inserisci i nomi dei driver
4. Ripeti per la colonna "Cliente"

## 7. Funzionalità Implementate

### ✅ Integrazione Google Sheets
- Le prenotazioni pagate vengono automaticamente inviate al foglio Google
- Colonne Driver e Cliente configurabili come dropdown

### ✅ Sistema SMS con Twilio
- Invio SMS ai driver per notifiche prenotazioni
- Invio SMS ai clienti per aggiornamenti
- Selezione multipla nel gestionale admin
- Pulsanti "Contatta Driver", "Contatta Cliente", "Contatta Tutti"

### ✅ Reminder Automatici
- Cron job giornaliero alle 17:00
- Reminder ai clienti per prenotazioni del giorno successivo
- Reminder ai clienti per prenotazioni a 7 giorni di distanza
- Endpoint di test per verificare il funzionamento

### ✅ Gestionale Admin Migliorato
- Checkbox per selezione multipla prenotazioni
- Pulsante "Seleziona tutti"
- Interfaccia per invio SMS di massa
- Test dei reminder automatici

## 8. Sicurezza

- Tutti gli endpoint admin richiedono autenticazione
- Le credenziali sono gestite tramite variabili d'ambiente
- Il cron job può essere protetto con un secret opzionale

## 9. Troubleshooting

### Errori comuni Google Sheets
- Verificare che il service account abbia accesso al foglio
- Controllare che l'ID del foglio sia corretto
- Verificare che la Google Sheets API sia abilitata

### Errori comuni Twilio
- Verificare che le credenziali siano corrette
- Controllare che il numero Twilio sia attivo
- Verificare il formato dei numeri di telefono (devono includere il prefisso internazionale)

### Errori comuni Cron Job
- Su Vercel, i cron job sono disponibili solo sui piani Pro
- Verificare che il file vercel.json sia nella root del progetto
- Controllare i log di Vercel per eventuali errori








