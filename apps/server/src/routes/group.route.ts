import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  createGroupSchema,
  addMemberSchema,
  updateGroupNameSchema,
  changeRoleSchema,
} from '../validators/group.validator';
import {
  create,
  addMemberHandler,
  removeMemberHandler,
  leaveHandler,
  renameHandler,
  changeRoleHandler,
} from '../controllers/group.controller';

export const groupRouter = Router();

groupRouter.use(authenticate);

groupRouter.post('/', validate(createGroupSchema), create);
groupRouter.post('/:conversationId/members', validate(addMemberSchema), addMemberHandler);
groupRouter.delete('/:conversationId/members/:userId', removeMemberHandler);
groupRouter.post('/:conversationId/leave', leaveHandler);
groupRouter.patch('/:conversationId', validate(updateGroupNameSchema), renameHandler);
groupRouter.patch(
  '/:conversationId/members/:userId/role',
  validate(changeRoleSchema),
  changeRoleHandler,
);