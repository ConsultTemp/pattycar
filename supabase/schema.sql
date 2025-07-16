-- Create the bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Stripe/Payment info
    stripe_session_id VARCHAR(255) NOT NULL UNIQUE,
    payment_intent_id VARCHAR(255),
    amount_total INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'eur',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'paid',
    invoice_url TEXT,
    
    -- Customer info
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    customer_phone_prefix VARCHAR(10),
    
    -- Service info
    service_type VARCHAR(50) NOT NULL,
    service_label VARCHAR(100),
    service_icon VARCHAR(10),
    service_badge VARCHAR(50),
    
    -- Journey info
    pickup_address TEXT NOT NULL,
    pickup_location_id VARCHAR(100),
    pickup_is_custom BOOLEAN DEFAULT false,
    destination_address TEXT NOT NULL,
    destination_location_id VARCHAR(100),
    destination_is_custom BOOLEAN DEFAULT false,
    
    -- Date & Time
    service_date VARCHAR(50) NOT NULL,
    service_time VARCHAR(50) NOT NULL,
    service_end_time VARCHAR(50),
    service_duration VARCHAR(50),
    
    -- Vehicle configuration
    vehicle_type VARCHAR(100) NOT NULL,
    vehicle_count INTEGER NOT NULL DEFAULT 1,
    passengers INTEGER NOT NULL DEFAULT 1,
    luggage INTEGER NOT NULL DEFAULT 0,
    same_vehicle_type BOOLEAN DEFAULT true,
    individual_vehicles JSONB,
    
    -- Options
    meet_and_greet BOOLEAN DEFAULT false,
    meet_greet_config JSONB,
    flight_info VARCHAR(255),
    departure_city VARCHAR(255),
    notes TEXT,
    billing_info TEXT,
    
    -- Pricing
    distance VARCHAR(50),
    duration VARCHAR(50),
    transfer_cost VARCHAR(50),
    transfer_route VARCHAR(100),
    event_route VARCHAR(100),
    night_surcharge VARCHAR(50),
    vat_rate VARCHAR(10),
    price_breakdown TEXT,
    
    -- Olympic/Event pricing
    is_olympic_pricing BOOLEAN DEFAULT false,
    
    -- Metadata
    raw_metadata JSONB
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session_id ON public.bookings(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON public.bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_service_date ON public.bookings(service_date);
CREATE INDEX IF NOT EXISTS idx_bookings_service_type ON public.bookings(service_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER handle_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (admin only)
CREATE POLICY "Admin can view all bookings" ON public.bookings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can insert bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin can update bookings" ON public.bookings
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policy for service role (for webhook)
CREATE POLICY "Service role can manage bookings" ON public.bookings
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role; 