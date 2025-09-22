"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AdminDeleteBookingModalProps {
  booking: {
    id: string
    customer_name: string
    service_date: string
    service_time: string
    pickup_address: string
    destination_address: string
  }
  onBookingDeleted?: () => void
}

export function AdminDeleteBookingModal({ booking, onBookingDeleted }: AdminDeleteBookingModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setError(null)
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/bookings?id=${booking.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setIsOpen(false)
        onBookingDeleted?.()
        alert('Prenotazione eliminata con successo!')
      } else {
        setError(result.error || 'Errore durante l\'eliminazione')
      }
    } catch (error) {
      setError('Errore di connessione. Riprova più tardi.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Elimina Prenotazione
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Attenzione!</strong> Questa azione è irreversibile.
              La prenotazione verrà eliminata solo dal database, non da Google Sheets.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h4 className="font-medium">Dettagli prenotazione da eliminare:</h4>
            <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
              <div><strong>Cliente:</strong> {booking.customer_name}</div>
              <div><strong>Data:</strong> {booking.service_date}</div>
              <div><strong>Ora:</strong> {booking.service_time}</div>
              <div><strong>Da:</strong> {booking.pickup_address}</div>
              <div><strong>A:</strong> {booking.destination_address}</div>
            </div>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting}>
            Annulla
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Eliminando..." : "Elimina Prenotazione"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
