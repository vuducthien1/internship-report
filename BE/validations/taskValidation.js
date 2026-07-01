const Joi = require('joi');

const taskValidator = (data) => {
    const schema = Joi.object({
        project_id: Joi.number().integer().required().messages({
            'any.required': 'Bắt buộc phải chọn Dự án.'
        }),
        engineer_id: Joi.number().integer().required().messages({
            'any.required': 'Bắt buộc phải chọn Kỹ sư để giao việc.'
        }),
        title: Joi.string().required().max(255).messages({
            'string.empty': 'Tên công việc không được để trống!'
        }),
        description: Joi.string().allow('', null),
        due_date: Joi.date().iso().allow(null, '').optional().messages({
            'date.format': 'Hạn hoàn thành phải đúng định dạng YYYY-MM-DD.'
        }),
        priority: Joi.string()
            .valid('low', 'medium', 'high', 'urgent', 'critical')
            .default('medium'),
        checklist: Joi.array().items(
            Joi.string().trim().min(2).max(255)
        ).max(30).default([]),
    });

    return schema.validate(data);
};

const taskManagerUpdateValidator = (data) => Joi.object({
    engineer_id: Joi.number().integer().positive().required(),
    title: Joi.string().trim().min(3).max(255).required(),
    description: Joi.string().allow('', null).max(5000),
    due_date: Joi.date().iso().allow(null, ''),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent', 'critical').required(),
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'on_hold', 'cancelled').required(),
    change_reason: Joi.string().trim().min(5).max(500).required(),
}).validate(data, { stripUnknown: true });

module.exports = { taskValidator, taskManagerUpdateValidator };
