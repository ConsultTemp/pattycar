# Database Schema Update - Spreadsheet Fields

## Nuovo Campi Aggiunti

Per supportare le funzionalità del foglio di calcolo amministrativo, sono stati aggiunti i seguenti campi alla tabella `bookings`:

### Campi Aggiunti:

1. **committente** (TEXT) - Chi ha preso la prenotazione
2. **passenger_details** (TEXT) - Dettagli sui passeggeri 
3. **vehicle_details** (TEXT) - Dettagli del veicolo
4. **net_amount** (DECIMAL(10,2)) - Importo netto (senza IVA)
5. **vat_amount** (DECIMAL(10,2)) - Importo IVA
6. **driver_billing** (DECIMAL(10,2)) - Fatturazione autista esterno
7. **driver_commission** (DECIMAL(10,2)) - Commissioni autista
8. **direct_collection** (DECIMAL(10,2)) - Incasso diretto
9. **payment_method** (TEXT) - Metodo di pagamento (Cash/KK)
10. **license_plate** (VARCHAR(20)) - Targa del veicolo

## Istruzioni per l'Aggiornamento

### 1. Eseguire la Migrazione Database

Esegui il file `database-migration-spreadsheet-fields.sql` nel tuo editor SQL Supabase:

```bash
# Nel dashboard Supabase, vai su SQL Editor e esegui il contenuto del file:
# database-migration-spreadsheet-fields.sql
```

### 2. Rigenerare i Tipi TypeScript

Dopo aver eseguito la migrazione, rigenera i tipi TypeScript:

```bash
# Se usi Supabase CLI
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts

# Oppure manualmente aggiorna il file types/database.types.ts
```

### 3. Verifica

Dopo l'aggiornamento, verifica che:
- [ ] I nuovi campi esistano nella tabella bookings
- [ ] Il componente admin-bookings-spreadsheet.tsx funzioni correttamente
- [ ] Non ci siano errori TypeScript

## Mappatura Campi Spreadsheet → Database

| Colonna Spreadsheet | Campo Database | Tipo | Descrizione |
|-------------------|----------------|------|-------------|
| Committente | committente | TEXT | Chi ha preso la prenotazione |
| Passeggero/i | passenger_details | TEXT | Dettagli passeggeri |
| Mezzo | vehicle_details | TEXT | Dettagli veicolo |
| Imponibile | net_amount | DECIMAL | Importo netto |
| IVA | vat_amount | DECIMAL | Importo IVA |
| Fatt. Autista | driver_billing | DECIMAL | Fatturazione autista |
| Comm. Autista | driver_commission | DECIMAL | Commissioni autista |
| Incasso Diretto | direct_collection | DECIMAL | Incasso diretto |
| Cash/KK | payment_method | TEXT | Metodo pagamento |
| Targa | license_plate | VARCHAR | Targa veicolo |

## Backup

Prima di eseguire la migrazione, assicurati di avere un backup della tabella bookings:

```sql
-- Crea una copia di backup
CREATE TABLE bookings_backup AS SELECT * FROM public.bookings;
```