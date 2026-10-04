(() => {
	'use strict';

	const init = () => {
		const find = (...selectors) => selectors.map(selector => document.querySelector(selector)).find(Boolean);
		const make = (tag, attrs = {}, text = '') => {
			const node = document.createElement(tag);
			for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
			if (text) node.textContent = text;
			return node;
		};

		let input = find('#taskInput', '#todoInput', '[name="task"]');
		let list = find('#taskList', '#todoList', '#tasks');
		let app = find('#todoApp', '.todo-app', 'main') || document.body;
		if (!input && !list) {
			app = make('main', { id: 'todoApp', class: 'todo-app' });
			app.append(make('h1', {}, 'To-do list'));
			document.body.append(app);
		}

		const toolbar = make('div', { class: 'todo-controls' });
		const anchor = list || input;
		if (anchor?.parentNode) anchor.parentNode.insertBefore(toolbar, anchor);
		else app.append(toolbar);

		const getControl = (selectors, tag, attrs, label, options) => {
			let node = find(...selectors);
			if (!node) {
				const wrapper = make('label', {}, label);
				node = make(tag, attrs);
				if (options) options.forEach(([value, title]) => node.append(make('option', { value }, title)));
				wrapper.append(node);
				toolbar.append(wrapper);
			}
			return node;
		};

		input = input || getControl(['#taskInput', '[name="task"]'], 'input', { id: 'taskInput', type: 'text', placeholder: 'Add a task', maxlength: '300' }, 'Task ');
		let addButton = find('#addTaskBtn', '#addTask', '#add-btn');
		if (!addButton) { addButton = make('button', { id: 'addTaskBtn', type: 'button' }, 'Add task'); toolbar.append(addButton); }
		const priority = getControl(['#taskPriority', '#prioritySelect', '[name="priority"]'], 'select', { id: 'taskPriority' }, 'Priority ', [['low', 'Low'], ['medium', 'Medium'], ['high', 'High']]);
		const dueDate = getControl(['#taskDueDate', '#dueDate', '[name="dueDate"]'], 'input', { id: 'taskDueDate', type: 'date' }, 'Due date ');
		const search = getControl(['#taskSearch', '#searchInput'], 'input', { id: 'taskSearch', type: 'search', placeholder: 'Search tasks' }, 'Search ');
		const priorityFilter = getControl(['#priorityFilter', '#filterPriority'], 'select', { id: 'priorityFilter' }, 'Priority filter ', [['all', 'All priorities'], ['low', 'Low'], ['medium', 'Medium'], ['high', 'High']]);
		const statusFilter = getControl(['#statusFilter', '#filterStatus'], 'select', { id: 'statusFilter' }, 'Status filter ', [['all', 'All tasks'], ['active', 'Active'], ['completed', 'Completed'], ['overdue', 'Overdue']]);
		const sort = getControl(['#sortBy', '#taskSort'], 'select', { id: 'sortBy' }, 'Sort ', [['newest', 'Newest'], ['due-asc', 'Due date (soonest)'], ['due-desc', 'Due date (latest)'], ['priority', 'Priority (high to low)']]);

		if (!list) { list = make('ul', { id: 'taskList', 'aria-live': 'polite' }); app.append(list); }
		const counter = (id, title) => {
			let node = find(`#${id}`);
			if (!node) {
				const line = make('p', {}, `${title}: `);
				node = make('span', { id });
				line.append(node);
				app.append(line);
			}
			return node;
		};
		const activeCount = counter('activeCount', 'Active');
		const completedCount = counter('completedCount', 'Completed');
		let darkToggle = find('#darkModeToggle', '#themeToggle');
		if (!darkToggle) {
			const label = make('label', {}, 'Dark mode ');
			darkToggle = make('input', { id: 'darkModeToggle', type: 'checkbox', 'aria-label': 'Dark mode' });
			label.append(darkToggle);
			toolbar.append(label);
		}

		const TASKS_KEY = 'todoTasks';
		const THEME_KEY = 'todoDarkMode';
		let tasks = [];
		try {
			const stored = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
			if (Array.isArray(stored)) tasks = stored.filter(task => task && typeof task.text === 'string').map(task => ({
				id: task.id || `${Date.now()}-${Math.random()}`,
				text: task.text,
				priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
				dueDate: typeof task.dueDate === 'string' ? task.dueDate : '',
				completed: Boolean(task.completed),
				createdAt: Number(task.createdAt) || Date.now()
			}));
		} catch (_) { tasks = []; }
		const save = () => { try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); } catch (_) {} };
		const isOverdue = task => !task.completed && Boolean(task.dueDate) && task.dueDate < new Date().toISOString().slice(0, 10);

		const render = () => {
			const term = search.value.trim().toLowerCase();
			let visible = tasks.filter(task => {
				if (!task.text.toLowerCase().includes(term)) return false;
				if (priorityFilter.value !== 'all' && priorityFilter.value !== task.priority) return false;
				if (statusFilter.value === 'active' && task.completed) return false;
				if (statusFilter.value === 'completed' && !task.completed) return false;
				if (statusFilter.value === 'overdue' && !isOverdue(task)) return false;
				return true;
			});
			if (sort.value === 'due-asc') visible.sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
			else if (sort.value === 'due-desc') visible.sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''));
			else if (sort.value === 'priority') visible.sort((a, b) => ({ high: 3, medium: 2, low: 1 }[b.priority] - { high: 3, medium: 2, low: 1 }[a.priority]));
			else visible.sort((a, b) => b.createdAt - a.createdAt);

			list.replaceChildren();
			visible.forEach(task => {
				const row = make('li', { 'data-task-id': task.id });
				if (task.completed) row.classList.add('completed');
				if (isOverdue(task)) row.classList.add('overdue');
				const checkbox = make('input', { type: 'checkbox', 'data-action': 'complete', 'aria-label': `Complete ${task.text}` });
				checkbox.checked = task.completed;
				row.append(checkbox, make('span', { class: 'task-text' }, task.text));
				row.append(make('span', { class: 'task-details' }, `${task.priority[0].toUpperCase()}${task.priority.slice(1)}${task.dueDate ? ` · Due ${task.dueDate}` : ''}${isOverdue(task) ? ' · OVERDUE' : ''}`));
				row.append(make('button', { type: 'button', 'data-action': 'edit' }, 'Edit'));
				row.append(make('button', { type: 'button', 'data-action': 'delete' }, 'Delete'));
				list.append(row);
			});
			activeCount.textContent = String(tasks.filter(task => !task.completed).length);
			completedCount.textContent = String(tasks.filter(task => task.completed).length);
		};

		const addTask = () => {
			const text = input.value.trim();
			if (!text) { input.focus(); return; }
			tasks.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text, priority: priority.value || 'medium', dueDate: dueDate.value, completed: false, createdAt: Date.now() });
			input.value = '';
			dueDate.value = '';
			priority.value = 'medium';
			save(); render(); input.focus();
		};
		addButton.addEventListener('click', addTask);
		input.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); addTask(); } });
		[search, priorityFilter, statusFilter, sort].forEach(node => {
			node.addEventListener('input', render);
			node.addEventListener('change', render);
		});
		list.addEventListener('change', event => {
			if (event.target.dataset.action !== 'complete') return;
			const row = event.target.closest('[data-task-id]');
			const task = tasks.find(item => item.id === row?.dataset.taskId);
			if (task) { task.completed = event.target.checked; save(); render(); }
		});
		list.addEventListener('click', event => {
			const action = event.target.dataset.action;
			if (action !== 'edit' && action !== 'delete') return;
			const row = event.target.closest('[data-task-id]');
			const task = tasks.find(item => item.id === row?.dataset.taskId);
			if (!task) return;
			if (action === 'delete') {
				if (!window.confirm(`Delete “${task.text}”?`)) return;
				tasks = tasks.filter(item => item.id !== task.id);
			} else {
				const text = window.prompt('Edit task:', task.text);
				if (text === null) return;
				if (!text.trim()) { window.alert('Task cannot be empty.'); return; }
				task.text = text.trim();
				const nextPriority = window.prompt('Priority (Low, Medium, High):', task.priority);
				if (nextPriority !== null && ['low', 'medium', 'high'].includes(nextPriority.trim().toLowerCase())) task.priority = nextPriority.trim().toLowerCase();
				const nextDueDate = window.prompt('Due date (YYYY-MM-DD), or blank for none:', task.dueDate);
				if (nextDueDate !== null && (!nextDueDate || /^\d{4}-\d{2}-\d{2}$/.test(nextDueDate))) task.dueDate = nextDueDate;
			}
			save(); render();
		});

		let darkMode = false;
		try { darkMode = localStorage.getItem(THEME_KEY) === 'true'; } catch (_) {}
		const applyTheme = enabled => {
			document.documentElement.classList.toggle('dark-mode', enabled);
			document.body.classList.toggle('dark-mode', enabled);
			darkToggle.checked = enabled;
			try { localStorage.setItem(THEME_KEY, String(enabled)); } catch (_) {}
		};
		darkToggle.addEventListener('change', () => applyTheme(darkToggle.checked));
		applyTheme(darkMode);
		save();
		render();
	};

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
	else init();
})();
