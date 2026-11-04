import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'q_gen_ai_default_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Register User + optional Institution
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, institutionName, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let institutionId: string | undefined = undefined;
    if (institutionName && institutionName.trim().length > 0) {
      const institution = await prisma.institution.create({
        data: {
          name: institutionName.trim(),
        },
      });
      institutionId = institution.id;
    }

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name.trim(),
        role: role === 'ADMIN' ? 'ADMIN' : 'TEACHER',
        institutionId,
      },
      include: {
        institution: true,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message || 'Registration failed.' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { institution: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message || 'Login failed.' });
  }
});

// Get Current User Profile & Counts
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        institution: true,
        _count: {
          select: {
            questionPapers: true,
            syllabusDocs: true,
            examTemplates: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
        counts: user._count,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Institution Profile
router.put('/institution', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, logoUrl, address, contactEmail, examHeaderConfig } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let institution;
    if (user.institutionId) {
      institution = await prisma.institution.update({
        where: { id: user.institutionId },
        data: {
          name: name?.trim(),
          logoUrl,
          address,
          contactEmail,
          examHeaderConfig: examHeaderConfig ? JSON.stringify(examHeaderConfig) : undefined,
        },
      });
    } else {
      institution = await prisma.institution.create({
        data: {
          name: name?.trim() || 'My Educational Institution',
          logoUrl,
          address,
          contactEmail,
          examHeaderConfig: examHeaderConfig ? JSON.stringify(examHeaderConfig) : undefined,
        },
      });
      await prisma.user.update({
        where: { id: userId },
        data: { institutionId: institution.id },
      });
    }

    res.json({ success: true, institution });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
