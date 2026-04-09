// import * as dotenv from 'dotenv'
// dotenv.config()

// const startWorker = async () => {
//   try {
//     const { redis } = await import('../config/redis')
//     if (!redis) {
//       console.warn('Email worker disabled — Redis not available')
//       return
//     }

//     const { Worker } = await import('bullmq')
//     const { inviteEmailTemplate, notificationEmailTemplate } = await import('../utils/emailTemplates')
//     const nodemailer = await import('nodemailer')

//     const transporter = nodemailer.default.createTransport({
//       host: process.env.SMTP_HOST || 'smtp.gmail.com',
//       port: parseInt(process.env.SMTP_PORT || '587'),
//       secure: false,
//       auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS,
//       },
//     })

//     const worker = new Worker(
//       'emails',
//       async (job) => {
//         const { type, to, data } = job.data
//         let template
//         if (type === 'invite') template = inviteEmailTemplate(data)
//         else if (type === 'notification') template = notificationEmailTemplate(data)
//         else throw new Error(`Unknown email type: ${type}`)

//         await transporter.sendMail({
//           from: `"DevCollab" <${process.env.SMTP_USER}>`,
//           to,
//           subject: template.subject,
//           html: template.html,
//         })
//         console.log(`Email sent: ${type} to ${to}`)
//       },
//       { connection: redis }
//     )

//     worker.on('completed', (job) => console.log(`Email job ${job.id} completed`))
//     worker.on('failed', (job, err) => console.error(`Email job ${job?.id} failed:`, err.message))
//     console.log('Email worker started')
//   } catch (err) {
//     console.warn('Email worker disabled — Redis not available')
//   }
// }

// startWorker()
export {}