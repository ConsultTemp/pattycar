"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { Input } from "@/components/ui/input"
import { MapPin, Loader2, AlertCircle } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

interface Place {
  place_id: string
  description: string
  main_text: string
  secondary_text: string
}

interface PlacesAutocompleteProps {
  value: string
  onChange: (value: string, placeId?: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function PlacesAutocomplete({
  value,
  onChange,
  placeholder = "Cerca indirizzo...",
  disabled = false,
  className = "",
}: PlacesAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [places, setPlaces] = useState<Place[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState(value)
  
  // Ref per prevenire la chiusura quando si clicca su un'opzione
  const isSelectingRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastSelectedValueRef = useRef<string>("")

  // Debounce dell'input per evitare troppe chiamate API
  const debouncedInputValue = useDebounce(inputValue, 500)

  // Effetto per cercare i luoghi quando cambia l'input con debounce
  useEffect(() => {
    // Non cercare se stiamo selezionando un'opzione
    if (isSelectingRef.current) {
      return
    }
    
    // Non cercare se il valore è quello che abbiamo appena selezionato
    if (debouncedInputValue === lastSelectedValueRef.current) {
      return
    }
    
    if (debouncedInputValue && debouncedInputValue.length >= 3) {
      searchPlaces(debouncedInputValue)
    } else {
      setPlaces([])
      setIsOpen(false)
      setError(null)
    }
  }, [debouncedInputValue])

  // Effetto per gestire i click fuori dal componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Funzione per cercare i luoghi tramite API
  const searchPlaces = useCallback(async (query: string) => {
    if (!query || query.length < 3) return

    setIsLoading(true)
    setError(null)

    try {
      // Cambiato da GET a POST per la nuova API
      const response = await fetch("/api/places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: query }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || `HTTP ${response.status}`)
      }

      if (data.error) {
        throw new Error(data.details || data.error)
      }

      setPlaces(data.predictions || [])
      setIsOpen((data.predictions || []).length > 0)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Errore nella ricerca")
      setPlaces([])
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Gestisce la selezione di un luogo
  const handlePlaceSelect = (place: Place) => {
    isSelectingRef.current = true
    lastSelectedValueRef.current = place.description
    // Imposta il valore selezionato e ferma qualsiasi ricerca in corso
    setInputValue(place.description)
    onChange(place.description, place.place_id)
    setIsOpen(false)
    setPlaces([])
    setError(null)
    setIsLoading(false)
    
    // Reset del flag dopo un breve timeout
    setTimeout(() => {
      isSelectingRef.current = false
      }, 300)
  }

  // Gestisce il cambiamento dell'input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    
    // Reset del flag di selezione quando l'utente digita manualmente
    if (!isSelectingRef.current) {
      // Reset del valore selezionato se l'utente sta digitando qualcosa di diverso
      if (newValue !== lastSelectedValueRef.current) {
        lastSelectedValueRef.current = ""
        }
      
      setInputValue(newValue)
      onChange(newValue)
      setError(null)

      if (newValue.length < 3) {
        setPlaces([])
        setIsOpen(false)
      }
    } else {
      }
  }

  // Gestisce il focus sull'input
  const handleInputFocus = () => {
    if (places.length > 0) {
      setIsOpen(true)
    }
  }

  // Gestisce la perdita di focus - ora con controllo del flag
  const handleInputBlur = () => {
    // Non chiudere se stiamo selezionando un'opzione
    if (!isSelectingRef.current) {
      setTimeout(() => {
        if (!isSelectingRef.current) {
          setIsOpen(false)
        }
      }, 150)
    }
  }

  // Gestisce mousedown per prevenire blur quando si clicca su un'opzione
  const handleOptionMouseDown = (e: React.MouseEvent) => {
    e.preventDefault() // Previene il blur dell'input
    isSelectingRef.current = true
  }

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`pr-10 ${error ? "border-red-500" : ""}`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : error ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            <MapPin className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Messaggio di errore */}
      {error && <div className="mt-1 text-sm text-red-600">{error}</div>}

      {/* Dropdown con i risultati */}
      {isOpen && places.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {places.map((place) => (
            <button
              key={place.place_id}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              onMouseDown={handleOptionMouseDown}
              onClick={() => handlePlaceSelect(place)}
            >
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{place.main_text}</div>
                  {place.secondary_text && <div className="text-xs text-gray-500 truncate">{place.secondary_text}</div>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Messaggio quando non ci sono risultati */}
      {isOpen && places.length === 0 && !isLoading && !error && debouncedInputValue.length >= 3 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500 text-sm">
          Nessun indirizzo trovato
        </div>
      )}
    </div>
  )
}