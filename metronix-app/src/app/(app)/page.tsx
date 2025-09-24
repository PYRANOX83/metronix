import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    // Redirect based on user role
    switch (session.user.role) {
      case 'CITIZEN':
        redirect('/dashboard')
      case 'SOLVER':
        redirect('/solver/dashboard')
      case 'ADMIN':
        redirect('/admin/dashboard')
      default:
        redirect('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Welcome to Metronix
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your comprehensive platform for managing citizen complaints and service requests
        </p>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-blue-600 mb-2">For Citizens</h3>
            <p className="text-gray-600">Report issues and track your complaints easily</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-green-600 mb-2">For Solvers</h3>
            <p className="text-gray-600">Manage and resolve assigned complaints efficiently</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-purple-600 mb-2">For Admins</h3>
            <p className="text-gray-600">Oversee the entire system and manage users</p>
          </div>
        </div>
      </div>
    </div>
  )
}
