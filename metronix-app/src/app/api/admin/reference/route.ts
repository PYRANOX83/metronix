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

    const [departments, solvers] = await Promise.all([
      prisma.department.findMany({
        select: { id: true, name: true }
      }),
      prisma.solver.findMany({
        select: {
          id: true,
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })
    ]);

    return NextResponse.json({
      departments,
      solvers: solvers.map((solver) => ({
        id: solver.id,
        name: solver.user?.name || 'Unknown',
        email: solver.user?.email || 'No email'
      }))
    });

  } catch (error) {
    console.error('Error fetching reference data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}