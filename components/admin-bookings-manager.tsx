"use client"

import React from 'react';
import { useBookingsData } from '@/hooks/use-bookings-data';
import AdminBookingsSpreadsheet from './admin-bookings-spreadsheet';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Download, Upload } from 'lucide-react';

export default function AdminBookingsManager() {
  const {
    bookings,
    drivers,
    isLoading,
    error,
    updateBooking,
    deleteBooking,
    addBooking,
    refreshData
  } = useBookingsData();

  const handleExportCSV = () => {
    const headers = [
      'Nome', 'Email', 'Telefono', 'Veicolo', 'Qty', 'Data', 'Ora',
      'Partenza', 'Destinazione', 'Passeggeri', 'Bagagli', 'Volo/Treno',
      'Status', 'Autista', 'Prezzo €', 'Note'
    ];

    const csvData = bookings.map(booking => [
      booking.name,
      booking.email,
      booking.phone,
      booking.vehicleType,
      booking.vehicleCount,
      booking.date,
      booking.time,
      booking.pickupLocation,
      booking.destination,
      booking.passengers,
      booking.luggage,
      booking.flight || '',
      booking.status,
      booking.driver || '',
      booking.price || '',
      booking.notes || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `prenotazioni_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Caricamento dati delle prenotazioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Prenotazioni</h1>
          <p className="text-gray-600 mt-1">
            Gestisci tutte le prenotazioni con un'interfaccia simile a Excel
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
          
          <Button
            variant="outline" 
            onClick={handleExportCSV}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Esporta CSV
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{bookings.length}</div>
          <div className="text-sm text-gray-600">Prenotazioni Totali</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            {bookings.filter(b => b.status === 'confirmed').length}
          </div>
          <div className="text-sm text-gray-600">Confermate</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-yellow-600">
            {bookings.filter(b => b.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">In Attesa</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            €{bookings.reduce((sum, b) => sum + (b.price || 0), 0).toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Valore Totale</div>
        </div>
      </div>

      {/* Main Spreadsheet */}
      <div className="bg-white rounded-lg border shadow-sm">
        <AdminBookingsSpreadsheet
          bookings={bookings}
          drivers={drivers}
          onBookingUpdate={updateBooking}
          onBookingDelete={deleteBooking}
          onBookingAdd={addBooking}
        />
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Istruzioni per l'uso - Simile a Excel</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <strong>Navigazione:</strong> Frecce direzionali, Tab, Enter</p>
            <p>• <strong>Modifica:</strong> Doppio click o F2 per modificare</p>
            <p>• <strong>Selezione:</strong> Click e trascina per selezionare più celle</p>
            <p>• <strong>Menu contestuale:</strong> Click destro per opzioni avanzate</p>
            <p>• <strong>Salvataggio:</strong> Modifiche salvate automaticamente</p>
          </div>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <strong>Copia:</strong> Ctrl+C per copiare celle</p>
            <p>• <strong>Incolla:</strong> Ctrl+V per incollare</p>
            <p>• <strong>Salva:</strong> Ctrl+S (mostra conferma)</p>
            <p>• <strong>Annulla:</strong> Ctrl+Z per annullare</p>
            <p>• <strong>Escape:</strong> Annulla modifiche attuali</p>
          </div>
        </div>
      </div>
    </div>
  );
}