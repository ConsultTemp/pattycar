-- Add departure time fields to bookings table
-- These fields store flight/train departure time when destination is airport/station

ALTER TABLE bookings 
ADD COLUMN departure_time TEXT NULL,
ADD COLUMN departure_minutes TEXT NULL,
ADD COLUMN departure_time_ampm TEXT NULL;

-- Add comments to explain the fields
COMMENT ON COLUMN bookings.departure_time IS 'Flight/train departure hour when destination is airport/station';
COMMENT ON COLUMN bookings.departure_minutes IS 'Flight/train departure minutes when destination is airport/station';
COMMENT ON COLUMN bookings.departure_time_ampm IS 'Flight/train departure AM/PM when destination is airport/station';
