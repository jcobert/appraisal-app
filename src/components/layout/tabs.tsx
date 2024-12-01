import * as Tab from '@radix-ui/react-tabs'
import { FC, ReactNode } from 'react'

type Props = {
  tabs?: { trigger?: ReactNode; content?: ReactNode }[]
}

const Tabs: FC<Props> = ({ tabs = [] }) => (
  <Tab.Root className='' defaultValue='tab-0'>
    <Tab.List className='flex items-end gap-x-[2px] bg-zinc-200 dark:bg-zinc-800 rounded-md mb-4'>
      {tabs?.map((tab, i) => (
        <Tab.Trigger
          key={i}
          className='px-2 sm:px-4 py-4 max-md:flex-1 flex items-center justify-center leading-none select-none first:rounded-tl-md last:rounded-tr-md data-[state=active]:shadow-[inset_0_0_0_0,0_2px_0_0] data-[state=active]:shadow-sky-600 data-[state=active]:focus:relative outline-none transition data-[state=inactive]:text-zinc-800 data-[state=active]:cursor-default data-[state=active]:bg-zinc-50 dark:data-[state=inactive]:bg-zinc-700 dark:data-[state=inactive]:text-zinc-200 data-[state=inactive]:bg-zinc-100 data-[state=active]:text-sky-600 data-[state=inactive]:hover:text-zinc-800 data-[state=inactive]:hover:bg-zinc-300 dark:data-[state=inactive]:hover:bg-zinc-600'
          value={`tab-${i}`}
        >
          {tab?.trigger}
        </Tab.Trigger>
      ))}
    </Tab.List>
    {tabs?.map((tab, i) => (
      <Tab.Content key={i} className='' value={`tab-${i}`}>
        {tab?.content}
      </Tab.Content>
    ))}
  </Tab.Root>
)

export default Tabs
