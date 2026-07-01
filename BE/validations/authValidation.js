const Joi = require('joi');

const registerValidator = (data) => {
    const schema = Joi.object({
        // 1. USERNAME: 5-50 ký tự, viết liền không dấu, không khoảng trắng, không ký tự đặc biệt (chỉ a-z, A-Z, 0-9)
        username: Joi.string().min(5).max(50).pattern(/^[a-zA-Z0-9]+$/).required().messages({
            'string.empty': 'Username không được để trống!',
            'string.min': 'Username phải có ít nhất 5 ký tự.',
            'string.max': 'Username không được vượt quá 50 ký tự.',
            'string.pattern.base': 'Username chỉ được chứa chữ cái không dấu và số, không có khoảng trắng hay ký tự đặc biệt.',
            'any.required': 'Trường username là bắt buộc.'
        }),

        // 2. FULLNAME: 5-50 ký tự, có dấu, có khoảng trắng, ký tự đặc biệt thoải mái, NHƯNG KHÔNG ĐƯỢC CÓ SỐ
        fullname: Joi.string().min(5).max(50).pattern(/^[^0-9]+$/).required().messages({
            'string.empty': 'Họ tên không được để trống!',
            'string.min': 'Họ tên phải có ít nhất 5 ký tự.',
            'string.max': 'Họ tên không được vượt quá 50 ký tự.',
            'string.pattern.base': 'Họ tên không được chứa chữ số.',
            'any.required': 'Trường họ tên là bắt buộc.'
        }),
        
        // 3. EMAIL: Đúng cấu trúc chuẩn
        email: Joi.string().email().required().messages({
            'string.empty': 'Email không được để trống!',
            'string.email': 'Định dạng email không hợp lệ (ví dụ: phuoc@gmail.com).',
            'any.required': 'Trường email là bắt buộc.'
        }),

        // 4. PHONE: Chuẩn đầu số Việt Nam (03, 05, 07, 08, 09) và đúng 10 số
        phone: Joi.string().pattern(/^0[35789][0-9]{8}$/).required().messages({
            'string.empty': 'Số điện thoại không được để trống!',
            'string.pattern.base': 'Số điện thoại không hợp lệ. Phải là 10 số và thuộc các đầu số chuẩn của Việt Nam.',
            'any.required': 'Trường số điện thoại là bắt buộc.'
        }),

        // 5. PASSWORD: 8-20 ký tự, Chữ đầu viết hoa, có số, có ký tự đặc biệt
        password: Joi.string().min(8).max(20).pattern(/^[A-Z](?=.*\d)(?=.*[\W_]).*$/).required().messages({
            'string.empty': 'Mật khẩu không được để trống!',
            'string.min': 'Mật khẩu phải có ít nhất 8 ký tự.',
            'string.max': 'Mật khẩu không được vượt quá 20 ký tự.',
            'string.pattern.base': 'Mật khẩu phải BẮT ĐẦU bằng chữ VIẾT HOA, chứa ít nhất 1 SỐ và 1 KÝ TỰ ĐẶC BIỆT.',
            'any.required': 'Trường mật khẩu là bắt buộc.'
        }),

        // 6. CONFIRM PASSWORD: Bắt buộc phải nhập lại và phải giống hệt password
        confirm_password: Joi.any().valid(Joi.ref('password')).required().messages({
            'any.only': 'Mật khẩu xác nhận không khớp với mật khẩu đã nhập!',
            'any.required': 'Vui lòng nhập lại mật khẩu để xác nhận.'
        }),

        // Giữ tương thích với form hiện tại nhưng tuyệt đối không cho client
        // tự chọn manager/admin ở endpoint đăng ký công khai.
        role: Joi.string().valid('engineer').optional()
    });

    return schema.validate(data);
};

const loginValidator = (data) => {
    const schema = Joi.object({
        // Chuyển sang đăng nhập bằng username (hoặc email nếu muốn, ở đây check bằng chuỗi string)
        username: Joi.string().required().messages({
            'string.empty': 'Vui lòng nhập Username để đăng nhập!',
            'any.required': 'Trường Username là bắt buộc.'
        }),
        password: Joi.string().required().messages({
            'string.empty': 'Vui lòng nhập mật khẩu!'
        })
    });
    return schema.validate(data);
};

const passwordRule = Joi.string().min(8).max(20).pattern(/^[A-Z](?=.*\d)(?=.*[\W_]).*$/).required().messages({
    'string.pattern.base': 'Mật khẩu phải bắt đầu bằng chữ viết hoa, có số và ký tự đặc biệt.',
});

const emailRequestValidator = (data) => Joi.object({
    email: Joi.string().trim().email().max(255).required(),
}).validate(data, { stripUnknown: true });

const tokenValidator = (data) => Joi.object({
    token: Joi.string().hex().length(64).required(),
}).validate(data, { stripUnknown: true });

const resetPasswordValidator = (data) => Joi.object({
    token: Joi.string().hex().length(64).required(),
    password: passwordRule,
    confirm_password: Joi.any().valid(Joi.ref('password')).required().messages({
        'any.only': 'Mật khẩu xác nhận không khớp.',
    }),
}).validate(data, { stripUnknown: true });

module.exports = {
    registerValidator,
    loginValidator,
    emailRequestValidator,
    tokenValidator,
    resetPasswordValidator,
};
