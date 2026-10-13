import Redis from 'ioredis';


//Single redis clien instance for the whole app
const redis = new Redis.default(process.env.REDIS_URL as string);

redis.on('connect', () => console.log('✅ Redis connected')); 
redis.on('error', (err: any) => console.error('❌ Redis error:', err));

//cache keys
//Centralizing key patterns prevents typos and makes it easy to find
// or invalidate all keys for a given resource

export const CACHE_KEYS = {
    roomMessages: (roomId: any) => `room:${roomId}:messages`,
    dmMessages: (convId: any) => `dm:${convId}:messages`,
    userRooms: (userId: any) => `room:${userId}:rooms`,
};

// TTL in seconds
export const CACHE_TTL = {
    messages: 60 * 60, 
    userRooms: 60 * 5, 
}; 


// Cache helpers

//Get cached messages for a room or DM
export const getCachedMessages = async (cacheKey: any) => {
    const data = await redis.get(cacheKey); 
    return data ? JSON.parse(data) : null; 
}; 

// Store the messages in the cache
export const setCachedMessages = async (cacheKey: any, messages: any, ttl = CACHE_TTL.messages) => {
    await redis.setex(cacheKey, ttl, JSON.stringify(messages)); 
    //SETEX = set with expiry. 
    // A ttl should be set so as to never cache forever
}; 

// Invalidating the cache key when ew messages arrive.
// Stale cache is worse than ni cache.

export const invalidateCache = async (cacheKey: any) => {
    await redis.del(cacheKey); 
}; 

export default redis; 