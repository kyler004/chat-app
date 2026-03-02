import bcrypt from 'bcryptjs'; 
import jwt from 'jsonwebtoken'; 
import { PrismaClient } from '@prisma/client'; 

const prisma = newPrismaClient(); 

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
        
        
    }
}