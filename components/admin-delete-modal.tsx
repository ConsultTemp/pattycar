"use client"

import { useState } from "react"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Database } from "@/types/database.types"

type BookingRow = Database['public']['Tables']['bookings']['Row']

interface DeleteModalProps {
  booking: BookingRow
  onBookingDeleted: () => void
  dictionary: any
}

export function AdminDeleteModal({ booking, onBookingDeleted, dictionary }: DeleteModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/delete-booking?id=${booking.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete booking')
      }

      toast({
        title: "Prenotazione eliminata",
        description: "La prenotazione è stata eliminata con successo",
      })

      setIsOpen(false)
      onBookingDeleted()
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante l'eliminazione della prenotazione",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="mr-1 h-3 w-3" />
          Elimina
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
          <AlertDialogDescription>
            Sei sicuro di voler eliminare questa prenotazione?
            <br />
            <br />
            <strong>Cliente:</strong> {booking.customer_name}
            <br />
            <strong>Email:</strong> {booking.customer_email}
            <br />
            <strong>Data:</strong> {booking.service_date} alle {booking.service_time}
            <br />
            <strong>Servizio:</strong> {booking.service_type}
            <br />
            <br />
            <span className="text-red-600">
              Questa azione non può essere annullata.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Annulla
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              'Elimina Prenotazione'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 