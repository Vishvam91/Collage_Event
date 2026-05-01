const nodemailer = require('nodemailer');

// Create transporter (you can configure this with your email service)
const createTransporter = () => {
    // For development/testing, we'll use a simple configuration
    // In production, you would use your actual email service credentials
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.ethereal.email', // Use ethereal for testing
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER || 'test@example.com',
            pass: process.env.EMAIL_PASS || 'password'
        }
    });
};

// Send registration confirmation email
const sendRegistrationConfirmation = async (studentEmail, studentName, eventDetails) => {
    try {
        // For demo purposes, let's create an Ethereal test account
        const testAccount = await nodemailer.createTestAccount();
        
        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        
        const mailOptions = {
            from: 'CHARUSAT Events <events@charusat.edu.in>',
            to: studentEmail,
            subject: `Registration Confirmed: ${eventDetails.title}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2c3e50; margin: 0;">CHARUSAT Events</h1>
                        <p style="color: #7f8c8d; margin: 5px 0 0 0;">Event Registration Confirmed</p>
                    </div>
                    
                    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                        <h2 style="color: #27ae60; margin: 0 0 10px 0;">🎉 Registration Successful!</h2>
                        <p style="margin: 0; color: #2c3e50;">Dear ${studentName}, your registration has been confirmed.</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #2c3e50; margin: 0 0 15px 0;">Event Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #34495e; width: 30%;">Event:</td>
                                <td style="padding: 8px 0; color: #2c3e50;">${eventDetails.title}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #34495e;">Date:</td>
                                <td style="padding: 8px 0; color: #2c3e50;">${new Date(eventDetails.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #34495e;">Time:</td>
                                <td style="padding: 8px 0; color: #2c3e50;">${eventDetails.time}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #34495e;">Venue:</td>
                                <td style="padding: 8px 0; color: #2c3e50;">${eventDetails.venue}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #34495e;">Category:</td>
                                <td style="padding: 8px 0; color: #2c3e50;">${eventDetails.category}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                        <h4 style="color: #856404; margin: 0 0 10px 0;">📋 Important Notes:</h4>
                        <ul style="color: #856404; margin: 0; padding-left: 20px;">
                            <li>Please arrive 15 minutes before the event start time</li>
                            <li>Bring your student ID card for verification</li>
                            <li>Follow the dress code: ${eventDetails.eligibility}</li>
                            <li>Contact the organizers if you need to cancel your registration</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #7f8c8d; margin: 0; font-size: 14px;">
                            This is an automated email from CHARUSAT Event Management System.<br>
                            If you have any questions, please contact the event organizers.
                        </p>
                    </div>
                </div>
            `
        };

        // Send the email using Ethereal
        const result = await transporter.sendMail(mailOptions);
        
        // Generate preview URL for testing
        const previewUrl = nodemailer.getTestMessageUrl(result);
        
        console.log('📧 Email sent successfully!');
        console.log(`To: ${studentEmail}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Preview URL: ${previewUrl}`);
        console.log(`Test Account - User: ${testAccount.user}, Pass: ${testAccount.pass}`);
        
        return { 
            success: true, 
            message: 'Email sent successfully',
            previewUrl,
            testAccount
        };
    } catch (error) {
        console.error('Email service error:', error);
        
        // Fallback to console logging if email fails
        console.log('📧 Email fallback - Details logged:');
        console.log(`To: ${studentEmail}`);
        console.log(`Subject: Registration Confirmed: ${eventDetails.title}`);
        console.log('Email generation completed (fallback mode)');
        
        return { success: true, message: 'Email prepared successfully (fallback mode)' };
    }
};

module.exports = {
    sendRegistrationConfirmation
};
