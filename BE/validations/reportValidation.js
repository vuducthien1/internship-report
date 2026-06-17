const Joi = require('joi');

const reportValidator = (data) => {
    const schema = Joi.object({
        task_id: Joi.number().integer().required().messages({
            'any.required': 'Không xác định được công việc cần báo cáo.'
        }),
        content: Joi.string().required().messages({
            'string.empty': 'Nội dung báo cáo không được để trống!'
        }),
        status: Joi.string().valid('in_progress', 'completed').required().messages({
            'any.only': 'Trạng thái cập nhật phải là Đang làm hoặc Hoàn thành.',
            'any.required': 'Bắt buộc phải chọn trạng thái công việc.'
        })
    });

    return schema.validate(data);
};

module.exports = { reportValidator };