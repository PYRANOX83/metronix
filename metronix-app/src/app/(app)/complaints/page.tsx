import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

async function getUserComplaints(userId: string) {
  return await prisma.complaint.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function MyComplaints() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'CITIZEN') {
    redirect('/')
  }

  const complaints = await getUserComplaints(session.user.id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Complaints
            </h1>
            <p className="mt-2 text-gray-600">
              Track the status of all your submitted complaints
            </p>
          </div>
          <Link
            href="/complaints/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            New Complaint
          </Link>
        </div>

        {complaints.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 mb-4">
              You haven&apos;t submitted any complaints yet.
            </p>
            <Link
              href="/complaints/new"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Submit your first complaint
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                All Complaints ({complaints.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {complaints.map((complaint) => (
                <div key={complaint.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">
                        {complaint.title}
                      </h4>
                      <p className="mt-1 text-gray-600">
                        {complaint.description}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>{complaint.category}</span>
                        <span>•</span>
                        <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}