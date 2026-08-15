import { Router } from 'express';
import * as conceptController from '../controllers/concept.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireProjectRole } from '../middleware/projectAuth.js';

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get('/', requireProjectRole(['OWNER', 'EDITOR', 'VIEWER']), conceptController.getConceptGraph);
router.get('/lineage/:nodeId', requireProjectRole(['OWNER', 'EDITOR', 'VIEWER']), conceptController.getLineageGraph);
router.post('/nodes', requireProjectRole(['OWNER', 'EDITOR']), conceptController.createConceptNode);
router.put('/nodes/:nodeId', requireProjectRole(['OWNER', 'EDITOR']), conceptController.updateConceptNode);
router.delete('/nodes/:nodeId', requireProjectRole(['OWNER', 'EDITOR']), conceptController.deleteConceptNode);

router.post('/edges', requireProjectRole(['OWNER', 'EDITOR']), conceptController.createEdge);
router.delete('/edges/:edgeId', requireProjectRole(['OWNER', 'EDITOR']), conceptController.deleteEdge);

export default router;
