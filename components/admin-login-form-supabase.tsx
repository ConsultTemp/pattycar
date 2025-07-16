"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { adminLogin } from "@/lib/supabase-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2 } from "lucide-react"

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
          
          if (response.ok) {
            router.push(`/${lang}/admin/dashboard`)
          } else {
            setError(dictionary.admin?.login?.loginError || "Failed to set authentication cookies")
          }
        } else {
          setError(dictionary.admin?.login?.loginError || "No session data received")
        }
      } else {
        setError(result.error || dictionary.admin?.login?.invalidCredentials || "Login failed")
      }
    } catch (err) {
      setError(dictionary.admin?.login?.loginError || "An unexpected error occurred")
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
          <AlertDescription>{error}</AlertDescription>
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
          disabled={isLoading}
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
            disabled={isLoading}
            placeholder={dictionary.admin?.login?.passwordPlaceholder || "Enter your password"}
            className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-100 text-gray-500"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
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
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {dictionary.admin?.login?.loggingIn || "Logging in..."}
          </>
        ) : (
          dictionary.admin?.login?.loginButton || "Login"
        )}
      </Button>
    </form>
  )
} 