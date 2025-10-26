-- Add water_taxi column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS water_taxi boolean NULL DEFAULT false;

-- Add comment to the column
COMMENT ON COLUMN public.bookings.water_taxi IS 'Water taxi service for Venice locations (excluding airport/station)';

-- Create index for water_taxi if needed for filtering
CREATE INDEX IF NOT EXISTS idx_bookings_water_taxi ON public.bookings USING btree (water_taxi) TABLESPACE pg_default;

