import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get complaints by day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all complaints from the last 30 days
    const recentComplaints = await prisma.complaint.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        createdAt: true
      }
    });

    // Group by date manually
    const complaintsByDate = recentComplaints.reduce((acc: Record<string, number>, complaint) => {
      const dateKey = complaint.createdAt.toISOString().split('T')[0];
      acc[dateKey] = (acc[dateKey] || 0) + 1;
      return acc;
    }, {});

    // Format data for chart
    const chartData = Object.entries(complaintsByDate).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Get department statistics (simplified approach)
    const departmentData = []; // Temporarily empty until we fix department relations

    // Get priority distribution
    const priorityStats = await prisma.complaint.groupBy({
      by: ['priority'],
      _count: {
        id: true
      }
    });

    const priorityData = priorityStats.map(stat => ({
      priority: stat.priority,
      count: stat._count.id
    }));

    return NextResponse.json({
      complaintsByDay: chartData,
      departmentStats: departmentData,
      priorityStats: priorityData
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}