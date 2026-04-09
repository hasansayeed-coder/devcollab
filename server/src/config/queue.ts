// let emailQueue: any = null

// const initQueue = async () => {
//   try {
//     const { redis } = await import('./redis')
//     if (!redis) {
//       console.warn('Email queue disabled — Redis not available')
//       return
//     }

//     const { Queue } = await import('bullmq')
//     emailQueue = new Queue('emails', {
//       connection: redis,
//       defaultJobOptions: {
//         attempts: 3,
//         backoff: { type: 'exponential', delay: 2000 },
//         removeOnComplete: 100,
//         removeOnFail: 50,
//       },
//     })
//     console.log('Email queue ready')
//   } catch {
//     console.warn('Email queue disabled — Redis not available')
//   }
// }

// initQueue()

// export { emailQueue }

export const emailQueue: any = null