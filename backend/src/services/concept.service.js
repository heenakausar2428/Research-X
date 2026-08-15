import prisma from '../config/db.js';
import AppError from '../utils/appError.js';

const verifyProjectAccess = async (userId, projectId) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { collaborators: true },
  });
  if (!project || !project.collaborators.some((collab) => collab.userId === userId)) {
    throw new AppError('Project not found or access denied.', 404);
  }
  return project;
};

export const getConceptData = async (userId, projectId) => {
  await verifyProjectAccess(userId, projectId);
  const nodes = await prisma.conceptNode.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' } });
  const edges = await prisma.edge.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' } });
  return { nodes, edges };
};

export const getLineageData = async (userId, projectId, nodeId) => {
  await verifyProjectAccess(userId, projectId);
  const nodes = await prisma.conceptNode.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' } });
  const edges = await prisma.edge.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' } });

  const allNodesById = nodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {});

  const outgoing = edges.reduce((acc, edge) => {
    acc[edge.sourceId] = acc[edge.sourceId] || [];
    acc[edge.sourceId].push(edge.targetId);
    return acc;
  }, {});

  const incoming = edges.reduce((acc, edge) => {
    acc[edge.targetId] = acc[edge.targetId] || [];
    acc[edge.targetId].push(edge.sourceId);
    return acc;
  }, {});

  if (!allNodesById[nodeId]) {
    throw new AppError('Insight node not found.', 404);
  }

  const collectRelated = (startIds, adjacency) => {
    const visited = new Set(startIds);
    const queue = [...startIds];

    while (queue.length > 0) {
      const current = queue.shift();
      const neighbors = adjacency[current] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return visited;
  };

  const ancestors = collectRelated([nodeId], incoming);
  const descendants = collectRelated([nodeId], outgoing);
  const lineageIds = new Set([...ancestors, ...descendants]);

  const lineageNodes = nodes.filter((node) => lineageIds.has(node.id));
  const lineageEdges = edges.filter(
    (edge) => lineageIds.has(edge.sourceId) && lineageIds.has(edge.targetId),
  );

  const insightNodes = nodes.filter((node) => node.type === 'INSIGHT');

  return {
    selectedNodeId: nodeId,
    nodes: lineageNodes,
    edges: lineageEdges,
    insightNodes,
  };
};

export const createConceptNode = async (userId, projectId, payload) => {
  await verifyProjectAccess(userId, projectId);
  const { label, type, description } = payload;
  if (!label) {
    throw new AppError('Concept node label is required.', 400);
  }

  return prisma.conceptNode.create({
    data: {
      label,
      type: type || 'CONCEPT',
      description,
      projectId,
    },
  });
};

export const updateConceptNode = async (userId, projectId, nodeId, payload) => {
  await verifyProjectAccess(userId, projectId);
  const node = await prisma.conceptNode.findUnique({ where: { id: nodeId } });
  if (!node || node.projectId !== projectId) {
    throw new AppError('Concept node not found.', 404);
  }

  return prisma.conceptNode.update({
    where: { id: nodeId },
    data: {
      label: payload.label ?? node.label,
      type: payload.type ?? node.type,
      description: payload.description ?? node.description,
    },
  });
};

export const deleteConceptNode = async (userId, projectId, nodeId) => {
  await verifyProjectAccess(userId, projectId);
  const node = await prisma.conceptNode.findUnique({ where: { id: nodeId } });
  if (!node || node.projectId !== projectId) {
    throw new AppError('Concept node not found.', 404);
  }

  await prisma.conceptNode.delete({ where: { id: nodeId } });
  return true;
};

export const createEdge = async (userId, projectId, payload) => {
  await verifyProjectAccess(userId, projectId);
  const { sourceId, targetId, relation } = payload;
  if (!sourceId || !targetId) {
    throw new AppError('Both source and target nodes are required.', 400);
  }

  const sourceNode = await prisma.conceptNode.findUnique({ where: { id: sourceId } });
  const targetNode = await prisma.conceptNode.findUnique({ where: { id: targetId } });
  if (!sourceNode || !targetNode || sourceNode.projectId !== projectId || targetNode.projectId !== projectId) {
    throw new AppError('Source or target node not found in project.', 404);
  }

  return prisma.edge.create({
    data: {
      sourceId,
      targetId,
      relation: relation || 'SUPPORTS',
      projectId,
    },
  });
};

export const deleteEdge = async (userId, projectId, edgeId) => {
  await verifyProjectAccess(userId, projectId);
  const edge = await prisma.edge.findUnique({ where: { id: edgeId } });
  if (!edge || edge.projectId !== projectId) {
    throw new AppError('Edge not found.', 404);
  }

  await prisma.edge.delete({ where: { id: edgeId } });
  return true;
};
