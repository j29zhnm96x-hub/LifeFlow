/**
 * LifeFlow - Minimalist GTD Task Planner
 * Main Application Script
 */

// ===========================
// Utility Functions
// ===========================

/**
 * Generate a unique ID
 * @returns {string} UUID-like string
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Format date for display
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Check if date is overdue
 * @param {string} dateStr - ISO date string
 * @returns {boolean} True if overdue
 */
function isOverdue(dateStr) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
}

/**
 * Check if date is today
 * @param {string} dateStr - ISO date string
 * @returns {boolean} True if today
 */
function isToday(dateStr) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

/**
 * Check if date is within days
 * @param {string} dateStr - ISO date string
 * @param {number} days - Number of days
 * @returns {boolean} True if within days
 */
function isWithinDays(dateStr, days) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const future = new Date();
    future.setDate(future.getDate() + days);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today && date <= future;
}

// ===========================
// Event Bus
// ===========================

/**
 * Custom Event Bus for component communication
 */
class EventBus {
    constructor() {
        this.events = {};
    }
    
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
    
    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
}

const eventBus = new EventBus();

// ===========================
// Storage Module
// ===========================

/**
 * Storage Manager - handles localStorage with IndexedDB fallback
 */
class StorageManager {
    constructor() {
        this.storageKey = 'lifeflow_data';
        this.useIndexedDB = false;
        this.db = null;
    }
    
    /**
     * Initialize storage
     */
    async init() {
        try {
            // Test localStorage
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
        } catch (e) {
            // Fallback to IndexedDB
            this.useIndexedDB = true;
            await this.initIndexedDB();
        }
    }
    
    /**
     * Initialize IndexedDB
     */
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('LifeFlowDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('data')) {
                    db.createObjectStore('data');
                }
            };
        });
    }
    
    /**
     * Get data from storage
     * @returns {Object} Stored data
     */
    async getData() {
        try {
            if (this.useIndexedDB) {
                return await this.getFromIndexedDB();
            } else {
                const data = localStorage.getItem(this.storageKey);
                return data ? JSON.parse(data) : this.getDefaultData();
            }
        } catch (e) {
            console.error('Error loading data:', e);
            return this.getDefaultData();
        }
    }
    
    /**
     * Save data to storage
     * @param {Object} data - Data to save
     */
    async saveData(data) {
        try {
            if (this.useIndexedDB) {
                await this.saveToIndexedDB(data);
            } else {
                localStorage.setItem(this.storageKey, JSON.stringify(data));
            }
        } catch (e) {
            console.error('Error saving data:', e);
        }
    }
    
    /**
     * Get data from IndexedDB
     */
    async getFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['data'], 'readonly');
            const store = transaction.objectStore('data');
            const request = store.get(this.storageKey);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                resolve(request.result || this.getDefaultData());
            };
        });
    }
    
    /**
     * Save data to IndexedDB
     */
    async saveToIndexedDB(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['data'], 'readwrite');
            const store = transaction.objectStore('data');
            const request = store.put(data, this.storageKey);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    
    /**
     * Get default data structure
     * @returns {Object} Default data
     */
    getDefaultData() {
        return {
            tasks: [],
            projects: [],
            settings: {
                darkMode: 'auto',
                notifications: true
            }
        };
    }
}

const storage = new StorageManager();

// ===========================
// Data Models
// ===========================

/**
 * Task Manager - handles task CRUD operations
 */
class TaskManager {
    constructor() {
        this.tasks = [];
    }
    
    /**
     * Initialize tasks from storage
     */
    async init() {
        const data = await storage.getData();
        this.tasks = data.tasks || [];
    }
    
    /**
     * Get all tasks
     * @returns {Array} All tasks
     */
    getTasks() {
        return this.tasks;
    }
    
    /**
     * Get task by ID
     * @param {string} id - Task ID
     * @returns {Object} Task object
     */
    getTask(id) {
        return this.tasks.find(task => task.id === id);
    }
    
