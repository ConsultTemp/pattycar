#!/bin/bash

# Test completo per Google Sheets Integration
# Questo script testa tutto il flusso: database + Google Sheets

echo "🚀 Testing Google Sheets Integration with Complete Booking Example"
echo "================================================================="

# 1. Prima verifica la configurazione
echo "1️⃣ Checking Google Sheets configuration..."
curl -s http://localhost:3000/api/admin/setup-google-sheets | jq '.'

echo -e "\n2️⃣ Setting up Google Sheets headers (run only once)..."
curl -s -X POST http://localhost:3000/api/admin/setup-google-sheets \
  -H "Content-Type: application/json" \
  -d '{"action": "setup-headers"}' | jq '.'

echo -e "\n3️⃣ Testing with a complete booking example..."

# Simula un webhook Stripe completo con tutti i metadata
curl -s -X POST http://localhost:3000/api/admin/setup-google-sheets \
  -H "Content-Type: application/json" \
  -d '{
    "action": "test-connection"
  }' | jq '.'

echo -e "\n4️⃣ Testing with a more realistic transfer booking..."

# Test con dati più realistici
curl -s -X POST http://localhost:3000/api/admin/setup-google-sheets \
  -H "Content-Type: application/json" \
  -d '{
    "action": "test-realistic-booking"
  }' 

echo -e "\n✅ Test completed! Check your Google Sheet at:"
echo "https://docs.google.com/spreadsheets/d/1alGf75MLURNNmZ3cD8nnIh8MwL8whPpwB-NQBxWTGBM/edit"

echo -e "\nIf you see errors above, make sure:"
echo "- Your .env.local has the correct Google Sheets variables"
echo "- The service account has Editor access to your Google Sheet"
echo "- Your Next.js dev server is running on localhost:3000"
