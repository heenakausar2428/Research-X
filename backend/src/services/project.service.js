import prisma from '../config/db.js';
import AppError from '../utils/appError.js';

export const createProject = async (userId, projectData) => {
  const { title, description, goal } = projectData;
  if (!title) {
    throw new AppError('Project title is required.', 400);
  }

  return prisma.$transaction(async (tx) => {
    // Create the project
    const project = await tx.project.create({
      data: {
        title,
        description,
        goal,
        ownerId: userId,
      },
    });

    // Create the OWNER collaborator record for creator
    await tx.projectCollaborator.create({
      data: {
        projectId: project.id,
        userId,
        role: 'OWNER',
      },
    });

    return project;
  });
};

export const getProjectsForUser = async (userId) => {
  // Retrieve projects where the user is a collaborator
  return prisma.project.findMany({
    where: {
      collaborators: {
        some: {
          userId,
        },
      },
    },
    include: {
      collaborators: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
};

export const getProjectById = async (userId, projectId) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      collaborators: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      workflow: {
        orderBy: { updatedAt: 'desc' },
      },
      experiments: {
        orderBy: { updatedAt: 'desc' },
        include: {
          iterations: {
            orderBy: { attemptNumber: 'asc' },
          },
        },
      },
    },
  });

  if (!project) {
    throw new AppError('Project not found.', 404);
  }

  // Ensure user is indeed a collaborator
  const isCollaborator = project.collaborators.some((c) => c.userId === userId);
  if (!isCollaborator) {
    throw new AppError('Access denied. You do not have permissions for this project.', 403);
  }

  return project;
};

export const updateProject = async (projectId, projectData) => {
  const { title, description, goal, status } = projectData;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new AppError('Project not found.', 404);
  }

  return prisma.project.update({
    where: { id: projectId },
    data: {
      title: title ?? project.title,
      description: description ?? project.description,
      goal: goal ?? project.goal,
      status: status ?? project.status,
    },
  });
};

export const deleteProject = async (projectId) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new AppError('Project not found.', 404);
  }

  await prisma.project.delete({ where: { id: projectId } });
  return true;
};

export const getCollaborators = async (projectId) => {
  return prisma.projectCollaborator.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

export const addCollaborator = async (projectId, email, role) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(`User with email ${email} not found.`, 404);
  }

  // Check if already exists
  const existing = await prisma.projectCollaborator.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: user.id,
      },
    },
  });

  if (existing) {
    throw new AppError('User is already a collaborator on this project.', 400);
  }

  return prisma.projectCollaborator.create({
    data: {
      projectId,
      userId: user.id,
      role: role || 'VIEWER',
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

export const removeCollaborator = async (projectId, userId) => {
  const collaborator = await prisma.projectCollaborator.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  if (!collaborator) {
    throw new AppError('Collaborator not found.', 404);
  }

  if (collaborator.role === 'OWNER') {
    throw new AppError('Cannot remove project owner.', 400);
  }

  await prisma.projectCollaborator.delete({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  return true;
};

