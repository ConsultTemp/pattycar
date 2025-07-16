# Supabase Setup Guide

This guide walks you through setting up Supabase for the admin dashboard and booking storage system.

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and keys from the API settings

## 2. Environment Variables

Add these variables to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 3. Database Setup

Run the SQL schema in your Supabase SQL editor (found in `supabase/schema.sql`):

```sql
-- This will create the bookings table with all necessary fields
-- Run the entire content of supabase/schema.sql
```

## 4. Authentication Setup

### Create Admin User

1. Go to Authentication > Users in your Supabase dashboard
2. Click "Add user"
3. Enter email and password for your admin user
4. Make sure to confirm the user

### Row Level Security (RLS)

The schema automatically sets up RLS policies that:
- Allow authenticated users (admins) to view all bookings
- Allow the service role (webhook) to insert new bookings
- Prevent anonymous access

## 5. Admin Dashboard Access

1. Navigate to `/[lang]/admin` (e.g., `/it/admin`)
2. Login with the admin credentials you created in Supabase
3. You'll be redirected to the dashboard at `/[lang]/admin/dashboard`

## 6. Webhook Integration

The Stripe webhook (`/api/stripe-webhook`) will now automatically:
- Save all booking data to Supabase when payments are completed
- Continue sending emails as before
- Handle database errors gracefully (emails still send if DB fails)

## 7. Features

### Admin Login
- Secure authentication with Supabase
- Session management with cookies
- Automatic redirect to dashboard when authenticated

### Admin Dashboard
- View all paid bookings in a table
- Filter by service type, date range, customer email
- Search functionality
- Sort by date/other fields
- Revenue statistics
- Direct links to Stripe invoices

### Database Storage
- All booking and payment data stored in Supabase
- Comprehensive schema covering all booking fields
- Automatic timestamps and UUID primary keys
- JSON storage for complex data (individual vehicles, meet & greet config)

## 8. Security Features

- Row Level Security enabled
- Service role access for webhook operations
- Authenticated user access for admin dashboard
- Secure cookie-based sessions
- No registration endpoint (admins created manually)

## 9. Testing

1. Make a test booking through your booking form
2. Complete payment via Stripe
3. Check Supabase dashboard to see the booking data
4. Login to admin dashboard to view the booking

## 10. Troubleshooting

### Common Issues:

1. **Admin can't login**: Check user is created and confirmed in Supabase Auth
2. **Bookings not saving**: Check service role key is correct and webhook is working
3. **Database connection errors**: Verify all environment variables are set
4. **RLS errors**: Ensure policies are created correctly from the schema

### Logs:

Check the webhook logs in your deployment platform for database insertion status. 