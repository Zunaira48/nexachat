import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

const publicUserSelect = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  createdAt: true,
} as const;

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}

export async function searchUsers(query: string, excludeUserId: string) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  return prisma.user.findMany({
    where: {
      AND: [
        { id: { not: excludeUserId } }, // never return yourself in search results
        {
          OR: [
            { username: { contains: query } },
            { displayName: { contains: query } },
          ],
        },
      ],
    },
    select: publicUserSelect,
    take: 20,
  });
}