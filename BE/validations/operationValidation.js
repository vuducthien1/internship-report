const Joi = require('joi');

const taskUpdateValidator = (data) => Joi.object({
    message: Joi.string().trim().min(2).max(1000).required(),
}).validate(data, { stripUnknown: true });

const taskRequestValidator = (data) => Joi.object({
    task_id: Joi.number().integer().positive().required(),
    request_type: Joi.string().valid('extension', 'blocker').required(),
    requested_due_date: Joi.when('request_type', {
        is: 'extension',
        then: Joi.date().iso().required(),
        otherwise: Joi.any().allow(null, '').default(null),
    }),
    reason: Joi.string().trim().min(10).max(2000).required(),
}).validate(data, { stripUnknown: true });

const taskRequestReviewValidator = (data) => Joi.object({
    decision: Joi.string().valid('approved', 'rejected').required(),
    review_note: Joi.string().trim().max(500).allow('').default(''),
}).validate(data, { stripUnknown: true });

const incidentValidator = (data) => Joi.object({
    project_id: Joi.number().integer().positive().required(),
    task_id: Joi.number().integer().positive().allow(null, '').default(null),
    title: Joi.string().trim().min(5).max(180).required(),
    description: Joi.string().trim().min(10).max(5000).required(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
    location_text: Joi.string().trim().max(255).allow('').default(''),
    latitude: Joi.number().min(-90).max(90).allow(null, '').default(null),
    longitude: Joi.number().min(-180).max(180).allow(null, '').default(null),
}).validate(data, { stripUnknown: true, convert: true });

const incidentStatusValidator = (data) => Joi.object({
    status: Joi.string().valid('open', 'investigating', 'resolved').required(),
    assigned_to: Joi.number().integer().positive().allow(null, '').default(null),
    root_cause: Joi.string().trim().max(3000).allow('').default(''),
    corrective_action: Joi.string().trim().max(3000).allow('').default(''),
    target_resolution_date: Joi.date().iso().allow(null, '').default(null),
}).validate(data, { stripUnknown: true });

const documentValidator = (data) => Joi.object({
    project_id: Joi.number().integer().positive().required(),
    title: Joi.string().trim().min(3).max(180).required(),
}).validate(data, { stripUnknown: true });

module.exports = {
    taskUpdateValidator,
    taskRequestValidator,
    taskRequestReviewValidator,
    incidentValidator,
    incidentStatusValidator,
    documentValidator,
};
