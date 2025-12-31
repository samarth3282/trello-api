const transporter = require('../config/email');
const logger = require('../utils/logger');

class EmailService {
    // Send welcome email
    static async sendWelcomeEmail(to, userData) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to,
                subject: 'Welcome to Task Management System',
                html: `
          <h1>Welcome ${userData.name}!</h1>
          <p>Thank you for registering with our Task Management System.</p>
          <p>You can now start creating projects and collaborating with your team.</p>
          <br>
          <p>Best regards,<br>Task Management Team</p>
        `,
            };

            await transporter.sendMail(mailOptions);
            logger.info(`Welcome email sent to ${to}`);
        } catch (error) {
            logger.error(`Failed to send welcome email to ${to}:`, error);
        }
    }

    // Send project invitation
    static async sendProjectInvite(to, inviteData) {
        try {
            const inviteUrl = `${process.env.CORS_ORIGIN}/accept-invite/${inviteData.inviteToken}`;

            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to,
                subject: `You've been invited to join ${inviteData.projectName}`,
                html: `
          <h1>Project Invitation</h1>
          <p>Hi there!</p>
          <p><strong>${inviteData.inviterName}</strong> has invited you to join the project <strong>${inviteData.projectName}</strong> as a <strong>${inviteData.role}</strong>.</p>
          <p>Click the link below to accept the invitation:</p>
          <a href="${inviteUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
          <p>Or copy and paste this URL into your browser:</p>
          <p>${inviteUrl}</p>
          <p>This invitation will expire in 7 days.</p>
          <br>
          <p>Best regards,<br>Task Management Team</p>
        `,
            };

            await transporter.sendMail(mailOptions);
            logger.info(`Project invitation sent to ${to}`);
        } catch (error) {
            logger.error(`Failed to send project invitation to ${to}:`, error);
        }
    }

    // Send task assignment notification
    static async sendTaskAssignment(to, taskData) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to,
                subject: `New Task Assigned: ${taskData.title}`,
                html: `
          <h1>New Task Assigned</h1>
          <p>You have been assigned a new task:</p>
          <h2>${taskData.title}</h2>
          <p><strong>Priority:</strong> ${taskData.priority}</p>
          <p><strong>Due Date:</strong> ${taskData.dueDate ? new Date(taskData.dueDate).toLocaleDateString() : 'Not set'}</p>
          <p><strong>Description:</strong></p>
          <p>${taskData.description || 'No description provided'}</p>
          <br>
          <p>Best regards,<br>Task Management Team</p>
        `,
            };

            await transporter.sendMail(mailOptions);
            logger.info(`Task assignment notification sent to ${to}`);
        } catch (error) {
            logger.error(`Failed to send task assignment notification to ${to}:`, error);
        }
    }

    // Send comment mention notification
    static async sendMentionNotification(to, mentionData) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to,
                subject: `You were mentioned in a comment`,
                html: `
          <h1>You Were Mentioned</h1>
          <p><strong>${mentionData.authorName}</strong> mentioned you in a comment on task <strong>${mentionData.taskTitle}</strong>:</p>
          <blockquote style="border-left: 4px solid #ccc; padding-left: 15px; margin: 15px 0;">
            ${mentionData.content}
          </blockquote>
          <br>
          <p>Best regards,<br>Task Management Team</p>
        `,
            };

            await transporter.sendMail(mailOptions);
            logger.info(`Mention notification sent to ${to}`);
        } catch (error) {
            logger.error(`Failed to send mention notification to ${to}:`, error);
        }
    }

    // Send daily digest
    static async sendDailyDigest(to, digestData) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to,
                subject: 'Your Daily Task Digest',
                html: `
          <h1>Daily Task Digest</h1>
          <h2>Tasks Assigned to You</h2>
          <ul>
            ${digestData.assignedTasks.map(task => `
              <li>
                <strong>${task.title}</strong> - ${task.status} (${task.priority})
                ${task.dueDate ? `<br><small>Due: ${new Date(task.dueDate).toLocaleDateString()}</small>` : ''}
              </li>
            `).join('')}
          </ul>
          
          <h2>Recent Activity</h2>
          <ul>
            ${digestData.activities.map(activity => `
              <li>${activity.description} - <small>${new Date(activity.createdAt).toLocaleString()}</small></li>
            `).join('')}
          </ul>
          
          <br>
          <p>Best regards,<br>Task Management Team</p>
        `,
            };

            await transporter.sendMail(mailOptions);
            logger.info(`Daily digest sent to ${to}`);
        } catch (error) {
            logger.error(`Failed to send daily digest to ${to}:`, error);
        }
    }
}

module.exports = EmailService;
