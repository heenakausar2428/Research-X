import * as conceptService from '../services/concept.service.js';
import { sendSuccess } from '../utils/response.js';

export const getConceptGraph = async (req, res, next) => {
  try {
    const data = await conceptService.getConceptData(req.user.id, req.params.projectId);
    return sendSuccess(res, 'Concept graph loaded successfully.', data, 200);
  } catch (error) {
    next(error);
  }
};

export const createConceptNode = async (req, res, next) => {
  try {
    const node = await conceptService.createConceptNode(req.user.id, req.params.projectId, req.body);
    return sendSuccess(res, 'Concept node created successfully.', node, 201);
  } catch (error) {
    next(error);
  }
};

export const updateConceptNode = async (req, res, next) => {
  try {
    const node = await conceptService.updateConceptNode(req.user.id, req.params.projectId, req.params.nodeId, req.body);
    return sendSuccess(res, 'Concept node updated successfully.', node, 200);
  } catch (error) {
    next(error);
  }
};

export const deleteConceptNode = async (req, res, next) => {
  try {
    await conceptService.deleteConceptNode(req.user.id, req.params.projectId, req.params.nodeId);
    return sendSuccess(res, 'Concept node deleted successfully.', null, 200);
  } catch (error) {
    next(error);
  }
};

export const createEdge = async (req, res, next) => {
  try {
    const edge = await conceptService.createEdge(req.user.id, req.params.projectId, req.body);
    return sendSuccess(res, 'Edge created successfully.', edge, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteEdge = async (req, res, next) => {
  try {
    await conceptService.deleteEdge(req.user.id, req.params.projectId, req.params.edgeId);
    return sendSuccess(res, 'Edge deleted successfully.', null, 200);
  } catch (error) {
    next(error);
  }
};

export const getLineageGraph = async (req, res, next) => {
  try {
    const data = await conceptService.getLineageData(req.user.id, req.params.projectId, req.params.nodeId);
    return sendSuccess(res, 'Insight lineage loaded successfully.', data, 200);
  } catch (error) {
    next(error);
  }
};
