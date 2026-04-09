'use client';

import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

function Popover(props: PopoverPrimitive.Root.Props) {
	return <PopoverPrimitive.Root {...props} />;
}

function PopoverTrigger(props: PopoverPrimitive.Trigger.Props) {
	return <PopoverPrimitive.Trigger {...props} />;
}

function PopoverContent({
	className,
	align = 'center',
	alignOffset = 0,
	side = 'bottom',
	sideOffset = 4,
	children,
	...props
}: PopoverPrimitive.Popup.Props &
	Pick<
		ComponentProps<typeof PopoverPrimitive.Positioner>,
		'align' | 'alignOffset' | 'side' | 'sideOffset'
	>) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Positioner
				align={align}
				alignOffset={alignOffset}
				side={side}
				sideOffset={sideOffset}
			>
				<PopoverPrimitive.Popup
					className={cn(
						'z-50 w-auto rounded-[var(--radius-md)] border border-border bg-popover p-[var(--space-2)] text-popover-foreground shadow-[var(--shadow-elevated)] outline-none',
						className,
					)}
					{...props}
				>
					{children}
				</PopoverPrimitive.Popup>
			</PopoverPrimitive.Positioner>
		</PopoverPrimitive.Portal>
	);
}

export { Popover, PopoverContent, PopoverTrigger };
