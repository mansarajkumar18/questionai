import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.js';

const router = Router();

// Get all boards grouped by category
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const where = category ? { category: String(category).toUpperCase() } : {};
    const boards = await prisma.board.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    const parsedBoards = boards.map((b) => ({
      ...b,
      defaultPatterns: b.defaultPatternsJson ? JSON.parse(b.defaultPatternsJson) : [],
    }));

    res.json({
      success: true,
      count: parsedBoards.length,
      boards: parsedBoards,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single board by ID or Code
router.get('/:identifier', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    const board = await prisma.board.findFirst({
      where: {
        OR: [{ id: identifier }, { code: identifier.toUpperCase() }],
      },
      include: {
        subjects: true,
      },
    });

    if (!board) {
      return res.status(404).json({ success: false, message: 'Educational board not found.' });
    }

    res.json({
      success: true,
      board: {
        ...board,
        defaultPatterns: board.defaultPatternsJson ? JSON.parse(board.defaultPatternsJson) : [],
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

