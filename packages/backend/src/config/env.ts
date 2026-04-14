import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { z } from 'zod';

config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const envSchema = z
	.object({
		DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
		DATABASE_URL_TEST: z.string().optional(),
		PORT: z.coerce.number().default(3000),
		NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
		ALLOWED_ORIGINS: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		if (data.NODE_ENV !== 'production') return;
		const origins =
			data.ALLOWED_ORIGINS?.split(',')
				.map((s) => s.trim())
				.filter(Boolean) ?? [];
		if (origins.length === 0) {
			ctx.addIssue({
				code: 'custom',
				message:
					'ALLOWED_ORIGINS is required when NODE_ENV is production (comma-separated origins)',
				path: ['ALLOWED_ORIGINS'],
			});
		}
	});

export type Env = z.infer<typeof envSchema> & { allowedOriginsList: string[] };

const _env = envSchema.parse(process.env);

export const env: Env = {
	..._env,
	allowedOriginsList: (_env.ALLOWED_ORIGINS ?? '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean),
};
