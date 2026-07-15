const STATUSES = ["New", "Planning", "In Progress", "Complete"];
const STORAGE_KEY = "strategnos-kanban-demo-v5";

function makeSteps(titles = []) {
  return titles.map(title => ({ id: crypto.randomUUID(), title, complete: false }));
}

function makeWorkflow(newSteps = [], planningSteps = [], progressSteps = [], completeSteps = []) {
  return {
    New: makeSteps(newSteps),
    Planning: makeSteps(planningSteps),
    "In Progress": makeSteps(progressSteps),
    Complete: makeSteps(completeSteps)
  };
}

const defaultState = {
  selectedCompany: "Strategnos (Pty) LTD.",
  companies: [
    "Strategnos (Pty) LTD.", "Adcock Ingram Healthcare", "Afrigen", "Afripharm",
    "Alla-Aamin", "ALS", "Ambasaam", "Ambatovy",
    "Andrada Mining Limited (Afritin Mining Limited)", "Aramex", "Arctic Store",
    "Atlantic Group", "Aviz Laboratories", "B. Braun Medical", "B2B Catering Suppliers"
  ],

  folderWorkflowAssignments: [],

  workflowTemplates: [
    {
      id: crypto.randomUUID(),
      name: "Standard Project Workflow",
      description: "Default workflow for internal project tasks",
      isActive: true,
      workflow: makeWorkflow(
        ["Confirm requirements", "Confirm task owner"],
        ["Prepare delivery plan", "Approve delivery plan"],
        ["Complete implementation", "Complete internal review"],
        ["Obtain final approval", "Close task"]
      )
    },
    {
      id: crypto.randomUUID(),
      name: "Validation Workflow",
      description: "Structured workflow for validation and qualification work",
      isActive: true,
      workflow: makeWorkflow(
        ["Confirm validation scope", "Assign document owner"],
        ["Prepare protocol", "Approve test approach"],
        ["Execute testing", "Record evidence", "Resolve deviations"],
        ["Approve report", "Archive validation evidence"]
      )
    }
  ],
  tasks: [
    {
      id: crypto.randomUUID(), company: "Strategnos (Pty) LTD.", group: "Audit Trail - Replacement Tool",
      title: "TEST", status: "New", due: "2026-06-16", assignee: "AA",
      workflow: makeWorkflow(
        ["Confirm user requirements", "Identify process owner", "Confirm scope"],
        ["Prepare replacement approach", "Estimate effort", "Approve delivery plan"],
        ["Build replacement", "Complete internal testing", "Resolve test findings"],
        ["Obtain stakeholder approval", "Publish handover pack"]
      )
    },
    {
      id: crypto.randomUUID(), company: "Strategnos (Pty) LTD.", group: "Data Set 1",
      title: "TEST TASK", status: "New", due: "2025-09-05", assignee: "AA",
      workflow: makeWorkflow(
        ["Validate source data", "Confirm data owner"],
        ["Map required fields", "Agree transformation rules"],
        ["Build dataset", "Complete peer review"],
        ["Obtain sign-off"]
      )
    },
    {
      id: crypto.randomUUID(), company: "Strategnos (Pty) LTD.", group: "HR Process",
      title: "TESTING", status: "New", due: "2025-11-28", assignee: "AA",
      workflow: makeWorkflow(
        ["Review current workflow", "Confirm stakeholders"],
        ["Document proposed process", "Schedule review session"],
        ["Implement approved process", "Train users"],
        ["Secure HR approval", "Close implementation"]
      )
    },
    {
      id: crypto.randomUUID(), company: "Strategnos (Pty) LTD.", group: "HR Process",
      title: "ONBOARDING PACK", status: "Planning", due: "2026-08-04", assignee: "KR",
      workflow: makeWorkflow(
        ["Confirm onboarding scope"],
        ["Gather templates", "Confirm policy versions", "Agree pack structure"],
        ["Draft onboarding pack", "Complete content review"],
        ["Publish final pack"]
      )
    },
    {
      id: crypto.randomUUID(), company: "Strategnos (Pty) LTD.", group: "Audit Trail - Replacement Tool",
      title: "USER ACCEPTANCE TESTING", status: "In Progress", due: "2026-08-12", assignee: "JM",
      workflow: makeWorkflow(
        ["Confirm test users", "Approve test scope"],
        ["Prepare UAT scripts", "Schedule test sessions"],
        ["Execute test scripts", "Record findings", "Retest resolved findings"],
        ["Obtain UAT sign-off", "Archive evidence"]
      )
    },
    {
      id: crypto.randomUUID(), company: "Strategnos (Pty) LTD.", group: "Data Set 1",
      title: "DATA QUALITY REVIEW", status: "Planning", due: "2026-08-18", assignee: "AA",
      workflow: makeWorkflow(
        ["Identify source systems", "Confirm data owners"],
        ["Define quality checks", "Agree exception thresholds", "Prepare review plan"],
        ["Run quality checks", "Investigate exceptions", "Document corrections"],
        ["Approve quality report", "Close review"]
      )
    },
    {
      id: crypto.randomUUID(), company: "Strategnos (Pty) LTD.", group: "Platform Release",
      title: "DEMO RELEASE", status: "Complete", due: "2026-07-30", assignee: "KR",
      workflow: makeWorkflow(
        ["Confirm release scope"],
        ["Prepare deployment plan", "Confirm rollback steps"],
        ["Deploy demo build", "Complete smoke testing"],
        ["Confirm release successful", "Share release notes"]
      )
    }
  ]
};

let state = loadState();
let searchTerm = "";
let companySearchTerm = "";
let toastTimer;

