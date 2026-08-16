import { Transform, TransformFnParams } from 'class-transformer';

export const TrimLower = (): PropertyDecorator =>
  Transform(({ value }: TransformFnParams) =>
    String(value ?? '')
      .trim()
      .toLowerCase(),
  );

export const Trim = (): PropertyDecorator =>
  Transform(({ value }: TransformFnParams) => String(value ?? '').trim());
