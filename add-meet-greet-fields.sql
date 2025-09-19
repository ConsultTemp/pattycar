-- Query SQL per aggiungere campi Meet & Greet alla tabella bookings
-- Esegui queste query in Supabase SQL Editor

-- VERSIONE SICURA: Tutti i campi hanno valori di default appropriati
ALTER TABLE bookings ADD COLUMN meet_greet_service_id TEXT DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN meet_greet_selected_service TEXT DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN meet_greet_passengers INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN meet_greet_children INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN meet_greet_infants INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN meet_greet_extra_luggage INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN meet_greet_extra_hours INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN meet_greet_special_services JSONB DEFAULT NULL;

-- Dopo aver eseguito queste query, dovrai rigenerare i tipi TypeScript
-- da Supabase Dashboard -> Settings -> API -> Generate Types
