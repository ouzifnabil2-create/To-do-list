const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const filterBtns = document.querySelectorAll('.filter-btn');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
  taskList.innerHTML = '';

  const filteredTasks = tasks.filter(task => {
    if (currentFilter === 'active') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true;
  });

  filteredTasks.forEach((task) => {
    const realIndex = tasks.indexOf(task);
    const li = document.createElement('li');

    if (task.completed) {
      li.classList.add('completed');
    }

    const span = document.createElement('span');
    span.textContent = task.text;

    span.addEventListener('click', () => {
      tasks[realIndex].completed = !tasks[realIndex].completed;
      saveTasks();
      renderTasks();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Supprimer';
    deleteBtn.classList.add('delete-btn');

    deleteBtn.addEventListener('click', () => {
      tasks.splice(realIndex, 1);
      saveTasks();
      renderTasks();
    });

    li.appendChild(span);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
}

function addTask() {
  const taskText = taskInput.value.trim();

  if (taskText === '') {
    alert('Veuillez entrer une tâche !');
    return;
  }

  tasks.push({
    text: taskText,
    completed: false
  });

  saveTasks();
  renderTasks();
  taskInput.value = '';
}

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    currentFilter = btn.getAttribute('data-filter');
    renderTasks();
  });
});

addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addTask();
  }
});

renderTasks(); 
const themeBtn = document.getElementById('themeBtn');

// 1. Appliquer le thème sauvegardé au chargement de la page
const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  themeBtn.textContent = '☀️ Light Mode';
} else {
  themeBtn.textContent = '🌙 Dark Mode';
}

// 2. Événement au clic pour basculer
themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');

  // Vérifier si le mode sombre est maintenant actif
  const isDarkMode = document.body.classList.contains('dark-mode');

  if (isDarkMode) {
    themeBtn.textContent = '☀️ Light Mode';
    localStorage.setItem('theme', 'dark');
  } else {
    themeBtn.textContent = '🌙 Dark Mode';
    localStorage.setItem('theme', 'light');
  }
});