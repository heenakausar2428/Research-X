import { Router } from 'express';
import * as experimentController from '../controllers/experiment.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireProjectRole } from '../middleware/projectAuth.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/', requireProjectRole(['OWNER', 'EDITOR', 'VIEWER']), experimentController.listExperiments);
router.post('/', requireProjectRole(['OWNER', 'EDITOR']), experimentController.createExperiment);
router.put('/:experimentId', requireProjectRole(['OWNER', 'EDITOR']), experimentController.updateExperiment);
router.delete('/:experimentId', requireProjectRole(['OWNER', 'EDITOR']), experimentController.deleteExperiment);
router.post('/:experimentId/iterations', requireProjectRole(['OWNER', 'EDITOR']), experimentController.addExperimentIteration);

export default router;
