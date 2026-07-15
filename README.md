# Strategnos Kanban and Workflow Demo

A standalone front-end demo based on the Strategnos workspace design.

## Included features

- Business-unit sidebar
- Kanban board with New, Planning, In Progress and Complete statuses
- Ordered subtask checklists for every task status
- Automatic task movement when the current checklist is completed
- Task flyout with Details, Files, Notes, Forms, Tags and Subtasks tabs
- Locked status dropdown whenever the current status has configured subtasks
- Administration > Workflows page
- Reusable workflow template creation and editing
- Ordered workflow subtask bubbles with drag-and-drop and arrow controls
- Local browser storage

## Open in Visual Studio Code

1. Extract the ZIP.
2. Open the extracted folder in Visual Studio Code.
3. Trust the folder when prompted.
4. Open `index.html` with Live Server.

You can also double-click `index.html` to open it directly.

## Reset the demo

The current browser storage key is:

```text
strategnos-kanban-demo-v5
```

To reset the data, run this in the browser console:

```javascript
localStorage.removeItem("strategnos-kanban-demo-v5");
location.reload();
```

## Files

- `index.html`
- `styles.css`
- `app.js`
- `README.md`


## Workflow Designer refresh

The workflow page now uses a stage-based designer. Select one main status at a time, then add, remove, or reorder its subtasks.


## Parent-folder workflow inheritance

Use the three-dot button beside a parent folder heading on the Kanban board to assign a workflow. Existing tasks can be updated immediately, and new tasks created in the same folder inherit the assignment automatically.
