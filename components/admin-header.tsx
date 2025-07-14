import Link from 'next/link'

export default function AdminHeader() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Link href="/admin/dashboard" className="text-xl font-bold text-gray-900">
              Patty Car Admin
            </Link>
          </div>
          <nav className="flex space-x-8">
            <Link 
              href="/admin/dashboard" 
              className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link 
              href="/" 
              className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              View Site
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}