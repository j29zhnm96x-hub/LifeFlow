# LifeFlow - Minimalist GTD Task Planner

A progressive web app for Getting Things Done (GTD) task management, built entirely with vanilla HTML, CSS, and JavaScript. No frameworks, no build tools—just clean, efficient code that works offline.

![LifeFlow App](https://github.com/user-attachments/assets/1ecc7a26-f72d-4650-8105-c8fd28846fab)

## 📋 Features

### Core Task Management
- ✅ **Quick Add**: Instantly add tasks with a prominent input bar
- ✅ **Task Details**: Rich task information including:
  - Title (required)
  - Multi-line description
  - Due dates with date picker
  - Project assignment
  - Tags (multiple per task)
  - Subtasks with checkboxes
  - Recurring task option
- ✅ **One-Click Completion**: Toggle task status with a single click
- ✅ **Instant Search**: Real-time search across titles, descriptions, and tags

### Project Organization
- 📂 **Projects**: Group related tasks into projects
- 🎨 **Custom Colors**: Assign colors to projects for visual organization
- 📊 **View Types**: Choose between List or Kanban board views per project
- 🗑️ **Full CRUD**: Create, edit, and delete projects

### Smart Views
- 📥 **Inbox**: All unassigned tasks
- 📅 **Today**: Tasks due today
- 📆 **This Week**: Tasks due within 7 days
- 🗓️ **This Month**: Tasks due within 30 days
- 📂 **Projects**: View and manage all projects

### Kanban Board
- 🎯 **Drag & Drop**: Native HTML5 drag-and-drop between columns
- 📋 **Three Columns**: To Do, Doing, Done
- 🔄 **Automatic Sync**: Changes persist immediately to storage

### User Experience
- 🌙 **Dark Mode**: Auto-detection with manual toggle
- 🎤 **Voice Input**: Web Speech API for hands-free task creation
- ⌨️ **Keyboard Shortcuts**: Power user features
- 📱 **Responsive Design**: Desktop sidebar, mobile bottom navigation
- 💾 **Offline Support**: Full functionality without internet
- 📤 **Export**: Download tasks as JSON or CSV
- 📲 **PWA Ready**: Install on any device

## 🚀 Setup Instructions

### No Installation Required!

1. **Clone or Download**:
   ```bash
   git clone https://github.com/j29zhnm96x-hub/LifeFlow.git
   cd LifeFlow
   ```

2. **Open in Browser**:
   - **Option 1**: Simply double-click `index.html`
   - **Option 2**: Use a local server (recommended for PWA features):
     ```bash
     # Python 3
     python3 -m http.server 8000
     
     # Node.js
     npx serve
     ```
   - Navigate to `http://localhost:8000`

3. **Start Using**: The app is ready to use immediately!

### PWA Installation

**Desktop (Chrome/Edge)**:
1. Open the app in your browser
2. Click the install icon in the address bar
3. Click "Install"

**Mobile (iOS/Android)**:
1. Open the app in Safari/Chrome
2. Tap the Share button
3. Select "Add to Home Screen"

## 📖 Usage Guide

### Adding Tasks

**Quick Add**:
1. Type task title in the top bar
2. Press Enter or click "Add"
3. Task appears in current view

**Detailed Add**:
1. Click on any task to open details modal
2. Fill in title (required)
3. Add optional details:
   - Description
   - Due date
   - Project assignment
   - Tags (press Enter to add)
   - Subtasks (click "+ Add Subtask")
   - Recurring toggle
4. Click "Save Task"

**Voice Input**:
1. Click the 🎤 microphone button
2. Speak your task title
3. Task appears in the input field
4. Press Enter to add

### Managing Tasks

- **Complete**: Check the checkbox next to any task
- **Edit**: Click on task text to open details
- **Delete**: Available in task detail modal
- **Search**: Type in search bar to filter tasks
- **Filter by View**: Click sidebar items to see specific task lists

### Working with Projects

1. **Create Project**:
   - Navigate to Projects view
   - Click "+ New Project"
   - Enter name, choose color and view type
   - Click "Save Project"

2. **Assign Tasks**:
   - Open task details
   - Select project from dropdown
   - Save changes

3. **View Project Tasks**:
   - Click on project card in Projects view
   - See all tasks in chosen view (List or Kanban)

### Using Kanban Board

1. Open a project with Kanban view
2. Drag tasks between columns:
   - **To Do**: Tasks not started
   - **Doing**: Tasks in progress
   - **Done**: Completed tasks
3. Changes save automatically

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `?` | Show keyboard shortcuts help |
| `n` | Focus quick-add input |
| `/` | Focus search bar |
| `Esc` | Close any open modal |

## 💾 Data Storage

### Storage Mechanism

LifeFlow uses a dual-storage approach:

1. **Primary**: `localStorage` - Fast, reliable, 5-10MB capacity
2. **Fallback**: IndexedDB - Used if localStorage is unavailable

### Data Structure

All data is stored under the key `lifeflow_data`:

```javascript
{
  tasks: [
    {
      id: "unique-id",
      title: "Task title",
      desc: "Description",
      projectId: "project-id" | null,
      due: "2025-11-15" | null,
      tags: ["tag1", "tag2"],
      subtasks: [
        {id: "sub-id", text: "Subtask", done: false}
      ],
      done: false,
      recurring: false,
      created: "2025-11-08T20:25:49Z",
      status: "todo" | "doing" | "done"
    }
  ],
  projects: [
    {
      id: "project-id",
      name: "Project Name",
      color: "#3b82f6",
      view: "list" | "kanban"
    }
  ],
  settings: {
    darkMode: "auto" | "light" | "dark",
    notifications: true
  }
}
```

### Data Persistence

- All changes save automatically
- No manual save required
- Data persists across sessions
- Works completely offline

### Export & Backup

**JSON Export**:
- Full data backup
- Preserves all relationships
- Human-readable format

**CSV Export**:
- Spreadsheet-compatible
- Great for task lists
- Easy to import elsewhere

## 🌐 Browser Compatibility

### Recommended Browsers

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Required Features

- localStorage or IndexedDB
- ES6+ JavaScript support
- CSS Grid and Flexbox
- Service Workers (for PWA)
- Web Speech API (optional, for voice input)
- HTML5 Drag and Drop (for Kanban)

## 🏗️ Architecture

### File Structure

```
/
├── index.html          # Single page application entry point
├── style.css          # Complete styling with CSS variables
├── script.js          # Modular vanilla JavaScript
├── manifest.json      # PWA manifest
├── sw.js              # Service worker for offline support
├── icons/
│   ├── icon-192.png   # App icon (192x192)
│   └── icon-512.png   # App icon (512x512)
└── README.md          # This file
```

### Code Architecture

**Design Pattern**: Model-View-Controller (MVC)

**Key Modules**:

1. **Storage Manager**: localStorage/IndexedDB abstraction
2. **Event Bus**: Custom pub/sub for component communication
3. **Task Manager**: CRUD operations for tasks
4. **Project Manager**: CRUD operations for projects
5. **Router**: View navigation and state management
6. **View Manager**: DOM rendering and updates
7. **UI Controller**: Event handling and user interactions

**Key Principles**:
- Pure vanilla JavaScript (ES6+)
- No external dependencies
- Modular, reusable code
- Clear separation of concerns
- Event-driven architecture

### Service Worker Strategy

**Cache-First Approach**:
1. Check cache for resource
2. Serve from cache if available
3. Fetch from network if not cached
4. Cache successful network responses
5. Fail gracefully if offline and not cached

## 🎨 Design System

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

### Colors

**Light Mode**:
- Background: `#ffffff`
- Cards: `#f5f5f5`
- Text: `#1f2937`
- Accent: `#3b82f6`

**Dark Mode**:
- Background: `#1f2937`
- Cards: `#111827`
- Text: `#f9fafb`
- Accent: `#3b82f6`

### Layout
- **Desktop**: Fixed sidebar (280px) with main content area
- **Mobile**: Bottom navigation bar with full-width content
- **Spacing**: Based on 1.5rem (24px) grid
- **Border Radius**: 0.75rem (12px) for cards

## 🔮 Future Enhancements

### Potential Features
- 🔄 Backend sync (REST API integration)
- 👥 Multi-user support with authentication
- 🔔 Push notifications for due dates
- 📊 Analytics and productivity insights
- 🌍 Internationalization (i18n)
- 🔗 Calendar integration (Google Calendar, iCal)
- 🎯 Priority levels for tasks
- 🏷️ Tag management and filtering
- 📎 File attachments
- 🔍 Advanced search with filters

### Migration Path to React

The codebase is structured to allow easy migration to React:

1. **State Management**: Current structure maps to Redux/Zustand
2. **Components**: Each view can become a React component
3. **Event Bus**: Can be replaced with React Context or state management
4. **Storage**: Already abstracted, easily mockable for tests
5. **Router**: Can integrate with React Router

**Suggested Steps**:
1. Create React app structure
2. Convert Storage/TaskManager/ProjectManager to services
3. Build React components for each view
4. Implement state management (Redux/Zustand)
5. Add React Router
6. Migrate UI interactions to React event handlers
7. Add testing framework (Jest, React Testing Library)

## 🔒 Security

### Implemented Measures
- ✅ XSS Prevention: All user input sanitized before rendering
- ✅ Safe DOM manipulation: Uses `textContent` where possible
- ✅ Input validation: Data structure validation on load
- ✅ CSP Ready: No inline scripts or styles
- ✅ HTTPS Ready: Works over secure connections

### Best Practices
- Never trust user input
- Sanitize before display
- Validate data structure
- Use secure storage APIs
- Regular security audits

## 📝 License

This project is open source and available for personal and commercial use.

## 🤝 Contributing

Contributions are welcome! This is a pure vanilla JavaScript project, so:
- No build tools or dependencies
- Follow existing code style
- Test in multiple browsers
- Maintain offline functionality
- Keep it simple and fast

## 📞 Support

For issues, feature requests, or questions, please open an issue on GitHub.

---

**Built with ❤️ using vanilla HTML, CSS, and JavaScript**