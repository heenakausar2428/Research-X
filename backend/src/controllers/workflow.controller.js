import * as workflowService from '../services/workflow.service.js';
import { sendSuccess } from '../utils/response.js';

export const listWorkflowCards = async (req, res, next) => {
  try {
    const cards = await workflowService.getWorkflowCards(req.user.id, req.params.projectId);
    return sendSuccess(res, 'Workflow cards retrieved successfully.', cards, 200);
  } catch (error) {
    next(error);
  }
};

export const createWorkflowCard = async (req, res, next) => {
  try {
    const card = await workflowService.createWorkflowCard(req.user.id, req.params.projectId, req.body);
    return sendSuccess(res, 'Workflow card created successfully.', card, 201);
  } catch (error) {
    next(error);
  }
};

export const updateWorkflowCard = async (req, res, next) => {
  try {
    const card = await workflowService.updateWorkflowCard(req.user.id, req.params.projectId, req.params.cardId, req.body);
    return sendSuccess(res, 'Workflow card updated successfully.', card, 200);
  } catch (error) {
    next(error);
  }
};

export const deleteWorkflowCard = async (req, res, next) => {
  try {
    await workflowService.deleteWorkflowCard(req.user.id, req.params.projectId, req.params.cardId);
    return sendSuccess(res, 'Workflow card deleted successfully.', null, 200);
  } catch (error) {
    next(error);
  }
};
