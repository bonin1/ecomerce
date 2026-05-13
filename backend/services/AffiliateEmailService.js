const nodemailer = require('nodemailer');

class AffiliateEmailService {
    constructor() {
        this.transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });
    }

    async sendAffiliateApprovalEmail(affiliate) {
        try {
            const affiliateLink = `${process.env.FRONTEND_URL}/affiliate?ref=${affiliate.affiliateCode}`;
            
            const emailTemplate = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Congratulations! Your Affiliate Application is Approved</h2>
                    
                    <p>Dear ${affiliate.name},</p>
                    
                    <p>We're excited to inform you that your affiliate application has been approved! You can now start earning commissions by promoting our products.</p>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #1f2937; margin-top: 0;">Your Affiliate Details:</h3>
                        <p><strong>Affiliate Code:</strong> ${affiliate.affiliateCode}</p>
                        <p><strong>Commission Rate:</strong> ${affiliate.commissionRate}%</p>
                        <p><strong>Your Affiliate Link:</strong><br>
                        <a href="${affiliateLink}" style="color: #2563eb; word-break: break-all;">${affiliateLink}</a></p>
                    </div>
                    
                    <h3 style="color: #1f2937;">How to Get Started:</h3>
                    <ol>
                        <li>Visit your <a href="${process.env.FRONTEND_URL}/affiliate" style="color: #2563eb;">affiliate dashboard</a></li>
                        <li>Use your unique affiliate link to promote our products</li>
                        <li>Track your clicks and conversions in real-time</li>
                        <li>Earn ${affiliate.commissionRate}% commission on every sale</li>
                    </ol>
                    
                    <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #1e40af;"><strong>Pro Tip:</strong> Share your affiliate link on social media, blogs, or with friends to maximize your earnings!</p>
                    </div>
                    
                    <p>If you have any questions, feel free to contact our affiliate support team.</p>
                    
                    <p>Best regards,<br>The Affiliate Team</p>
                </div>
            `;

            const mailOptions = {
                from: process.env.SMTP_FROM || '"Affiliate Program" <noreply@ecommerce.com>',
                to: affiliate.email,
                subject: 'Your Affiliate Application is Approved! 🎉',
                html: emailTemplate
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Affiliate approval email sent:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Error sending affiliate approval email:', error);
            return { success: false, error: error.message };
        }
    }

    async sendAffiliateRejectionEmail(affiliate, reason = 'Application does not meet our current requirements') {
        try {
            const emailTemplate = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #dc2626;">Affiliate Application Update</h2>
                    
                    <p>Dear ${affiliate.name},</p>
                    
                    <p>Thank you for your interest in our affiliate program. After careful review, we regret to inform you that your application has not been approved at this time.</p>
                    
                    <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                        <h3 style="color: #991b1b; margin-top: 0;">Reason:</h3>
                        <p style="margin: 0;">${reason}</p>
                    </div>
                    
                    <p>You're welcome to reapply in the future. We encourage you to:</p>
                    <ul>
                        <li>Build your online presence and audience</li>
                        <li>Create quality content related to our industry</li>
                        <li>Review our affiliate program requirements</li>
                    </ul>
                    
                    <p>Thank you for your understanding.</p>
                    
                    <p>Best regards,<br>The Affiliate Team</p>
                </div>
            `;

            const mailOptions = {
                from: process.env.SMTP_FROM || '"Affiliate Program" <noreply@ecommerce.com>',
                to: affiliate.email,
                subject: 'Affiliate Application Status Update',
                html: emailTemplate
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Affiliate rejection email sent:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Error sending affiliate rejection email:', error);
            return { success: false, error: error.message };
        }
    }

    async sendWeeklyPerformanceReport(affiliate, stats) {
        try {
            const emailTemplate = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Your Weekly Affiliate Performance Report</h2>
                    
                    <p>Hi ${affiliate.name},</p>
                    
                    <p>Here's your performance summary for the past week:</p>
                    
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                                <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 16px;">Total Clicks</h3>
                                <p style="font-size: 24px; font-weight: bold; color: #2563eb; margin: 0;">${stats.weeklyClicks}</p>
                            </div>
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                                <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 16px;">Conversions</h3>
                                <p style="font-size: 24px; font-weight: bold; color: #059669; margin: 0;">${stats.weeklyConversions}</p>
                            </div>
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                                <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 16px;">Conversion Rate</h3>
                                <p style="font-size: 24px; font-weight: bold; color: #7c3aed; margin: 0;">${stats.conversionRate}%</p>
                            </div>
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                                <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 16px;">Earnings</h3>
                                <p style="font-size: 24px; font-weight: bold; color: #dc2626; margin: 0;">$${stats.weeklyEarnings}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #065f46;"><strong>Keep it up!</strong> Visit your <a href="${process.env.FRONTEND_URL}/affiliate" style="color: #059669;">affiliate dashboard</a> for detailed analytics and new promotional materials.</p>
                    </div>
                    
                    <p>Best regards,<br>The Affiliate Team</p>
                </div>
            `;

            const mailOptions = {
                from: process.env.SMTP_FROM || '"Affiliate Program" <noreply@ecommerce.com>',
                to: affiliate.email,
                subject: `Weekly Report: ${stats.weeklyEarnings > 0 ? '$' + stats.weeklyEarnings + ' earned' : 'Keep pushing!'} 📊`,
                html: emailTemplate
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Weekly performance email sent:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Error sending weekly performance email:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new AffiliateEmailService();
