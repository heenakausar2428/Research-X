import { Router } from 'express';
import authRoutes from './auth.routes.js';
import projectRoutes from './project.routes.js';
import literatureRoutes from './literature.routes.js';
import workflowRoutes from './workflow.routes.js';
import conceptRoutes from './concept.routes.js';
import experimentRoutes from './experiment.routes.js';

const router = Router();

// Mounting routers
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/projects/:projectId/literature', literatureRoutes);
router.use('/projects/:projectId/workflow', workflowRoutes);
router.use('/projects/:projectId/concepts', conceptRoutes);
router.use('/projects/:projectId/experiments', experimentRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running healthy.',
    timestamp: new Date().toISOString(),
  });
});

export default router;
