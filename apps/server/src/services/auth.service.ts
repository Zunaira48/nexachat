import argon2 from 'argon2';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import type { RegisterInput } from '../validators/auth.validator';

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: input.email }, { username: input.username }],
    },
  });

  if (existing) {
    const field = existing.email === input.email ? 'Email' : 'Username';
    throw new AppError(`${field} is already taken`, 409);
  }

  const passwordHash = await argon2.hash(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      passwordHash,
      displayName: input.displayName,
    },
  });

  // Never return passwordHash to the client
  const { passwordHash: _omit, ...safeUser } = user;
  return safeUser;
}