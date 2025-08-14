"use client"

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Import jspreadsheet types
declare global {
  interface Window {
    jspreadsheet: any;
  }
}

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  vehicleCount: number;
  date: string;
  time: string;
  pickupLocation: string;
  destination: string;
  passengers: number;
  luggage: number;
  flight?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  driver?: string;
  price?: number;
}

interface AdminBookingsSpreadsheetProps {
  bookings: Booking[];
  drivers: { id: string; name: string }[];
  onBookingUpdate: (id: string, updates: Partial<Booking>) => void;
  onBookingDelete: (id: string) => void;
  onBookingAdd: (booking: Omit<Booking, 'id'>) => void;
}

export default function AdminBookingsSpreadsheet({
  bookings,
  drivers,
  onBookingUpdate,
  onBookingDelete,
  onBookingAdd
}: AdminBookingsSpreadsheetProps) {
  const jRef = useRef<HTMLDivElement>(null);
  const spreadsheetRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vehicle types options
  const vehicleTypes = [
    { value: 'sedan', label: 'Sedan' },
    { value: 'van', label: 'Van' },
    { value: 'minibus', label: 'Mini Bus' },
    { value: 'luxury-sedan', label: 'Luxury Sedan' },
  ];

  // Status options
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  // Common pickup locations
  const pickupLocations = [
    'Aeroporto Malpensa',
    'Aeroporto Orio al Serio',
    'Stazione Centrale',
    'Stazione Garibaldi',
    'Aeroporto Venezia Marco Polo',
    'Stazione Venezia Santa Lucia',
  ];

  useEffect(() => {
    const loadJSpreadsheet = async () => {
      // Import jspreadsheet dynamically
      const jspreadsheet = await import('jspreadsheet-ce');
      window.jspreadsheet = jspreadsheet.default;

      if (jRef.current && window.jspreadsheet) {
        // Sort bookings by date chronologically
        const sortedBookings = [...bookings].sort((a, b) => 
          new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
        );

        // Prepare data for spreadsheet
        const data = sortedBookings.map(booking => [
          booking.name,
          booking.email,
          booking.phone,
          booking.vehicleType,
          booking.vehicleCount.toString(),
          booking.date,
          booking.time,
          booking.pickupLocation,
          booking.destination,
          booking.passengers.toString(),
          booking.luggage.toString(),
          booking.flight || '',
          booking.status,
          booking.driver || '',
          booking.price?.toString() || '',
          booking.notes || ''
        ]);

        // Define columns configuration
        const columns = [
          { type: 'text', title: 'Nome', width: 150 },
          { type: 'text', title: 'Email', width: 200 },
          { type: 'text', title: 'Telefono', width: 130 },
          { 
            type: 'dropdown', 
            title: 'Veicolo', 
            width: 120,
            source: vehicleTypes.map(v => v.label)
          },
          { type: 'numeric', title: 'Qty', width: 60 },
          { type: 'calendar', title: 'Data', width: 120 },
          { type: 'text', title: 'Ora', width: 80 },
          { 
            type: 'dropdown', 
            title: 'Partenza', 
            width: 180,
            source: pickupLocations
          },
          { type: 'text', title: 'Destinazione', width: 180 },
          { type: 'numeric', title: 'Pass.', width: 60 },
          { type: 'numeric', title: 'Bagagli', width: 80 },
          { type: 'text', title: 'Volo/Treno', width: 120 },
          { 
            type: 'dropdown', 
            title: 'Status', 
            width: 100,
            source: statusOptions.map(s => s.label)
          },
          { 
            type: 'dropdown', 
            title: 'Autista', 
            width: 150,
            source: drivers.map(d => d.name)
          },
          { type: 'numeric', title: 'Prezzo €', width: 100 },
          { type: 'text', title: 'Note', width: 200 },
        ];

        // Initialize spreadsheet
        spreadsheetRef.current = window.jspreadsheet(jRef.current, {
          data: data,
          columns: columns,
          minDimensions: [16, 100], // min columns, min rows
          allowInsertRow: true,
          allowInsertColumn: false,
          allowDeleteRow: true,
          allowDeleteColumn: false,
          allowRenameColumn: false,
          csvHeaders: true,
          search: true,
          pagination: false,
          copyCompatibility: true, // Enable Excel-like copy/paste
          selectAnchor: true, // Excel-like cell selection
          contextMenu: true, // Enable right-click menu
          tableOverflow: true, // Handle large tables
          tableWidth: '100%',
          tableHeight: '600px',
          toolbar: [
            {
              type: 'i',
              content: 'add',
              title: 'Aggiungi Riga',
              onclick: function() {
                spreadsheetRef.current.insertRow();
              }
            },
            {
              type: 'i', 
              content: 'remove',
              title: 'Rimuovi Riga',
              onclick: function() {
                const selectedRows = spreadsheetRef.current.getSelectedRows();
                if (selectedRows.length > 0) {
                  selectedRows.forEach((row: number) => {
                    spreadsheetRef.current.deleteRow(row);
                  });
                }
              }
            }
          ],
          contextMenu: function(obj: any, x: number, y: number, e: Event) {
            const items = [];
            
            if (y !== null) {
              items.push({
                title: 'Inserisci riga sopra',
                onclick: function() {
                  spreadsheetRef.current.insertRow(1, parseInt(y), 1);
                }
              });
              
              items.push({
                title: 'Inserisci riga sotto', 
                onclick: function() {
                  spreadsheetRef.current.insertRow(1, parseInt(y) + 1, 1);
                }
              });
              
              items.push({
                title: 'Elimina riga',
                onclick: function() {
                  if (confirm('Sei sicuro di voler eliminare questa riga?')) {
                    // Call onBookingDelete if we have a booking ID
                    const bookingIndex = parseInt(y);
                    if (sortedBookings[bookingIndex]) {
                      onBookingDelete(sortedBookings[bookingIndex].id);
                    }
                    spreadsheetRef.current.deleteRow(parseInt(y), 1);
                  }
                }
              });
            }

            return items;
          },
          onchange: function(instance: any, cell: HTMLElement, x: string, y: string, value: string) {
            // Handle cell changes
            const row = parseInt(y);
            const col = parseInt(x);
            
            if (sortedBookings[row]) {
              const booking = sortedBookings[row];
              const updates: Partial<Booking> = {};
              
              // Map column index to booking field
              const columnMap = [
                'name', 'email', 'phone', 'vehicleType', 'vehicleCount',
                'date', 'time', 'pickupLocation', 'destination', 'passengers',
                'luggage', 'flight', 'status', 'driver', 'price', 'notes'
              ];
              
              const field = columnMap[col] as keyof Booking;
              
              if (field) {
                // Type conversion based on field
                if (field === 'vehicleCount' || field === 'passengers' || field === 'luggage') {
                  updates[field] = parseInt(value) || 0 as any;
                } else if (field === 'price') {
                  updates[field] = parseFloat(value) || 0 as any;
                } else if (field === 'vehicleType') {
                  const vehicleType = vehicleTypes.find(v => v.label === value);
                  updates[field] = vehicleType ? vehicleType.value : value as any;
                } else if (field === 'status') {
                  const status = statusOptions.find(s => s.label === value);
                  updates[field] = status ? status.value : value as any;
                } else {
                  updates[field] = value as any;
                }
                
                // Call the update callback
                onBookingUpdate(booking.id, updates);
              }
            }
          },
          oninsertrow: function(instance: any, rowNumber: number) {
            // Handle new row insertion - create a new booking
            const newBooking: Omit<Booking, 'id'> = {
              name: '',
              email: '',
              phone: '',
              vehicleType: 'sedan',
              vehicleCount: 1,
              date: new Date().toISOString().split('T')[0],
              time: '12:00',
              pickupLocation: '',
              destination: '',
              passengers: 1,
              luggage: 0,
              flight: '',
              notes: '',
              status: 'pending',
              driver: '',
              price: 0
            };
            
            onBookingAdd(newBooking);
          },
          onkeydown: function(instance: any, cell: HTMLElement, x: number, y: number, e: KeyboardEvent) {
            // Excel-like keyboard shortcuts
            if (e.ctrlKey || e.metaKey) {
              switch (e.key.toLowerCase()) {
                case 'c':
                  // Copy functionality already handled by jspreadsheet
                  break;
                case 'v':
                  // Paste functionality already handled by jspreadsheet
                  break;
                case 's':
                  e.preventDefault();
                  // Save current state (could trigger a save action)
                  console.log('Save shortcut triggered');
                  break;
                case 'z':
                  // Undo functionality
                  if (spreadsheetRef.current.undo) {
                    e.preventDefault();
                    spreadsheetRef.current.undo();
                  }
                  break;
                case 'y':
                  // Redo functionality
                  if (spreadsheetRef.current.redo) {
                    e.preventDefault();
                    spreadsheetRef.current.redo();
                  }
                  break;
              }
            }
            
            // Excel-like navigation
            switch (e.key) {
              case 'Tab':
                // Tab moves to next cell (default jspreadsheet behavior)
                break;
              case 'Enter':
                // Enter moves to cell below (default jspreadsheet behavior)
                break;
              case 'Escape':
                // Cancel edit and revert changes
                if (spreadsheetRef.current.closeEditor) {
                  spreadsheetRef.current.closeEditor(cell, false);
                }
                break;
            }
          }
        });

        setIsLoading(false);
      }
    };

    loadJSpreadsheet();

    // Cleanup
    return () => {
      if (spreadsheetRef.current) {
        spreadsheetRef.current.destroy();
      }
    };
  }, [bookings, drivers, onBookingUpdate, onBookingDelete, onBookingAdd]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Caricamento tabella prenotazioni...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestione Prenotazioni</h2>
        <div className="text-sm text-gray-500">
          {bookings.length} prenotazioni totali
        </div>
      </div>
      
      <div className="border rounded-lg p-4 bg-white">
        <div ref={jRef} className="w-full" />
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Navigazione:</strong> Usa le frecce per navigare, doppio click per modificare, click destro per opzioni aggiuntive</p>
        <p><strong>Funzionalità:</strong> Editing inline, ordinamento cronologico, dropdown per selezioni, validazione automatica</p>
      </div>
    </div>
  );
}