import * as literatureService from '../services/literature.service.js';
import { sendSuccess } from '../utils/response.js';

export const uploadReference = async (req, res, next) => {
  try {
    const fileMeta = req.file || null;
    const reference = await literatureService.createReference(req.user.id, req.params.projectId, req.body, fileMeta);
    return sendSuccess(res, 'Reference uploaded successfully.', reference, 201);
  } catch (error) {
    next(error);
  }
};

export const listReferences = async (req, res, next) => {
  try {
    const references = await literatureService.getReferences(req.user.id, req.params.projectId);
    return sendSuccess(res, 'References retrieved successfully.', references, 200);
  } catch (error) {
    next(error);
  }
};
