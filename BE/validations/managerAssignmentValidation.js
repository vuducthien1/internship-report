const Joi = require('joi');

const createManagerAssignmentValidator = (data) => Joi.object({
    manager_id: Joi.number().integer().positive().required(),
    project_id: Joi.number().integer().positive().allow(null, '').default(null),
    title: Joi.string().trim().min(5).max(180).required(),
    description: Joi.string().trim().min(10).max(3000).required(),
    due_date: Joi.date().iso().min('now').allow(null, '').default(null),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
}).validate(data, { stripUnknown: true });

const updateManagerAssignmentValidator = (data) => Joi.object({
    status: Joi.string().valid('accepted', 'in_progress', 'completed').required(),
    progress_percent: Joi.number().integer().min(0).max(100).required(),
    manager_note: Joi.string().trim().max(1000).allow('').default(''),
}).validate(data, { stripUnknown: true });

const cancelManagerAssignmentValidator = (data) => Joi.object({
    reason: Joi.string().trim().min(5).max(500).required(),
}).validate(data, { stripUnknown: true });

module.exports = {
    createManagerAssignmentValidator,
    updateManagerAssignmentValidator,
    cancelManagerAssignmentValidator,
};
