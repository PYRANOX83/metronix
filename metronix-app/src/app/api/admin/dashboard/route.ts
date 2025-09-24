import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ComplaintStatus } from "@prisma/client"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get statistics
    const totalComplaints = await prisma.complaint.count()
    const submittedComplaints = await prisma.complaint.count({
      where: { status: 'SUBMITTED' as ComplaintStatus }
    })
    const assignedComplaints = await prisma.complaint.count({
      where: { status: 'ASSIGNED' as ComplaintStatus }
    })
    const resolvedComplaints = await prisma.complaint.count({
      where: { status: 'RESOLVED' as ComplaintStatus }
    })

    // Get recent complaints
    const recentComplaints = await prisma.complaint.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        solver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Get user statistics
    const totalUsers = await prisma.user.count()
    const totalCitizens = await prisma.user.count({
      where: { role: 'CITIZEN' }
    })
    const totalSolvers = await prisma.user.count({
      where: { role: 'SOLVER' }
    })
    const totalAdmins = await prisma.user.count({
      where: { role: 'ADMIN' }
    })

    return NextResponse.json({
      stats: {
        complaints: {
          total: totalComplaints,
          submitted: submittedComplaints,
          assigned: assignedComplaints,
          resolved: resolvedComplaints
        },
        users: {
          total: totalUsers,
          citizens: totalCitizens,
          solvers: totalSolvers,
          admins: totalAdmins
        }
      },
      recentComplaints
    })
  } catch (error) {
    console.error("Error fetching admin dashboard:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}