import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { sendComplaintConfirmationEmail } from '@/lib/email';
import { ComplaintStatus, ComplaintCategory, Priority, Complaint } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // If userId is provided, only return complaints for that user
    if (userId && session.user?.role === 'CITIZEN' && userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const whereClause = userId ? { citizenId: userId } : {};
    
    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        solver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(complaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user?.role !== 'CITIZEN') {
      return NextResponse.json({ error: 'Only citizens can submit complaints' }, { status: 403 });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const priority = formData.get('priority') as string;
    const location = formData.get('location') as string;
    const lat = formData.get('lat') ? parseFloat(formData.get('lat') as string) : null;
    const lng = formData.get('lng') ? parseFloat(formData.get('lng') as string) : null;
    const mediaFiles = formData.getAll('media') as File[];

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate category
    const validCategories = ['ROADS', 'WATER', 'ELECTRICITY', 'SANITATION', 'NOISE', 'PARKING', 'OTHER'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Validate priority
    const validPriorities = ['LOW', 'NORMAL', 'HIGH'];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
    }

    const mediaUrls: string[] = [];

    // Handle file uploads
    if (mediaFiles && mediaFiles.length > 0) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'complaints');
      await mkdir(uploadsDir, { recursive: true });

      for (const file of mediaFiles) {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          return NextResponse.json({ error: 'File size too large' }, { status: 400 });
        }

        const fileExtension = path.extname(file.name);
        const fileName = `${uuidv4()}${fileExtension}`;
        const filePath = path.join(uploadsDir, fileName);

        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        mediaUrls.push(`/uploads/complaints/${fileName}`);
      }
    }

    // Create complaint
    const complaint = await prisma.complaint.create({
      data: {
        title,
        description,
        category: category as ComplaintCategory,
        priority: (priority as Priority) || 'NORMAL',
        status: 'SUBMITTED' as ComplaintStatus,
        location,
        lat,
        lng,
        images: mediaUrls.length > 0 ? JSON.stringify(mediaUrls) : null,
        citizenId: session.user.id,
        userId: session.user.id,
      },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send confirmation email to citizen
    if (complaint.citizenId) {
      const citizen = await prisma.user.findUnique({
        where: { id: complaint.citizenId },
        select: { email: true, name: true }
      });
      
      if (citizen?.email) {
        try {
          await sendComplaintConfirmationEmail(
            citizen.email,
            complaint as Complaint,
            citizen.name || 'User'
          );
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
          // Don't fail the request if email sending fails
        }
      }
    }

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    console.error('Error creating complaint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}