    /**
     * Create a new task
     * @param {Object} taskData - Task data
     * @returns {Object} Created task
     */
    async createTask(taskData) {
        const task = {
            id: generateId(),
            title: taskData.title,
            desc: taskData.desc || '',
            projectId: taskData.projectId || null,
            due: taskData.due || null,
            tags: taskData.tags || [],
            subtasks: taskData.subtasks || [],
            done: false,
            recurring: taskData.recurring || false,
            created: new Date().toISOString(),
            status: taskData.status || 'todo'
        };
        
        this.tasks.push(task);
        await this.save();
        eventBus.emit('task:created', task);
        return task;
    }
    
    /**
     * Update a task
     * @param {string} id - Task ID
     * @param {Object} updates - Updates to apply
     * @returns {Object} Updated task
     */
    async updateTask(id, updates) {
        const task = this.getTask(id);
        if (!task) return null;
        
        Object.assign(task, updates);
        await this.save();
        eventBus.emit('task:updated', task);
        return task;
    }
    
    /**
     * Delete a task
     * @param {string} id - Task ID
     */
    async deleteTask(id) {
        const index = this.tasks.findIndex(task => task.id === id);
        if (index > -1) {
            const task = this.tasks[index];
            this.tasks.splice(index, 1);
            await this.save();
            eventBus.emit('task:deleted', task);
        }
    }
    
    /**
     * Toggle task completion
     * @param {string} id - Task ID
     */
    async toggleTask(id) {
        const task = this.getTask(id);
        if (task) {
            task.done = !task.done;
            await this.save();
            eventBus.emit('task:updated', task);
        }
    }
    
    /**
     * Filter tasks by view
     * @param {string} view - View name
     * @param {string} projectId - Optional project ID
     * @returns {Array} Filtered tasks
     */
    filterTasks(view, projectId = null) {
        let filtered = this.tasks;
        
        if (projectId) {
            filtered = filtered.filter(task => task.projectId === projectId);
        } else {
            switch (view) {
                case 'inbox':
                    filtered = filtered.filter(task => !task.projectId);
                    break;
                case 'today':
                    filtered = filtered.filter(task => isToday(task.due));
                    break;
                case 'week':
                    filtered = filtered.filter(task => isWithinDays(task.due, 7));
                    break;
                case 'month':
                    filtered = filtered.filter(task => isWithinDays(task.due, 30));
                    break;
            }
        }
        
        return filtered.sort((a, b) => {
            // Sort by done status, then by due date
            if (a.done !== b.done) return a.done ? 1 : -1;
            if (a.due && b.due) return new Date(a.due) - new Date(b.due);
            if (a.due) return -1;
            if (b.due) return 1;
            return new Date(b.created) - new Date(a.created);
        });
    }
    
    /**
     * Search tasks
     * @param {string} query - Search query
     * @returns {Array} Matching tasks
     */
    searchTasks(query) {
        if (!query) return this.tasks;
        
        const lowerQuery = query.toLowerCase();
        return this.tasks.filter(task => {
            return task.title.toLowerCase().includes(lowerQuery) ||
                   task.desc.toLowerCase().includes(lowerQuery) ||
                   task.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
        });
    }
    
    /**
     * Save tasks to storage
     */
    async save() {
        const data = await storage.getData();
        data.tasks = this.tasks;
        await storage.saveData(data);
    }
}

const taskManager = new TaskManager();

/**
 * Project Manager - handles project CRUD operations
 */
class ProjectManager {
    constructor() {
        this.projects = [];
    }
    
    /**
     * Initialize projects from storage
     */
    async init() {
        const data = await storage.getData();
        this.projects = data.projects || [];
    }
    
    /**
     * Get all projects
     * @returns {Array} All projects
     */
    getProjects() {
        return this.projects;
    }
    
    /**
     * Get project by ID
     * @param {string} id - Project ID
     * @returns {Object} Project object
     */
    getProject(id) {
        return this.projects.find(project => project.id === id);
    }
    
    /**
     * Create a new project
     * @param {Object} projectData - Project data
     * @returns {Object} Created project
     */
    async createProject(projectData) {
        const project = {
            id: generateId(),
            name: projectData.name,
            color: projectData.color || '#3b82f6',
            view: projectData.view || 'list'
        };
        
        this.projects.push(project);
        await this.save();
        eventBus.emit('project:created', project);
        return project;
    }
    
