const Redis = require('ioredis')
const dotenv = require('dotenv')

dotenv.config()

export const redis = new Redis(process.env.UPSTASH_REDIS_URL)