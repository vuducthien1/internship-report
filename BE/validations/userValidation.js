const Joi = require('joi');

const updateRoleValidator = (data) => Joi.object({
    role: Joi.string().valid('engineer', 'manager').required().messages({
        'any.only': 'Chỉ có thể chuyển đổi giữa Kỹ sư và Quản lý.',
        'any.required': 'Vui lòng chọn quyền mới.',
    }),
}).validate(data);

const phone = Joi.string().pattern(/^0[35789][0-9]{8}$/).messages({
    'string.pattern.base': 'Số điện thoại phải gồm 10 số và có đầu số Việt Nam hợp lệ.',
});

const updateMyProfileValidator = (data) => Joi.object({
    phone: phone.required(),
    bio: Joi.string().trim().max(500).allow('').default(''),
    avatar_url: Joi.string().trim().uri({ scheme: ['http', 'https'] }).max(500).allow('').default(''),
}).validate(data, { stripUnknown: true });

const adminUpdateProfileValidator = (data) => Joi.object({
    fullname: Joi.string().trim().min(5).max(80).pattern(/^[^0-9]+$/).required(),
    email: Joi.string().trim().email().max(150).required(),
    phone: phone.required(),
    employee_code: Joi.string().trim().max(50).allow('').default(''),
    department: Joi.string().trim().max(120).allow('').default(''),
    job_title: Joi.string().trim().max(120).allow('').default(''),
}).validate(data, { stripUnknown: true });

const changePasswordValidator = (data) => Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string().min(8).max(20).pattern(/^[A-Z](?=.*\d)(?=.*[\W_]).*$/).required().messages({
        'string.pattern.base': 'Mật khẩu mới phải bắt đầu bằng chữ viết hoa, có số và ký tự đặc biệt.',
    }),
    confirm_password: Joi.any().valid(Joi.ref('new_password')).required().messages({
        'any.only': 'Mật khẩu xác nhận không khớp.',
    }),
}).validate(data, { stripUnknown: true });

module.exports = {
    updateRoleValidator,
    updateMyProfileValidator,
    adminUpdateProfileValidator,
    changePasswordValidator,
};
