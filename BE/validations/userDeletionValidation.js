const Joi = require('joi');

const deletionRequestValidator = (data) => Joi.object({
    user_id: Joi.number().integer().positive().required(),
    reason: Joi.string().trim().min(10).max(1000).required(),
}).validate(data, { stripUnknown: true });

const deletionReviewValidator = (data) => Joi.object({
    decision: Joi.string().valid('approved', 'rejected').required(),
    review_note: Joi.string().trim().max(1000).allow('').default(''),
}).custom((value, helpers) => {
    if (value.decision === 'rejected' && value.review_note.length < 5) {
        return helpers.message({ custom: 'Vui lòng nhập lý do từ chối.' });
    }
    return value;
}).validate(data, { stripUnknown: true });

module.exports = { deletionRequestValidator, deletionReviewValidator };