const businessList = document.getElementById("businessList");
const selectedCompanyTitle = document.getElementById("selectedCompanyTitle");
const kanbanBoard = document.getElementById("kanbanBoard");
const taskSearch = document.getElementById("taskSearch");
const companySearch = document.getElementById("companySearch");
const taskModal = document.getElementById("taskModal");
const taskForm = document.getElementById("taskForm");
const taskFlyout = document.getElementById("taskFlyout");
const flyoutTaskForm = document.getElementById("flyoutTaskForm");

function ensureWorkflow(task) {
  if (!task.workflow) {
    task.workflow = makeWorkflow();
    task.workflow[task.status] = Array.isArray(task.subtasks) ? task.subtasks : [];
    delete task.subtasks;
  }
  STATUSES.forEach(status => {
    if (!Array.isArray(task.workflow[status])) task.workflow[status] = [];
  });
  return task;
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const loaded = saved ? JSON.parse(saved) : structuredClone(defaultState);

    if (!Array.isArray(loaded.folderWorkflowAssignments)) {
      loaded.folderWorkflowAssignments = [];
    }

    if (!Array.isArray(loaded.workflowTemplates)) {
      loaded.workflowTemplates = structuredClone(defaultState.workflowTemplates);
    }

    loaded.workflowTemplates.forEach(template => {
      if (!template.workflow) template.workflow = makeWorkflow();
      STATUSES.forEach(status => {
        if (!Array.isArray(template.workflow[status])) template.workflow[status] = [];
      });
    });

    loaded.tasks.forEach(ensureWorkflow);
    return loaded;
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function cloneWorkflowTemplate(template) {
  const workflow = makeWorkflow();
  STATUSES.forEach(status => {
    workflow[status] = (template?.workflow?.[status] || []).map(step => ({
      id: crypto.randomUUID(),
      title: step.title,
      complete: false
    }));
  });
  return workflow;
}

function getFolderWorkflowAssignment(company, group) {
  return state.folderWorkflowAssignments.find(
    item => item.company === company && item.group === group
  );
}

function getWorkflowTemplate(templateId) {
  return state.workflowTemplates.find(template => template.id === templateId);
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function formatDate(dateString) {
  if (!dateString) return "No due date";
  return new Intl.DateTimeFormat("en-ZA", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(`${dateString}T00:00:00`));
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function renderBusinessUnits() {
  const visible = state.companies.filter(company => company.toLowerCase().includes(companySearchTerm.toLowerCase()));
  businessList.innerHTML = visible.map(company => `
    <div class="business-item ${company === state.selectedCompany ? "selected" : ""}" data-company="${escapeHtml(company)}">
      <span>⊞</span><span class="business-name"><span>▦</span>${escapeHtml(company)}</span>
      <span class="business-icons"><button>▣</button><button>⌖</button><button>☆</button></span>
    </div>`).join("");
  document.querySelectorAll(".business-item").forEach(item => item.addEventListener("click", () => {
    state.selectedCompany = item.dataset.company; saveState(); render();
  }));
}

function getVisibleTasks() {
  return state.tasks.filter(task => {
    ensureWorkflow(task);
    const allStepText = STATUSES.flatMap(status => task.workflow[status].map(step => step.title)).join(" ");
    const haystack = `${task.title} ${task.group} ${task.status} ${allStepText}`.toLowerCase();
    return task.company === state.selectedCompany && haystack.includes(searchTerm.toLowerCase());
  });
}

function renderBoard() {
  selectedCompanyTitle.textContent = state.selectedCompany;
  const tasks = getVisibleTasks();
  const groups = [...new Set(tasks.map(task => task.group))];
  const header = `<div class="status-header">${STATUSES.map(status => `<div class="status-title">${status}</div>`).join("")}</div>`;
  if (!groups.length) { kanbanBoard.innerHTML = header + `<div class="empty-column">No matching tasks found.</div>`; return; }

  kanbanBoard.innerHTML = header + groups.map(group => {
    const groupTasks = tasks.filter(task => task.group === group);
    const assignment = getFolderWorkflowAssignment(state.selectedCompany, group);
    const assignedTemplate = assignment ? getWorkflowTemplate(assignment.workflowTemplateId) : null;

    return `<section class="project-group">
      <div class="project-heading">
        <span class="group-chevron">⌄</span>
        <strong>${escapeHtml(group)}</strong>
        <span class="group-count">- ${groupTasks.length} item${groupTasks.length === 1 ? "" : "s"}</span>
        ${assignedTemplate ? `<span class="folder-workflow-badge" title="Inherited by tasks in this folder">↳ ${escapeHtml(assignedTemplate.name)}</span>` : ""}
        <button class="folder-menu-button" type="button" title="Configure parent folder" data-configure-folder="${escapeHtml(group)}">⋮</button>
      </div>
      <div class="group-grid">${STATUSES.map(status => {
        const statusTasks = groupTasks.filter(task => task.status === status);
        return `<div class="status-column" data-status="${status}" data-group="${escapeHtml(group)}">
          ${statusTasks.length ? statusTasks.map(renderTaskCard).join("") : `<div class="empty-column"></div>`}
        </div>`;
      }).join("")}</div></section>`;
  }).join("");
  bindTaskEvents();
}

function renderTaskCard(task) {
  const currentSteps = task.workflow[task.status] || [];
  const completed = currentSteps.filter(step => step.complete).length;
  const total = currentSteps.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;
  return `<article class="task-card ${task.status === "Complete" ? "complete" : ""}" data-task-id="${task.id}">
    <div class="task-card-header"><div><div class="task-title">${escapeHtml(task.title)}</div>
      <div class="substatus-caption">${escapeHtml(task.status)} sub-statuses</div></div>
      <button class="card-menu" title="Configure task" data-configure-task="${task.id}">⋮</button></div>
    <div class="progress-row"><span>${completed} of ${total} complete</span><strong>${progress}%</strong></div>
    <div class="progress-track"><div class="progress-bar" style="width:${progress}%"></div></div>
    <div class="checklist">${currentSteps.map(step => `
      <label class="check-item ${step.complete ? "done" : ""}"><input type="checkbox" ${step.complete ? "checked" : ""}
        data-task-id="${task.id}" data-step-id="${step.id}"/><span>${escapeHtml(step.title)}</span></label>`).join("")
      || ``}</div>
    <div class="card-footer"><span>${formatDate(task.due)}</span><div class="card-footer-right">
      <button class="small-action" title="Move backwards" data-move-back="${task.id}">←</button>
      <button class="small-action" title="Move forwards" data-move-forward="${task.id}">→</button>
      <span class="avatar">${escapeHtml(task.assignee || "--")}</span></div></div></article>`;
}

function bindTaskEvents() {
  document.querySelectorAll('input[type="checkbox"][data-task-id]').forEach(input => input.addEventListener("change", handleStepToggle));
  document.querySelectorAll("[data-move-back]").forEach(button => button.addEventListener("click", () => moveTask(button.dataset.moveBack, -1)));
  document.querySelectorAll("[data-move-forward]").forEach(button => button.addEventListener("click", () => moveTask(button.dataset.moveForward, 1)));
  document.querySelectorAll("[data-configure-task]").forEach(button => button.addEventListener("click", () => openTaskFlyout(button.dataset.configureTask)));
  document.querySelectorAll("[data-configure-folder]").forEach(button => button.addEventListener("click", () => openFolderWorkflowModal(button.dataset.configureFolder)));
}

function handleStepToggle(event) {
  const task = state.tasks.find(item => item.id === event.target.dataset.taskId);
  if (!task) return;
  const currentSteps = task.workflow[task.status] || [];
  const step = currentSteps.find(item => item.id === event.target.dataset.stepId);
  if (!step) return;
  step.complete = event.target.checked;
  const allComplete = currentSteps.length > 0 && currentSteps.every(item => item.complete);
  const currentIndex = STATUSES.indexOf(task.status);
  if (allComplete && currentIndex < STATUSES.length - 1) {
    const previousStatus = task.status;
    task.status = STATUSES[currentIndex + 1];
    saveState(); renderBoard(); showToast(`${task.title} moved from ${previousStatus} to ${task.status}.`); return;
  }
  saveState(); renderBoard();
}

function moveTask(taskId, direction) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task) return;
  const currentIndex = STATUSES.indexOf(task.status);
  const nextIndex = Math.max(0, Math.min(STATUSES.length - 1, currentIndex + direction));
  if (nextIndex === currentIndex) return;
  task.status = STATUSES[nextIndex]; saveState(); renderBoard(); showToast(`${task.title} moved to ${task.status}.`);
}

function setFlyoutTab(tabName) {
  document.querySelectorAll("[data-flyout-tab]").forEach(button => {
    button.classList.toggle("active", button.dataset.flyoutTab === tabName);
  });
  document.querySelectorAll("[data-flyout-panel]").forEach(panel => {
    panel.classList.toggle("active", panel.dataset.flyoutPanel === tabName);
  });
}

function subtaskChipMarkup(step, index) {
  return `
    <div class="subtask-chip" data-subtask-id="${step.id}" draggable="true">
      <span class="subtask-order" title="Execution order">${index + 1}</span>
      <span class="subtask-chip-title">${escapeHtml(step.title)}</span>
      <span class="subtask-chip-actions">
        <button type="button" class="chip-order-button" data-chip-move="up" title="Move earlier" aria-label="Move earlier">↑</button>
        <button type="button" class="chip-order-button" data-chip-move="down" title="Move later" aria-label="Move later">↓</button>
        <button type="button" class="chip-remove-button" data-chip-remove title="Remove subtask" aria-label="Remove subtask">×</button>
      </span>
    </div>`;
}

function refreshSubtaskOrder(list) {
  [...list.querySelectorAll(".subtask-chip")].forEach((chip, index) => {
    chip.querySelector(".subtask-order").textContent = index + 1;
    chip.querySelector('[data-chip-move="up"]').disabled = index === 0;
    chip.querySelector('[data-chip-move="down"]').disabled = index === list.children.length - 1;
  });
}

function renderFlyoutSubtaskConfiguration(task) {
  const host = document.getElementById("flyoutStatusConfiguration");
  host.innerHTML = STATUSES.map((status, index) => `
    <section class="flyout-status-card ${status === task.status ? "current" : ""}" data-status-card="${status}">
      <div class="flyout-status-card-heading">
        <span class="status-number">${index + 1}</span>
        <div><strong>${status}</strong>${status === task.status ? `<span class="current-status-badge">Current</span>` : ""}</div>
      </div>
      <div class="subtask-chip-editor">
        <div class="subtask-chip-list" data-status-config="${status}">
          ${task.workflow[status].map((step, stepIndex) => subtaskChipMarkup(step, stepIndex)).join("")}
        </div>
        <div class="subtask-chip-input-row">
          <input style = "border-radius: 4px !important" type="text" data-subtask-entry="${status}" placeholder="..." autocomplete="off" />
        </div>
      </div>
    </section>`).join("");

  host.querySelectorAll(".subtask-chip-list").forEach(refreshSubtaskOrder);
}


function addSubtaskChip(status) {
  const input = document.querySelector(`[data-subtask-entry="${status}"]`);
  const list = document.querySelector(`.subtask-chip-list[data-status-config="${status}"]`);
  if (!input || !list) return;
  const title = input.value.trim();
  if (!title) return;
  const duplicate = [...list.querySelectorAll(".subtask-chip-title")].some(el => el.textContent.trim().toLowerCase() === title.toLowerCase());
  if (duplicate) {
    input.setCustomValidity("This subtask already exists.");
    input.reportValidity();
    input.setCustomValidity("");
    return;
  }
  const wrapper = document.createElement("div");
  wrapper.innerHTML = subtaskChipMarkup({ id: crypto.randomUUID(), title }, list.children.length).trim();
  list.appendChild(wrapper.firstElementChild);
  input.value = "";
  refreshSubtaskOrder(list);
  input.focus();
}

const flyoutStatusConfiguration = document.getElementById("flyoutStatusConfiguration");
flyoutStatusConfiguration.addEventListener("keydown", event => {
  const input = event.target.closest("[data-subtask-entry]");
  if (!input || event.key !== "Enter") return;
  event.preventDefault();
  addSubtaskChip(input.dataset.subtaskEntry);
});

flyoutStatusConfiguration.addEventListener("click", event => {
  const addButton = event.target.closest("[data-add-subtask]");
  if (addButton) return addSubtaskChip(addButton.dataset.addSubtask);

  const chip = event.target.closest(".subtask-chip");
  if (!chip) return;
  const list = chip.parentElement;
  if (event.target.closest("[data-chip-remove]")) {
    chip.remove();
    refreshSubtaskOrder(list);
    return;
  }
  const moveButton = event.target.closest("[data-chip-move]");
  if (!moveButton) return;
  if (moveButton.dataset.chipMove === "up" && chip.previousElementSibling) list.insertBefore(chip, chip.previousElementSibling);
  if (moveButton.dataset.chipMove === "down" && chip.nextElementSibling) list.insertBefore(chip.nextElementSibling, chip);
  refreshSubtaskOrder(list);
});

let draggedSubtaskChip = null;
flyoutStatusConfiguration.addEventListener("dragstart", event => {
  draggedSubtaskChip = event.target.closest(".subtask-chip");
  if (!draggedSubtaskChip) return;
  draggedSubtaskChip.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
});
flyoutStatusConfiguration.addEventListener("dragover", event => {
  const target = event.target.closest(".subtask-chip");
  if (!draggedSubtaskChip || !target || target === draggedSubtaskChip || target.parentElement !== draggedSubtaskChip.parentElement) return;
  event.preventDefault();
  const rect = target.getBoundingClientRect();
  target.parentElement.insertBefore(draggedSubtaskChip, event.clientY < rect.top + rect.height / 2 ? target : target.nextElementSibling);
});
flyoutStatusConfiguration.addEventListener("dragend", () => {
  if (!draggedSubtaskChip) return;
  const list = draggedSubtaskChip.parentElement;
  draggedSubtaskChip.classList.remove("dragging");
  draggedSubtaskChip = null;
  refreshSubtaskOrder(list);
});

function openTaskFlyout(taskId) {

  const task = state.tasks.find(item => item.id === taskId);
  if (!task) return;
  ensureWorkflow(task);

  document.getElementById("flyoutTaskId").value = task.id;
  document.getElementById("flyoutTaskTitle").textContent = task.title;
  document.getElementById("flyoutBreadcrumb").textContent = `${task.company}  /  IT & TECH  /  ${task.group}`;
  document.getElementById("flyoutName").value = task.title;
  document.getElementById("flyoutAssignee").value = task.assignee || "";
  document.getElementById("flyoutAvatar").textContent = task.assignee || "--";
  const flyoutStatusSelect = document.getElementById("flyoutStatus");
  flyoutStatusSelect.value = task.status;
  const currentStatusSubtasks = task.workflow[task.status] || [];
  flyoutStatusSelect.disabled = currentStatusSubtasks.length > 0;
  flyoutStatusSelect.title = currentStatusSubtasks.length > 0
    ? "Status is controlled by the current checklist."
    : "";
  document.getElementById("flyoutStartDate").value = task.startDate || task.due || "";
  document.getElementById("flyoutEndDate").value = task.due || "";
  document.getElementById("flyoutStartTime").value = task.startTime || "00:30";
  document.getElementById("flyoutEndTime").value = task.endTime || "01:00";
  document.getElementById("flyoutFolderCode").value = task.folderCode || "";
  document.getElementById("flyoutTaskType").value = task.taskType || "General";
  document.getElementById("flyoutBillable").checked = Boolean(task.billable);
  document.getElementById("flyoutProtected").checked = Boolean(task.protected);
  document.getElementById("flyoutTravelDistance").value = task.travelDistance || 0;
  document.getElementById("flyoutCurrentStatus").textContent = `Current: ${task.status}`;
  renderFlyoutSubtaskConfiguration(task);
  setFlyoutTab("details");

  taskFlyout.classList.remove("hidden");
  taskFlyout.setAttribute("aria-hidden", "false");
  document.body.classList.add("flyout-open");
}

function closeTaskFlyout() {
  taskFlyout.classList.add("hidden");
  taskFlyout.setAttribute("aria-hidden", "true");
  document.body.classList.remove("flyout-open");
  flyoutTaskForm.reset();
}

function saveTaskFromFlyout(event) {
  event.preventDefault();
  const task = state.tasks.find(item => item.id === document.getElementById("flyoutTaskId").value);
  if (!task) return;

  task.title = document.getElementById("flyoutName").value.trim();
  task.assignee = document.getElementById("flyoutAssignee").value.trim().toUpperCase() || "--";
  const currentStatusSubtasks = task.workflow[task.status] || [];
  if (currentStatusSubtasks.length === 0) {
    task.status = document.getElementById("flyoutStatus").value;
  }
  task.startDate = document.getElementById("flyoutStartDate").value;
  task.due = document.getElementById("flyoutEndDate").value;
  task.startTime = document.getElementById("flyoutStartTime").value;
  task.endTime = document.getElementById("flyoutEndTime").value;
  task.folderCode = document.getElementById("flyoutFolderCode").value.trim();
  task.taskType = document.getElementById("flyoutTaskType").value;
  task.billable = document.getElementById("flyoutBillable").checked;
  task.protected = document.getElementById("flyoutProtected").checked;
  task.travelDistance = Number(document.getElementById("flyoutTravelDistance").value || 0);

  document.querySelectorAll("#flyoutStatusConfiguration [data-status-config]").forEach(list => {
    const status = list.dataset.statusConfig;
    const existingById = new Map(task.workflow[status].map(step => [step.id, step]));
    task.workflow[status] = [...list.querySelectorAll(".subtask-chip")].map(chip => {
      const id = chip.dataset.subtaskId;
      const title = chip.querySelector(".subtask-chip-title").textContent.trim();
      const existing = existingById.get(id);
      return existing ? { ...existing, title } : { id, title, complete: false };
    });
  });

  saveState();
  closeTaskFlyout();
  renderBoard();
  showToast("Task updated.");
}

function render() { renderBusinessUnits(); renderBoard(); }
function openModal() {
  taskModal.classList.remove("hidden"); taskModal.setAttribute("aria-hidden", "false");
  document.getElementById("taskDueInput").value = new Date().toISOString().slice(0, 10);
  document.getElementById("taskTitleInput").focus();
}
function closeModal() { taskModal.classList.add("hidden"); taskModal.setAttribute("aria-hidden", "true"); taskForm.reset(); }

function createTask(event) {
  event.preventDefault();
  const status = document.getElementById("taskStatusInput").value;
  const group = document.getElementById("taskGroupInput").value.trim();
  const assignment = getFolderWorkflowAssignment(state.selectedCompany, group);
  const assignedTemplate = assignment ? getWorkflowTemplate(assignment.workflowTemplateId) : null;
  const workflow = assignedTemplate ? cloneWorkflowTemplate(assignedTemplate) : makeWorkflow();

  if (!assignedTemplate) {
    workflow[status] = makeSteps(
      document.getElementById("taskSubtasksInput").value
        .split("\n")
        .map(value => value.trim())
        .filter(Boolean)
    );
  }

  state.tasks.push({
    id: crypto.randomUUID(), company: state.selectedCompany,
    group, title: document.getElementById("taskTitleInput").value.trim(),
    status, due: document.getElementById("taskDueInput").value,
    assignee: document.getElementById("taskAssigneeInput").value.trim().toUpperCase() || "--",
    workflowTemplateId: assignedTemplate?.id || null,
    workflow
  });
  saveState(); closeModal(); renderBoard(); showToast("Task created. Use the three-dot menu to configure every status.");
}

document.getElementById("newTaskBtn").addEventListener("click", openModal);
document.getElementById("taskSearchBtn").addEventListener("click", () => { searchTerm = taskSearch.value.trim(); renderBoard(); });
taskSearch.addEventListener("input", event => { searchTerm = event.target.value.trim(); renderBoard(); });
companySearch.addEventListener("input", event => { companySearchTerm = event.target.value.trim(); renderBusinessUnits(); });
taskForm.addEventListener("submit", createTask);
flyoutTaskForm.addEventListener("submit", saveTaskFromFlyout);
document.querySelectorAll("[data-close-modal]").forEach(el => el.addEventListener("click", closeModal));
document.querySelectorAll("[data-close-flyout]").forEach(el => el.addEventListener("click", closeTaskFlyout));
document.querySelectorAll("[data-flyout-tab]").forEach(button => button.addEventListener("click", () => setFlyoutTab(button.dataset.flyoutTab)));

document.getElementById("deleteFlyoutTaskBtn").addEventListener("click", () => {
  const id = document.getElementById("flyoutTaskId").value;
  const task = state.tasks.find(item => item.id === id);
  if (!task || !confirm(`Delete ${task.title}?`)) return;
  state.tasks = state.tasks.filter(item => item.id !== id);
  saveState(); closeTaskFlyout(); renderBoard(); showToast("Task deleted.");
});

document.getElementById("addCompanyBtn").addEventListener("click", () => {
  const name = prompt("Enter the new business unit name:");
  if (!name?.trim()) return;
  state.companies.push(name.trim()); state.selectedCompany = name.trim(); saveState(); render();
});
document.getElementById("newBusinessUnitBtn").addEventListener("click", () => document.getElementById("addCompanyBtn").click());
document.getElementById("filterBtn").addEventListener("click", () => showToast("Advanced filters are a visual demo placeholder."));



// -----------------------------
// Parent folder workflow linking
// -----------------------------
const folderWorkflowModal = document.getElementById("folderWorkflowModal");
const folderWorkflowForm = document.getElementById("folderWorkflowForm");

function openFolderWorkflowModal(group) {
  const assignment = getFolderWorkflowAssignment(state.selectedCompany, group);
  const select = document.getElementById("folderWorkflowSelect");

  document.getElementById("folderWorkflowCompany").textContent = state.selectedCompany;
  document.getElementById("folderWorkflowGroup").textContent = group;
  document.getElementById("folderWorkflowGroupValue").value = group;

  const activeTemplates = state.workflowTemplates.filter(template => template.isActive !== false);
  select.innerHTML = `
    <option value="">No workflow assigned</option>
    ${activeTemplates.map(template => `
      <option value="${template.id}">${escapeHtml(template.name)}</option>
    `).join("")}`;

  select.value = assignment?.workflowTemplateId || "";
  document.getElementById("applyWorkflowToExistingTasks").checked = true;
  updateFolderWorkflowPreview();

  folderWorkflowModal.classList.remove("hidden");
  folderWorkflowModal.setAttribute("aria-hidden", "false");
}

function closeFolderWorkflowModal() {
  folderWorkflowModal.classList.add("hidden");
  folderWorkflowModal.setAttribute("aria-hidden", "true");
  folderWorkflowForm.reset();
}

function updateFolderWorkflowPreview() {
  const template = getWorkflowTemplate(document.getElementById("folderWorkflowSelect").value);
  const preview = document.getElementById("folderWorkflowPreview");

  if (!template) {
    preview.innerHTML = `
      <div class="folder-workflow-empty-preview">
        No workflow will be inherited by tasks in this parent folder.
      </div>`;
    return;
  }

  preview.innerHTML = `
    <div class="folder-workflow-preview-header">
      <strong>${escapeHtml(template.name)}</strong>
      <span>${STATUSES.reduce((sum, status) => sum + template.workflow[status].length, 0)} subtasks</span>
    </div>
    <div class="folder-workflow-preview-stages">
      ${STATUSES.map((status, index) => `
        <div>
          <span>${index + 1}</span>
          <strong>${status}</strong>
          <small>${template.workflow[status].length} item${template.workflow[status].length === 1 ? "" : "s"}</small>
        </div>
      `).join("")}
    </div>`;
}

folderWorkflowForm.addEventListener("submit", event => {
  event.preventDefault();

  const group = document.getElementById("folderWorkflowGroupValue").value;
  const workflowTemplateId = document.getElementById("folderWorkflowSelect").value;
  const applyExisting = document.getElementById("applyWorkflowToExistingTasks").checked;

  state.folderWorkflowAssignments = state.folderWorkflowAssignments.filter(
    item => !(item.company === state.selectedCompany && item.group === group)
  );

  if (workflowTemplateId) {
    state.folderWorkflowAssignments.push({
      company: state.selectedCompany,
      group,
      workflowTemplateId
    });

    if (applyExisting) {
      const template = getWorkflowTemplate(workflowTemplateId);
      state.tasks
        .filter(task => task.company === state.selectedCompany && task.group === group)
        .forEach(task => {
          task.workflowTemplateId = workflowTemplateId;
          task.workflow = cloneWorkflowTemplate(template);
        });
    }
  }

  saveState();
  closeFolderWorkflowModal();
  renderBoard();
  showToast(workflowTemplateId ? "Workflow linked to parent folder." : "Folder workflow removed.");
});

document.getElementById("folderWorkflowSelect").addEventListener("change", updateFolderWorkflowPreview);
document.querySelectorAll("[data-close-folder-workflow]").forEach(element => {
  element.addEventListener("click", closeFolderWorkflowModal);
});

// -----------------------------
// Workflow administration page
// -----------------------------
const workspacePage = document.getElementById("workspacePage");
const workflowsPage = document.getElementById("workflowsPage");
const administrationNavButton = document.getElementById("administrationNavButton");
const administrationMenu = document.getElementById("administrationMenu");
const openWorkflowsPageButton = document.getElementById("openWorkflowsPage");
const workflowTemplateList = document.getElementById("workflowTemplateList");
const workflowEditorForm = document.getElementById("workflowEditorForm");
const workflowEmptyState = document.getElementById("workflowEmptyState");
const workflowStatusConfiguration = document.getElementById("workflowStatusConfiguration");

let selectedWorkflowTemplateId = null;
let workflowSearchTerm = "";
let draggedWorkflowChip = null;

function showWorkspacePage() {
  workspacePage.classList.remove("hidden");
  workflowsPage.classList.add("hidden");
  administrationMenu.classList.add("hidden");

  document.querySelectorAll(".main-nav > a").forEach(link => {
    link.classList.toggle("active", link.id === "myWorkspaceNav");
  });
  administrationNavButton.classList.remove("active");
}

function showWorkflowsPage() {
  workspacePage.classList.add("hidden");
  workflowsPage.classList.remove("hidden");
  administrationMenu.classList.add("hidden");

  document.querySelectorAll(".main-nav > a").forEach(link => link.classList.remove("active"));
  administrationNavButton.classList.add("active");

  renderWorkflowTemplateList();

  if (
    selectedWorkflowTemplateId &&
    state.workflowTemplates.some(template => template.id === selectedWorkflowTemplateId)
  ) {
    openWorkflowEditor(selectedWorkflowTemplateId);
  }
}

function renderWorkflowTemplateList() {
  const templates = state.workflowTemplates.filter(template => {
    const searchContent = `${template.name} ${template.description || ""}`.toLowerCase();
    return searchContent.includes(workflowSearchTerm.toLowerCase());
  });

  if (!templates.length) {
    workflowTemplateList.innerHTML = `<div class="workflow-list-empty">No workflows found.</div>`;
    return;
  }

  workflowTemplateList.innerHTML = templates.map(template => {
    const totalSteps = STATUSES.reduce(
      (total, status) => total + (template.workflow[status] || []).length,
      0
    );

    return `
      <button
        type="button"
        class="workflow-template-item ${template.id === selectedWorkflowTemplateId ? "selected" : ""}"
        data-workflow-template-id="${template.id}"
      >
        <span class="workflow-template-icon">↳</span>
        <span class="workflow-template-details">
          <strong>${escapeHtml(template.name)}</strong>
          <small>${totalSteps} configured subtask${totalSteps === 1 ? "" : "s"}</small>
        </span>
        <span class="workflow-template-status ${template.isActive ? "active" : "inactive"}">
          ${template.isActive ? "Active" : "Inactive"}
        </span>
      </button>`;
  }).join("");

  workflowTemplateList.querySelectorAll("[data-workflow-template-id]").forEach(button => {
    button.addEventListener("click", () => openWorkflowEditor(button.dataset.workflowTemplateId));
  });
}

let selectedWorkflowStage = "New";

function renderWorkflowStageStrip(template) {
  const strip = document.getElementById("workflowStageStrip");
  strip.innerHTML = STATUSES.map((status, index) => {
    const count = (template.workflow[status] || []).length;
    return `
      <button type="button"
        class="workflow-stage-step ${status === selectedWorkflowStage ? "active" : ""}"
        data-workflow-stage="${status}">
        <span class="workflow-stage-index">${index + 1}</span>
        <span class="workflow-stage-label">
          <strong>${status}</strong>
          <small>${count} subtask${count === 1 ? "" : "s"}</small>
        </span>
        ${index < STATUSES.length - 1 ? `<span class="workflow-stage-arrow">→</span>` : ""}
      </button>`;
  }).join("");

  strip.querySelectorAll("[data-workflow-stage]").forEach(button => {
    button.addEventListener("click", () => {
      selectedWorkflowStage = button.dataset.workflowStage;
      renderWorkflowDesigner(template);
    });
  });
}

function workflowSubtaskRowMarkup(step, index) {
  return `
    <div class="workflow-subtask-row" data-workflow-subtask-id="${step.id}" draggable="true">
      <button type="button" class="workflow-drag-handle" title="Drag to reorder">☰</button>
      <span class="workflow-subtask-number">${index + 1}</span>
      <span class="workflow-subtask-title">${escapeHtml(step.title)}</span>
      <div class="workflow-subtask-actions">
        <button type="button" data-workflow-chip-move="up" title="Move earlier">↑</button>
        <button type="button" data-workflow-chip-move="down" title="Move later">↓</button>
        <button type="button" data-workflow-chip-remove title="Remove subtask">×</button>
      </div>
    </div>`;
}

function refreshWorkflowRowOrder(list) {
  const rows = [...list.querySelectorAll(".workflow-subtask-row")];
  rows.forEach((row, index) => {
    row.querySelector(".workflow-subtask-number").textContent = index + 1;
    row.querySelector('[data-workflow-chip-move="up"]').disabled = index === 0;
    row.querySelector('[data-workflow-chip-move="down"]').disabled = index === rows.length - 1;
  });
  document.getElementById("workflowStageCount").textContent =
    `${rows.length} subtask${rows.length === 1 ? "" : "s"}`;
}

function renderWorkflowDesigner(template) {
  renderWorkflowStageStrip(template);
  document.getElementById("workflowStageTitle").textContent = selectedWorkflowStage;
  document.getElementById("workflowStageDescription").textContent =
    selectedWorkflowStage === "Complete"
      ? "Configure the final checks required before this task can be considered fully complete."
      : "Configure the ordered subtasks required before this stage can advance.";

  const steps = template.workflow[selectedWorkflowStage] || [];
  workflowStatusConfiguration.innerHTML = `
    <div class="workflow-subtask-panel">
      <div class="workflow-subtask-panel-heading">
        <div>
          <h4>Subtasks</h4>
          <p>Drag items to reorder them. Tasks must complete these before moving on.</p>
        </div>
      </div>
      <div class="workflow-subtask-list" data-workflow-status-list="${selectedWorkflowStage}">
        ${steps.map(workflowSubtaskRowMarkup).join("")}
      </div>
      <div class="workflow-add-subtask">
        <span class="workflow-add-icon">＋</span>
        <input type="text" data-workflow-subtask-entry="${selectedWorkflowStage}"
          placeholder="Type a subtask and press Enter" autocomplete="off" />
        <button type="button" class="primary-button"
          data-add-workflow-subtask="${selectedWorkflowStage}">Add subtask</button>
      </div>
    </div>`;

  refreshWorkflowRowOrder(
    workflowStatusConfiguration.querySelector("[data-workflow-status-list]")
  );
}

function openWorkflowEditor(templateId) {
  const template = state.workflowTemplates.find(item => item.id === templateId);
  if (!template) return;

  selectedWorkflowTemplateId = template.id;
  workflowEmptyState.classList.add("hidden");
  workflowEditorForm.classList.remove("hidden");

  document.getElementById("workflowTemplateId").value = template.id;
  document.getElementById("workflowName").value = template.name;
  document.getElementById("workflowDescription").value = template.description || "";
  document.getElementById("workflowIsActive").checked = template.isActive !== false;
  document.getElementById("workflowEditorTitle").textContent = template.name;

  renderWorkflowDesigner(template);
  renderWorkflowTemplateList();
}

function createNewWorkflow() {
  const template = {
    id: crypto.randomUUID(),
    name: "New Workflow",
    description: "",
    isActive: true,
    workflow: makeWorkflow()
  };

  state.workflowTemplates.push(template);
  selectedWorkflowTemplateId = template.id;
  selectedWorkflowStage = "New";
  saveState();
  renderWorkflowTemplateList();
  openWorkflowEditor(template.id);
  document.getElementById("workflowName").select();
}

function addWorkflowSubtaskChip(status) {
  const input = workflowStatusConfiguration.querySelector(
    `[data-workflow-subtask-entry="${status}"]`
  );
  const list = workflowStatusConfiguration.querySelector(
    `[data-workflow-status-list="${status}"]`
  );
  if (!input || !list) return;

  const title = input.value.trim();
  if (!title) return;

  const duplicate = [...list.querySelectorAll(".workflow-subtask-title")]
    .some(el => el.textContent.trim().toLowerCase() === title.toLowerCase());

  if (duplicate) {
    input.setCustomValidity("This subtask already exists.");
    input.reportValidity();
    input.setCustomValidity("");
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = workflowSubtaskRowMarkup(
    { id: crypto.randomUUID(), title, complete: false },
    list.children.length
  ).trim();

  list.appendChild(wrapper.firstElementChild);
  input.value = "";
  refreshWorkflowRowOrder(list);
  input.focus();
}

workflowStatusConfiguration.addEventListener("keydown", event => {
  const input = event.target.closest("[data-workflow-subtask-entry]");
  if (!input || event.key !== "Enter") return;
  event.preventDefault();
  addWorkflowSubtaskChip(input.dataset.workflowSubtaskEntry);
});

workflowStatusConfiguration.addEventListener("click", event => {
  const addButton = event.target.closest("[data-add-workflow-subtask]");
  if (addButton) {
    addWorkflowSubtaskChip(addButton.dataset.addWorkflowSubtask);
    return;
  }

  const row = event.target.closest(".workflow-subtask-row");
  if (!row) return;
  const list = row.parentElement;

  if (event.target.closest("[data-workflow-chip-remove]")) {
    row.remove();
    refreshWorkflowRowOrder(list);
    return;
  }

  const moveButton = event.target.closest("[data-workflow-chip-move]");
  if (!moveButton) return;

  if (moveButton.dataset.workflowChipMove === "up" && row.previousElementSibling) {
    list.insertBefore(row, row.previousElementSibling);
  }
  if (moveButton.dataset.workflowChipMove === "down" && row.nextElementSibling) {
    list.insertBefore(row.nextElementSibling, row);
  }
  refreshWorkflowRowOrder(list);
});

workflowStatusConfiguration.addEventListener("dragstart", event => {
  draggedWorkflowChip = event.target.closest(".workflow-subtask-row");
  if (!draggedWorkflowChip) return;
  draggedWorkflowChip.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
});

workflowStatusConfiguration.addEventListener("dragover", event => {
  const target = event.target.closest(".workflow-subtask-row");
  if (!draggedWorkflowChip || !target || target === draggedWorkflowChip ||
      target.parentElement !== draggedWorkflowChip.parentElement) return;

  event.preventDefault();
  const rect = target.getBoundingClientRect();
  target.parentElement.insertBefore(
    draggedWorkflowChip,
    event.clientY < rect.top + rect.height / 2 ? target : target.nextElementSibling
  );
});

workflowStatusConfiguration.addEventListener("dragend", () => {
  if (!draggedWorkflowChip) return;
  const list = draggedWorkflowChip.parentElement;
  draggedWorkflowChip.classList.remove("dragging");
  draggedWorkflowChip = null;
  refreshWorkflowRowOrder(list);
});

workflowEditorForm.addEventListener("submit", event => {
  event.preventDefault();

  const template = state.workflowTemplates.find(
    item => item.id === document.getElementById("workflowTemplateId").value
  );
  if (!template) return;

  template.name = document.getElementById("workflowName").value.trim();
  template.description = document.getElementById("workflowDescription").value.trim();
  template.isActive = document.getElementById("workflowIsActive").checked;

  const list = workflowStatusConfiguration.querySelector(
    `[data-workflow-status-list="${selectedWorkflowStage}"]`
  );

  template.workflow[selectedWorkflowStage] = [
    ...list.querySelectorAll(".workflow-subtask-row")
  ].map(row => ({
    id: row.dataset.workflowSubtaskId,
    title: row.querySelector(".workflow-subtask-title").textContent.trim(),
    complete: false
  }));

  saveState();
  renderWorkflowTemplateList();
  openWorkflowEditor(template.id);
  showToast("Workflow saved.");
});

document.getElementById("deleteWorkflowBtn").addEventListener("click", () => {
  const template = state.workflowTemplates.find(item => item.id === selectedWorkflowTemplateId);
  if (!template) return;

  if (!confirm(`Delete the workflow "${template.name}"?`)) return;

  state.workflowTemplates = state.workflowTemplates.filter(item => item.id !== template.id);
  selectedWorkflowTemplateId = null;
  saveState();

  workflowEditorForm.classList.add("hidden");
  workflowEmptyState.classList.remove("hidden");
  renderWorkflowTemplateList();
  showToast("Workflow deleted.");
});

document.getElementById("cancelWorkflowBtn").addEventListener("click", () => {
  if (selectedWorkflowTemplateId) openWorkflowEditor(selectedWorkflowTemplateId);
});

administrationNavButton.addEventListener("click", event => {
  event.stopPropagation();
  administrationMenu.classList.toggle("hidden");
});

openWorkflowsPageButton.addEventListener("click", showWorkflowsPage);
document.getElementById("newWorkflowBtn").addEventListener("click", createNewWorkflow);

document.getElementById("workflowSearch").addEventListener("input", event => {
  workflowSearchTerm = event.target.value.trim();
  renderWorkflowTemplateList();
});

document.addEventListener("click", event => {
  if (!event.target.closest(".nav-dropdown")) administrationMenu.classList.add("hidden");
});

document.getElementById("myWorkspaceNav").addEventListener("click", event => {
  event.preventDefault();
  showWorkspacePage();
});

render();
