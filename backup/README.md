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
strategnos-kanban-demo-v6
```

To reset the data, run this in the browser console:

```javascript
localStorage.removeItem("strategnos-kanban-demo-v6");
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


## Grouped workflow steps

The Workflow Designer now supports grouped steps such as:

```text
1
2
  2.1
  2.2
3
```

A grouped step can use either:

- **All required** — every branch must be completed.
- **Any one required** — one branch is enough to complete the grouped step.

Click **Add grouped step** in a workflow stage, edit the group and branch names, then choose the completion rule.


## Workflow-controlled and ad-hoc task subtasks

The task flyout now distinguishes between two subtask modes:

- **Ad-hoc task subtasks:** editable directly on the task. Users can add, remove and reorder them.
- **Workflow-controlled subtasks:** inherited from the workflow linked to the task's parent folder. The Subtasks tab shows a lock, displays the workflow structure as read-only, and reflects normal steps, grouped steps and assigned users.

When an administrator updates a workflow, tasks in linked parent folders are synchronised automatically while preserving completion values for matching steps.
