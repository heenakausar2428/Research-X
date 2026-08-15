import prisma from '../config/db.js';
import AppError from '../utils/appError.js';

const ensureProjectAccess = async (userId, projectId) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { collaborators: true },
  });

  if (!project || !project.collaborators.some((c) => c.userId === userId)) {
    throw new AppError('Project not found or access denied.', 404);
  }

  return project;
};

export const getWorkflowCards = async (userId, projectId) => {
  await ensureProjectAccess(userId, projectId);

  return prisma.workflowCard.findMany({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
  });
};

export const createWorkflowCard = async (userId, projectId, cardData) => {
  await ensureProjectAccess(userId, projectId);

  const { title, description, stage } = cardData;
  if (!title) {
    throw new AppError('Card title is required.', 400);
  }

  return prisma.workflowCard.create({
    data: {
      title,
      description,
      stage,
      projectId,
    },
  });
};

export const updateWorkflowCard = async (userId, projectId, cardId, cardData) => {
  await ensureProjectAccess(userId, projectId);

  const card = await prisma.workflowCard.findUnique({ where: { id: cardId } });
  if (!card || card.projectId !== projectId) {
    throw new AppError('Workflow card not found.', 404);
  }

  return prisma.workflowCard.update({
    where: { id: cardId },
    data: {
      title: cardData.title ?? card.title,
      description: cardData.description ?? card.description,
      stage: cardData.stage ?? card.stage,
    },
  });
};

export const deleteWorkflowCard = async (userId, projectId, cardId) => {
  await ensureProjectAccess(userId, projectId);

  const card = await prisma.workflowCard.findUnique({ where: { id: cardId } });
  if (!card || card.projectId !== projectId) {
    throw new AppError('Workflow card not found.', 404);
  }

  await prisma.workflowCard.delete({ where: { id: cardId } });
  return true;
};

