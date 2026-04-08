export type Todo = {
	id: string;
	description: string;
	isCompleted: boolean;
	createdAt: string;
	dueDate: string | null;
};

export type ApiErrorBody = {
	statusCode: number;
	error: string;
	message: string;
};

export class ApiRequestError extends Error {
	readonly body: ApiErrorBody;

	constructor(body: ApiErrorBody) {
		super(body.message);
		this.name = 'ApiRequestError';
		this.body = body;
	}
}

async function readJsonUnknown(res: Response): Promise<unknown> {
	const text = await res.text();
	if (!text) return undefined;
	try {
		return JSON.parse(text) as unknown;
	} catch {
		return undefined;
	}
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
	if (!value || typeof value !== 'object') return false;
	const o = value as Record<string, unknown>;
	return (
		typeof o.statusCode === 'number' && typeof o.error === 'string' && typeof o.message === 'string'
	);
}

async function parseErrorResponse(res: Response): Promise<ApiErrorBody> {
	const data = await readJsonUnknown(res);
	if (isApiErrorBody(data)) {
		return data;
	}
	return {
		statusCode: res.status,
		error: res.statusText || 'Error',
		message: `Request failed with status ${res.status}`,
	};
}

function isTodo(value: unknown): value is Todo {
	if (!value || typeof value !== 'object') return false;
	const o = value as Record<string, unknown>;
	return (
		typeof o.id === 'string' &&
		typeof o.description === 'string' &&
		typeof o.isCompleted === 'boolean' &&
		typeof o.createdAt === 'string'
	);
}

async function safeFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
	try {
		return await fetch(input, init);
	} catch (err) {
		throw new ApiRequestError({
			statusCode: 0,
			error: 'NetworkError',
			message: err instanceof Error ? err.message : 'Network request failed',
		});
	}
}

export async function getTodos(): Promise<Todo[]> {
	const res = await safeFetch('/api/todos');
	if (!res.ok) {
		const err = await parseErrorResponse(res);
		throw new ApiRequestError(err);
	}
	const data: unknown = await res.json();
	if (!Array.isArray(data) || !data.every(isTodo)) {
		throw new ApiRequestError({
			statusCode: res.status,
			error: 'ParseError',
			message: 'Unexpected response shape from GET /api/todos',
		});
	}
	return data;
}

export async function createTodo(body: { description: string }): Promise<Todo> {
	const res = await safeFetch('/api/todos', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	if (!res.ok) {
		const err = await parseErrorResponse(res);
		throw new ApiRequestError(err);
	}
	const data: unknown = await res.json();
	if (!isTodo(data)) {
		throw new ApiRequestError({
			statusCode: res.status,
			error: 'ParseError',
			message: 'Unexpected response shape from POST /api/todos',
		});
	}
	return data;
}

export async function deleteTodo(id: string): Promise<void> {
	const res = await safeFetch(`/api/todos/${id}`, {
		method: 'DELETE',
	});
	if (!res.ok) {
		const err = await parseErrorResponse(res);
		throw new ApiRequestError(err);
	}
}

export async function toggleTodo(id: string, isCompleted: boolean): Promise<Todo> {
	const res = await safeFetch(`/api/todos/${id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ isCompleted }),
	});
	if (!res.ok) {
		const err = await parseErrorResponse(res);
		throw new ApiRequestError(err);
	}
	const data: unknown = await res.json();
	if (!isTodo(data)) {
		throw new ApiRequestError({
			statusCode: res.status,
			error: 'ParseError',
			message: 'Unexpected response shape from PATCH /api/todos/:id',
		});
	}
	return data;
}
