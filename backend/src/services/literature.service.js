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

export const createReference = async (userId, projectId, payload, fileMeta) => {
  const { title, authors, year, tags, summary } = payload;

  if (!title || !projectId) {
    throw new AppError('Project ID and title are required.', 400);
  }

  await ensureProjectAccess(userId, projectId);

  const reference = await prisma.reference.create({
    data: {
      title,
      authors,
      year: year ? Number(year) : null,
      tags: tags ? tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
      summary,
      filePath: fileMeta?.path || null,
      fileName: fileMeta?.originalname || null,
      fileMimeType: fileMeta?.mimetype || null,
      projectId,
      uploadedById: userId,
    },
  });

  return reference;
};

export const getReferences = async (userId, projectId) => {
  await ensureProjectAccess(userId, projectId);

  return prisma.reference.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
};

