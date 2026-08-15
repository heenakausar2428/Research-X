import prisma from '../config/db.js';
import AppError from '../utils/appError.js';

/**
 * Middleware to enforce project-specific permissions.
 * @param {string[]} allowedRoles Array of ProjectRoles permitted to perform the action (e.g. ['OWNER', 'EDITOR'])
 */
export const requireProjectRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required.', 401));
      }

      // Look for project ID in request parameters
      const projectId = req.params.projectId || req.params.id;

      if (!projectId) {
        return next(new AppError('Project ID is required for this action.', 400));
      }

      // Query project collaborator join record
      const collaborator = await prisma.projectCollaborator.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: req.user.id,
          },
        },
      });

      if (!collaborator) {
        return next(new AppError('You do not have access to this project.', 403));
      }

      if (!allowedRoles.includes(collaborator.role)) {
        return next(new AppError('You do not have permission to perform this action.', 403));
      }

      // Attach permissions info to request object
      req.projectRole = collaborator.role;
      req.projectId = projectId;

      next();
    } catch (error) {
      next(error);
    }
  };
};
