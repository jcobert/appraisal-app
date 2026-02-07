import { AppraisalType, OrderStatus, PaymentStatus } from '@prisma/client'

export const PAYMENT_STATUS_LABEL = {
  paid: 'Paid',
  partial: 'Partially Paid',
  unpaid: 'Unpaid',
} as const satisfies {
  [x in PaymentStatus]: string
}

export const ORDER_STATUS_LABEL = {
  cancelled: 'Cancelled',
  closed: 'Closed',
  open: 'Open',
} as const satisfies {
  [x in OrderStatus]: string
}

export const APPRAISAL_TYPE_LABEL = {
  purchase: 'Purchase',
  refinance: 'Refinance',
} as const satisfies {
  [x in AppraisalType]: string
}
