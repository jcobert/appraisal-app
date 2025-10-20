import { zodResolver } from '@hookform/resolvers/zod'
import { FieldValues, UseFormProps, useForm } from 'react-hook-form'
import { ZodType } from 'zod'

import { formErrorMap } from '@/utils/zod'

export const useZodForm = <TForm extends FieldValues = FieldValues>(
  schema: ZodType,
  options?: UseFormProps<TForm>,
) => {
  return useForm<TForm>({
    resolver: zodResolver(schema, { errorMap: formErrorMap }),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    ...options,
  })
}

export default useZodForm