    /**
     * Update a project
     * @param {string} id - Project ID
     * @param {Object} updates - Updates to apply
     * @returns {Object} Updated project
     */
    async updateProject(id, updates) {
        const project = this.getProject(id);
        if (!project) return null;
        
        Object.assign(project, updates);
        await this.save();
        eventBus.emit('project:updated', project);
        return project;
    }
    
    /**
     * Delete a project
     * @param {string} id - Project ID
     */
    async deleteProject(id) {
        const index = this.projects.findIndex(project => project.id === id);
        if (index > -1) {
            const project = this.projects[index];
            this.projects.splice(index, 1);
            
            // Unassign tasks from this project
            const tasks = taskManager.getTasks().filter(task => task.projectId === id);
            for (const task of tasks) {
                await taskManager.updateTask(task.id, { projectId: null });
            }
            
            await this.save();
            eventBus.emit('project:deleted', project);
        }
    }
    
    /**
     * Get task count for project
     * @param {string} id - Project ID
     * @returns {number} Task count
     */
    getTaskCount(id) {
        return taskManager.getTasks().filter(task => task.projectId === id).length;
    }
    
    /**
     * Save projects to storage
     */
    async save() {
        const data = await storage.getData();
        data.projects = this.projects;
        await storage.saveData(data);
    }
}

const projectManager = new ProjectManager();

// ===========================
// Router
// ===========================

/**
 * Router - handles view switching
 */
class Router {
    constructor() {
        this.currentView = 'inbox';
        this.currentProjectId = null;
    }
    
    /**
     * Navigate to a view
     * @param {string} view - View name
     * @param {string} projectId - Optional project ID
     */
    navigate(view, projectId = null) {
        this.currentView = view;
        this.currentProjectId = projectId;
        
        // Update active nav items
        document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.view === view && !projectId) {
                item.classList.add('active');
            }
        });
        
        // Render view
        this.renderView();
    }
    
    /**
     * Render current view
     */
    renderView() {
        const taskListView = document.getElementById('taskListView');
        const kanbanView = document.getElementById('kanbanView');
        const projectsView = document.getElementById('projectsView');
        
        // Hide all views
        taskListView.classList.add('hidden');
        kanbanView.classList.add('hidden');
        projectsView.classList.add('hidden');
        
        // Update view title
        let title = this.currentView.charAt(0).toUpperCase() + this.currentView.slice(1);
        
        if (this.currentProjectId) {
            const project = projectManager.getProject(this.currentProjectId);
            if (project) {
                title = project.name;
                
                // Show kanban or list view based on project setting
                if (project.view === 'kanban') {
                    kanbanView.classList.remove('hidden');
                    viewManager.renderKanban(this.currentProjectId);
                } else {
                    taskListView.classList.remove('hidden');
                    viewManager.renderTaskList(this.currentView, this.currentProjectId);
                }
            }
        } else if (this.currentView === 'projects') {
            projectsView.classList.remove('hidden');
            viewManager.renderProjects();
        } else {
            taskListView.classList.remove('hidden');
            viewManager.renderTaskList(this.currentView);
        }
        
        document.getElementById('viewTitle').textContent = title;
        this.updateCounts();
    }
    
    /**
     * Update nav counts
     */
    updateCounts() {
        const counts = {
            inbox: taskManager.filterTasks('inbox').filter(t => !t.done).length,
            today: taskManager.filterTasks('today').filter(t => !t.done).length,
            week: taskManager.filterTasks('week').filter(t => !t.done).length,
            month: taskManager.filterTasks('month').filter(t => !t.done).length,
            projects: projectManager.getProjects().length
        };
        
        Object.entries(counts).forEach(([view, count]) => {
            document.querySelectorAll(`[data-count="${view}"]`).forEach(el => {
                el.textContent = count;
            });
        });
    }
}

const router = new Router();

// ===========================
// View Manager
// ===========================

/**
 * View Manager - handles DOM rendering
 */
