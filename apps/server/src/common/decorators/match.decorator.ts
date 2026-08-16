import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export const MATCH = 'Match';

export function Match<T = never>(
  property: [T] extends [never] ? string : keyof T & string,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: MATCH,
      target: target.constructor,
      propertyName: propertyName as string,
      constraints: [property],
      options: {
        message: i18nValidationMessage('validation.CONFIRM_MATCH'),
        ...validationOptions,
      },
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          return value === (args.object as Record<string, unknown>)[property];
        },
      },
    });
  };
}
