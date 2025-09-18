# Integrazione Google Sheets SMS

Questa documentazione spiega come funziona l'integrazione tra Google Apps Script e l'endpoint SMS per l'invio automatico di messaggi a driver e clienti.

## 🔧 Architettura

```
Google Sheets (con Apps Script) → API Endpoint (/api/send-sms) → Twilio → SMS
```

## 📋 Configurazione Google Apps Script

Il codice Google Apps Script fornito crea un menu personalizzato nel foglio Google con tre opzioni:

- **Contatta driver**: Invia SMS solo ai driver delle righe selezionate
- **Contatta cliente**: Invia SMS solo ai clienti delle righe selezionate  
- **Contatta entrambi**: Invia SMS sia ai driver che ai clienti

### Struttura dati richiesta

Il foglio Google deve avere questa struttura:
- **Sheet1**: Dati delle prenotazioni
  - Colonna A: Data
  - Colonna B: Ora
  - Colonna E: Nome Driver
  - Colonna X (24): Telefono Cliente
- **Sheet2**: Dati dei driver
  - Colonna A: Nome Driver
  - Colonna B: Telefono Driver

## 🚀 Endpoint API

### URL
```
POST https://tuosito.com/api/send-sms
```

### Payload
```json
{
  "data": "2024-01-15",           // Data del servizio
  "ora": "14:30",                 // Ora del servizio
  "clientePhone": "+393331234567", // Telefono cliente
  "driverPhone": "+393339876543",  // Telefono driver
  "target": "driver|cliente|entrambi", // Chi contattare
  "customerName": "Mario Rossi",   // Nome cliente (opzionale)
  "pickup": "Via Roma 123",       // Indirizzo ritiro (opzionale)
  "destination": "Aeroporto"      // Destinazione (opzionale)
}
```

### Response
```json
{
  "success": true,
  "message": "SMS sent: 2 successful, 0 failed",
  "results": [
    {
      "target": "driver",
      "phone": "+393339876543",
      "success": true,
      "messageId": "SM1234567890"
    },
    {
      "target": "cliente", 
      "phone": "+393331234567",
      "success": true,
      "messageId": "SM0987654321"
    }
  ],
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0
  }
}
```

## 📱 Template Messaggi

### Messaggio per Driver
```
🚗 Nuova prenotazione!

Cliente: Mario Rossi
Data: 15/01/2024 alle 14:30
Da: Via Roma 123, Milano
A: Aeroporto Malpensa

Patty Car
```

### Messaggio per Cliente
```
🚗 Promemoria Patty Car

Ciao Mario, il tuo servizio è programmato per 15/01/2024 alle 14:30.

Ritiro: Via Roma 123, Milano

Grazie per averci scelto!
```

## 🧪 Testing

### 1. Test con Node.js
```bash
node test-sms-endpoint.js
```

### 2. Test manuale con curl
```bash
curl -X POST https://tuosito.com/api/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "data": "2024-01-15",
    "ora": "14:30", 
    "clientePhone": "+393331234567",
    "driverPhone": "+393339876543",
    "target": "entrambi",
    "customerName": "Test User",
    "pickup": "Test Address"
  }'
```

### 3. Health Check
```bash
curl https://tuosito.com/api/send-sms
```

## ⚠️ Gestione Errori

L'endpoint gestisce diversi tipi di errore:

### 400 - Bad Request
- Campi obbligatori mancanti (`data`, `ora`, `target`)
- Target non valido (deve essere `driver`, `cliente`, o `entrambi`)
- Numero di telefono mancante per il target richiesto

### 500 - Internal Server Error  
- Errori di configurazione Twilio
- Errori di rete o API Twilio
- Errori interni del server

## 🔧 Configurazione Variabili d'Ambiente

Assicurati che queste variabili siano configurate:

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token  
TWILIO_PHONE_NUMBER=+1234567890
```

## 📞 Formato Numeri di Telefono

L'endpoint accetta numeri in diversi formati e li normalizza automaticamente:
- `3331234567` → `+393331234567`
- `+393331234567` → `+393331234567` (già formattato)
- `393331234567` → `+393331234567`

Il prefisso predefinito è `+39` (Italia) se non specificato.

## 🔄 Flusso di Utilizzo

1. L'utente seleziona una o più righe nel foglio Google
2. Sceglie l'azione dal menu "Azioni SMS"
3. Google Apps Script legge i dati delle righe selezionate
4. Per ogni riga, fa una chiamata POST all'endpoint
5. L'endpoint formatta i numeri e crea i messaggi
6. Invia gli SMS tramite Twilio
7. Restituisce i risultati a Google Apps Script
8. Google Apps Script logga i risultati

## 🐛 Debug

Per debuggare problemi:

1. **Google Apps Script**: Controlla i log in `Extensions > Apps Script > Execution transcript`
2. **Endpoint**: Controlla i log del server per errori Twilio
3. **Twilio**: Controlla la console Twilio per lo stato dei messaggi

## 🔐 Sicurezza

- L'endpoint non richiede autenticazione (considera di aggiungere un token se necessario)
- I numeri di telefono vengono validati e formattati
- Gli errori non espongono informazioni sensibili
