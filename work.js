
document.addEventListener('DOMContentLoaded', () => {
const addTaskBtn = document.getElementById('addTaskBtn');
const taskTitle = document.getElementById('taskTitle');
const taskPriority = document.getElementById('taskPriority');
const taskContainer = document.getElementById('taskContainer');
const filterPriority = document.getElementById('filterPriority');
const filterStatus = document.getElementById('filterStatus');
const sortMethod = document.getElementById('sortMethod');

let tasks = [];

async function loadTasks() {
    const response = await fetch('index.php');
    tasks = await response.json();
    renderTasks();
}

function renderTasks() {
    const filteredTasks = _.filter(tasks, task => {
        const priorityMatch = !filterPriority.value || task.priority === filterPriority.value;
        const statusMatch = !filterStatus.value || task.status === filterStatus.value;
        return priorityMatch && statusMatch;
    });

    const sortedTasks = _.orderBy(filteredTasks, 
        task => {
            switch(sortMethod.value) {
                case 'createdAt': return task.createdAt;
                case 'priority': 
                    const priorityOrder = { low: 1, medium: 2, high: 3 };
                    return priorityOrder[task.priority];
                case 'title': return task.title;
            }
        }, 
        'asc'
    );

    taskContainer.innerHTML = sortedTasks.map(task => `
        <div class="task-card bg-white/20 backdrop-blur-lg rounded-2xl p-5 shadow-lg ${getPriorityClass(task.priority)}">
            <div class="flex justify-between items-center mb-3">
                <h3 class="font-bold text-xl text-white truncate flex-grow mr-2">${task.title}</h3>
                <span class="text-sm text-white/70">${formatDate(task.createdAt)}</span>
            </div>
            <div class="flex justify-between items-center mb-3">
                <span class="text-sm ${getStatusClass(task.status)} font-medium">${getStatusText(task.status)}</span>
                <div class="space-x-2">
                    <button onclick="editTask('${task.id}')" 
                        class="text-white/80 hover:text-white bg-white/20 px-2 py-1 rounded-lg transition">編輯</button>
                    <button onclick="toggleTaskStatus('${task.id}')" 
                        class="text-white/80 hover:text-white bg-white/20 px-2 py-1 rounded-lg transition">
                        ${task.status === 'completed' ? '重新開始' : '完成'}
                    </button>
                    <button onclick="deleteTask('${task.id}')" 
                        class="text-red-300 hover:text-red-100 bg-white/20 px-2 py-1 rounded-lg transition">刪除</button>
                </div>
            </div>
            ${task.link ? `<a href="${task.link}" target="_blank" class="text-blue-200 text-sm mt-2 block truncate hover:text-white">${task.link}</a>` : ''}
        </div>
    `).join('');

    updateStatistics();
}

function getPriorityClass(priority) {
    const classes = {
        low: 'border-l-4 border-green-400',
        medium: 'border-l-4 border-yellow-400',
        high: 'border-l-4 border-red-400'
    };
    return classes[priority];
}

function getStatusClass(status) {
    return status === 'completed' ? 'text-green-300' : 'text-yellow-300';
}

function getStatusText(status) {
    return status === 'completed' ? '已完成' : '進行中';
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString('zh-TW', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
}

async function addTask() {
    const title = taskTitle.value.trim();
    if (!title) return;

    const newTask = {
        title,
        priority: taskPriority.value,
        status: 'pending',
        createdAt: Date.now(),
        id: `task_${Date.now()}`
    };

    const response = await fetch('index.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'add',
            task: newTask
        })
    });

    if (response.ok) {
        tasks.push(newTask);
        taskTitle.value = '';
        renderTasks();
    }
}

window.editTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const newTitle = prompt('編輯任務標題', task.title);
    if (newTitle !== null) {
        task.title = newTitle;
        await fetch('index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update',
                task: task
            })
        });
        renderTasks();
    }
};

window.toggleTaskStatus = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    task.status = task.status === 'completed' ? 'pending' : 'completed';
    task.completedAt = task.status === 'completed' ? Date.now() : null;

    await fetch('index.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'update',
            task: task
        })
    });

    renderTasks();
};

window.deleteTask = async (taskId) => {
    if (confirm('確定要刪除這個任務嗎？')) {
        await fetch(`index.php?id=${taskId}`, { method: 'DELETE' });
        tasks = tasks.filter(t => t.id !== taskId);
        renderTasks();
    }
};

function updateStatistics() {
    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;

    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('pendingTasks').textContent = pendingTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
}

addTaskBtn.addEventListener('click', addTask);
filterPriority.addEventListener('change', renderTasks);
filterStatus.addEventListener('change', renderTasks);
sortMethod.addEventListener('change', renderTasks);

loadTasks();
});
