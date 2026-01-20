import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, UseFormProps, UseFormReturn, FieldValues } from 'react-hook-form';
import { ZodType } from 'zod';

export interface UseFormWithValidationProps<T extends FieldValues> extends Omit<UseFormProps<T>, 'resolver'> {
  schema: ZodType<T, any, any>;
}

export function useFormWithValidation<T extends FieldValues>({
  schema,
  ...props
}: UseFormWithValidationProps<T>): UseFormReturn<T> {
  return useForm<T>({
    resolver: zodResolver(schema),
    mode: 'onChange', // Validate on change for immediate feedback
    ...props,
  });
}
