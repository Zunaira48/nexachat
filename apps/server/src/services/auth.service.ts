import argon2 from 'argon2';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import type { RegisterInput, LoginInput } from '../validators/auth.validator';
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
} from '../utils/tokens';

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


interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}

async function issueSession(userId: string, meta: RequestMeta) {
  const refreshToken = generateRefreshToken();

  await (prisma as typeof prisma & { session: typeof prisma['session'] }).session.create({
    data: {
      userId,
      refreshTokenHash: hashRefreshToken(refreshToken),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return refreshToken;
}

export async function loginUser(input: LoginInput, meta: RequestMeta) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Deliberately generic error — never reveal whether it was the email
  // or password that was wrong (prevents user enumeration attacks)
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const validPassword = await argon2.verify(user.passwordHash, input.password);
  if (!validPassword) {
    throw new AppError('Invalid email or password', 401);
  }

  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshToken = await issueSession(user.id, meta);

  const { passwordHash: _omit, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken };
}

export async function refreshSession(rawRefreshToken: string, meta: RequestMeta) {
  const tokenHash = hashRefreshToken(rawRefreshToken);

  const session = await prisma.session.findFirst({
    where: { refreshTokenHash: tokenHash },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw new AppError('Invalid or expired session', 401);
  }

  // Rotate: revoke the old session, issue a brand new refresh token.
  // This means a stolen refresh token only works ONCE before the
  // legitimate user's next refresh invalidates it — a reused old
  // token after rotation is a strong signal of theft.
  await prisma.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });

  const newRefreshToken = await issueSession(session.userId, meta);
  const accessToken = signAccessToken({ sub: session.user.id, email: session.user.email });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logoutUser(rawRefreshToken: string) {
  const tokenHash = hashRefreshToken(rawRefreshToken);
  await prisma.session.updateMany({
    where: { refreshTokenHash: tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}