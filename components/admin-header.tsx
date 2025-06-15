"use client"
import { Button } from "@/components/ui/button"
import { Shield, LogOut, Lock } from "lucide-react"
import { useRouter } from "next/navigation"

interface AdminHeaderProps {
  lang: string
}

export default function AdminHeader({ lang }: AdminHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/admin-logout", {
        method: "POST",
      })

      if (response.ok) {
        router.push(`/${lang}/admin`)
      }
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <header className="bg-gray-900 border-b border-gray-700 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-red-600 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Patty Car Elite</h1>
              <p className="text-gray-400 text-xs">Administrative Portal</p>
            </div>
          </div>

          {/* Security Status */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-green-400">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Secure Session Active</span>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
