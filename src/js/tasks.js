class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.loadTasks();
        this.renderTasks();
        this.setupEventListeners();
    }

    loadTasks() {
        this.tasks = storage.getTasks();
    }

    saveTasks() {
        storage.saveTasks(this.tasks);
    }

    addTask(title, priority = 'medium', description = '', estimatedPomodoros = 1) {
        const task = {
            id: this.generateId(),
            title,
            description,
            priority,
            estimatedPomodoros,
            completedPomodoros: 0,
            isCompleted: false,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        analytics.updateStats();
        
        notifications.show('Task Added', `${title} has been added to your royal tasks.`);
        
        return task;
    }

    editTask(id, updates) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex === -1) return;

        this.tasks[taskIndex] = {
            ...this.tasks[taskIndex],
            ...updates,
            lastUpdated: new Date().toISOString()
        };

        this.saveTasks();
        this.renderTasks();
        analytics.updateStats();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.renderTasks();
        analytics.updateStats();
        
        notifications.show('Task Deleted', 'Task has been removed from your list.');
    }

    toggleComplete(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        task.isCompleted = !task.isCompleted;
        task.lastUpdated = new Date().toISOString();
        
        if (task.isCompleted) {
            task.completedPomodoros = task.estimatedPomodoros;
            notifications.show('Task Completed!', `Great job completing "${task.title}"!`);
        } else {
            task.completedPomodoros = 0;
        }

        this.saveTasks();
        this.renderTasks();
        analytics.updateStats();
    }

    setActiveTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task && !task.isCompleted) {
            timer.setCurrentTask(task);
            notifications.show('Task Activated', `Now working on: ${task.title}`);
        }
    }

    updatePomodoroCount(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task && !task.isCompleted) {
            task.completedPomodoros = Math.min(
                task.completedPomodoros + 1,
                task.estimatedPomodoros
            );
            
            if (task.completedPomodoros >= task.estimatedPomodoros) {
                task.isCompleted = true;
                notifications.show('Task Completed!', `Finished "${task.title}"!`);
            }
            
            this.saveTasks();
            this.renderTasks();
            analytics.updateStats();
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getPriorityClass(priority) {
        const classes = {
            royal: 'royal',
            high: 'high',
            medium: 'medium',
            low: 'low'
        };
        return classes[priority] || 'medium';
    }

    getPriorityIcon(priority) {
        const icons = {
            royal: 'fa-crown',
            high: 'fa-fire',
            medium: 'fa-star',
            low: 'fa-leaf'
        };
        return icons[priority] || 'fa-star';
    }

    renderTasks() {
        const container = document.getElementById('tasksList');
        if (!container) return;

        container.innerHTML = '';

        if (this.tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>No Royal Tasks Yet</h3>
                    <p>Add your first task to begin your productive journey!</p>
                </div>
            `;
            return;
        }

        this.tasks.forEach(task => {
            const taskEl = this.createTaskElement(task);
            container.appendChild(taskEl);
        });
    }

    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = `task-item ${task.isCompleted ? 'completed' : ''}`;
        div.dataset.id = task.id;

        const priorityClass = this.getPriorityClass(task.priority);
        const priorityIcon = this.getPriorityIcon(task.priority);

        div.innerHTML = `
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                    <span class="task-priority ${priorityClass}">
                        <i class="fas ${priorityIcon}"></i>
                        ${task.priority}
                    </span>
                    <span><i class="fas fa-clock"></i> ${task.estimatedPomodoros} pomodoros</span>
                    <span><i class="fas fa-check-circle"></i> ${task.completedPomodoros}/${task.estimatedPomodoros}</span>
                </div>
            </div>
            <div class="task-controls">
                <button class="task-btn set-active" title="Set as active">
                    <i class="fas fa-play"></i>
                </button>
                <button class="task-btn edit-task" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-btn complete-task" title="${task.isCompleted ? 'Undo' : 'Complete'}">
                    <i class="fas ${task.isCompleted ? 'fa-undo' : 'fa-check'}"></i>
                </button>
            </div>
        `;

        return div;
    }

    setupEventListeners() {
        // Add task button
        document.getElementById('saveTaskBtn').addEventListener('click', () => {
            const input = document.getElementById('taskInput');
            const priority = document.getElementById('taskPriority').value;
            
            if (input.value.trim()) {
                this.addTask(input.value.trim(), priority);
                input.value = '';
            }
        });

        // Enter key to add task
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('saveTaskBtn').click();
            }
        });

        // Task list event delegation
        document.getElementById('tasksList').addEventListener('click', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (!taskItem) return;

            const taskId = taskItem.dataset.id;
            const target = e.target.closest('button');

            if (!target) return;

            if (target.classList.contains('set-active')) {
                this.setActiveTask(taskId);
            } else if (target.classList.contains('edit-task')) {
                this.openEditModal(taskId);
            } else if (target.classList.contains('complete-task')) {
                this.toggleComplete(taskId);
            }
        });

        // Add task modal button
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            document.getElementById('taskInput').focus();
        });

        // Task modal save
        document.getElementById('saveTaskEdit').addEventListener('click', () => {
            this.saveTaskEdit();
        });

        // Task modal delete
        document.getElementById('deleteTask').addEventListener('click', () => {
            if (this.currentEditId) {
                this.deleteTask(this.currentEditId);
                this.closeTaskModal();
            }
        });
    }

    openEditModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.currentEditId = taskId;

        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskDesc').value = task.description || '';
        document.getElementById('editTaskPriority').value = task.priority;
        document.getElementById('editTaskEstimate').value = task.estimatedPomodoros;

        document.getElementById('taskModal').classList.add('active');
    }

    closeTaskModal() {
        this.currentEditId = null;
        document.getElementById('taskModal').classList.remove('active');
    }

    saveTaskEdit() {
        if (!this.currentEditId) return;

        const updates = {
            title: document.getElementById('editTaskTitle').value.trim(),
            description: document.getElementById('editTaskDesc').value.trim(),
            priority: document.getElementById('editTaskPriority').value,
            estimatedPomodoros: parseInt(document.getElementById('editTaskEstimate').value) || 1
        };

        if (updates.title) {
            this.editTask(this.currentEditId, updates);
            this.closeTaskModal();
        }
    }

    getTaskStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.isCompleted).length;
        const inProgress = total - completed;
        const totalPomodoros = this.tasks.reduce((sum, t) => sum + t.estimatedPomodoros, 0);
        const completedPomodoros = this.tasks.reduce((sum, t) => sum + t.completedPomodoros, 0);

        return {
            total,
            completed,
            inProgress,
            totalPomodoros,
            completedPomodoros,
            completionRate: total > 0 ? (completed / total) * 100 : 0,
            pomodoroRate: totalPomodoros > 0 ? (completedPomodoros / totalPomodoros) * 100 : 0
        };
    }

    getTasksByPriority() {
        return {
            royal: this.tasks.filter(t => t.priority === 'royal'),
            high: this.tasks.filter(t => t.priority === 'high'),
            medium: this.tasks.filter(t => t.priority === 'medium'),
            low: this.tasks.filter(t => t.priority === 'low')
        };
    }
}

// Initialize task manager
let taskManager = null;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
});
