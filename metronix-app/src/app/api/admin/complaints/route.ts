import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma, ComplaintCategory, Priority, ComplaintStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const solverId = searchParams.get('solverId');

    const whereClause: Prisma.ComplaintWhereInput = {};
    
    if (category) whereClause.category = category as ComplaintCategory;
    if (priority) whereClause.priority = priority as Priority;
    if (status) whereClause.status = status as ComplaintStatus;
    if (solverId) whereClause.solverId = solverId;

    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      include: {
        citizen: {
          select: { id: true, name: true, email: true }
        },
        solver: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(complaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { complaintId, status, solverId, priority } = body;

    if (!complaintId) {
      return NextResponse.json({ error: 'Complaint ID is required' }, { status: 400 });
    }

    const updateData: Prisma.ComplaintUncheckedUpdateInput = {};
    if (status) updateData.status = status as ComplaintStatus;
    if (solverId !== undefined) updateData.solverId = solverId;
    if (priority) updateData.priority = priority as Priority;

    const updatedComplaint = await prisma.complaint.update({
      where: { id: complaintId },
      data: updateData,
      include: {
        citizen: {
          select: { id: true, name: true, email: true }
        },
        solver: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(updatedComplaint);
  } catch (error) {
    console.error('Error updating complaint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}