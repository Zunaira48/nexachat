import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  memberIds: z.array(z.string()).min(1),
});

export const addMemberSchema = z.object({
  userId: z.string().min(1),
});

export const updateGroupNameSchema = z.object({
  name: z.string().min(1).max(100),
});

export const changeRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});