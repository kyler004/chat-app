import bcrypt from 'bcryptjs'; 
import jwt from 'jsonwebtoken'; 
import { prisma } from '../lib/prisma.js'; 
 

// Helper - we'll reuse this in multiple places
const generateToken = (userId) => {
    return jwt.sign(
        { userId }, 
        process.env.JWT_SECRET, 
        { expiresIn: '7d'}, 
    );
};

// POST /api/auth/regiser
export const register  = async (req, res) => {
    try {
        const {username, email, password} = req.body; 

        // Checks if the user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR : [{email}, {username}], 
            }, 
        }); 

        if (existingUser) {
            return res.status(409).json({
                error: 'Username or email already taken', 
            }); 
        }

        // Hash the password - Never store plain text
        const hashedPassword = await bcrypt.hash(password, 12); 
        // 12 is the salt rounds and suitable for production

        //Create the user
        const user = await prisma.user.create({
            data: {username, email, password: hashedPassword}, 
        }); 

        // Return token (user is logged in immediately after registering) 
        const token = generateToken(user.id); 
        
        res.status(201).json({
            token, 
            user : {
                id: user.id, 
                username: user.username, 
                email: user.email, 
            }, 
        }); 
    } catch (error) {
        console.error('Register error:', error); 
        res.status(500).json({ error: 'Internal server error' }); 
    }
}; 

//POST /api/auth/login

export const login = async (req, res) => {
    try {
        const { email, password } = req.body; 

        //Find the user
        const user = await prisma.user.findUnique({ where: {email}}); 

        if (!user) {
            // Important: Returns the same error for when the email or password is wrong so as not to indicate attackers which one is wrong
            return res.status(401).json({ error: 'Invalid credentials' }); 
        }

        //Comparing password with hash
        const isMatch = await bcrypt.compare(password, user.password); 

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' }); 
        }

        //Return the token
        const token = generateToken(user.id); 

        res.json({
            token, 
            user: {
                id: user.id, 
                username: user.username, 
                email: user.email, 
            }, 
        }); 
    } catch (error) {
        console.error('Login error:', error); 
        res.status(500).json({ error: 'Internal server error'}); 
    }
}; 

//Protected route
// GET /api/auth/me

export const getMe = async (req, res) => {
    // req.user is attached by the protect middleware
    res.json({ user: req.user }); 
}; 