import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireProjectRole } from '../middleware/projectAuth.js';

const router = Router();

router.use(requireAuth);

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);

router.get('/:id', requireProjectRole(['OWNER', 'EDITOR', 'VIEWER']), projectController.getProject);
router.put('/:id', requireProjectRole(['OWNER', 'EDITOR']), projectController.updateProject);
router.delete('/:id', requireProjectRole(['OWNER']), projectController.deleteProject);

// Collaborator Management
router.get('/:id/collaborators', requireProjectRole(['OWNER', 'EDITOR', 'VIEWER']), projectController.getCollaborators);
router.post('/:id/collaborators', requireProjectRole(['OWNER']), projectController.addCollaborator);
router.delete('/:id/collaborators/:userId', requireProjectRole(['OWNER']), projectController.removeCollaborator);

export default router;
