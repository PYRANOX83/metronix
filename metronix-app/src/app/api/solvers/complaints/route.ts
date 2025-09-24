import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ComplaintStatus } from "@prisma/client"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all available complaints for assignment
    const availableComplaints = await prisma.complaint.findMany({
      where: {
        status: 'SUBMITTED' as ComplaintStatus,
        solverId: null
      },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        priority: 'desc',
        createdAt: 'asc'
      }
    })

    // Get assigned complaints for this solver
    const assignedComplaints = await prisma.complaint.findMany({
      where: {
        solverId: session.user.id
      },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({
      available: availableComplaints,
      assigned: assignedComplaints
    })
  } catch (error) {
    console.error("Error fetching solver complaints:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}