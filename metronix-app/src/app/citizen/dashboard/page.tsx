import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import CitizenDashboardClient from './CitizenDashboardClient'

export default async function CitizenDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'CITIZEN') {
    redirect('/dashboard')
  }

  // Pre-fetch initial data on the server
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'
  const complaintsResponse = await fetch(`${baseUrl}/api/complaints`, {
    headers: {
      'Cookie': `next-auth.session-token=${session.user.id}`,
    },
  })

  let initialComplaints = []
  if (complaintsResponse.ok) {
    initialComplaints = await complaintsResponse.json()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenDashboardClient 
        initialComplaints={initialComplaints}
        user={session.user}
      />
    </div>
  )
}