import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendDailySummaryEmail } from '@/lib/email';
import { ComplaintStatus, Complaint } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, adminEmail } = body;

    // If no date provided, use today's date
    const targetDate = date ? new Date(date) : new Date();
    const dateString = targetDate.toISOString().split('T')[0];

    // Get complaints for the target date
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const complaints = await prisma.complaint.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        solver: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get admin details
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id! },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Send daily summary email
    const emailResult = await sendDailySummaryEmail(
      adminEmail || admin.email,
      complaints as Complaint[],
      admin.name || 'Admin',
      dateString
    );

    if (!emailResult.success) {
      return NextResponse.json({ 
        error: 'Failed to send email', 
        details: emailResult.error 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Daily summary email sent successfully',
      date: dateString,
      complaintsCount: complaints.length,
      emailId: emailResult.messageId,
    });

  } catch (error) {
    console.error('Error sending daily summary email:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// GET endpoint to get daily summary data without sending email
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    // If no date provided, use today's date
    const targetDate = date ? new Date(date) : new Date();
    const dateString = targetDate.toISOString().split('T')[0];

    // Get complaints for the target date
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const complaints = await prisma.complaint.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        solver: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate statistics
    const stats = {
      total: complaints.length,
      pending: complaints.filter(c => c.status === ComplaintStatus.SUBMITTED).length,
      assigned: complaints.filter(c => c.status === ComplaintStatus.ASSIGNED).length,
      resolved: complaints.filter(c => c.status === ComplaintStatus.RESOLVED).length,
    };

    return NextResponse.json({
      date: dateString,
      stats,
      complaints,
    });

  } catch (error) {
    console.error('Error fetching daily summary data:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}