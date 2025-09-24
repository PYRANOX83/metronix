import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendComplaintAssignmentEmail, sendStatusUpdateEmail } from "@/lib/email"
import { ComplaintStatus, Complaint } from "@prisma/client"

// GET complaint detail with progress logs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const complaintId = id

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
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
        },
        progressLogs: {
          include: {
            user: {
              select: {
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
    }

    // Check if solver has access to this complaint
    if (session.user?.role === 'SOLVER' && complaint.solverId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ complaint })
  } catch (error) {
    console.error("Error fetching complaint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST actions for complaint management
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const complaintId = id
    const body = await request.json()
    const { action, note } = body

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId }
    })

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
    }

    // Check if solver has access to this complaint
    if (session.user?.role === 'SOLVER' && complaint.solverId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    let updatedComplaint

    switch (action) {
      case 'assign':
        // Assign complaint to solver
        updatedComplaint = await prisma.complaint.update({
          where: { id: complaintId },
          data: {
            solverId: session.user!.id,
            status: 'ASSIGNED' as ComplaintStatus
          },
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

        // Create progress log
        await prisma.progressLog.create({
          data: {
            complaintId,
            userId: session.user.id,
            status: 'ASSIGNED' as ComplaintStatus,
            note: 'Complaint assigned to solver'
          }
        })

        // Send assignment email to solver
        if (updatedComplaint.solverId) {
          const solver = await prisma.user.findUnique({
            where: { id: updatedComplaint.solverId },
            select: { email: true, name: true }
          });
          
          if (solver?.email && solver?.name) {
            try {
              await sendComplaintAssignmentEmail(
                solver.email,
                updatedComplaint as Complaint,
                solver.name
              );
            } catch (emailError) {
              console.error('Failed to send assignment email:', emailError);
              // Don't fail the request if email sending fails
            }
          }
        }
        break

      case 'start':
        // Start working on complaint - keep status as ASSIGNED but add progress log
        updatedComplaint = await prisma.complaint.update({
          where: { id: complaintId },
          data: {
            // Keep status as ASSIGNED since there's no IN_PROGRESS status
          },
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

        // Create progress log
        await prisma.progressLog.create({
          data: {
            complaintId,
            userId: session.user.id,
            status: 'ASSIGNED' as ComplaintStatus,
            note: 'Work started on complaint'
          }
        })

        // Send status update email to citizen
        if (updatedComplaint.citizenId) {
          const citizen = await prisma.user.findUnique({
            where: { id: updatedComplaint.citizenId },
            select: { email: true, name: true }
          });
          
          if (citizen?.email && citizen?.name) {
            try {
              await sendStatusUpdateEmail(
                citizen.email,
                updatedComplaint as Complaint,
                citizen.name,
                'ASSIGNED',
                'Work has started on your complaint'
              );
            } catch (emailError) {
              console.error('Failed to send status update email:', emailError);
              // Don't fail the request if email sending fails
            }
          }
        }
        break

      case 'resolve':
        // Resolve complaint
        updatedComplaint = await prisma.complaint.update({
          where: { id: complaintId },
          data: {
            status: 'RESOLVED' as ComplaintStatus
          },
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

        // Create progress log
        await prisma.progressLog.create({
          data: {
            complaintId,
            userId: session.user.id,
            status: 'RESOLVED' as ComplaintStatus,
            note: note || 'Complaint resolved'
          }
        })

        // Send status update email to citizen
        if (updatedComplaint.citizenId) {
          const citizen = await prisma.user.findUnique({
            where: { id: updatedComplaint.citizenId },
            select: { email: true, name: true }
          });
          
          if (citizen?.email && citizen?.name) {
            try {
              await sendStatusUpdateEmail(
                citizen.email,
                updatedComplaint as Complaint,
                citizen.name,
                'RESOLVED',
                note || 'Your complaint has been resolved'
              );
            } catch (emailError) {
              console.error('Failed to send status update email:', emailError);
              // Don't fail the request if email sending fails
            }
          }
        }
        break

      case 'add_note':
        // Add progress note
        if (!note || !note.trim()) {
          return NextResponse.json({ error: "Note content is required" }, { status: 400 })
        }

        await prisma.progressLog.create({
          data: {
            complaintId,
            userId: session.user.id,
            status: complaint.status as ComplaintStatus,
            note: note.trim()
          }
        })

        // Return updated complaint with new log
        updatedComplaint = await prisma.complaint.findUnique({
          where: { id: complaintId },
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
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ complaint: updatedComplaint })
  } catch (error) {
    console.error("Error updating complaint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}