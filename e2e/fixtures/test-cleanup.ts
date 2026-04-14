const API_BASE = 'http://localhost:3000';

export class TodoTracker {
	private readonly descriptions: string[] = [];

	track(description: string) {
		this.descriptions.push(description);
	}

	async cleanup(request: import('@playwright/test').APIRequestContext) {
		if (this.descriptions.length === 0) return;
		const res = await request.get(`${API_BASE}/api/todos`);
		if (!res.ok()) return;
		const todos = (await res.json()) as { id: string; description: string }[];
		const toDelete = todos.filter((t) => this.descriptions.includes(t.description));
		for (const t of toDelete) {
			await request.delete(`${API_BASE}/api/todos/${t.id}`);
		}
		this.descriptions.length = 0;
	}
}
