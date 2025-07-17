"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, AlertTriangle, CheckCircle } from "lucide-react"

interface SetupPasswordFormProps {
  lang: string
  dictionary: any
  tokenHash?: string
  type?: string
}

export default function SetupPasswordForm({ lang, dictionary, tokenHash, type }: SetupPasswordFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)

  const validatePassword = (password: string) => {
    return password.length >= 8
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    // Check if we have valid token
    if (!tokenHash || type !== 'invite') {
      setError(dictionary.admin?.setupPassword?.tokenMissing || "Invitation token missing")
      return
    }

    // Validate password requirements
    if (!validatePassword(formData.password)) {
      setError(dictionary.admin?.setupPassword?.passwordRequirements || "Password must be at least 8 characters")
      return
    }

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError(dictionary.admin?.setupPassword?.passwordMismatch || "Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tokenHash: tokenHash,
          password: formData.password
        })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setSuccess(true)
        
        // Show success message briefly then redirect
        setTimeout(() => {
          router.push(`/${lang}/admin/dashboard`)
        }, 1500)
      } else {
        // Handle errors with rate limiting
        if (response.status === 429) {
          setError(data.error || dictionary.admin?.setupPassword?.setupError || "Too many attempts. Try again later.")
        } else {
          setError(data.error || dictionary.admin?.setupPassword?.setupError || "Error setting up password")
          setRemainingAttempts(data.remainingAttempts)
        }
      }
    } catch (err) {
      setError(dictionary.admin?.setupPassword?.setupError || "Error setting up password")
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

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-green-800">
          {dictionary.admin?.setupPassword?.success || "Password set successfully!"}
        </h2>
        <p className="text-sm text-gray-600">
          {dictionary.admin?.setupPassword?.redirecting || "Redirecting to dashboard..."}
        </p>
      </div>
    )
  }

  // Show error screen if no valid token
  if ((!tokenHash || type !== 'invite') && !error) {
    setError(dictionary.admin?.setupPassword?.tokenMissing || "Invitation token missing")
  }

  if ((!tokenHash || type !== 'invite') || error) {
    return (
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-lg font-semibold text-red-800">
          {dictionary.admin?.setupPassword?.tokenExpired || "Invalid Link"}
        </h2>
        <p className="text-sm text-gray-600">
          {error}
        </p>
        <a 
          href={`/${lang}/admin`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {dictionary.admin?.setupPassword?.goToLogin || "Go to Login"}
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="text-center text-sm text-gray-600">
        {dictionary.admin?.setupPassword?.welcomeMessage || "Welcome! Set up your password to get started."}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            {dictionary.admin?.setupPassword?.passwordLabel || "Password"}
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              placeholder={dictionary.admin?.setupPassword?.passwordPlaceholder || "Enter password"}
              className="pr-10"
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              {showPassword ? 
                <EyeOff className="w-4 h-4" /> : 
                <Eye className="w-4 h-4" />
              }
            </button>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            {dictionary.admin?.setupPassword?.confirmPasswordLabel || "Confirm Password"}
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder={dictionary.admin?.setupPassword?.confirmPasswordPlaceholder || "Confirm password"}
              className="pr-10"
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              {showConfirmPassword ? 
                <EyeOff className="w-4 h-4" /> : 
                <Eye className="w-4 h-4" />
              }
            </button>
          </div>
        </div>

        {/* Password Requirements */}
        <div className="text-xs text-gray-500">
          {dictionary.admin?.setupPassword?.passwordRequirements || "Password must be at least 8 characters"}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {remainingAttempts !== null && (
                <div className="mt-1 text-xs">
                  Remaining attempts: {remainingAttempts}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading || !formData.password || !formData.confirmPassword}
          className="w-full text-white"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{dictionary.admin?.setupPassword?.settingUp || "Setting up..."}</span>
            </div>
          ) : (
            dictionary.admin?.setupPassword?.setupButton || "Setup Password"
          )}
        </Button>
      </form>

      {/* Login Link */}
      <div className="text-center text-sm">
        <span className="text-gray-600">Already have an account? </span>
        <a 
          href={`/${lang}/admin`}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          {dictionary.admin?.setupPassword?.goToLogin || "Go to Login"}
        </a>
      </div>
    </div>
  )
} 