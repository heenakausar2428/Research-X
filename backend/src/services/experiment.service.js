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

export const getExperiments = async (userId, projectId) => {
  await ensureProjectAccess(userId, projectId);

  return prisma.experiment.findMany({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
    include: {
      iterations: {
        orderBy: { attemptNumber: 'asc' },
      },
    },
  });
};

export const createExperiment = async (userId, projectId, experimentData) => {
  await ensureProjectAccess(userId, projectId);

  const { title, objective, methodology, status } = experimentData;
  if (!title) {
    throw new AppError('Experiment title is required.', 400);
  }

  return prisma.experiment.create({
    data: {
      title,
      objective,
      methodology,
      status,
      projectId,
    },
    include: {
      iterations: true,
    },
  });
};

export const updateExperiment = async (userId, projectId, experimentId, experimentData) => {
  await ensureProjectAccess(userId, projectId);

  const experiment = await prisma.experiment.findUnique({ where: { id: experimentId } });
  if (!experiment || experiment.projectId !== projectId) {
    throw new AppError('Experiment not found.', 404);
  }

  return prisma.experiment.update({
    where: { id: experimentId },
    data: {
      title: experimentData.title ?? experiment.title,
      objective: experimentData.objective ?? experiment.objective,
      methodology: experimentData.methodology ?? experiment.methodology,
      status: experimentData.status ?? experiment.status,
    },
    include: {
      iterations: true,
    },
  });
};

export const deleteExperiment = async (userId, projectId, experimentId) => {
  await ensureProjectAccess(userId, projectId);

  const experiment = await prisma.experiment.findUnique({ where: { id: experimentId } });
  if (!experiment || experiment.projectId !== projectId) {
    throw new AppError('Experiment not found.', 404);
  }

  await prisma.experiment.delete({ where: { id: experimentId } });
  return true;
};

export const addExperimentIteration = async (userId, projectId, experimentId, iterationData) => {
  await ensureProjectAccess(userId, projectId);

  const experiment = await prisma.experiment.findUnique({ where: { id: experimentId } });
  if (!experiment || experiment.projectId !== projectId) {
    throw new AppError('Experiment not found.', 404);
  }

  const { notes, result, attemptNumber } = iterationData;
  if (attemptNumber == null) {
    throw new AppError('Iteration attempt number is required.', 400);
  }

  return prisma.experimentIteration.create({
    data: {
      notes,
      result,
      attemptNumber,
      experimentId,
    },
  });
};