class ViewManager {
    /**
     * Render task list
     * @param {string} view - View name
     * @param {string} projectId - Optional project ID
     */
    renderTaskList(view, projectId = null) {
        const taskList = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');
        const tasks = taskManager.filterTasks(view, projectId);
        
        if (tasks.length === 0) {
            taskList.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');
        taskList.innerHTML = tasks.map(task => this.renderTaskItem(task)).join('');
    }
    
    /**
     * Render a single task item
     * @param {Object} task - Task object
     * @returns {string} HTML string
     */
    renderTaskItem(task) {
        const project = task.projectId ? projectManager.getProject(task.projectId) : null;
        const dueClass = task.due ? (isOverdue(task.due) ? 'overdue' : (isToday(task.due) ? 'today' : '')) : '';
        
        return `
            <div class="task-item ${task.done ? 'done' : ''}" data-task-id="${task.id}">
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.done ? 'checked' : ''}
                    onclick="app.toggleTask('${task.id}')"
                >
                <div class="task-content" onclick="app.editTask('${task.id}')">
                    <div class="task-title">${sanitizeHTML(task.title)}</div>
                    ${task.desc ? `<div class="task-desc">${sanitizeHTML(task.desc)}</div>` : ''}
                    <div class="task-meta">
                        ${task.due ? `<span class="task-due ${dueClass}">${formatDate(task.due)}</span>` : ''}
                        ${project ? `<span class="task-project" style="border-left: 3px solid ${project.color}">${sanitizeHTML(project.name)}</span>` : ''}
                        ${task.tags.length > 0 ? `
                            <div class="task-tags">
                                ${task.tags.map(tag => `<span class="task-tag">${sanitizeHTML(tag)}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render kanban board
     * @param {string} projectId - Project ID
     */
    renderKanban(projectId) {
        const tasks = taskManager.filterTasks('inbox', projectId);
        const columns = {
            todo: tasks.filter(t => t.status === 'todo' && !t.done),
            doing: tasks.filter(t => t.status === 'doing' && !t.done),
            done: tasks.filter(t => t.status === 'done' || t.done)
        };
        
        Object.entries(columns).forEach(([status, tasks]) => {
            const column = document.querySelector(`[data-droppable="${status}"]`);
            column.innerHTML = tasks.map(task => this.renderKanbanCard(task)).join('');
        });
    }
    
    /**
     * Render a kanban card
     * @param {Object} task - Task object
     * @returns {string} HTML string
     */
    renderKanbanCard(task) {
        return `
            <div 
                class="task-card" 
                draggable="true"
                data-task-id="${task.id}"
                ondragstart="app.handleDragStart(event)"
                ondragend="app.handleDragEnd(event)"
                onclick="app.editTask('${task.id}')"
            >
                <div class="task-title">${sanitizeHTML(task.title)}</div>
                ${task.desc ? `<div class="task-desc">${sanitizeHTML(task.desc)}</div>` : ''}
                ${task.due ? `<div class="task-due ${isOverdue(task.due) ? 'overdue' : ''}">${formatDate(task.due)}</div>` : ''}
            </div>
        `;
    }
    
    /**
     * Render projects list
     */
    renderProjects() {
        const projectsList = document.getElementById('projectsList');
        const projects = projectManager.getProjects();
        
        if (projects.length === 0) {
            projectsList.innerHTML = '<div class="empty-state"><p>No projects yet. Create one to get started!</p></div>';
            return;
        }
        
        projectsList.innerHTML = projects.map(project => {
            const taskCount = projectManager.getTaskCount(project.id);
            return `
                <div class="project-card" style="border-left-color: ${project.color}" onclick="app.openProject('${project.id}')">
                    <div class="project-header">
                        <div class="project-name">${sanitizeHTML(project.name)}</div>
                        <div class="project-actions">
                            <button class="icon-btn btn-sm" onclick="event.stopPropagation(); app.editProject('${project.id}')" title="Edit">✏️</button>
                            <button class="icon-btn btn-sm" onclick="event.stopPropagation(); app.deleteProject('${project.id}')" title="Delete">🗑️</button>
                        </div>
                    </div>
                    <div class="project-stats">
                        ${taskCount} ${taskCount === 1 ? 'task' : 'tasks'} • ${project.view === 'kanban' ? 'Kanban' : 'List'} view
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Populate project select dropdown
     */
    populateProjectSelect() {
        const select = document.getElementById('taskProject');
        const projects = projectManager.getProjects();
        
        select.innerHTML = '<option value="">No Project</option>' + 
            projects.map(project => `
                <option value="${project.id}">${sanitizeHTML(project.name)}</option>
            `).join('');
    }
}

const viewManager = new ViewManager();

// ===========================
// UI Controller
// ===========================

/**
 * UI Controller - handles UI interactions
 */
class UIController {
    constructor() {
        this.modals = {};
        this.currentTaskId = null;
        this.currentProjectId = null;
    }
    
    /**
     * Initialize UI
     */
    init() {
        // Cache modal elements
        this.modals.task = document.getElementById('taskModal');
        this.modals.project = document.getElementById('projectModal');
        this.modals.export = document.getElementById('exportModal');
        this.modals.help = document.getElementById('helpModal');
        
        // Setup event listeners
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.setupDragAndDrop();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Quick add
        document.getElementById('quickAddBtn').addEventListener('click', () => this.quickAddTask());
        document.getElementById('quickAddInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.quickAddTask();
        });
        
        // Voice input
        document.getElementById('voiceInputBtn').addEventListener('click', () => this.startVoiceInput());
        
        // Search
        document.getElementById('searchInput').addEventListener('input', 
            debounce((e) => this.handleSearch(e.target.value), 300)
        );
        
        // Navigation
        document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
            if (item.dataset.view) {
                item.addEventListener('click', () => router.navigate(item.dataset.view));
            }
        });
        
        // Mobile add button
        document.getElementById('mobileAddBtn').addEventListener('click', () => {
            this.openTaskModal();
        });
        
        // Dark mode toggle
        document.getElementById('darkModeToggle').addEventListener('click', () => this.toggleDarkMode());
        
        // Export
        document.getElementById('exportBtn').addEventListener('click', () => this.openModal('export'));
        document.getElementById('exportJsonBtn').addEventListener('click', () => this.exportData('json'));
        document.getElementById('exportCsvBtn').addEventListener('click', () => this.exportData('csv'));
        
        // Help
        document.getElementById('helpBtn').addEventListener('click', () => this.openModal('help'));
        
        // Project
        document.getElementById('newProjectBtn').addEventListener('click', () => this.openProjectModal());
        
        // Modal close handlers
        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        // Forms
        document.getElementById('taskForm').addEventListener('submit', (e) => this.saveTask(e));
        document.getElementById('projectForm').addEventListener('submit', (e) => this.saveProject(e));
        
        // Subtasks
        document.getElementById('addSubtaskBtn').addEventListener('click', () => this.addSubtaskInput());
        
        // Tags input
        document.getElementById('taskTags').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTag(e.target.value);
                e.target.value = '';
            }
        });
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                // Allow Esc even in inputs
                if (e.key === 'Escape') {
                    e.target.blur();
                    this.closeAllModals();
                }
                return;
            }
            
            switch(e.key) {
                case '?':
                    e.preventDefault();
                    this.openModal('help');
                    break;
                case 'n':
                    e.preventDefault();
                    document.getElementById('quickAddInput').focus();
                    break;
                case '/':
                    e.preventDefault();
                    document.getElementById('searchInput').focus();
                    break;
                case 'Escape':
                    this.closeAllModals();
                    break;
            }
        });
    }
    
    /**
     * Setup drag and drop for kanban
     */
    setupDragAndDrop() {
        document.querySelectorAll('[data-droppable]').forEach(column => {
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
                const status = column.dataset.droppable;
                this.moveTask(taskId, status);
            });
        });
    }
    
    /**
     * Quick add task
     */
    async quickAddTask() {
        const input = document.getElementById('quickAddInput');
        const title = input.value.trim();
        
        if (!title) return;
        
        await taskManager.createTask({ title });
        input.value = '';
        router.renderView();
        this.showToast('Task added!');
    }
    
    /**
     * Start voice input
     */
    startVoiceInput() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showToast('Voice input not supported in this browser');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        
        const btn = document.getElementById('voiceInputBtn');
        btn.classList.add('listening');
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('quickAddInput').value = transcript;
            btn.classList.remove('listening');
        };
        
        recognition.onerror = () => {
            btn.classList.remove('listening');
            this.showToast('Voice input error');
        };
        
        recognition.onend = () => {
            btn.classList.remove('listening');
        };
        
        recognition.start();
    }
    
    /**
     * Handle search
     * @param {string} query - Search query
     */
    handleSearch(query) {
        const taskList = document.getElementById('taskList');
        const tasks = taskManager.searchTasks(query);
        
        if (tasks.length === 0) {
            taskList.innerHTML = '<div class="empty-state"><p>No tasks found</p></div>';
            return;
        }
        
        taskList.innerHTML = tasks.map(task => viewManager.renderTaskItem(task)).join('');
    }
    
    /**
     * Open task modal
     * @param {string} taskId - Optional task ID for editing
     */
    openTaskModal(taskId = null) {
        this.currentTaskId = taskId;
        const modal = this.modals.task;
        const form = document.getElementById('taskForm');
        
        // Populate project select
        viewManager.populateProjectSelect();
        
        if (taskId) {
            const task = taskManager.getTask(taskId);
            if (task) {
                document.getElementById('taskId').value = task.id;
                document.getElementById('taskTitle').value = task.title;
                document.getElementById('taskDesc').value = task.desc;
                document.getElementById('taskDue').value = task.due || '';
                document.getElementById('taskProject').value = task.projectId || '';
                document.getElementById('taskRecurring').checked = task.recurring;
                
                // Render tags
                this.renderTags(task.tags);
                
                // Render subtasks
                this.renderSubtasks(task.subtasks);
            }
        } else {
            form.reset();
            document.getElementById('tagsList').innerHTML = '';
            document.getElementById('subtasksList').innerHTML = '';
        }
        
        modal.classList.remove('hidden');
        document.getElementById('taskTitle').focus();
    }
    
    /**
     * Open project modal
     * @param {string} projectId - Optional project ID for editing
     */
    openProjectModal(projectId = null) {
        this.currentProjectId = projectId;
        const modal = this.modals.project;
        const form = document.getElementById('projectForm');
        
        if (projectId) {
            const project = projectManager.getProject(projectId);
            if (project) {
                document.getElementById('projectId').value = project.id;
                document.getElementById('projectName').value = project.name;
                document.getElementById('projectColor').value = project.color;
                document.querySelector(`input[name="projectView"][value="${project.view}"]`).checked = true;
            }
        } else {
            form.reset();
        }
        
        modal.classList.remove('hidden');
        document.getElementById('projectName').focus();
    }
    
    /**
     * Open modal
     * @param {string} name - Modal name
     */
    openModal(name) {
        if (this.modals[name]) {
            this.modals[name].classList.remove('hidden');
        }
    }
    
    /**
     * Close all modals
     */
    closeAllModals() {
        Object.values(this.modals).forEach(modal => modal.classList.add('hidden'));
        this.currentTaskId = null;
        this.currentProjectId = null;
    }
    
    /**
     * Save task
     * @param {Event} e - Form submit event
     */
    async saveTask(e) {
        e.preventDefault();
        
        const taskData = {
            title: document.getElementById('taskTitle').value.trim(),
            desc: document.getElementById('taskDesc').value.trim(),
            due: document.getElementById('taskDue').value || null,
            projectId: document.getElementById('taskProject').value || null,
            recurring: document.getElementById('taskRecurring').checked,
            tags: this.getCurrentTags(),
            subtasks: this.getCurrentSubtasks()
        };
        
        if (this.currentTaskId) {
            await taskManager.updateTask(this.currentTaskId, taskData);
            this.showToast('Task updated!');
        } else {
            await taskManager.createTask(taskData);
            this.showToast('Task created!');
        }
        
        this.closeAllModals();
        router.renderView();
    }
    
    /**
     * Save project
     * @param {Event} e - Form submit event
     */
    async saveProject(e) {
        e.preventDefault();
        
        const projectData = {
            name: document.getElementById('projectName').value.trim(),
            color: document.getElementById('projectColor').value,
            view: document.querySelector('input[name="projectView"]:checked').value
        };
        
        if (this.currentProjectId) {
            await projectManager.updateProject(this.currentProjectId, projectData);
            this.showToast('Project updated!');
        } else {
            await projectManager.createProject(projectData);
            this.showToast('Project created!');
        }
        
        this.closeAllModals();
        router.renderView();
    }
    
    /**
     * Render tags in modal
     * @param {Array} tags - Array of tag strings
     */
    renderTags(tags) {
        const container = document.getElementById('tagsList');
        container.innerHTML = tags.map(tag => `
            <span class="tag-chip">
                ${sanitizeHTML(tag)}
                <button type="button" class="tag-remove" onclick="this.parentElement.remove()">×</button>
            </span>
        `).join('');
    }
    
    /**
     * Add tag
     * @param {string} tag - Tag text
     */
    addTag(tag) {
        if (!tag.trim()) return;
        
        const container = document.getElementById('tagsList');
        const chip = document.createElement('span');
        chip.className = 'tag-chip';
        chip.innerHTML = `
            ${sanitizeHTML(tag.trim())}
            <button type="button" class="tag-remove" onclick="this.parentElement.remove()">×</button>
        `;
        container.appendChild(chip);
    }
    
    /**
     * Get current tags from modal
     * @returns {Array} Array of tag strings
     */
    getCurrentTags() {
        return Array.from(document.querySelectorAll('#tagsList .tag-chip'))
            .map(chip => chip.textContent.trim().replace('×', ''));
    }
    
    /**
     * Render subtasks in modal
     * @param {Array} subtasks - Array of subtask objects
     */
    renderSubtasks(subtasks) {
        const container = document.getElementById('subtasksList');
        container.innerHTML = subtasks.map(subtask => `
            <div class="subtask-item" data-subtask-id="${subtask.id}">
                <input type="checkbox" class="subtask-checkbox" ${subtask.done ? 'checked' : ''}>
                <input type="text" class="subtask-text" value="${sanitizeHTML(subtask.text)}">
                <button type="button" class="subtask-remove" onclick="this.parentElement.remove()">×</button>
            </div>
        `).join('');
    }
    
    /**
     * Add subtask input
     */
    addSubtaskInput() {
        const container = document.getElementById('subtasksList');
        const div = document.createElement('div');
        div.className = 'subtask-item';
        div.innerHTML = `
            <input type="checkbox" class="subtask-checkbox">
            <input type="text" class="subtask-text" placeholder="Subtask...">
            <button type="button" class="subtask-remove" onclick="this.parentElement.remove()">×</button>
        `;
        container.appendChild(div);
        div.querySelector('.subtask-text').focus();
    }
    
    /**
     * Get current subtasks from modal
     * @returns {Array} Array of subtask objects
     */
    getCurrentSubtasks() {
        return Array.from(document.querySelectorAll('#subtasksList .subtask-item'))
            .map(item => ({
                id: item.dataset.subtaskId || generateId(),
                text: item.querySelector('.subtask-text').value.trim(),
                done: item.querySelector('.subtask-checkbox').checked
            }))
            .filter(subtask => subtask.text);
    }
    
    /**
     * Toggle dark mode
     */
    async toggleDarkMode() {
        const html = document.documentElement;
        const currentTheme = html.dataset.theme || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.dataset.theme = newTheme;
        
        // Save to settings
        const data = await storage.getData();
        data.settings.darkMode = newTheme;
        await storage.saveData(data);
        
        // Update icon
        const icon = document.querySelector('.theme-icon');
        icon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }
    
    /**
     * Export data
     * @param {string} format - Export format (json or csv)
     */
    async exportData(format) {
        const data = await storage.getData();
        let content, filename, type;
        
        if (format === 'json') {
            content = JSON.stringify(data, null, 2);
            filename = `lifeflow-export-${Date.now()}.json`;
            type = 'application/json';
        } else if (format === 'csv') {
            content = this.convertToCSV(data.tasks);
            filename = `lifeflow-export-${Date.now()}.csv`;
            type = 'text/csv';
        }
        
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        this.closeAllModals();
        this.showToast('Data exported!');
    }
    
    /**
     * Convert tasks to CSV
     * @param {Array} tasks - Array of tasks
     * @returns {string} CSV string
     */
    convertToCSV(tasks) {
        const headers = ['Title', 'Description', 'Due Date', 'Project', 'Tags', 'Done', 'Created'];
        const rows = tasks.map(task => {
            const project = task.projectId ? projectManager.getProject(task.projectId)?.name : '';
            return [
                task.title,
                task.desc,
                task.due || '',
                project,
                task.tags.join('; '),
                task.done ? 'Yes' : 'No',
                task.created
            ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
        });
        
        return [headers.join(','), ...rows].join('\n');
    }
    
    /**
     * Show toast notification
     * @param {string} message - Toast message
     */
    showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
    
    /**
     * Handle drag start
     * @param {Event} e - Drag event
     */
    handleDragStart(e) {
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
    }
    
    /**
     * Handle drag end
     * @param {Event} e - Drag event
     */
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }
    
    /**
     * Move task to new status
     * @param {string} taskId - Task ID
     * @param {string} status - New status
     */
    async moveTask(taskId, status) {
        await taskManager.updateTask(taskId, { 
            status,
            done: status === 'done'
        });
        router.renderView();
        this.showToast('Task moved!');
    }
}

