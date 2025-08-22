-- Add phone field to drivers table for SMS notifications
ALTER TABLE drivers ADD COLUMN phone VARCHAR(20);

-- Add index for better performance when querying by phone
CREATE INDEX IF NOT EXISTS idx_drivers_phone ON drivers(phone);

-- Update drivers table comment
COMMENT ON COLUMN drivers.phone IS 'Phone number for SMS notifications';