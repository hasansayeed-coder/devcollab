// import Redis from 'ioredis'
// import { env } from './env'

// let redis: Redis | null = null

// const createRedis = () => {
//   try {
//     const client = new Redis(env.redisUrl, {
//       maxRetriesPerRequest: null,
//       lazyConnect: true,
//       retryStrategy: () => null,
//       reconnectOnError: () => false,
//     })

//     client.on('error', () => {
//       // silently ignore — Redis is optional
//     })

//     return client
//   } catch {
//     return null
//   }
// }

// redis = createRedis()

// export { redis }

export const redis: any = null