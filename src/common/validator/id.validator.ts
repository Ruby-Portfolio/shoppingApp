import { registerDecorator, ValidationOptions } from 'class-validator';

export const IsId: Function = (
  validationOptions?: ValidationOptions,
): Function => {
  return (object: Object, propertyName: string): void => {
    registerDecorator({
      name: 'isId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: number): boolean {
          return value > 0;
        },
      },
    });
  };
};
