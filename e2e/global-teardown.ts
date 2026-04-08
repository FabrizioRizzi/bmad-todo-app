async function globalTeardown() {
	try {
		// Fetch all todos
		const response = await fetch('http://localhost:3000/api/todos');

		if (!response.ok) {
			console.log('ℹ️ Could not fetch todos for cleanup');
			return;
		}

		const todos = await response.json();

		if (!Array.isArray(todos) || todos.length === 0) {
			console.log('✅ Database is clean (no todos to delete)');
			return;
		}

		// Delete each todo
		let deleted = 0;
		for (const todo of todos) {
			const deleteResponse = await fetch(`http://localhost:3000/api/todos/${todo.id}`, {
				method: 'DELETE',
			});

			if (deleteResponse.ok) {
				deleted++;
			}
		}

		console.log(`✅ Test database cleaned: ${deleted} todos deleted`);
	} catch (_error) {
		// Server might not be running, which is fine during development
		console.log('ℹ️ Database cleanup skipped (server may not be running)');
	}
}

export default globalTeardown;
