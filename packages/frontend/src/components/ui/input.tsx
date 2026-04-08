import { Input as InputPrimitive } from '@base-ui/react/input';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(function Input(
	{ className, type, ...props },
	ref,
) {
	return (
		<InputPrimitive
			ref={ref}
			type={type}
			data-slot="input"
			className={cn(
				'h-11 w-full min-w-0 rounded-[var(--radius)] border border-input bg-transparent px-[var(--space-4)] py-[var(--space-2)] text-[length:var(--text-base)] transition-colors duration-[var(--duration-normal)] ease-[var(--ease-standard)] outline-none file:inline-flex file:h-[var(--space-5)] file:border-0 file:bg-transparent file:text-[length:var(--text-sm)] file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-[length:var(--text-sm)] dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
				className,
			)}
			{...props}
		/>
	);
});

export { Input };
