#!/bin/bash

# Twilio Setup Validation Script
# This script helps validate your Twilio configuration

echo "🚗 PatyCar - Twilio SMS Setup Validation"
echo "========================================"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ File .env.local not found"
    echo "💡 Create .env.local from .env.example and configure your Twilio credentials"
    exit 1
fi

echo "✅ Found .env.local file"

# Load environment variables
export $(grep -v '^#' .env.local | xargs)

# Check required Twilio variables
required_vars=("TWILIO_ACCOUNT_SID" "TWILIO_AUTH_TOKEN" "TWILIO_PHONE_NUMBER")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '   - %s\n' "${missing_vars[@]}"
    echo ""
    echo "💡 Please add these variables to your .env.local file:"
    echo "   TWILIO_ACCOUNT_SID=your_account_sid"
    echo "   TWILIO_AUTH_TOKEN=your_auth_token"  
    echo "   TWILIO_PHONE_NUMBER=+39xxxxxxxxxx"
    exit 1
fi

echo "✅ All required Twilio variables found"
echo ""

# Validate phone number format
if [[ ! $TWILIO_PHONE_NUMBER =~ ^\+[1-9][0-9]{7,14}$ ]]; then
    echo "⚠️  Phone number format may be invalid: $TWILIO_PHONE_NUMBER"
    echo "💡 Expected format: +393331234567"
else
    echo "✅ Phone number format looks valid: $TWILIO_PHONE_NUMBER"
fi

# Check if dependencies are installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js"
    exit 1
fi

if [ ! -d "node_modules/twilio" ]; then
    echo "❌ Twilio package not installed"
    echo "💡 Run: pnpm install"
    exit 1
fi

echo "✅ Twilio package installed"
echo ""

# Display summary
echo "📋 Configuration Summary:"
echo "   Account SID: ${TWILIO_ACCOUNT_SID:0:8}..."
echo "   Auth Token: ${TWILIO_AUTH_TOKEN:0:8}..."
echo "   Phone Number: $TWILIO_PHONE_NUMBER"
echo ""

echo "🎉 Twilio configuration looks good!"
echo ""
echo "📱 Next steps:"
echo "   1. Test SMS: pnpm test:sms customer +393331234567 \"Mario Rossi\""
echo "   2. Test cron job: pnpm cron:notify"
echo "   3. Deploy to Vercel with environment variables"
echo ""
echo "📚 For detailed setup, see: TWILIO_SMS_SETUP.md"