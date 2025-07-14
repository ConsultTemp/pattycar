import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminLoginForm from '@/components/admin-login-form'

export default async function AdminPage() {
  // Check if admin is already logged in
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    redirect('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Admin Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to access the admin dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  )
}