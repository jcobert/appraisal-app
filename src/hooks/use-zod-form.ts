import { zodResolver } from '@hookform/resolvers/zod'
import { FieldValues, UseFormProps, useForm } from 'react-hook-form'
import { ZodErrorMap, ZodType } from 'zod'

export const defaultErrorMap: ZodErrorMap = (error, ctx) => {
  let message = ctx.defaultError
  switch (error.code) {
    case 'too_small':
      if (error.type === 'string') {
        // String required
        message = 'Field is required'
      } else if (error.type === 'number') {
        // Number min
        message = `Must be at least ${error.minimum}`
      }
      break
    default:
      break
  }
  return { message: message || ctx.defaultError }
}

export const useZodForm = <TForm extends FieldValues = FieldValues>(
  schema: ZodType,
  options?: UseFormProps<TForm>,
) => {
  return useForm<TForm>({
    resolver: zodResolver(schema, { errorMap: defaultErrorMap }),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    ...options,
  })
}

export default useZodForm
