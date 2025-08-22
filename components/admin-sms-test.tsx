"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Send, TestTube } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface AdminSmsTestProps {
  dictionary: any
}

export default function AdminSmsTest({ dictionary }: AdminSmsTestProps) {
  const [testData, setTestData] = useState({
    type: '',
    phone: '',
    name: '',
    customMessage: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSendTestSms = async () => {
    if (!testData.type || !testData.phone || !testData.name) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi obbligatori",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // For testing, we'll call the appropriate service endpoint
      let apiUrl = ''
      let requestBody: any = {}

      if (testData.type === 'customer') {
        // We'll create a test endpoint for this
        apiUrl = '/api/admin/test-customer-sms'
        requestBody = {
          customerName: testData.name,
          customerPhone: testData.phone.replace(/^\+39/, ''),
          customerPhonePrefix: '+39',
          serviceDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          serviceTime: '10:00',
          pickupAddress: 'Via Roma 1, Milano (TEST)',
          destinationAddress: 'Aeroporto Malpensa (TEST)',
          vehicleType: 'Mercedes Class E (TEST)',
          driverName: 'Mario Rossi (TEST)',
          notificationType: '1_day',
          customMessage: testData.customMessage
        }
      } else if (testData.type === 'driver') {
        apiUrl = '/api/admin/test-driver-sms'
        requestBody = {
          driverName: testData.name,
          driverPhone: testData.phone,
          serviceDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          serviceTime: '10:00',
          customerName: 'Giovanni Bianchi (TEST)',
          pickupAddress: 'Via Roma 1, Milano (TEST)',
          destinationAddress: 'Aeroporto Malpensa (TEST)',
          vehicleType: 'Mercedes Class E (TEST)',
          passengers: 2,
          notes: 'Test notification from admin panel',
          customMessage: testData.customMessage
        }
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: "SMS Inviato",
          description: `SMS di test inviato a ${testData.phone}`,
        })
        
        // Reset form
        setTestData({
          type: '',
          phone: '',
          name: '',
          customMessage: ''
        })
      } else {
        toast({
          title: "Errore invio SMS",
          description: result.error || "Si è verificato un errore",
          variant: "destructive",
        })
      }

    } catch (error) {
      console.error('Error sending test SMS:', error)
      toast({
        title: "Errore di connessione",
        description: "Impossibile inviare l'SMS di test",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TestTube className="mr-2 h-5 w-5" />
          Test Notifiche SMS
        </CardTitle>
        <CardDescription>
          Invia SMS di test per verificare la configurazione Twilio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="test-type">Tipo Destinatario *</Label>
            <Select value={testData.type} onValueChange={(value) => setTestData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Cliente</SelectItem>
                <SelectItem value="driver">Autista</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-phone">Numero Telefono *</Label>
            <Input
              id="test-phone"
              type="tel"
              placeholder="+393331234567"
              value={testData.phone}
              onChange={(e) => setTestData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="test-name">Nome Destinatario *</Label>
          <Input
            id="test-name"
            placeholder="Mario Rossi"
            value={testData.name}
            onChange={(e) => setTestData(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="custom-message">Messaggio Personalizzato (Opzionale)</Label>
          <Textarea
            id="custom-message"
            placeholder="Lascia vuoto per usare il template standard..."
            value={testData.customMessage}
            onChange={(e) => setTestData(prev => ({ ...prev, customMessage: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => setTestData({ type: '', phone: '', name: '', customMessage: '' })}
          >
            Reset
          </Button>
          <Button
            onClick={handleSendTestSms}
            disabled={isLoading || !testData.type || !testData.phone || !testData.name}
          >
            <Send className="mr-2 h-4 w-4" />
            {isLoading ? 'Invio...' : 'Invia SMS Test'}
          </Button>
        </div>

        <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded">
          <strong>Note:</strong> Gli SMS di test includeranno la dicitura "(TEST)" per distinguerli dai messaggi reali.
          Assicurati di aver configurato correttamente le variabili di ambiente Twilio.
        </div>
      </CardContent>
    </Card>
  )
}