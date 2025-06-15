class Task {
    constructor(id, title, date, description, priority, subtasks = []) {
        this.id = id;
        this.title = title;
        this.date = date;
        this.description = description;
        this.priority = priority;
        this.subtasks = subtasks;
    }
}

class Subtask {
    constructor(id, title, completed = false) {
        this.id = id;
        this.title = title;
        this.completed = completed;
    }
}

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentDate = new Date();
let editingTaskId = null;

const calendarDays = document.getElementById('calendarDays');
const currentMonthElement = document.getElementById('currentMonth');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskModal = document.getElementById('taskModal');
const taskDetailsModal = document.getElementById('taskDetailsModal');
const taskForm = document.getElementById('taskForm');
const closeButtons = document.querySelectorAll('.close');
const cancelBtn = document.getElementById('cancelBtn');
const addSubtaskBtn = document.getElementById('addSubtaskBtn');
const subtasksList = document.getElementById('subtasksList');
const editTaskBtn = document.getElementById('editTaskBtn');
const deleteTaskBtn = document.getElementById('deleteTaskBtn');
const darkModeToggle = document.getElementById('darkModeToggle');

function initDarkMode() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

function toggleDarkMode() {
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDarkMode) {
        document.documentElement.removeAttribute('data-theme');
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('darkMode', 'false');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('darkMode', 'true');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    renderCalendar();
    setupEventListeners();
});

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startingDay = firstDay.getDay() || 7; 
    const totalDays = lastDay.getDate();
    
    currentMonthElement.textContent = `${getMonthName(month)} ${year}`;
    
    calendarDays.innerHTML = '';
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i > 0; i--) {
        const dayElement = createDayElement(prevMonthLastDay - i + 1, 'other-month');
        calendarDays.appendChild(dayElement);
    }
    
    for (let day = 1; day <= totalDays; day++) {
        const dayElement = createDayElement(day);
        if (isToday(year, month, day)) {
            dayElement.classList.add('today');
        }
        calendarDays.appendChild(dayElement);
    }
    
    const remainingCells = 42 - (startingDay - 1 + totalDays); 
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = createDayElement(day, 'other-month');
        calendarDays.appendChild(dayElement);
    }
    
    renderTasks();
}

function createDayElement(day, className = '') {
    const dayElement = document.createElement('div');
    dayElement.className = `day ${className}`;
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    
    dayElement.appendChild(dayNumber);

    if (!className.includes('other-month')) {
        dayElement.addEventListener('click', (event) => {
            
            if (event.target === dayElement || event.target === dayNumber) {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const dayNum = day; 
                const formattedDate = getFormattedDateString(year, month, dayNum);
                showTaskModal(null, formattedDate);
            }
        });
    }
    
    return dayElement;
}

function renderTasks() {
    const dayElements = document.querySelectorAll('.day');
    dayElements.forEach((dayElement, index) => {
        const day = parseInt(dayElement.querySelector('.day-number').textContent);
        const isOtherMonth = dayElement.classList.contains('other-month');
        
        if (!isOtherMonth) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            
            const dateString = getFormattedDateString(year, month, day);
            
            const dayTasks = tasks.filter(task => {
                
                return task.date === dateString;
            });
            dayTasks.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = `task-item ${task.priority}`;
                taskElement.textContent = task.title;
                taskElement.dataset.taskId = task.id;
                taskElement.addEventListener('click', () => showTaskDetails(task.id));
                dayElement.appendChild(taskElement);
            });
        }
    });
}

function showTaskModal(taskId = null, selectedDate = null) {
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    const modalTitle = document.getElementById('modalTitle');
    
    if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            editingTaskId = taskId;
            modalTitle.textContent = 'Edytuj Zadanie';
            form.taskTitle.value = task.title;
            form.taskDate.value = task.date;
            form.taskDescription.value = task.description;
            form.taskPriority.value = task.priority;
            
            subtasksList.innerHTML = '';
            task.subtasks.forEach(subtask => {
                addSubtaskToForm(subtask);
            });
        }
    } else {
        editingTaskId = null;
        modalTitle.textContent = 'Dodaj Nowe Zadanie';
        form.reset();
        subtasksList.innerHTML = '';
        
        if (selectedDate) {
            form.taskDate.value = selectedDate;
        }
    }
    
    modal.classList.add('active');
}

