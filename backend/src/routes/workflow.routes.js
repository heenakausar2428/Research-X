import { Router } from 'express';
import * as workflowController from '../controllers/workflow.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireProjectRole } from '../middleware/projectAuth.js';

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get('/', requireProjectRole(['OWNER', 'EDITOR', 'VIEWER']), workflowController.listWorkflowCards);
router.post('/', requireProjectRole(['OWNER', 'EDITOR']), workflowController.createWorkflowCard);
router.put('/:cardId', requireProjectRole(['OWNER', 'EDITOR']), workflowController.updateWorkflowCard);
router.delete('/:cardId', requireProjectRole(['OWNER', 'EDITOR']), workflowController.deleteWorkflowCard);

export default router;
