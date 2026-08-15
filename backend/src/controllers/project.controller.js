import * as projectService from '../services/project.service.js';
import { sendSuccess } from '../utils/response.js';

export const createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.user.id, req.body);
    return sendSuccess(res, 'Project created successfully.', project, 201);
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getProjectsForUser(req.user.id);
    return sendSuccess(res, 'Projects retrieved successfully.', projects, 200);
  } catch (error) {
    next(error);
  }
};

export const getProject = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.user.id, req.params.id);
    return sendSuccess(res, 'Project retrieved successfully.', project, 200);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body);
    return sendSuccess(res, 'Project updated successfully.', project, 200);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    await projectService.deleteProject(req.params.id);
    return sendSuccess(res, 'Project deleted successfully.', null, 200);
  } catch (error) {
    next(error);
  }
};

export const getCollaborators = async (req, res, next) => {
  try {
    const collaborators = await projectService.getCollaborators(req.params.id);
    return sendSuccess(res, 'Collaborators retrieved successfully.', collaborators, 200);
  } catch (error) {
    next(error);
  }
};

export const addCollaborator = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const collaborator = await projectService.addCollaborator(req.params.id, email, role);
    return sendSuccess(res, 'Collaborator added successfully.', collaborator, 201);
  } catch (error) {
    next(error);
  }
};

export const removeCollaborator = async (req, res, next) => {
  try {
    const { userId } = req.params;
    await projectService.removeCollaborator(req.params.id, userId);
    return sendSuccess(res, 'Collaborator removed successfully.', null, 200);
  } catch (error) {
    next(error);
  }
};

