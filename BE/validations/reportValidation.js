const Joi = require('joi');

const reportValidator = (data) => {
    const schema = Joi.object({
        task_id: Joi.number().integer().required().messages({
            'any.required': 'Không xác định được công việc cần báo cáo.'
        }),
        content: Joi.string().trim().max(5000).required().messages({
            'string.empty': 'Nội dung báo cáo không được để trống!'
        }),
        status: Joi.string().valid('in_progress', 'completed').required().messages({
            'any.only': 'Trạng thái cập nhật phải là Đang làm hoặc Hoàn thành.',
            'any.required': 'Bắt buộc phải chọn trạng thái công việc.'
        }),
        report_type: Joi.string().valid('manual', 'voice', 'mixed').default('manual'),
        work_quantity: Joi.string().trim().max(255).allow('').default(''),
        blockers: Joi.string().trim().max(2000).allow('').default(''),
        safety_notes: Joi.string().trim().max(2000).allow('').default(''),
        next_plan: Joi.string().trim().max(2000).allow('').default(''),
    });

    return schema.validate(data);
};

const reviewReportValidator = (data) => Joi.object({
    decision: Joi.string().valid('approved', 'rejected').required(),
    review_note: Joi.when('decision', {
        is: 'rejected',
        then: Joi.string().trim().min(5).max(500).required().messages({
            'string.min': 'Vui lòng nêu rõ lý do từ chối.',
            'string.empty': 'Vui lòng nêu rõ lý do từ chối.',
            'any.required': 'Vui lòng nêu rõ lý do từ chối.',
        }),
        otherwise: Joi.string().trim().max(500).allow('').default(''),
    }),
}).validate(data, { stripUnknown: true });

module.exports = { reportValidator, reviewReportValidator };
