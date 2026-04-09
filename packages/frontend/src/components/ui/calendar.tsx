'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DayPickerProps } from 'react-day-picker';
import { DayPicker } from 'react-day-picker';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type CalendarProps = DayPickerProps;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={cn('p-[var(--space-2)]', className)}
			classNames={{
				root: 'w-fit',
				months: 'flex flex-col gap-4 sm:flex-row',
				month: 'flex flex-col gap-4',
				nav: 'flex items-center justify-between gap-1',
				button_previous: cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'size-8 p-0'),
				button_next: cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'size-8 p-0'),
				month_caption: 'flex justify-center pt-1',
				caption_label: 'text-[length:var(--text-sm)] font-medium',
				table: 'w-full border-collapse',
				weekdays: 'flex',
				weekday: 'text-muted-foreground flex-1 text-center text-[0.8rem] font-normal select-none',
				week: 'mt-2 flex w-full',
				day: 'relative p-0 text-center',
				day_button: cn(
					buttonVariants({ variant: 'ghost' }),
					'size-8 p-0 font-normal aria-selected:opacity-100',
				),
				selected:
					'rounded-[var(--radius-md)] bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
				today: 'rounded-[var(--radius-md)] bg-muted text-foreground',
				outside: 'text-muted-foreground opacity-50',
				disabled: 'text-muted-foreground opacity-50',
				hidden: 'invisible',
				...classNames,
			}}
			components={{
				Chevron: ({ orientation, className: chClassName, ...chevronProps }) =>
					orientation === 'left' ? (
						<ChevronLeft aria-hidden className={cn('size-4', chClassName)} {...chevronProps} />
					) : (
						<ChevronRight aria-hidden className={cn('size-4', chClassName)} {...chevronProps} />
					),
			}}
			{...props}
		/>
	);
}

export { Calendar };
