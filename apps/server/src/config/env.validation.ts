import Joi from 'joi';

export const envValidationSchema = Joi.object({
  SERVER_PORT: Joi.number().integer().min(1).max(65535).required(),
  NODE_ENV: Joi.string().valid('test', 'development', 'production').required(),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info'),
}).options({
  allowUnknown: true,
});
