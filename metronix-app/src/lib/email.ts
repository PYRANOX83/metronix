import nodemailer from 'nodemailer';
import { Complaint, ComplaintStatus, Priority, ComplaintCategory } from '@prisma/client';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

// Email templates
export const emailTemplates = {
  complaintConfirmation: (complaint: Complaint, citizenName: string) => ({
    subject: `Complaint Submitted - ${complaint.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #007bff; margin-bottom: 20px;">Complaint Confirmation</h2>
          <p>Dear ${citizenName},</p>
          <p>Your complaint has been successfully submitted. Here are the details:</p>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #333;">${complaint.title}</h3>
            <p><strong>Category:</strong> ${complaint.category}</p>
            <p><strong>Priority:</strong> ${complaint.priority}</p>
            <p><strong>Location:</strong> ${complaint.location || 'Not specified'}</p>
            <p><strong>Description:</strong> ${complaint.description}</p>
            <p><strong>Status:</strong> <span style="color: #28a745;">Pending</span></p>
          </div>
          
          <p>We will review your complaint and assign it to the appropriate department shortly.</p>
          <p>You can track the progress of your complaint through your dashboard.</p>
          
          <p style="margin-top: 30px;">Best regards,<br>Metronix Team</p>
        </div>
      </div>
    `,
  }),

  complaintAssignment: (complaint: Complaint, solverName: string) => ({
    subject: `New Complaint Assigned - ${complaint.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #dc3545; margin-bottom: 20px;">New Complaint Assignment</h2>
          <p>Dear ${solverName},</p>
          <p>A new complaint has been assigned to you. Please review and take appropriate action.</p>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #333;">${complaint.title}</h3>
            <p><strong>Category:</strong> ${complaint.category}</p>
            <p><strong>Priority:</strong> ${complaint.priority}</p>
            <p><strong>Location:</strong> ${complaint.location || 'Not specified'}</p>
            <p><strong>Description:</strong> ${complaint.description}</p>
            <p><strong>Status:</strong> <span style="color: #ffc107;">Assigned</span></p>
          </div>
          
          <p>Please log in to your dashboard to view the complete details and start working on this complaint.</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/solver/dashboard" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              View Dashboard
            </a>
          </div>
          
          <p style="margin-top: 30px;">Best regards,<br>Metronix Team</p>
        </div>
      </div>
    `,
  }),

  statusUpdate: (complaint: Complaint, citizenName: string, newStatus: string, note?: string) => ({
    subject: `Complaint Status Updated - ${complaint.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #17a2b8; margin-bottom: 20px;">Complaint Status Update</h2>
          <p>Dear ${citizenName},</p>
          <p>The status of your complaint has been updated.</p>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #333;">${complaint.title}</h3>
            <p><strong>Previous Status:</strong> ${complaint.status}</p>
            <p><strong>New Status:</strong> <span style="color: #28a745; font-weight: bold;">${newStatus}</span></p>
            ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
          </div>
          
          <p>You can view the complete details and track progress through your dashboard.</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/citizen/dashboard" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              View Dashboard
            </a>
          </div>
          
          <p style="margin-top: 30px;">Best regards,<br>Metronix Team</p>
        </div>
      </div>
    `,
  }),

  dailySummary: (complaints: Complaint[], adminName: string, date: string) => ({
    subject: `Daily Complaint Summary - ${date}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #6f42c1; margin-bottom: 20px;">Daily Complaint Summary</h2>
          <p>Dear ${adminName},</p>
          <p>Here is the summary of complaints for ${date}:</p>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #333;">Summary Statistics</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 10px 0;"><strong>Total Complaints:</strong> ${complaints.length}</li>
              <li style="margin: 10px 0;"><strong>Submitted:</strong> ${complaints.filter(c => c.status === 'SUBMITTED').length}</li>
              <li style="margin: 10px 0;"><strong>Assigned:</strong> ${complaints.filter(c => c.status === 'ASSIGNED').length}</li>
            <li style="margin: 10px 0;"><strong>Resolved:</strong> ${complaints.filter(c => c.status === 'RESOLVED').length}</li>
            </ul>
          </div>
          
          ${complaints.length > 0 ? `
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #333;">Recent Complaints</h3>
            ${complaints.slice(0, 5).map(complaint => `
              <div style="border-left: 3px solid #007bff; padding-left: 10px; margin: 10px 0;">
                <strong>${complaint.title}</strong><br>
                <small>Category: ${complaint.category} | Priority: ${complaint.priority} | Status: ${complaint.status}</small>
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/dashboard" 
               style="background-color: #6f42c1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              View Full Dashboard
            </a>
          </div>
          
          <p style="margin-top: 30px;">Best regards,<br>Metronix Team</p>
        </div>
      </div>
    `,
  }),
};

// Email sending functions
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('Email configuration not found, skipping email sending');
      return { success: false, error: 'Email configuration not available' };
    }

    const info = await transporter.sendMail({
      from: `"Metronix" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Convenience functions for specific email types
export async function sendComplaintConfirmationEmail(to: string, complaint: Complaint, citizenName: string) {
  const template = emailTemplates.complaintConfirmation(complaint, citizenName);
  return sendEmail(to, template.subject, template.html);
}

export async function sendComplaintAssignmentEmail(to: string, complaint: Complaint, solverName: string) {
  const template = emailTemplates.complaintAssignment(complaint, solverName);
  return sendEmail(to, template.subject, template.html);
}

export async function sendStatusUpdateEmail(to: string, complaint: Complaint, citizenName: string, newStatus: string, note?: string) {
  const template = emailTemplates.statusUpdate(complaint, citizenName, newStatus, note);
  return sendEmail(to, template.subject, template.html);
}

export async function sendDailySummaryEmail(to: string, complaints: Complaint[], adminName: string, date: string) {
  const template = emailTemplates.dailySummary(complaints, adminName, date);
  return sendEmail(to, template.subject, template.html);
}