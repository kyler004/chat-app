import jwt from 'jsonwebtoken'; 
import { prisma } from '../lib/prisma.js'; 
 

export const protect = async (req, res, next) => {
    try {
        // Extract the token from the authorization header
        const authHeader = req.headers.authorization; 

        if(!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided'}); 
        }

        const token = authHeader.split(' ')[1]; // "Bearer <token>"

        //verify the token 
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 

        //Fetch fresh user data from DB
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }, 
            select: {
                id: true, 
                username: true, 
                email: true, 
                avatar: true, 
                //Password not selected to avoid exposure
            },
        });

        if (!user) {
            return res.status(401).json({ error: 'User no longer exists' }); 
        }

        // Attach the user to req object for downstream view
        req.user = user; 
        next(); // Pass control to the actual route handler
    } catch (error) {
        //Handling the error gracefully
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token'}); 
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' }); 
        }
        res.status(500).json({ error: 'Internal server error'}); 
    }; 
}