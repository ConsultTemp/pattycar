# PatyCar - Sistema di Prenotazioni e Trasporti

Sistema completo di prenotazioni online per servizi di trasporto privato con dashboard amministrativo e notifiche SMS automatiche.

## 🚀 Funzionalità Principali

- **Prenotazioni Online**: Sistema di booking multilingue (IT, EN, AR)
- **Dashboard Admin**: Gestione completa prenotazioni, clienti e autisti
- **Spreadsheet Admin**: Tabella Excel-like per editing rapido prenotazioni
- **Pagamenti Stripe**: Integrazione completa con checkout sicuro
- **Notifiche SMS**: Sistema automatico via Twilio per clienti e autisti
- **Sistema Multilingue**: Supporto completo per più lingue
- **Responsive Design**: Ottimizzato per desktop e mobile

## 📱 Sistema Notifiche SMS

### Notifiche Clienti Automatiche
- **7 giorni prima** del servizio alle 18:00
- **1 giorno prima** del servizio alle 18:00
- Cron job automatico su Vercel
- Include dettagli servizio e contatti

### Notifiche Driver dall'Admin
- Selezione per **date specifiche**
- Selezione **righe singole** nel spreadsheet
- Invio batch con rate limiting
- Dettagli completi del servizio

## 🛠️ Setup e Installazione

### 1. Clona e Installa Dipendenze
```bash
git clone <repository>
cd pattycar
pnpm install
```

### 2. Configurazione Environment
Copia `.env.example` in `.env.local` e configura:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key

# Twilio SMS
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+39xxxxxxxxxx

# Altri servizi...
```

### 3. Setup Database
Segui la guida in `SUPABASE_SETUP.md` per:
- Configurare Supabase
- Eseguire migrazioni
- Configurare autenticazione admin

### 4. Setup Twilio SMS
Segui la guida completa in `TWILIO_SMS_SETUP.md` per:
- Configurare account Twilio
- Acquistare numero SMS
- Configurare cron job Vercel
- Testare le notifiche

### 5. Avvia il Progetto
```bash
pnpm dev
```

## 📋 Struttura del Progetto

```
/app
  /[lang]           # Route multilingue
    /admin          # Dashboard amministrativo
    /booking        # Sistema prenotazioni
  /api              # API Routes
    /admin          # API amministrative
    /cron           # Cron job (notifiche SMS)
    
/components         # Componenti React
  /ui              # Componenti UI base
  /booking         # Componenti prenotazioni
  
/lib               # Utilities e servizi
  - twilio-service.ts  # Servizio SMS centralizzato
  - database.ts        # Helper database
  - pricing-config.ts  # Configurazione prezzi
  
/dictionaries      # File traduzioni
/types             # Tipi TypeScript
```

## 🔧 Tecnologie Utilizzate

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: Supabase (PostgreSQL)
- **Pagamenti**: Stripe
- **Email**: Resend
- **SMS**: Twilio
- **Hosting**: Vercel

## 🚨 Componenti Principali

### Admin Dashboard
- **Location**: `/app/[lang]/admin/dashboard/page.tsx`
- **Features**: Visualizzazione prenotazioni, statistiche, filtri

### Spreadsheet Prenotazioni  
- **Location**: `/components/admin-bookings-spreadsheet.tsx`
- **Features**: Editing Excel-like, notifiche SMS, 18 campi

### Sistema Prenotazioni
- **Location**: `/app/[lang]/booking/page.tsx`
- **Features**: Form multipassaggio, calcolo prezzi, integrazione Stripe

### Servizio SMS
- **Location**: `/lib/twilio-service.ts`
- **Features**: Notifiche clienti/driver, batch processing, rate limiting

## 📱 Testing SMS

### Test Rapido
```bash
# Test notifica cliente
node scripts/test-sms.js customer +393331234567 "Mario Rossi"

# Test notifica driver  
node scripts/test-sms.js driver +393331234567 "Giuseppe Verdi"
```

### Test Cron Job
```bash
# Test manuale del cron job
curl -X POST http://localhost:3000/api/cron/notify-customers
```

## 🔐 Sicurezza

- **Admin Auth**: Autenticazione Supabase con session management
- **API Protection**: Tutte le API admin richiedono autenticazione
- **Cron Security**: Bearer token opzionale per cron job
- **Rate Limiting**: Gestione automatica per API SMS
- **Input Validation**: Validazione completa dati input

## 📚 Documentazione Aggiuntiva

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**: Setup database e autenticazione
- **[TWILIO_SMS_SETUP.md](./TWILIO_SMS_SETUP.md)**: Guida completa SMS Twilio
- **[ADMIN_BOOKINGS_SPREADSHEET.md](./ADMIN_BOOKINGS_SPREADSHEET.md)**: Uso spreadsheet admin

## 🚀 Deploy

### Vercel (Consigliato)
1. Connetti repository a Vercel
2. Configura environment variables
3. Deploy automatico con cron job inclusi

### Variabili di Produzione
Configura in Vercel Dashboard:
- Database (Supabase)
- Pagamenti (Stripe)  
- Email (Resend)
- SMS (Twilio)
- Autenticazione admin

## 📞 Supporto

Per problemi:
1. Controlla i log Vercel Functions
2. Verifica configurazione environment variables
3. Consulta la documentazione specifica per ogni servizio
4. Testa singolarmente ogni integrazione

---

**Versione**: 0.1.0  
**Ultimo aggiornamento**: Gennaio 2025
