import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';


// Helper - we'll reuse this in multiple places
const generateToken = (userId: any) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d'},
    );
};

// POST /api/auth/register
export const register  = async (req: any, res: any) => {
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
    } catch (error: any) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//POST /api/auth/login

export const login = async (req: any, res: any) => {
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
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error'});
    }
};

//Protected route
// GET /api/auth/me

export const getMe = async (req: any, res: any) => {
    // req.user is attached by the protect middleware
    res.json({ user: (req as any).user });
};

// Google OAuth Manual Flow
export const googleAuth = (req: any, res: any) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || 'placeholder_client_id';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/auth/google/callback';

    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: redirectUri,
      client_id: clientId,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' '),
    };

    const qs = new URLSearchParams(options);
    res.redirect(`${rootUrl}?${qs.toString()}`);
};

export const googleAuthCallback = async (req: any, res: any) => {
    const code = req.query.code as string;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is missing' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || 'placeholder_client_id';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'placeholder_client_secret';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/auth/google/callback';
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenRes.json();

      if (!tokenData.access_token) {
        throw new Error('Failed to retrieve access token from Google');
      }

      // Fetch user profile from Google
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const userData = await userRes.json();

      if (!userData.email) {
        throw new Error('No email found in Google profile');
      }

      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      // If user doesn't exist, create one
      if (!user) {
        // Create a random password since they use Google
        const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(randomPassword, 12);

        user = await prisma.user.create({
          data: {
            username: userData.name || userData.email.split('@')[0],
            email: userData.email,
            password: hashedPassword,
          }
        });
      }

      // Create our JWT
      const token = generateToken(user.id);

      // Redirect to frontend with token
      // In a real app, you might want to use httpOnly cookies instead of query params
      res.redirect(`${clientUrl}/login?token=${token}`);

    } catch (error: any) {
      console.error('Google Auth Error:', error);
      res.redirect(`${clientUrl}/login?error=oauth_failed`);
    }
};
