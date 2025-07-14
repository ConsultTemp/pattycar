# Admin System Setup Guide

This document explains how to set up the admin system with Supabase authentication and booking management.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Application Configuration
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## Database Schema

Create the following table in your Supabase database:

### Bookings Table

```sql
-- Create the bookings table
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_prefix TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  passengers INTEGER NOT NULL,
  departure_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  luggage INTEGER NOT NULL,
  flight_number TEXT,
  billing_info TEXT,
  notes TEXT,
  meet_greet BOOLEAN DEFAULT FALSE,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  payment_intent_id TEXT,
  payment_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  stripe_session_id TEXT
);

-- Create indexes for performance
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);
CREATE INDEX idx_bookings_email ON bookings(email);
CREATE INDEX idx_bookings_stripe_session_id ON bookings(stripe_session_id);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access (you'll need to adjust this based on your auth setup)
CREATE POLICY "Admin users can view all bookings" ON bookings
  FOR ALL USING (auth.role() = 'authenticated');
```

## Admin User Setup

Since there's no registration system, you need to manually create admin users in Supabase:

1. Go to your Supabase dashboard
2. Navigate to Authentication > Users
3. Click "Add user"
4. Enter the admin email and password
5. The user will be able to log in at `/admin`

## Stripe Webhook Setup

1. Go to your Stripe dashboard
2. Navigate to Developers > Webhooks
3. Click "Add endpoint"
4. Set the endpoint URL to: `https://your-domain.com/api/stripe-webhook`
5. Select the following events to listen for:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
6. Copy the webhook secret and add it to your environment variables

## Features

### Admin Login (`/admin`)
- Secure login with Supabase authentication
- No registration form (admins must be manually created)
- Redirects to dashboard after successful login

### Admin Dashboard (`/admin/dashboard`)
- View all bookings with payment status
- Filter and search functionality
- Statistics overview (total, paid, pending bookings)
- Responsive design for desktop and mobile

### Booking Flow
1. User fills out booking form
2. Form creates a booking record in Supabase with 'pending' status
3. User is redirected to Stripe checkout
4. After successful payment, webhook updates booking status to 'completed'
5. User sees success/failure page

### Payment Pages
- **Success Page**: `/[lang]/payment-success` - Shows after successful payment
- **Cancelled Page**: `/[lang]/payment-cancelled` - Shows if payment is cancelled

## Security Considerations

1. **Row Level Security**: Enabled on the bookings table
2. **Environment Variables**: Keep all secrets in `.env.local`
3. **Webhook Security**: Stripe webhook signatures are verified
4. **Authentication**: Admin routes are protected with session checks

## File Structure

```
app/
├── admin/
│   ├── page.tsx                 # Admin login page
│   └── dashboard/
│       └── page.tsx             # Admin dashboard
├── api/
│   ├── create-checkout-session/
│   │   └── route.ts            # Creates Stripe checkout session
│   └── stripe-webhook/
│       └── route.ts            # Handles Stripe webhook events
└── [lang]/
    ├── payment-success/
    │   └── page.tsx            # Payment success page
    └── payment-cancelled/
        └── page.tsx            # Payment cancelled page

components/
├── admin-header.tsx            # Admin dashboard header
├── admin-login-form.tsx        # Admin login form
├── admin-logout.tsx            # Admin logout button
└── booking-form.tsx            # Updated booking form with Stripe

lib/
└── supabase.ts                 # Supabase client configuration
```

## Testing

1. **Admin Login**: Test with a manually created admin user
2. **Booking Flow**: Complete a test booking with Stripe test cards
3. **Webhook**: Use Stripe CLI to test webhook events locally
4. **Dashboard**: Verify bookings appear in the admin dashboard

## Troubleshooting

### Common Issues

1. **Supabase Connection**: Verify all environment variables are set correctly
2. **Stripe Webhook**: Ensure webhook secret matches and endpoint is accessible
3. **Admin Login**: Check that user exists in Supabase auth table
4. **Payment Flow**: Verify Stripe keys are for the correct environment (test/live)

### Logs

- Check browser console for client-side errors
- Check Vercel/hosting logs for server-side errors
- Check Stripe dashboard for webhook delivery status
- Check Supabase logs for database query issues