const transporter = require('../config/EmailConfig');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

exports.sendVerificationEmail = async (email, verificationToken) => {
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verificationUrl = `${frontendUrl}/verify-email/verify?token=${verificationToken}`;
        
        let template = await fs.readFile(
            path.join(__dirname, '../template/VerificationEmailTemplate.html'),
            'utf8'
        );

        template = template
            .replace('#{VERIFICATION_URL}#', verificationUrl)
            .replace('#{LOGO_URL}#', `${process.env.BASE_URL}/static/image/STRIKETECH-1.png`)
            .replace('#{FACEBOOK_ICON}#', `${process.env.BASE_URL}/static/image/facebook.png`)
            .replace('#{TWITTER_ICON}#', `${process.env.BASE_URL}/static/image/twitter.png`)
            .replace('#{INSTAGRAM_ICON}#', `${process.env.BASE_URL}/static/image/instagram.png`)
            .replace('#{FACEBOOK_URL}#', process.env.FACEBOOK_URL || '#')
            .replace('#{TWITTER_URL}#', process.env.TWITTER_URL || '#')
            .replace('#{INSTAGRAM_URL}#', process.env.INSTAGRAM_URL || '#');

        const mailOptions = {
            from: {
                name: 'StrikeTech',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: 'Verify Your Email - StrikeTech',
            html: template
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending error:', error);
        return false;
    }
};

exports.sendPasswordResetEmail = async (email, resetToken) => {
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
        
        let template = await fs.readFile(
            path.join(__dirname, '../template/PasswordResetTemplate.html'),
            'utf8'
        );

        template = template
            .replace('#{RESET_URL}#', resetUrl)
            .replace('#{LOGO_URL}#', `${process.env.BASE_URL}/static/image/STRIKETECH-1.png`);

        const mailOptions = {
            from: {
                name: 'StrikeTech',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: 'Password Reset Request - StrikeTech',
            html: template
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending error:', error);
        return false;
    }
};

exports.sendNewDeviceLoginAlert = async (email, deviceInfo) => {
    try {
        let template = await fs.readFile(
            path.join(__dirname, '../template/NewDeviceLoginTemplate.html'),
            'utf8'
        );

        template = template
            .replace('#{DEVICE_INFO}#', `${deviceInfo.browser} on ${deviceInfo.os}`)
            .replace('#{IP_ADDRESS}#', deviceInfo.ip)
            .replace('#{LOGIN_TIME}#', new Date().toLocaleString());

        const mailOptions = {
            from: {
                name: 'StrikeTech',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: 'New Device Login Detected - StrikeTech',
            html: template
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending error:', error);
        return false;
    }
};

exports.sendOTPEmail = async (email, otp) => {
    try {
        let template = await fs.readFile(
            path.join(__dirname, '../template/OTPEmailTemplate.html'),
            'utf8'
        );

        template = template
            .replace('#{OTP_CODE}#', otp)
            .replace('#{LOGO_URL}#', `${process.env.BASE_URL}/static/image/STRIKETECH-1.png`);

        const mailOptions = {
            from: {
                name: 'StrikeTech',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: 'Your Login OTP Code - StrikeTech',
            html: template
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('OTP Email sending error:', error);
        return false;
    }
};

exports.sendOrderConfirmationEmail = async (email, orderDetails) => {
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const trackOrderUrl = `${frontendUrl}/account/orders/${orderDetails.id}`;
        
        let template = await fs.readFile(
            path.join(__dirname, '../template/OrderConfirmationEmailTemplate.html'),
            'utf8'
        );

        // Generate order items HTML
        let orderItemsHtml = '';
        if (orderDetails.items && orderDetails.items.length) {
            orderDetails.items.forEach(item => {
                // Convert price to number before using toFixed
                const price = parseFloat(item.price);
                orderItemsHtml += `
                <tr>
                    <td style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">${item.product_name}</td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">${item.quantity}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">$${price.toFixed(2)}</td>
                </tr>
                `;
            });
        }

        // Convert total_amount to number for safe formatting
        const totalAmount = parseFloat(orderDetails.total_amount);

        template = template
            .replace('#{LOGO_URL}#', `${process.env.BASE_URL}/static/image/STRIKETECH-1.png`)
            .replace('#{ORDER_NUMBER}#', orderDetails.order_number)
            .replace('#{ORDER_DATE}#', new Date(orderDetails.createdAt).toLocaleDateString())
            .replace('#{ORDER_TOTAL}#', totalAmount.toFixed(2))
            .replace('#{PAYMENT_METHOD}#', orderDetails.payment_method)
            .replace('#{ORDER_ITEMS}#', orderItemsHtml)
            .replace('#{SHIPPING_ADDRESS}#', orderDetails.shipping_address)
            .replace('#{SHIPPING_CITY}#', orderDetails.shipping_city)
            .replace('#{SHIPPING_POSTAL}#', orderDetails.shipping_postal_code)
            .replace('#{SHIPPING_COUNTRY}#', orderDetails.shipping_country)
            .replace('#{ORDER_NOTES}#', orderDetails.notes || 'No additional notes')
            .replace('#{TRACK_ORDER_URL}#', trackOrderUrl);

        const mailOptions = {
            from: {
                name: 'StrikeTech',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: `Order Confirmed: ${orderDetails.order_number} - StrikeTech`,
            html: template
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Order confirmation email sending error:', error);
        return false;
    }
};

exports.sendSubscriptionWelcomeEmail = async (email, unsubscribeToken) => {
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const unsubscribeUrl = `${frontendUrl}/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken}`;
        
        let template = await fs.readFile(
            path.join(__dirname, '../template/SubscriptionWelcomeTemplate.html'),
            'utf8'
        );

        const currentYear = new Date().getFullYear();

        template = template
            .replace('#{LOGO_URL}#', `${process.env.BASE_URL}/static/image/STRIKETECH-1.png`)
            .replace('#{SHOP_URL}#', frontendUrl)
            .replace('#{UNSUBSCRIBE_URL}#', unsubscribeUrl)
            .replace('#{FACEBOOK_URL}#', process.env.FACEBOOK_URL || '#')
            .replace('#{TWITTER_URL}#', process.env.TWITTER_URL || '#')
            .replace('#{INSTAGRAM_URL}#', process.env.INSTAGRAM_URL || '#')
            .replace('#{FACEBOOK_ICON}#', `${process.env.BASE_URL}/static/image/facebook.png`)
            .replace('#{TWITTER_ICON}#', `${process.env.BASE_URL}/static/image/twitter.png`)
            .replace('#{INSTAGRAM_ICON}#', `${process.env.BASE_URL}/static/image/instagram.png`)
            .replace('#{CURRENT_YEAR}#', currentYear);

        const mailOptions = {
            from: {
                name: 'StrikeTech Newsletter',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: 'Welcome to StrikeTech Newsletter',
            html: template
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Subscription welcome email sending error:', error);
        return false;
    }
};

exports.sendUnsubscribeConfirmationEmail = async (email) => {
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resubscribeUrl = `${frontendUrl}/newsletter/subscribe`;
        
        let template = await fs.readFile(
            path.join(__dirname, '../template/UnsubscribeConfirmationTemplate.html'),
            'utf8'
        );

        const currentYear = new Date().getFullYear();

        template = template
            .replace('#{LOGO_URL}#', `${process.env.BASE_URL}/static/image/STRIKETECH-1.png`)
            .replace('#{RESUBSCRIBE_URL}#', resubscribeUrl)
            .replace('#{CURRENT_YEAR}#', currentYear);

        const mailOptions = {
            from: {
                name: 'StrikeTech Newsletter',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: "You've Unsubscribed from StrikeTech Newsletter'",
            html: template
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Unsubscribe confirmation email sending error:', error);
        return false;
    }
};

exports.sendJobApplicationConfirmationEmail = async (email, applicationData) => {
    try {
        let template = await fs.readFile(
            path.join(__dirname, '../template/JobApplicationConfirmationTemplate.html'),
            'utf8'
        );

        const currentYear = new Date().getFullYear();
        const applicationDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        template = template
            .replace('#{LOGO_URL}#', `${process.env.BASE_URL}/static/image/STRIKETECH-1.png`)
            .replace('#{APPLICANT_NAME}#', applicationData.name)
            .replace('#{JOB_TITLE}#', applicationData.jobTitle)
            .replace('#{JOB_LOCATION}#', applicationData.jobLocation)
            .replace('#{APPLICATION_DATE}#', applicationDate)
            .replace('#{CURRENT_YEAR}#', currentYear);

        const mailOptions = {
            from: {
                name: 'StrikeTech Careers',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: `Application Received: ${applicationData.jobTitle} - StrikeTech`,
            html: template
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Job application confirmation email error:', error);
        return false;
    }
};

exports.sendApplicationStatusUpdateEmail = async (email, statusData) => {
    try {
        let template = await fs.readFile(
            path.join(__dirname, '../template/ApplicationStatusUpdateTemplate.html'),
            'utf8'
        );

        const currentYear = new Date().getFullYear();

        if (statusData.status === 'approved') {
            template = template
                .replace('#{APPROVED_BLOCK_START}#', '')
                .replace('#{APPROVED_BLOCK_END}#', '')
                .replace('#{REJECTED_BLOCK_START}#', '<!--')
                .replace('#{REJECTED_BLOCK_END}#', '-->');
        } else {
            template = template
                .replace('#{APPROVED_BLOCK_START}#', '<!--')
                .replace('#{APPROVED_BLOCK_END}#', '-->')
                .replace('#{REJECTED_BLOCK_START}#', '')
                .replace('#{REJECTED_BLOCK_END}#', '');
        }

        if (statusData.feedbackNote && statusData.feedbackNote.trim() !== '') {
            template = template
                .replace('#{FEEDBACK_BLOCK_START}#', '')
                .replace('#{FEEDBACK_BLOCK_END}#', '')
                .replace('#{FEEDBACK_NOTE}#', statusData.feedbackNote);
        } else {
            template = template
                .replace('#{FEEDBACK_BLOCK_START}#', '<!--')
                .replace('#{FEEDBACK_BLOCK_END}#', '-->');
        }

        template = template
            .replace('#{LOGO_URL}#', `${process.env.BASE_URL}/static/image/STRIKETECH-1.png`)
            .replace(/#{APPLICANT_NAME}#/g, statusData.name)
            .replace(/#{JOB_TITLE}#/g, statusData.jobTitle)
            .replace('#{CURRENT_YEAR}#', currentYear);

        const mailOptions = {
            from: {
                name: 'StrikeTech Careers',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: `Application Status Update: ${statusData.jobTitle} - StrikeTech`,
            html: template
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Application status update email error:', error);
        return false;
    }
};

exports.sendTrackingUpdateEmail = async (email, trackingData) => {
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const trackingUrl = `${frontendUrl}/track-order?order=${trackingData.orderNumber}&track=${trackingData.trackingNumber}`;
        const contactUrl = `${frontendUrl}/help`;
        
        let template = await fs.readFile(
            path.join(__dirname, '../template/OrderTrackingUpdateTemplate.html'),
            'utf8'
        );

        let estimatedDelivery = 'Not available';
        if (trackingData.estimatedDelivery) {
            estimatedDelivery = new Date(trackingData.estimatedDelivery).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        const formatStatus = (status) => {
            return status
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        };

        template = template
            .replace('#{LOGO_URL}#', `${process.env.BASE_URL}/static/image/STRIKETECH-1.png`)
            .replace('#{CUSTOMER_NAME}#', trackingData.customerName)
            .replace('#{ORDER_NUMBER}#', trackingData.orderNumber)
            .replace('#{ORDER_STATUS}#', formatStatus(trackingData.status))
            .replace('#{CURRENT_LOCATION}#', trackingData.location || 'Not specified')
            .replace('#{CARRIER}#', trackingData.carrier || 'Not specified')
            .replace('#{TRACKING_NUMBER}#', trackingData.trackingNumber || 'Not available')
            .replace('#{ESTIMATED_DELIVERY}#', estimatedDelivery)
            .replace('#{UPDATE_DESCRIPTION}#', trackingData.description || 'No additional details available.')
            .replace('#{TRACKING_URL}#', trackingUrl)
            .replace('#{CONTACT_URL}#', contactUrl);

        const mailOptions = {
            from: {
                name: 'StrikeTech Order Tracking',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: `Order Update: ${trackingData.orderNumber} - ${formatStatus(trackingData.status)}`,
            html: template
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Tracking update email sending error:', error);
        return false;
    }
};
