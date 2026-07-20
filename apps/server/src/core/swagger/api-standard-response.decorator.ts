import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';

const buildStandardResponseSchema = (dataSchema: object) => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    statusCode: { type: 'number', example: 200 },
    data: dataSchema,
    timestamp: { type: 'string', example: '2026-04-11T18:00:00.000Z' },
    path: { type: 'string', example: '/api/auth/me' },
    requestId: {
      type: 'string',
      example: '550e8400-e29b-41d4-a716-446655440000',
    },
  },
});

export const ApiStandardResponse = <T extends Type>(
  model: T,
  options: { status?: 200 | 201; description?: string; isArray?: boolean } = {},
) => {
  const { status = 200, description = 'Başarılı', isArray = false } = options;

  const dataSchema = isArray
    ? { type: 'array', items: { $ref: getSchemaPath(model) } }
    : { $ref: getSchemaPath(model) };

  const schema = buildStandardResponseSchema(dataSchema);

  const responseDecorator =
    status === 201
      ? ApiCreatedResponse({ description, schema })
      : ApiOkResponse({ description, schema });

  return applyDecorators(ApiExtraModels(model), responseDecorator);
};

export const ApiStandardEmptyResponse = (
  options: { status?: 200 | 201; description?: string } = {},
) => {
  const { status = 200, description = 'Başarılı' } = options;

  const schema = buildStandardResponseSchema({ type: 'null', nullable: true });

  return status === 201
    ? ApiCreatedResponse({ description, schema })
    : ApiOkResponse({ description, schema });
};

export const ApiPaginatedResponse = <T extends Type>(
  model: T,
  options: { description?: string } = {},
) => {
  const { description = 'Sayfalı liste' } = options;

  const schema = buildStandardResponseSchema({
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: getSchemaPath(model) },
      },
      total: { type: 'number', example: 100 },
      page: { type: 'number', example: 1 },
      limit: { type: 'number', example: 20 },
    },
  });

  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({ description, schema }),
  );
};