function showTaskDetails(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const modal = document.getElementById('taskDetailsModal');
    const title = document.getElementById('taskDetailsTitle');
    const date = document.getElementById('taskDetailsDate');
    const priority = document.getElementById('taskDetailsPriority');
    const description = document.getElementById('taskDetailsDescription');
    const subtasks = document.getElementById('taskDetailsSubtasks');
    
    title.textContent = task.title;
    date.textContent = formatDate(task.date);
    priority.textContent = getPriorityName(task.priority);
    description.textContent = task.description || 'Brak opisu';
    
    subtasks.innerHTML = '';
    task.subtasks.forEach(subtask => {
        const li = document.createElement('li');
        li.className = subtask.completed ? 'completed' : '';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = subtask.completed;
        checkbox.addEventListener('change', () => {
            subtask.completed = checkbox.checked;
            li.className = subtask.completed ? 'completed' : '';
            saveTasks();
        });
        
        const span = document.createElement('span');
        span.textContent = subtask.title;
        
        li.appendChild(checkbox);
        li.appendChild(span);
        subtasks.appendChild(li);
    });
    
    editTaskBtn.onclick = () => {
        modal.classList.remove('active');
        showTaskModal(taskId);
    };
    
    deleteTaskBtn.onclick = () => {
        if (confirm('Czy na pewno chcesz usunąć to zadanie?')) {
            deleteTask(taskId);
            modal.classList.remove('active');
        }
    };
    
    modal.classList.add('active');
}

function addSubtaskToForm(subtask = null) {
    const subtaskDiv = document.createElement('div');
    subtaskDiv.className = 'subtask-item';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Nazwa podzadania';
    input.value = subtask ? subtask.title : '';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'danger-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.onclick = () => subtaskDiv.remove();
    
    subtaskDiv.appendChild(input);
    subtaskDiv.appendChild(deleteBtn);
    subtasksList.appendChild(subtaskDiv);
}

function saveTask(event) {
    event.preventDefault();
    
    const form = event.target;
    const subtasks = Array.from(subtasksList.children).map(div => {
        const input = div.querySelector('input');
        return new Subtask(
            Date.now().toString(),
            input.value
        );
    }).filter(subtask => subtask.title.trim() !== '');
    
    const task = new Task(
        editingTaskId || Date.now().toString(),
        form.taskTitle.value,
        form.taskDate.value,
        form.taskDescription.value,
        form.taskPriority.value,
        subtasks
    );
    
    if (editingTaskId) {
        const index = tasks.findIndex(t => t.id === editingTaskId);
        tasks[index] = task;
    } else {
        tasks.push(task);
    }
    
    saveTasks();
    taskModal.classList.remove('active');
    renderCalendar();
}

function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    renderCalendar();
}

function getFormattedDateString(year, month, day) {
    const d = new Date(year, month, day);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dt}`;
}

function getMonthName(month) {
    const months = [
        'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
        'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    return months[month];
}

function isToday(year, month, day) {
    const today = new Date();
    return today.getFullYear() === year &&
           today.getMonth() === month &&
           today.getDate() === day;
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getPriorityName(priority) {
    const priorities = {
        'low': 'Niski',
        'medium': 'Średni',
        'high': 'Wysoki'
    };
    return priorities[priority] || priority;
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function setupEventListeners() {
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    addTaskBtn.addEventListener('click', () => showTaskModal());
    
    taskForm.addEventListener('submit', saveTask);
    
    addSubtaskBtn.addEventListener('click', () => addSubtaskToForm());
    
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            taskModal.classList.remove('active');
            taskDetailsModal.classList.remove('active');
        });
    });
    
    cancelBtn.addEventListener('click', () => {
        taskModal.classList.remove('active');
    });
    
    darkModeToggle.addEventListener('click', toggleDarkMode);
    
    window.addEventListener('click', (event) => {
        if (event.target === taskModal) {
            taskModal.classList.remove('active');
        }
        if (event.target === taskDetailsModal) {
            taskDetailsModal.classList.remove('active');
        }
    });
} 