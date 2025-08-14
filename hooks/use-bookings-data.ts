import { useState, useEffect, useCallback } from 'react';

export interface Booking {
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
  createdAt?: string;
  updatedAt?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

// Mock data per testing
const mockBookings: Booking[] = [
  {
    id: '1',
    name: 'Mario Rossi',
    email: 'mario@example.com',
    phone: '+39 333 1234567',
    vehicleType: 'sedan',
    vehicleCount: 1,
    date: '2024-02-15',
    time: '10:30',
    pickupLocation: 'Aeroporto Malpensa',
    destination: 'Milano Centrale',
    passengers: 2,
    luggage: 2,
    flight: 'AZ123',
    status: 'confirmed',
    driver: 'Giuseppe Verdi',
    price: 85,
    notes: 'Cliente VIP - servizio premium'
  },
  {
    id: '2',
    name: 'Anna Bianchi',
    email: 'anna@example.com',
    phone: '+39 338 7654321',
    vehicleType: 'van',
    vehicleCount: 1,
    date: '2024-02-16',
    time: '14:15',
    pickupLocation: 'Stazione Centrale',
    destination: 'Aeroporto Orio al Serio',
    passengers: 4,
    luggage: 4,
    status: 'pending',
    price: 120,
    notes: 'Viaggio famiglia con bambini'
  },
  {
    id: '3',
    name: 'John Smith',
    email: 'john@example.com',
    phone: '+1 555 123456',
    vehicleType: 'luxury-sedan',
    vehicleCount: 1,
    date: '2024-02-17',
    time: '08:00',
    pickupLocation: 'Hotel Bulgari Milano',
    destination: 'Aeroporto Malpensa',
    passengers: 1,
    luggage: 1,
    flight: 'LH456',
    status: 'confirmed',
    driver: 'Marco Ferrari',
    price: 150,
    notes: 'Cliente business - fatturazione aziendale'
  },
  {
    id: '4',
    name: 'Sophie Dubois',
    email: 'sophie@example.com',
    phone: '+33 6 12 34 56 78',
    vehicleType: 'minibus',
    vehicleCount: 1,
    date: '2024-02-14',
    time: '16:45',
    pickupLocation: 'Stazione Garibaldi',
    destination: 'Como',
    passengers: 8,
    luggage: 8,
    status: 'confirmed',
    driver: 'Luigi Bianchi',
    price: 200,
    notes: 'Gruppo turistico francese'
  }
];

const mockDrivers: Driver[] = [
  { id: '1', name: 'Giuseppe Verdi', phone: '+39 347 1111111', email: 'giuseppe@pattycar.com' },
  { id: '2', name: 'Marco Ferrari', phone: '+39 347 2222222', email: 'marco@pattycar.com' },
  { id: '3', name: 'Luigi Bianchi', phone: '+39 347 3333333', email: 'luigi@pattycar.com' },
  { id: '4', name: 'Antonio Rossi', phone: '+39 347 4444444', email: 'antonio@pattycar.com' },
];

export function useBookingsData() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize with mock data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // In a real app, you would fetch from an API:
        // const bookingsResponse = await fetch('/api/admin/bookings');
        // const driversResponse = await fetch('/api/admin/drivers');
        // const bookingsData = await bookingsResponse.json();
        // const driversData = await driversResponse.json();
        
        setBookings(mockBookings);
        setDrivers(mockDrivers);
        setError(null);
      } catch (err) {
        setError('Failed to load data');
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const updateBooking = useCallback(async (id: string, updates: Partial<Booking>) => {
    try {
      // Optimistically update the UI
      setBookings(prev => prev.map(booking => 
        booking.id === id 
          ? { ...booking, ...updates, updatedAt: new Date().toISOString() }
          : booking
      ));

      // In a real app, you would make an API call:
      // await fetch(`/api/admin/bookings/${id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updates)
      // });

      console.log(`Updated booking ${id}:`, updates);
    } catch (err) {
      setError('Failed to update booking');
      console.error('Error updating booking:', err);
      // Revert optimistic update on error
      // You would refetch data here in a real app
    }
  }, []);

  const deleteBooking = useCallback(async (id: string) => {
    try {
      // Optimistically remove from UI
      const bookingToDelete = bookings.find(b => b.id === id);
      setBookings(prev => prev.filter(booking => booking.id !== id));

      // In a real app, you would make an API call:
      // await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' });

      console.log(`Deleted booking ${id}:`, bookingToDelete?.name);
    } catch (err) {
      setError('Failed to delete booking');
      console.error('Error deleting booking:', err);
      // Revert optimistic update on error
      // You would refetch data here in a real app
    }
  }, [bookings]);

  const addBooking = useCallback(async (booking: Omit<Booking, 'id'>) => {
    try {
      const newBooking: Booking = {
        ...booking,
        id: Date.now().toString(), // In real app, this would come from the server
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Optimistically add to UI
      setBookings(prev => [...prev, newBooking]);

      // In a real app, you would make an API call:
      // const response = await fetch('/api/admin/bookings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(booking)
      // });
      // const createdBooking = await response.json();

      console.log('Added new booking:', newBooking);
    } catch (err) {
      setError('Failed to add booking');
      console.error('Error adding booking:', err);
      // Revert optimistic update on error
    }
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API refetch
      await new Promise(resolve => setTimeout(resolve, 300));
      // In real app: refetch from API
      setError(null);
    } catch (err) {
      setError('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    bookings,
    drivers,
    isLoading,
    error,
    updateBooking,
    deleteBooking,
    addBooking,
    refreshData
  };
}