import { Router } from 'express';
import * as literatureController from '../controllers/literature.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireProjectRole } from '../middleware/projectAuth.js';
import { uploadSingleFile } from '../middleware/upload.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post('/', requireProjectRole(['OWNER', 'EDITOR']), uploadSingleFile, literatureController.uploadReference);
router.get('/', requireProjectRole(['OWNER', 'EDITOR', 'VIEWER']), literatureController.listReferences);

export default router;
