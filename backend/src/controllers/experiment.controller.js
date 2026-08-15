import * as experimentService from '../services/experiment.service.js';
import { sendSuccess } from '../utils/response.js';

export const listExperiments = async (req, res, next) => {
  try {
    const experiments = await experimentService.getExperiments(req.user.id, req.params.projectId);
    return sendSuccess(res, 'Experiments retrieved successfully.', experiments, 200);
  } catch (error) {
    next(error);
  }
};

export const createExperiment = async (req, res, next) => {
  try {
    const experiment = await experimentService.createExperiment(req.user.id, req.params.projectId, req.body);
    return sendSuccess(res, 'Experiment created successfully.', experiment, 201);
  } catch (error) {
    next(error);
  }
};

export const updateExperiment = async (req, res, next) => {
  try {
    const experiment = await experimentService.updateExperiment(
      req.user.id,
      req.params.projectId,
      req.params.experimentId,
      req.body,
    );
    return sendSuccess(res, 'Experiment updated successfully.', experiment, 200);
  } catch (error) {
    next(error);
  }
};

export const deleteExperiment = async (req, res, next) => {
  try {
    await experimentService.deleteExperiment(req.user.id, req.params.projectId, req.params.experimentId);
    return sendSuccess(res, 'Experiment deleted successfully.', null, 200);
  } catch (error) {
    next(error);
  }
};

export const addExperimentIteration = async (req, res, next) => {
  try {
    const iteration = await experimentService.addExperimentIteration(
      req.user.id,
      req.params.projectId,
      req.params.experimentId,
      req.body,
    );
    return sendSuccess(res, 'Experiment iteration added successfully.', iteration, 201);
  } catch (error) {
    next(error);
  }
};
