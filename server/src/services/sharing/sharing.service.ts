import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/db.js';

export interface CreateShareOptions {
  paperId: string;
  includeAnswerKey?: boolean;
  allowDownload?: boolean;
  expiresDays?: number;
}

export class SharingService {
  public static async createShareLink(options: CreateShareOptions) {
    const { paperId, includeAnswerKey = false, allowDownload = true, expiresDays = 14 } = options;

    let expiresAt: Date | undefined = undefined;
    if (expiresDays && expiresDays > 0) {
      expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);
    }

    const shareToken = uuidv4();

    const link = await prisma.sharedLink.create({
      data: {
        paperId,
        shareToken,
        includeAnswerKey,
        allowDownload,
        expiresAt,
      },
    });

    return link;
  }

  public static async getSharedDocument(shareToken: string) {
    const link = await prisma.sharedLink.findUnique({
      where: { shareToken },
      include: {
        paper: {
          include: {
            questions: {
              include: {
                answer: true,
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    if (!link) {
      throw new Error('Examination link not found or invalid.');
    }

    if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
      throw new Error('This examination link has expired.');
    }

    return link;
  }
}

