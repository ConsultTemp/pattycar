-- Migration Script: Add Spreadsheet Fields to Bookings Table
-- Execute this script in your Supabase SQL editor or database console

-- Add new fields to bookings table for spreadsheet functionality
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS committente TEXT,
ADD COLUMN IF NOT EXISTS passenger_details TEXT,
ADD COLUMN IF NOT EXISTS vehicle_details TEXT,
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS driver_billing DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS driver_commission DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS direct_collection DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS license_plate VARCHAR(20);

-- Add comments to describe the new fields
COMMENT ON COLUMN public.bookings.committente IS 'Person who took the booking (manual entry)';
COMMENT ON COLUMN public.bookings.passenger_details IS 'Details about passengers (manual text)';
COMMENT ON COLUMN public.bookings.vehicle_details IS 'Vehicle details (manual text)';
COMMENT ON COLUMN public.bookings.net_amount IS 'Net amount before VAT (typically 90% of total)';
COMMENT ON COLUMN public.bookings.vat_amount IS 'VAT amount (typically 10% of total)';
COMMENT ON COLUMN public.bookings.driver_billing IS 'Driver billing amount for external drivers';
COMMENT ON COLUMN public.bookings.driver_commission IS 'Driver commission amount';
COMMENT ON COLUMN public.bookings.direct_collection IS 'Direct collection amount';
COMMENT ON COLUMN public.bookings.payment_method IS 'Payment method (cash, credit card, etc.)';
COMMENT ON COLUMN public.bookings.license_plate IS 'Vehicle license plate';

-- Verify the new columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN (
  'committente', 'passenger_details', 'vehicle_details', 
  'net_amount', 'vat_amount', 'driver_billing', 
  'driver_commission', 'direct_collection', 'payment_method', 'license_plate'
)
ORDER BY column_name;