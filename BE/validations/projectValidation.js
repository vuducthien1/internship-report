const Joi = require('joi');

const projectValidator = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(5).max(255).required().messages({
            'string.empty': 'Tên dự án không được để trống!',
            'string.min': 'Tên dự án phải có ít nhất 5 ký tự.',
            'any.required': 'Trường tên dự án là bắt buộc.'
        }),
        description: Joi.string().allow('', null),
        location: Joi.string().required().messages({
            'string.empty': 'Địa điểm thi công không được để trống!',
            'any.required': 'Trường địa điểm là bắt buộc.'
        }),
        manager_id: Joi.number().integer().required().messages({
            'number.base': 'ID Quản lý không hợp lệ.',
            'any.required': 'Bắt buộc phải gán một Quản lý cho dự án.'
        }),
        start_date: Joi.date().iso().required().messages({
            'date.format': 'Ngày bắt đầu phải đúng định dạng YYYY-MM-DD.',
            'any.required': 'Vui lòng chọn ngày bắt đầu.'
        }),
        end_date: Joi.date().iso().min(Joi.ref('start_date')).required().messages({
            'date.min': 'Ngày kết thúc không thể diễn ra trước ngày bắt đầu!',
            'any.required': 'Vui lòng chọn ngày kết thúc.'
        })
    });

    return schema.validate(data);
};

module.exports = { projectValidator };