const ui = new UIController();

// ===========================
// Application
// ===========================

/**
 * Main Application
 */
class App {
    async init() {
        // Initialize storage
        await storage.init();
        
        // Initialize managers
        await taskManager.init();
        await projectManager.init();
        
        // Initialize UI
        ui.init();
        
        // Set initial theme
        await this.initTheme();
        
        // Render initial view
        router.navigate('inbox');
        
        // Register service worker
        this.registerServiceWorker();
        
        // Setup event bus listeners
        this.setupEventListeners();
    }
    
    /**
     * Initialize theme
     */
    async initTheme() {
        const data = await storage.getData();
        const darkMode = data.settings.darkMode;
        
        if (darkMode === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light';
            document.querySelector('.theme-icon').textContent = prefersDark ? '☀️' : '🌙';
        } else {
            document.documentElement.dataset.theme = darkMode;
            document.querySelector('.theme-icon').textContent = darkMode === 'dark' ? '☀️' : '🌙';
        }
    }
    
    /**
     * Register service worker
     */
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(() => {
                console.log('Service worker registration failed');
            });
        }
    }
    
    /**
     * Setup event bus listeners
     */
    setupEventListeners() {
        eventBus.on('task:created', () => router.updateCounts());
        eventBus.on('task:updated', () => router.updateCounts());
        eventBus.on('task:deleted', () => router.updateCounts());
        eventBus.on('project:created', () => router.updateCounts());
        eventBus.on('project:updated', () => router.updateCounts());
        eventBus.on('project:deleted', () => router.updateCounts());
    }
    
    // Public methods for global access
    toggleTask(taskId) {
        taskManager.toggleTask(taskId).then(() => router.renderView());
    }
    
    editTask(taskId) {
        ui.openTaskModal(taskId);
    }
    
    openProject(projectId) {
        router.navigate('project', projectId);
    }
    
    editProject(projectId) {
        ui.openProjectModal(projectId);
    }
    
    async deleteProject(projectId) {
        if (confirm('Are you sure you want to delete this project?')) {
            await projectManager.deleteProject(projectId);
            router.navigate('projects');
            ui.showToast('Project deleted!');
        }
    }
    
    handleDragStart(e) {
        ui.handleDragStart(e);
    }
    
    handleDragEnd(e) {
        ui.handleDragEnd(e);
    }
}

// Initialize app
const app = new App();
app.init();

// Make app globally accessible for inline event handlers
window.app = app;
