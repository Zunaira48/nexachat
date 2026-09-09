import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { requestUploadSchema } from '../validators/attachment.validator';
import { requestUpload, confirm } from '../controllers/attachment.controller';

export const attachmentRouter = Router({ mergeParams: true });

attachmentRouter.use(authenticate);

attachmentRouter.post('/request-upload', validate(requestUploadSchema), requestUpload);
attachmentRouter.post('/confirm', confirm);