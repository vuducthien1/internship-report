const Joi = require('joi');

const contactValidator = (data) => Joi.object({
    fullname: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().trim().email().max(255).required(),
    phone: Joi.string().trim().pattern(/^0[35789][0-9]{8}$/).allow('').default(''),
    company: Joi.string().trim().max(150).allow('').default(''),
    message: Joi.string().trim().min(10).max(2000).required(),
}).validate(data, { stripUnknown: true });

const contactStatusValidator = (data) => Joi.object({
    status: Joi.string().valid('new', 'processing', 'resolved').required(),
}).validate(data, { stripUnknown: true });

module.exports = { contactValidator, contactStatusValidator };
