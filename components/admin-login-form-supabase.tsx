"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { adminLogin } from "@/lib/supabase-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react"

interface AdminLoginFormProps {
  lang: string
  dictionary: any
}

export default function AdminLoginFormSupabase({ lang, dictionary }: AdminLoginFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isBlocked, setIsBlocked] = useState(false)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await adminLogin(formData.email, formData.password)
      
      if (result.success && result.session) {
        // Set auth cookies via API
        const session = result.session
        if (session) {
          const response = await fetch('/api/auth/set-cookies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              accessToken: session.access_token,
              refreshToken: session.refresh_token
            })
          })
          
          const data = await response.json()
          
          if (response.ok) {
            router.push(`/${lang}/admin/dashboard`)
          } else {
            // Gestione errori con rate limiting
            if (response.status === 429) {
              setError(data.error || "Troppi tentativi di login. Riprova più tardi.")
              setIsBlocked(true)
            } else {
              setError(data.error || dictionary.admin?.login?.loginError || "Errore durante l'autenticazione")
              setRemainingAttempts(data.remainingAttempts)
            }
          }
        } else {
          setError(dictionary.admin?.login?.loginError || "Errore di autenticazione")
        }
      } else {
        // Login fallito da Supabase - registra il tentativo fallito
        await fetch('/api/auth/set-cookies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            accessToken: null,
            refreshToken: null
          })
        }).catch(() => {}) // Ignora errori per questo logging
        
        setError(result.error || dictionary.admin?.login?.invalidCredentials || "Credenziali non valide")
      }
    } catch (err) {
      setError(dictionary.admin?.login?.loginError || "Errore durante il login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Avviso tentativi rimanenti */}
      {remainingAttempts !== null && remainingAttempts > 0 && remainingAttempts <= 2 && !isBlocked && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Attenzione: {remainingAttempts} tentativi rimanenti
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">{dictionary.admin?.login?.emailLabel || "Email"}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          disabled={isLoading || isBlocked}
          placeholder={dictionary.admin?.login?.emailPlaceholder || "admin@example.com"}
          className="bg-white border-gray-300 text-gray-900 placeholder-gray-500"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">{dictionary.admin?.login?.passwordLabel || "Password"}</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleInputChange}
            required
            disabled={isLoading || isBlocked}
            placeholder={dictionary.admin?.login?.passwordPlaceholder || "Enter your password"}
            className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-100 text-gray-500"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading || isBlocked}
            title={showPassword ? dictionary.admin?.login?.hidePassword : dictionary.admin?.login?.showPassword}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium" 
        disabled={isLoading || isBlocked}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {dictionary.admin?.login?.loggingIn || "Accesso in corso..."}
          </>
        ) : (
          dictionary.admin?.login?.loginButton || "Accedi"
        )}
      </Button>
    </form>
  )
} 