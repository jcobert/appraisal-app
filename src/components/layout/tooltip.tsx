import * as Tip from '@radix-ui/react-tooltip'
import { FC, ReactNode } from 'react'

export type TooltipProps = {
  trigger?: ReactNode
  triggerProps?: Tip.TooltipTriggerProps
  content?: ReactNode
  contentProps?: Tip.TooltipContentProps
  rootProps?: Tip.TooltipProps
  portalProps?: Tip.TooltipPortalProps
  arrowProps?: Tip.TooltipArrowProps
}

const Tooltip: FC<TooltipProps> = ({
  trigger,
  content,
  triggerProps,
  contentProps,
  rootProps,
  portalProps,
  arrowProps,
}) => {
  return (
    <Tip.Provider delayDuration={300}>
      <Tip.Root {...rootProps}>
        <Tip.Trigger {...triggerProps}>{trigger}</Tip.Trigger>
        <Tip.Portal {...portalProps}>
          <Tip.Content {...contentProps}>
            {content}
            <Tip.Arrow {...arrowProps} />
          </Tip.Content>
        </Tip.Portal>
      </Tip.Root>
    </Tip.Provider>
  )
}

export default Tooltip
