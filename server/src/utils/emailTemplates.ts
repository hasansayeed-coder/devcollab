export const inviteEmailTemplate = (data: {
  inviterUsername: string
  projectName: string
  inviteUrl: string
}) => ({
  subject: `You've been invited to join ${data.projectName} on DevCollab`,
  html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a1a;">You have a new invitation</h2>
      <p style="color: #555;">
        <strong>${data.inviterUsername}</strong> has invited you to collaborate on
        <strong>${data.projectName}</strong> on DevCollab.
      </p>
      
        href="${data.inviteUrl}"
        style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1a1a1a;color:#fff;border-radius:8px;text-decoration:none;font-weight:500;"
      >
        View Project
      </a>
      <p style="margin-top:24px;color:#999;font-size:12px;">
        If you didn't expect this invitation, you can ignore this email.
      </p>
    </div>
  `,
})

export const notificationEmailTemplate = (data: {
  username: string
  message: string
  actionUrl: string
}) => ({
  subject: `New notification on DevCollab`,
  html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a1a;">Hi ${data.username},</h2>
      <p style="color: #555;">${data.message}</p>
      
        href="${data.actionUrl}"
        style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1a1a1a;color:#fff;border-radius:8px;text-decoration:none;font-weight:500;"
      >
        View on DevCollab
      </a>
    </div>
  `,
})