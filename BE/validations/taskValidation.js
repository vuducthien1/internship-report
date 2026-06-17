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
        description: Joi.string().allow('', null)
    });

    return schema.validate(data);
};

module.exports = { taskValidator };