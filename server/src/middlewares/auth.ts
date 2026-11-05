import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'q_gen_ai_default_secret_key';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

let cachedDefaultUser: AuthUser | null = null;

export async function getDefaultUser(): Promise<AuthUser> {
  if (cachedDefaultUser) {
    return cachedDefaultUser;
  }

  try {
    let user = await prisma.user.findFirst({
      where: { role: 'TEACHER' },
    });

    if (!user) {
      user = await prisma.user.findFirst();
    }

    if (!user) {
      let inst = await prisma.institution.findFirst();
      if (!inst) {
        inst = await prisma.institution.create({
          data: {
            name: 'Apex Institute of Science & Technology',
            address: 'Knowledge Campus, Chennai, Tamil Nadu',
            contactEmail: 'contact@apex.edu',
          },
        });
      }

      user = await prisma.user.create({
        data: {
          email: 'teacher@qgenai.edu',
          name: 'Faculty Educator',
          passwordHash: 'public_access_no_auth',
          role: 'TEACHER',
          institutionId: inst.id,
        },
      });
    }

    cachedDefaultUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    return cachedDefaultUser;
  } catch (err) {
    // Fallback in-memory dummy user if database connection is cold
    return {
      id: 'default-educator-id',
      email: 'teacher@qgenai.edu',
      role: 'TEACHER',
      name: 'Faculty Educator',
    };
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      req.user = decoded;
      return next();
    } catch {
      // If token expired/invalid, seamlessly fall through to default workspace user
    }
  }

  // Public application mode: provide default teacher context with zero blocking
  try {
    req.user = await getDefaultUser();
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  return requireAuth(req, res, next);
}

