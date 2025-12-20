import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { User } from '@/models/User';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req, { params }) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'Admin') {
    return NextResponse.json({ message: 'Only Admin can send password reset emails' }, { status: 403 });
  }
  
  await connectDB();

  const { id } = await params;
  
  try {
    const targetUser = await User.findById(id).select('name email');
    if (!targetUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Generate a temporary password reset token (valid for 24 hours)
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store reset token in user document
    await User.findByIdAndUpdate(id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires
    });

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Send email
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'BaseCamp StaffSync <onboarding@resend.dev>',
        to: targetUser.email,
        subject: 'Password Reset Request - BaseCamp StaffSync',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #f58327 0%, #ff9d4d 100%); color: white; padding: 30px 20px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; }
                .logo { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 5px; }
                .content { background: #ffffff; padding: 30px; }
                .detail-box { margin: 20px 0; padding: 20px; background: #fff7f0; border-left: 4px solid #f58327; border-radius: 4px; }
                .button-container { margin: 30px 0; text-align: center; }
                .button { display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; background: #f58327; color: white; box-shadow: 0 2px 4px rgba(245,131,39,0.3); transition: all 0.3s; }
                .button:hover { background: #e0741f; box-shadow: 0 4px 8px rgba(245,131,39,0.4); }
                .link-box { word-break: break-all; background: #f9fafb; padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; margin: 15px 0; font-size: 13px; color: #6b7280; }
                .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
                .warning strong { color: #f59e0b; }
                .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">BaseCamp StaffSync</div>
                  <h1>🔐 Password Reset Request</h1>
                </div>
                <div class="content">
                  <p style="font-size: 16px; color: #333;">Hello <strong style="color: #f58327;">${targetUser.name}</strong>,</p>
                  
                  <p style="font-size: 15px; color: #555; line-height: 1.8;">A password reset has been requested for your account by an administrator.</p>
                  
                  <div class="detail-box">
                    <p style="margin: 0; font-size: 14px; color: #333;">Click the button below to reset your password:</p>
                  </div>
                  
                  <div class="button-container">
                    <a href="${resetLink}" class="button">Reset Password</a>
                  </div>
                  
                  <p style="font-size: 14px; color: #555;">Or copy and paste this link into your browser:</p>
                  <div class="link-box">${resetLink}</div>
                  
                  <div class="warning">
                    <strong>⚠️ Important Security Information:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px; color: #555;">
                      <li>This link will expire in <strong>24 hours</strong></li>
                      <li>If you didn't request this, please contact your administrator immediately</li>
                      <li>Never share this link with anyone</li>
                      <li>Create a strong password with uppercase, lowercase, numbers, and special characters</li>
                    </ul>
                  </div>
                  
                  <p style="font-size: 15px; color: #333; margin-top: 25px;">Best regards,<br><strong style="color: #f58327;">BaseCamp StaffSync Team</strong></p>
                </div>
                <div class="footer">
                  <p style="margin: 5px 0;">This is an automated message. Please do not reply to this email.</p>
                  <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} BaseCamp StaffSync. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `
      });

      return NextResponse.json({ 
        message: 'Password reset email sent successfully',
        email: targetUser.email 
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return NextResponse.json({ 
        message: 'Failed to send email. Please try again later.',
        error: emailError.message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ 
      message: error.message 
    }, { status: 500 });
  }
}
