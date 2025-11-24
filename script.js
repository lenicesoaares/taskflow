class TaskFlow {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('taskflow-tasks')) || [];
        this.currentEditId = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.renderTasks();
        this.updateTaskCounts();
    }

    initializeElements() {
        // Input elements
        this.taskInput = document.getElementById('task-input');
        this.taskPriority = document.getElementById('task-priority');
        this.addTaskBtn = document.getElementById('add-task-btn');
        
        // Columns
        this.todoColumn = document.getElementById('todo-tasks');
        this.doingColumn = document.getElementById('doing-tasks');
        this.doneColumn = document.getElementById('done-tasks');
        
        // Counters
        this.todoCount = document.getElementById('todo-count');
        this.doingCount = document.getElementById('doing-count');
        this.doneCount = document.getElementById('done-count');
        
        // Controls
       
        
        // Modal elements
        this.modal = document.getElementById('edit-modal');
        this.editTaskInput = document.getElementById('edit-task-input');
        this.editTaskPriority = document.getElementById('edit-task-priority');
        this.saveEditBtn = document.getElementById('save-edit-btn');
        this.cancelEditBtn = document.getElementById('cancel-edit-btn');
        this.closeModal = document.querySelector('.close');
    }

    attachEventListeners() {
        // Add task
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Drag and drop
        this.attachDragAndDrop();

        // Controls
    

        // Modal
        this.saveEditBtn.addEventListener('click', () => this.saveEdit());
        this.cancelEditBtn.addEventListener('click', () => this.closeEditModal());
        this.closeModal.addEventListener('click', () => this.closeEditModal());
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeEditModal();
            }
        });

        // Load tasks from localStorage on page load
        window.addEventListener('load', () => {
            this.renderTasks();
            this.updateTaskCounts();
        });
    }

    attachDragAndDrop() {
        const columns = [this.todoColumn, this.doingColumn, this.doneColumn];
        
        columns.forEach(column => {
            // Allow drop
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.classList.add('drag-over');
            });

            column.addEventListener('dragleave', () => {
                column.classList.remove('drag-over');
            });

            column.addEventListener('drop', (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');
                
                const taskId = e.dataTransfer.getData('text/plain');
                const newStatus = column.dataset.status;
                this.moveTask(taskId, newStatus);
            });
        });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    addTask() {
        const content = this.taskInput.value.trim();
        if (!content) {
            alert('Por favor, digite uma tarefa!');
            return;
        }

        const task = {
            id: this.generateId(),
            content: content,
            priority: this.taskPriority.value,
            status: 'todo',
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.updateTaskCounts();
        
        // Reset input
        this.taskInput.value = '';
        this.taskInput.focus();
    }

    moveTask(taskId, newStatus) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex].status = newStatus;
            this.saveTasks();
            this.renderTasks();
            this.updateTaskCounts();
        }
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.currentEditId = taskId;
            this.editTaskInput.value = task.content;
            this.editTaskPriority.value = task.priority;
            this.modal.style.display = 'block';
            this.editTaskInput.focus();
        }
    }

    saveEdit() {
        if (!this.currentEditId) return;

        const taskIndex = this.tasks.findIndex(task => task.id === this.currentEditId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex].content = this.editTaskInput.value.trim();
            this.tasks[taskIndex].priority = this.editTaskPriority.value;
            this.saveTasks();
            this.renderTasks();
            this.closeEditModal();
        }
    }

    closeEditModal() {
        this.modal.style.display = 'none';
        this.currentEditId = null;
    }

    deleteTask(taskId) {
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveTasks();
            this.renderTasks();
            this.updateTaskCounts();
        }
    }

    clearCompleted() {
        if (confirm('Tem certeza que deseja limpar todas as tarefas concluídas?')) {
            this.tasks = this.tasks.filter(task => task.status !== 'done');
            this.saveTasks();
            this.renderTasks();
            this.updateTaskCounts();
        }
    }

   

    renderTasks() {
        // Clear all columns
        this.todoColumn.innerHTML = '';
        this.doingColumn.innerHTML = '';
        this.doneColumn.innerHTML = '';

        // Render tasks in their respective columns
        this.tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            
            switch (task.status) {
                case 'todo':
                    this.todoColumn.appendChild(taskElement);
                    break;
                case 'doing':
                    this.doingColumn.appendChild(taskElement);
                    break;
                case 'done':
                    this.doneColumn.appendChild(taskElement);
                    break;
            }
        });
    }

    createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = `task-item ${task.priority}-priority`;
        taskDiv.draggable = true;
        taskDiv.dataset.taskId = task.id;

        // Priority labels
        const priorityLabels = {
            low: '🟢 Baixa',
            medium: '🟡 Média',
            high: '🔴 Alta'
        };

        taskDiv.innerHTML = `
            <div class="task-content">${task.content}</div>
            <div class="task-meta">
                <small>Prioridade: ${priorityLabels[task.priority]}</small>
            </div>
            <div class="task-actions">
                <button class="task-btn edit-btn" onclick="taskFlow.editTask('${task.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="task-btn delete-btn" onclick="taskFlow.deleteTask('${task.id}')">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;

        // Drag events
        taskDiv.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
            taskDiv.classList.add('dragging');
        });

        taskDiv.addEventListener('dragend', () => {
            taskDiv.classList.remove('dragging');
        });

        return taskDiv;
    }

    updateTaskCounts() {
        const todoCount = this.tasks.filter(task => task.status === 'todo').length;
        const doingCount = this.tasks.filter(task => task.status === 'doing').length;
        const doneCount = this.tasks.filter(task => task.status === 'done').length;

        this.todoCount.textContent = todoCount;
        this.doingCount.textContent = doingCount;
        this.doneCount.textContent = doneCount;
    }

    saveTasks() {
        localStorage.setItem('taskflow-tasks', JSON.stringify(this.tasks));
    }
}

// Initialize the app
const taskFlow = new TaskFlow();

// Make it available globally for onclick events
window.taskFlow = taskFlow;