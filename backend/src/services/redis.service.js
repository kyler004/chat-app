import Redis from 'ioredis'; 

//Single redis clien instance for the whole app
const redis = new Redis(process.env.REDIS_URL); 

redis.on('connect', () => console.log('✅ Redis connected')); 
redis.on('error', (err) => console.error('❌ Redis error:', err));

//cache keys
//Centralizing key patterns prevents typos and makes it easy to find
// or invalidate all keys for a given resource

export const CACHE_KEYS = {
    roomMessages: (roomId) => `room:${roomId}:messages`, 
    dmMessages: (convId) => `dm:${convId}:messages`, 
    userRooms: (userId) => `room:${userId}:rooms`, 
};

// TTL in seconds
export const CACHE_TTL = {
    messages: 60 * 60, 
    userRooms: 60 * 5, 
}; 


// Cache helpers

//Get cached messages for a room or DM
export const getCachedMessages = async (cacheKey) => {
    const data = await redis.get(cacheKey); 
    return data ? JSON.parse(data) : null; 
}; 

// Store the messages in the cache
export const setCachedMessages = async (cacheKey, messages, ttl = CACHE_TTL.messages) => {
    await redis.setex(cacheKey, ttl, JSON.stringify(messages)); 
    //SETEX = set with expiry. 
    // A ttl should be set so as to never cache forever
}; 

// Invalidating the cache key when ew messages arrive.
// Stale cache is worse than ni cache.

export const invalidateCache = async (cacheKey) => {
    await redis.del(cacheKey); 
}; 

export default redis; 