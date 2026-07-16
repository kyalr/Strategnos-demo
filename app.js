const STATUSES = ["New", "Planning", "In Progress", "Complete"];
const STORAGE_KEY = "strategnos-kanban-demo-v6";
const DEMO_USERS = [
  {
    id: "user-kyle-robertson",
    name: "Kyle Robertson",
    email: "kyler@strategnos.com",
    initials: "KR"
  },
  {
    id: "user-kyle-damons",
    name: "Kyle Damons",
    email: "kyled@strategnos.com",
    initials: "KD"
  },
  {
    id: "user-john-meyer",
    name: "John Meyer",
    email: "johnm@strategnos.com",
    initials: "JM"
  },
  {
    id: "user-amanda-adams",
    name: "Amanda Adams",
    email: "amandaa@strategnos.com",
    initials: "AA"
  }
];



function makeSteps(titles = []) {
  return titles.map(title => ({
    id: crypto.randomUUID(),
    type: "step",
    title,
    complete: false,
    assignedUserIds: []
  }));
}

function makeGroup(title = "Grouped step", completionMode = "all", childTitles = ["First branch", "Second branch"]) {
  return {
    id: crypto.randomUUID(),
    type: "group",
    title,
    completionMode,
    children: childTitles.map(childTitle => ({
      id: crypto.randomUUID(),
      type: "step",
      title: childTitle,
      complete: false,
      assignedUserIds: []
    }))
  };
}

function makeWorkflow(newSteps = [], planningSteps = [], progressSteps = [], completeSteps = []) {
  return {
    New: makeSteps(newSteps),
    Planning: makeSteps(planningSteps),
    "In Progress": makeSteps(progressSteps),
    Complete: makeSteps(completeSteps)
  };
}

function normalizeWorkflowStep(step) {
  if (!step || typeof step !== "object") {
    return {
      id: crypto.randomUUID(),
      type: "step",
      title: "Untitled step",
      complete: false,
      assignedUserIds: []
    };
  }

  if (step.type === "group" || Array.isArray(step.children)) {
    step.type = "group";
    step.id ||= crypto.randomUUID();
    step.title ||= "Grouped step";
    step.completionMode = step.completionMode === "any" ? "any" : "all";
    step.children = Array.isArray(step.children)
      ? step.children.map(child => {
          child = normalizeWorkflowStep({ ...child, type: "step" });
          child.type = "step";
          delete child.children;
          delete child.completionMode;
          return child;
        })
      : [];
    return step;
  }

  step.type = "step";
  step.id ||= crypto.randomUUID();
  step.title ||= "Untitled step";
  step.complete = Boolean(step.complete);
  if (!Array.isArray(step.assignedUserIds)) step.assignedUserIds = [];
  return step;
}

function cloneWorkflowStep(step) {
  const normalized = normalizeWorkflowStep(structuredClone(step));

  if (normalized.type === "group") {
    return {
      id: crypto.randomUUID(),
      sourceStepId: normalized.sourceStepId || normalized.id,
      type: "group",
      title: normalized.title,
      completionMode: normalized.completionMode,
      children: normalized.children.map(child => ({
        id: crypto.randomUUID(),
        sourceStepId: child.sourceStepId || child.id,
        type: "step",
        title: child.title,
        complete: false,
        assignedUserIds: [...(child.assignedUserIds || [])]
      }))
    };
  }

  return {
    id: crypto.randomUUID(),
    sourceStepId: normalized.sourceStepId || normalized.id,
    type: "step",
    title: normalized.title,
    complete: false,
    assignedUserIds: [...(normalized.assignedUserIds || [])]
  };
}

function isWorkflowStepComplete(step) {
  const normalized = normalizeWorkflowStep(step);

  if (normalized.type !== "group") {
    return Boolean(normalized.complete);
  }

  if (!normalized.children.length) return false;

  return normalized.completionMode === "any"
    ? normalized.children.some(child => child.complete)
    : normalized.children.every(child => child.complete);
}

function countWorkflowItems(steps = []) {
  return steps.reduce(
    (total, step) => total + (step.type === "group" ? step.children.length : 1),
    0
  );
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

// Add one grouped example to the default project workflow for first-time demo data.
const standardDefaultWorkflow = defaultState.workflowTemplates[0]?.workflow?.Planning;
if (standardDefaultWorkflow && !standardDefaultWorkflow.some(step => step.type === "group")) {
  standardDefaultWorkflow.splice(
    1,
    0,
    makeGroup(
      "Review delivery approach",
      "all",
      ["Technical review", "Business approval"]
    )
  );
}

let state = loadState();
let searchTerm = "";
let companySearchTerm = "";
let toastTimer;
let workflowViewEnabled = false;

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
    task.workflow[status] = task.workflow[status].map(normalizeWorkflowStep);
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
      if (!template.workflow) {
        template.workflow = makeWorkflow();
      }

      STATUSES.forEach(status => {
        if (!Array.isArray(template.workflow[status])) {
          template.workflow[status] = [];
        }

        template.workflow[status] =
          template.workflow[status].map(normalizeWorkflowStep);
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
    workflow[status] = (template?.workflow?.[status] || [])
      .map(cloneWorkflowStep);
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


function getTaskWorkflowAssignment(task) {
  if (!task) return null;

  const assignment = getFolderWorkflowAssignment(
    task.company,
    task.group
  );

  if (!assignment) return null;

  const template = getWorkflowTemplate(
    assignment.workflowTemplateId
  );

  if (!template) return null;

  return { assignment, template };
}

function isTaskWorkflowControlled(task) {
  return Boolean(getTaskWorkflowAssignment(task));
}

function findMatchingTaskStep(existingSteps, templateStep) {
  return existingSteps.find(existing => {
    const templateSourceId =
      templateStep.sourceStepId || templateStep.id;

    const sameSource = Boolean(
      existing.sourceStepId &&
      templateSourceId &&
      existing.sourceStepId === templateSourceId
    );

    const sameLegacyStep =
      existing.type === templateStep.type &&
      existing.title.trim().toLowerCase() ===
        templateStep.title.trim().toLowerCase();

    return sameSource || sameLegacyStep;
  });
}

function getUniqueWorkflowItemId(preferredId, usedIds) {
  if (preferredId && !usedIds.has(preferredId)) {
    usedIds.add(preferredId);
    return preferredId;
  }

  const id = crypto.randomUUID();
  usedIds.add(id);
  return id;
}

function synchroniseTaskWithWorkflow(task, template) {
  ensureWorkflow(task);
  const updatedWorkflow = makeWorkflow();

  STATUSES.forEach(status => {
    const existingSteps = task.workflow[status] || [];
    const templateSteps = template.workflow[status] || [];

    const usedOutputStepIds = new Set();
    const matchedExistingStepIds = new Set();

    updatedWorkflow[status] = templateSteps.map(templateStep => {
      const templateSourceId =
        templateStep.sourceStepId || templateStep.id;

      const existing = existingSteps.find(existingStep => {
        if (matchedExistingStepIds.has(existingStep.id)) {
          return false;
        }

        const sameSource = Boolean(
          existingStep.sourceStepId &&
          templateSourceId &&
          existingStep.sourceStepId === templateSourceId
        );

        const sameLegacyStep =
          existingStep.type === templateStep.type &&
          String(existingStep.title || "")
            .trim()
            .toLowerCase() ===
          String(templateStep.title || "")
            .trim()
            .toLowerCase();

        return sameSource || sameLegacyStep;
      });

      if (existing?.id) {
        matchedExistingStepIds.add(existing.id);
      }

      if (templateStep.type === "group") {
        const existingChildren =
          existing?.type === "group"
            ? existing.children || []
            : [];

        const usedOutputChildIds = new Set();
        const matchedExistingChildIds = new Set();

        return {
          id: getUniqueWorkflowItemId(
            existing?.id,
            usedOutputStepIds
          ),
          sourceStepId: templateSourceId,
          type: "group",
          title: templateStep.title,
          completionMode:
            templateStep.completionMode === "any"
              ? "any"
              : "all",

          children: (templateStep.children || []).map(
            templateChild => {
              const templateChildSourceId =
                templateChild.sourceStepId ||
                templateChild.id;

              const existingChild =
                existingChildren.find(child => {
                  if (
                    matchedExistingChildIds.has(child.id)
                  ) {
                    return false;
                  }

                  const sameSource = Boolean(
                    child.sourceStepId &&
                    templateChildSourceId &&
                    child.sourceStepId ===
                      templateChildSourceId
                  );

                  const sameLegacyStep =
                    String(child.title || "")
                      .trim()
                      .toLowerCase() ===
                    String(templateChild.title || "")
                      .trim()
                      .toLowerCase();

                  return sameSource || sameLegacyStep;
                });

              if (existingChild?.id) {
                matchedExistingChildIds.add(
                  existingChild.id
                );
              }

              return {
                id: getUniqueWorkflowItemId(
                  existingChild?.id,
                  usedOutputChildIds
                ),
                sourceStepId: templateChildSourceId,
                type: "step",
                title: templateChild.title,
                complete: Boolean(
                  existingChild?.complete
                ),
                assignedUserIds: [
                  ...(
                    templateChild.assignedUserIds ||
                    []
                  )
                ]
              };
            }
          )
        };
      }

      return {
        id: getUniqueWorkflowItemId(
          existing?.id,
          usedOutputStepIds
        ),
        sourceStepId: templateSourceId,
        type: "step",
        title: templateStep.title,
        complete: Boolean(existing?.complete),
        assignedUserIds: [
          ...(templateStep.assignedUserIds || [])
        ]
      };
    });
  });

  task.workflowTemplateId = template.id;
  task.workflow = updatedWorkflow;
  return task;
}

function repairLinkedWorkflowTasks() {
  let repairedTaskCount = 0;

  state.folderWorkflowAssignments.forEach(assignment => {
    const template = getWorkflowTemplate(
      assignment.workflowTemplateId
    );

    if (!template) {
      return;
    }

    state.tasks
      .filter(task =>
        task.company === assignment.company &&
        task.group === assignment.group
      )
      .forEach(task => {
        synchroniseTaskWithWorkflow(task, template);
        repairedTaskCount += 1;
      });
  });

  if (repairedTaskCount > 0) {
    saveState();
  }
}

function synchroniseTasksLinkedToTemplate(templateId) {
  const template = getWorkflowTemplate(templateId);
  if (!template) return;

  state.folderWorkflowAssignments
    .filter(item => item.workflowTemplateId === templateId)
    .forEach(assignment => {
      state.tasks
        .filter(task =>
          task.company === assignment.company &&
          task.group === assignment.group
        )
        .forEach(task => synchroniseTaskWithWorkflow(task, template));
    });
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
const allGroups = [
  ...new Set(tasks.map(task => task.group))
];

const groups = workflowViewEnabled
  ? allGroups.filter(group => {
      return Boolean(
        getFolderWorkflowAssignment(
          state.selectedCompany,
          group
        )
      );
    })
  : allGroups;
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

function renderTaskChecklistStep(task, step, stepIndex) {
  const number = stepIndex + 1;

  if (step.type === "group") {
    const groupComplete = isWorkflowStepComplete(step);
    const modeLabel = step.completionMode === "any" ? "One required" : "All required";

    return `
      <div class="check-group ${groupComplete ? "done" : ""}">


        <div class="check-group-children">
          ${step.children.map((child, childIndex) => `
            <label class="check-item check-child ${child.complete ? "done" : ""}">
              <input
                type="checkbox"
                ${child.complete ? "checked" : ""}
                data-task-id="${task.id}"
                data-step-id="${step.id}"
                data-child-step-id="${child.id}"
              />
              <span class="check-child-number">${number}.${childIndex + 1}</span>
              <span>${escapeHtml(child.title)}</span>
            </label>
          `).join("")}
        </div>
      </div>`;
  }

  return `
    <label class="check-item ${step.complete ? "done" : ""}">
      <input
        type="checkbox"
        ${step.complete ? "checked" : ""}
        data-task-id="${task.id}"
        data-step-id="${step.id}"
      />
      <span class="check-step-number">${number}</span>
      <span>${escapeHtml(step.title)}</span>
    </label>`;
}

function renderTaskCard(task) {
  const currentSteps = task.workflow[task.status] || [];
  const completed = currentSteps.filter(isWorkflowStepComplete).length;
  const total = currentSteps.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  return `<article class="task-card ${task.status === "Complete" ? "complete" : ""}" data-task-id="${task.id}">
    <div class="task-card-header"><div><div class="task-title">${escapeHtml(task.title)}</div>
      </div>
      <button class="card-menu" title="Configure task" data-configure-task="${task.id}">⋮</button></div>
    <div class="progress-row"><span>${completed} of ${total} steps complete</span><strong>${progress}%</strong></div>
    <div class="progress-track"><div class="progress-bar" style="width:${progress}%"></div></div>
    <div class="checklist">${currentSteps.map((step, index) => renderTaskChecklistStep(task, step, index)).join("")}</div>
    <div class="card-footer"><span>${formatDate(task.due)}</span><div class="card-footer-right">
      <button class="small-action" title="Move backwards" data-move-back="${task.id}">←</button>
      <button class="small-action" title="Move forwards" data-move-forward="${task.id}">→</button>
      <span class="avatar">${escapeHtml(task.assignee || "--")}</span></div></div></article>`;
}

function bindTaskEvents() {
  document.querySelectorAll("[data-move-back]").forEach(button => button.addEventListener("click", () => moveTask(button.dataset.moveBack, -1)));
  document.querySelectorAll("[data-move-forward]").forEach(button => button.addEventListener("click", () => moveTask(button.dataset.moveForward, 1)));
  document.querySelectorAll("[data-configure-task]").forEach(button => button.addEventListener("click", () => openTaskFlyout(button.dataset.configureTask)));
  document.querySelectorAll("[data-configure-folder]").forEach(button => button.addEventListener("click", () => openFolderWorkflowModal(button.dataset.configureFolder)));
}

// Delegate checklist changes from the board. This remains reliable after
// renderBoard() replaces task-card HTML, including grouped workflow branches.
kanbanBoard.addEventListener("change", event => {
  const checkbox = event.target.closest(
    'input[type="checkbox"][data-task-id][data-step-id]'
  );

  if (!checkbox) {
    return;
  }

  handleStepToggle({ target: checkbox });
});

function findTaskWorkflowStep(task, status, stepId, childStepId = null) {
  const steps = task.workflow?.[status] || [];
  const parentStep = steps.find(step => step.id === stepId);

  if (!parentStep) return null;

  if (childStepId && parentStep.type === "group") {
    const childStep = (parentStep.children || []).find(
      child => child.id === childStepId
    );

    return childStep
      ? { parentStep, targetStep: childStep }
      : null;
  }

  return { parentStep, targetStep: parentStep };
}

function handleStepToggle(event) {
  const checkbox = event.target.closest(
    'input[type="checkbox"][data-task-id][data-step-id]'
  );

  if (!checkbox) return;

  const task = state.tasks.find(
    item => item.id === checkbox.dataset.taskId
  );

  if (!task) return;

  ensureWorkflow(task);

  const match = findTaskWorkflowStep(
    task,
    task.status,
    checkbox.dataset.stepId,
    checkbox.dataset.childStepId || null
  );

  if (!match) {
    console.warn("Could not find workflow step for checkbox", {
      taskId: checkbox.dataset.taskId,
      stepId: checkbox.dataset.stepId,
      childStepId: checkbox.dataset.childStepId
    });
    return;
  }

  match.targetStep.complete = checkbox.checked;

  const currentSteps = task.workflow[task.status] || [];
  const allComplete =
    currentSteps.length > 0 &&
    currentSteps.every(isWorkflowStepComplete);

  const currentIndex = STATUSES.indexOf(task.status);

  if (allComplete && currentIndex < STATUSES.length - 1) {
    const previousStatus = task.status;
    task.status = STATUSES[currentIndex + 1];
    saveState();
    renderBoard();
    showToast(
      `${task.title} moved from ${previousStatus} to ${task.status}.`
    );
    return;
  }

  saveState();
  renderBoard();
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

function flyoutAssignedUsersMarkup(step) {
  const users = (step.assignedUserIds || [])
    .map(userId => DEMO_USERS.find(user => user.id === userId))
    .filter(Boolean);

  if (!users.length) return "";

  return `
    <div class="flyout-workflow-users">
      ${users.map(user => `
        <span
          class="flyout-workflow-user"
          title="${escapeHtml(user.name)} — ${escapeHtml(user.email)}"
        >${escapeHtml(user.initials)}</span>
      `).join("")}
    </div>`;
}

function flyoutReadOnlyStepMarkup(step, index) {
  const number = index + 1;

  if (step.type === "group") {
    const modeLabel =
      step.completionMode === "any"
        ? "One required"
        : "All required";

    return `
      <div class="flyout-workflow-group">
        <div class="flyout-workflow-group-heading">
          <span class="flyout-workflow-number">${number}</span>
          <strong>${escapeHtml(step.title)}</strong>
          <span class="flyout-workflow-mode">${modeLabel}</span>
        </div>

        <div class="flyout-workflow-branches">
          ${step.children.map((child, childIndex) => `
            <div class="flyout-workflow-step">
              <span class="flyout-workflow-number child">
                ${number}.${childIndex + 1}
              </span>
              <span class="flyout-workflow-step-title">
                ${escapeHtml(child.title)}
              </span>
              ${flyoutAssignedUsersMarkup(child)}
            </div>
          `).join("")}
        </div>
      </div>`;
  }

  return `
    <div class="flyout-workflow-step">
      <span class="flyout-workflow-number">${number}</span>
      <span class="flyout-workflow-step-title">
        ${escapeHtml(step.title)}
      </span>
      ${flyoutAssignedUsersMarkup(step)}
    </div>`;
}

function renderWorkflowControlledSubtasks(task, template) {
  const host = document.getElementById("flyoutStatusConfiguration");

  host.innerHTML = `
    <div class="workflow-controlled-banner">
      <span class="workflow-controlled-lock">🔒</span>
      <div>
        <strong>Workflow controlled</strong>
        <p>
          This checklist is inherited from
          <b>${escapeHtml(template.name)}</b> and cannot be changed on the task.
          Update the workflow under Administration to change these steps.
        </p>
      </div>
    </div>

    <div class="workflow-controlled-statuses">
      ${STATUSES.map((status, index) => {
        const steps = task.workflow[status] || [];

        return `
          <section class="flyout-status-card workflow-readonly-card ${status === task.status ? "current" : ""}">
            <div class="flyout-status-card-heading">
              <span class="status-number">${index + 1}</span>
              <div>
                <strong>${status}</strong>
                ${status === task.status
                  ? `<span class="current-status-badge">Current</span>`
                  : ""}
              </div>
              <span class="workflow-readonly-lock" title="Managed by workflow"></span>
            </div>

            <div class="flyout-workflow-readonly-list">
              ${steps.length
                ? steps.map(flyoutReadOnlyStepMarkup).join("")
                : `<div class="flyout-workflow-empty">No workflow steps configured.</div>`}
            </div>
          </section>`;
      }).join("")}
    </div>`;
}

function renderEditableTaskSubtasks(task) {
  const host = document.getElementById("flyoutStatusConfiguration");

  host.innerHTML = `
    <div class="ad-hoc-status-grid">
      ${STATUSES.map((status, index) => `
        <section class="flyout-status-card ${status === task.status ? "current" : ""}" data-status-card="${status}">
          <div class="flyout-status-card-heading">
            <span class="status-number">${index + 1}</span>
            <div>
              <strong>${status}</strong>
              ${status === task.status
                ? `<span class="current-status-badge">Current</span>`
                : ""}
            </div>
          </div>

          <div class="subtask-chip-editor">
            <div class="subtask-chip-list" data-status-config="${status}">
              ${task.workflow[status]
                .filter(step => step.type !== "group")
                .map((step, stepIndex) => subtaskChipMarkup(step, stepIndex))
                .join("")}
            </div>

            <div class="subtask-chip-input-row">
              <input
                style="border-radius: 4px !important"
                type="text"
                data-subtask-entry="${status}"
                placeholder="Subtask..."
                autocomplete="off"
              />
            </div>
          </div>
        </section>`).join("")}
    </div>`;

  host.querySelectorAll(".subtask-chip-list")
    .forEach(refreshSubtaskOrder);
}

function renderFlyoutSubtaskConfiguration(task) {
  const workflowControl = getTaskWorkflowAssignment(task);

  if (workflowControl) {
    synchroniseTaskWithWorkflow(
      task,
      workflowControl.template
    );

    renderWorkflowControlledSubtasks(
      task,
      workflowControl.template
    );

    return;
  }

  renderEditableTaskSubtasks(task);
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

  const workflowControl = getTaskWorkflowAssignment(task);
  if (workflowControl) {
    synchroniseTaskWithWorkflow(task, workflowControl.template);
    saveState();
  }

  const subtasksTab = document.querySelector(
    '[data-flyout-tab="subtasks"]'
  );

  subtasksTab.classList.toggle(
    Boolean(workflowControl)
  );
  subtasksTab.innerHTML = workflowControl
    ? "Subtasks"
    : "Subtasks";
  subtasksTab.title = workflowControl
    ? `Managed by ${workflowControl.template.name}`
    : "Task-specific subtasks";

  document.getElementById("flyoutTaskId").value = task.id;
  document.getElementById("flyoutTaskTitle").textContent = task.title;
  document.getElementById("flyoutBreadcrumb").textContent = `${task.company}  /  IT & TECH  /  ${task.group}`;
  document.getElementById("flyoutName").value = task.title;
  document.getElementById("flyoutAssignee").value = task.assignee || "";
  document.getElementById("flyoutAvatar").textContent = task.assignee || "--";
  const flyoutStatusSelect = document.getElementById("flyoutStatus");
  flyoutStatusSelect.value = task.status;
  const currentStatusSubtasks = task.workflow[task.status] || [];
  flyoutStatusSelect.disabled = Boolean(workflowControl) || currentStatusSubtasks.length > 0;
  flyoutStatusSelect.title = workflowControl
    ? `Status is controlled by ${workflowControl.template.name}.`
    : currentStatusSubtasks.length > 0
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
  const workflowControl = getTaskWorkflowAssignment(task);
  const currentStatusSubtasks = task.workflow[task.status] || [];

  if (!workflowControl && currentStatusSubtasks.length === 0) {
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

  if (workflowControl) {
    synchroniseTaskWithWorkflow(task, workflowControl.template);
  } else {
    document.querySelectorAll("#flyoutStatusConfiguration [data-status-config]").forEach(list => {
      const status = list.dataset.statusConfig;
      const existingById = new Map(task.workflow[status].map(step => [step.id, step]));

      task.workflow[status] = [...list.querySelectorAll(".subtask-chip")].map(chip => {
        const id = chip.dataset.subtaskId;
        const title = chip.querySelector(".subtask-chip-title").textContent.trim();
        const existing = existingById.get(id);

        return existing
          ? { ...existing, title }
          : {
              id,
              type: "step",
              title,
              complete: false,
              assignedUserIds: []
            };
      });
    });
  }

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
          synchroniseTaskWithWorkflow(task, template);
        });
    }
  } else {
    state.tasks
      .filter(task =>
        task.company === state.selectedCompany &&
        task.group === group
      )
      .forEach(task => {
        task.workflowTemplateId = null;
      });
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
    const count = countWorkflowItems(template.workflow[status] || []);
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

function assignedUserAvatarsMarkup(step) {
  const assignedUsers = (step.assignedUserIds || [])
    .map(userId => DEMO_USERS.find(user => user.id === userId))
    .filter(Boolean);

  return `
    <div class="workflow-linked-user-avatars">
      ${assignedUsers.map(user => `
        <span
          class="workflow-linked-user-avatar"
          title="${escapeHtml(user.name)} — ${escapeHtml(user.email)}"
        >
          ${escapeHtml(user.initials)}
          <button
            type="button"
            data-remove-subtask-user="${user.id}"
            title="Remove ${escapeHtml(user.name)}"
          >×</button>
        </span>
      `).join("")}
    </div>`;
}

function subtaskUserPickerMarkup() {
  return `
    <div class="subtask-user-picker hidden">
      <div class="subtask-user-search">
        <input
          type="text"
          placeholder="Search users by name or email"
          data-subtask-user-search
          autocomplete="off"
        />
        <span>⌕</span>
      </div>
      <div class="subtask-user-results"></div>
    </div>`;
}

function workflowSimpleStepMarkup(step, index) {
  return `
    <div
      class="workflow-subtask-wrapper"
      data-workflow-subtask-wrapper="${step.id}"
      data-workflow-item-type="step"
    >
      <div
        class="workflow-subtask-row"
        data-workflow-subtask-id="${step.id}"
        draggable="true"
      >
        <button type="button" class="workflow-drag-handle" title="Drag to reorder">☰</button>
        <span class="workflow-subtask-number">${index + 1}</span>
        <span class="workflow-subtask-title">${escapeHtml(step.title)}</span>

        <div class="workflow-subtask-actions">
          ${assignedUserAvatarsMarkup(step)}
          <button type="button" data-link-subtask-users title="Link users" class="subtask-user-button">♟</button>
          <button type="button" data-workflow-chip-move="up" title="Move earlier">↑</button>
          <button type="button" data-workflow-chip-move="down" title="Move later">↓</button>
          <button type="button" data-workflow-chip-remove title="Remove subtask">×</button>
        </div>
      </div>

      ${subtaskUserPickerMarkup()}
    </div>`;
}

function workflowGroupMarkup(step, index) {
  const number = index + 1;

  return `
    <div
      class="workflow-subtask-wrapper workflow-group-wrapper"
      data-workflow-subtask-wrapper="${step.id}"
      data-workflow-item-type="group"
    >
      <div
        class="workflow-subtask-row workflow-group-row"
        data-workflow-subtask-id="${step.id}"
        draggable="true"
      >
        <button type="button" class="workflow-drag-handle" title="Drag group to reorder">☰</button>
        <span class="workflow-subtask-number">${number}</span>

        <input
          class="workflow-group-title-input"
          data-workflow-group-title
          value="${escapeHtml(step.title)}"
          maxlength="100"
          aria-label="Grouped step title"
        />

        <select
          class="workflow-group-mode"
          data-workflow-group-mode
          title="Choose how this grouped step is completed"
        >
          <option value="all" ${step.completionMode === "all" ? "selected" : ""}>All required</option>
          <option value="any" ${step.completionMode === "any" ? "selected" : ""}>One required</option>
        </select>

        <div class="workflow-subtask-actions">
          <button type="button" data-workflow-chip-move="up" title="Move earlier">↑</button>
          <button type="button" data-workflow-chip-move="down" title="Move later">↓</button>
          <button type="button" data-workflow-chip-remove title="Remove grouped step">×</button>
        </div>
      </div>

      <div class="workflow-group-children" data-workflow-group-children>
      ${step.children.map((child, childIndex) => `
        <div
          class="workflow-group-child-row"
          data-workflow-child-id="${child.id}"
        >
          <span class="workflow-group-branch-line"></span>

          <span class="workflow-child-number">
            ${number}.${childIndex + 1}
          </span>

          <input
            class="workflow-child-title-input"
            data-workflow-child-title
            value="${escapeHtml(child.title)}"
            maxlength="100"
            aria-label="Branch title"
          />

          <div class="workflow-child-actions">
            ${assignedUserAvatarsMarkup(child)}

            <button
              type="button"
              data-link-group-child-users
              title="Assign users"
              class="subtask-user-button"
            >
              ♟
            </button>

            <button
              type="button"
              data-child-move="up"
              title="Move branch earlier"
            >
              ↑
            </button>

            <button
              type="button"
              data-child-move="down"
              title="Move branch later"
            >
              ↓
            </button>

            <button
              type="button"
              data-child-remove
              title="Remove branch"
            >
              ×
            </button>
          </div>

          <div class="group-child-user-picker subtask-user-picker hidden">
            <div class="subtask-user-search">
              <input
                type="text"
                placeholder="Search users by name or email"
                data-group-child-user-search
                autocomplete="off"
              />

              <span>⌕</span>
            </div>

            <div class="subtask-user-results"></div>
          </div>
        </div>
      `).join("")}

        <button type="button" class="workflow-add-branch-button" data-add-group-child>
          + Add branch
        </button>
      </div>
    </div>`;
}

function workflowSubtaskRowMarkup(step, index) {
  const normalized = normalizeWorkflowStep(step);

  return normalized.type === "group"
    ? workflowGroupMarkup(normalized, index)
    : workflowSimpleStepMarkup(normalized, index);
}

function getSelectedWorkflowTemplate() {
  return state.workflowTemplates.find(
    template =>
      template.id ===
      document.getElementById("workflowTemplateId").value
  );
}

function findWorkflowStepById(stepId) {
  const template = getSelectedWorkflowTemplate();

  if (!template) {
    return null;
  }

  const stageSteps =
    template.workflow[selectedWorkflowStage] || [];

  for (const step of stageSteps) {
    if (step.id === stepId) {
      return step;
    }

    if (step.type === "group") {
      const child = step.children.find(
        item => item.id === stepId
      );

      if (child) {
        return child;
      }
    }
  }

  return null;
}

function getWorkflowStepFromRow(row) {
  const template = getSelectedWorkflowTemplate();

  if (!template) {
    return null;
  }

  const stepId = row.dataset.workflowSubtaskId;

  for (const step of template.workflow[selectedWorkflowStage]) {
    if (step.id === stepId) return step;

    if (step.type === "group") {
      const child = step.children.find(item => item.id === stepId);
      if (child) return child;
    }
  }

  return null;
}

function renderSubtaskUserResults(wrapper, searchTerm = "") {
  const row = wrapper.querySelector(".workflow-subtask-row");
  const step = getWorkflowStepFromRow(row);

  if (!step) {
    return;
  }

  const results = wrapper.querySelector(
    ".subtask-user-results"
  );

  const search = searchTerm.trim().toLowerCase();

  const users = DEMO_USERS.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search);

    return matchesSearch;
  });

  results.innerHTML = users.length
    ? users.map(user => {
        const selected = (
          step.assignedUserIds || []
        ).includes(user.id);

        return `
          <button
            type="button"
            class="subtask-user-result ${
              selected ? "selected" : ""
            }"
            data-select-subtask-user="${user.id}"
          >
            <span class="subtask-user-result-avatar">
              ${escapeHtml(user.initials)}
            </span>

            <span class="subtask-user-result-details">
              <strong>${escapeHtml(user.name)}</strong>
              <small>${escapeHtml(user.email)}</small>
            </span>

            <span class="subtask-user-result-status">
              ${selected ? "✓ Linked" : "Link"}
            </span>
          </button>
        `;
      }).join("")
    : `
      <div class="subtask-user-no-results">
        No users found.
      </div>
    `;
}

function renderGroupChildUserResults(
  childRow,
  searchTerm = ""
) {
  const childId = childRow.dataset.workflowChildId;
  const child = findWorkflowStepById(childId);

  if (!child) {
    return;
  }

  const results = childRow.querySelector(
    ".subtask-user-results"
  );

  const search = searchTerm.trim().toLowerCase();

  const users = DEMO_USERS.filter(user => {
    return (
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)
    );
  });

  results.innerHTML = users.length
    ? users.map(user => {
        const selected = (
          child.assignedUserIds || []
        ).includes(user.id);

        return `
          <button
            type="button"
            class="subtask-user-result ${
              selected ? "selected" : ""
            }"
            data-select-group-child-user="${user.id}"
          >
            <span class="subtask-user-result-avatar">
              ${escapeHtml(user.initials)}
            </span>

            <span class="subtask-user-result-details">
              <strong>${escapeHtml(user.name)}</strong>
              <small>${escapeHtml(user.email)}</small>
            </span>

            <span class="subtask-user-result-status">
              ${selected ? "✓ Linked" : "Link"}
            </span>
          </button>
        `;
      }).join("")
    : `
      <div class="subtask-user-no-results">
        No users found.
      </div>
    `;
}

function closeAllSubtaskUserPickers(exceptWrapper = null) {
  document
    .querySelectorAll(".workflow-subtask-wrapper")
    .forEach(wrapper => {
      if (wrapper !== exceptWrapper) {
        wrapper
          .querySelector(".subtask-user-picker")
          ?.classList.add("hidden");
      }
    });
}

function refreshWorkflowDesignerAfterUserChange() {
  const template = getSelectedWorkflowTemplate();

  if (!template) {
    return;
  }

  saveState();
  renderWorkflowDesigner(template);
}

function refreshWorkflowRowOrder(list) {
  const wrappers = [...list.children].filter(
    child => child.classList.contains("workflow-subtask-wrapper")
  );

  wrappers.forEach((wrapper, index) => {
    const row = wrapper.querySelector(":scope > .workflow-subtask-row");
    row.querySelector(".workflow-subtask-number").textContent = index + 1;
    row.querySelector('[data-workflow-chip-move="up"]').disabled = index === 0;
    row.querySelector('[data-workflow-chip-move="down"]').disabled = index === wrappers.length - 1;

    const children = [...wrapper.querySelectorAll(":scope > .workflow-group-children > .workflow-group-child-row")];
    children.forEach((childRow, childIndex) => {
      childRow.querySelector(".workflow-child-number").textContent = `${index + 1}.${childIndex + 1}`;
      childRow.querySelector('[data-child-move="up"]').disabled = childIndex === 0;
      childRow.querySelector('[data-child-move="down"]').disabled = childIndex === children.length - 1;
    });
  });

  const itemCount = wrappers.reduce((total, wrapper) => {
    if (wrapper.dataset.workflowItemType === "group") {
      return total + wrapper.querySelectorAll(".workflow-group-child-row").length;
    }
    return total + 1;
  }, 0);

  document.getElementById("workflowStageCount").textContent =
    `${itemCount} subtask${itemCount === 1 ? "" : "s"}`;
}

function renderWorkflowDesigner(template) {
  renderWorkflowStageStrip(template);
  document.getElementById("workflowStageTitle").textContent = selectedWorkflowStage;
  document.getElementById("workflowStageDescription").textContent =
    selectedWorkflowStage === "Complete"
      ? "Configure the final checks required before this task can be considered fully complete."
      : "Configure sequential steps, parallel requirements, or alternative workflow choices.";

  const steps = template.workflow[selectedWorkflowStage] || [];

  workflowStatusConfiguration.innerHTML = `
    <div class="workflow-subtask-panel">
      <div class="workflow-subtask-panel-heading">
        <div>
          <h4>Subtasks</h4>
          <p>
            Use a normal subtask for a single step. Use a grouped step for parallel work
            or an either/or choice such as 2.1 and 2.2.
          </p>
        </div>
      </div>

      <div class="workflow-subtask-list" data-workflow-status-list="${selectedWorkflowStage}">
        ${steps.map(workflowSubtaskRowMarkup).join("")}
      </div>

      <div class="workflow-add-subtask">
        <span class="workflow-add-icon">＋</span>
        <input
          type="text" style = "font-size: 10px;"
          data-workflow-subtask-entry="${selectedWorkflowStage}"
          placeholder="Subtask..."
          autocomplete="off"
        />
        <button
          type="button"
          class="primary-button"
          data-add-workflow-subtask="${selectedWorkflowStage}"
        >Add subtask</button>
        <button
          type="button"
          class="secondary-button workflow-add-group-button"
          data-add-workflow-group="${selectedWorkflowStage}"
        >Add grouped step</button>
      </div>

      <div class="workflow-group-help">
        <span><strong>All required:</strong> every branch must be completed.</span>
        <span><strong>One required:</strong> completing one branch is enough.</span>
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

  const workflowAdminUser = DEMO_USERS.find(
    user => user.id === template.adminUserId
  );

  document.getElementById("workflowAdminUserId").value =
    template.adminUserId || "";

  document.getElementById("workflowAdmin").value = "";

  if (workflowAdminUser) {
    selectWorkflowAdmin(workflowAdminUser.id);
  } else {
    clearWorkflowAdmin();
  }

  renderWorkflowDesigner(template);
  renderWorkflowTemplateList();
}

function createNewWorkflow() {
  const template = {
    id: crypto.randomUUID(),
    name: "New Workflow",
    description: "",
    adminUserId: "",
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
    {
      id: crypto.randomUUID(),
      type: "step",
      title,
      complete: false,
      assignedUserIds: []
    },
    list.children.length
  ).trim();

  list.appendChild(wrapper.firstElementChild);
  input.value = "";
  refreshWorkflowRowOrder(list);
  input.focus();
}

function addWorkflowGroup(status) {
  const list = workflowStatusConfiguration.querySelector(
    `[data-workflow-status-list="${status}"]`
  );
  if (!list) return;

  const group = makeGroup("Grouped step", "all", ["First branch", "Second branch"]);
  const wrapper = document.createElement("div");
  wrapper.innerHTML = workflowSubtaskRowMarkup(group, list.children.length).trim();
  list.appendChild(wrapper.firstElementChild);

  refreshWorkflowRowOrder(list);

  const titleInput = list.lastElementChild.querySelector("[data-workflow-group-title]");
  titleInput?.focus();
  titleInput?.select();
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

  const addGroupButton = event.target.closest("[data-add-workflow-group]");
  if (addGroupButton) {
    addWorkflowGroup(addGroupButton.dataset.addWorkflowGroup);
    return;
  }

  const addChildButton = event.target.closest("[data-add-group-child]");
  if (addChildButton) {
    const wrapper = addChildButton.closest(".workflow-group-wrapper");
    const childrenHost = wrapper.querySelector("[data-workflow-group-children]");
    const groupNumber = wrapper.querySelector(".workflow-subtask-number").textContent;
    const childCount = childrenHost.querySelectorAll(".workflow-group-child-row").length;
    const childId = crypto.randomUUID();

    addChildButton.insertAdjacentHTML("beforebegin", `
      <div
        class="workflow-group-child-row"
        data-workflow-child-id="${childId}"
      >
        <span class="workflow-group-branch-line"></span>

        <span class="workflow-child-number">
          ${groupNumber}.${childCount + 1}
        </span>

        <input
          class="workflow-child-title-input"
          data-workflow-child-title
          value="New branch"
          maxlength="100"
          aria-label="Branch title"
        />

        <div class="workflow-child-actions">
          <div class="workflow-linked-user-avatars"></div>

          <button
            type="button"
            data-link-group-child-users
            title="Assign users"
            class="subtask-user-button"
          >
            ♟
          </button>

          <button
            type="button"
            data-child-move="up"
            title="Move branch earlier"
          >
            ↑
          </button>

          <button
            type="button"
            data-child-move="down"
            title="Move branch later"
          >
            ↓
          </button>

          <button
            type="button"
            data-child-remove
            title="Remove branch"
          >
            ×
          </button>
        </div>

        <div class="group-child-user-picker subtask-user-picker hidden">
          <div class="subtask-user-search">
            <input
              type="text"
              placeholder="Search users by name or email"
              data-group-child-user-search
              autocomplete="off"
            />

            <span>⌕</span>
          </div>

          <div class="subtask-user-results"></div>
        </div>
      </div>
    `);

    refreshWorkflowRowOrder(wrapper.parentElement);
    const input = addChildButton.previousElementSibling.querySelector("[data-workflow-child-title]");
    input.focus();
    input.select();
    return;
  }

  const childRow = event.target.closest(".workflow-group-child-row");
  if (childRow) {
    const wrapper = childRow.closest(".workflow-group-wrapper");
    const list = wrapper.parentElement;

    if (event.target.closest("[data-child-remove]")) {
      const childRows = wrapper.querySelectorAll(".workflow-group-child-row");
      if (childRows.length <= 2) {
        showToast("A grouped step must contain at least two branches.");
        return;
      }
      childRow.remove();
      refreshWorkflowRowOrder(list);
      return;
    }

    const moveButton = event.target.closest("[data-child-move]");
    if (moveButton) {
      const previous = childRow.previousElementSibling;
      const next = childRow.nextElementSibling;

      if (
        moveButton.dataset.childMove === "up" &&
        previous?.classList.contains("workflow-group-child-row")
      ) {
        childRow.parentElement.insertBefore(childRow, previous);
      }

      if (
        moveButton.dataset.childMove === "down" &&
        next?.classList.contains("workflow-group-child-row")
      ) {
        childRow.parentElement.insertBefore(next, childRow);
      }

      refreshWorkflowRowOrder(list);
      return;
    }
  }

  const userLinkButton = event.target.closest("[data-link-subtask-users]");
  if (userLinkButton) {
    const wrapper = userLinkButton.closest(".workflow-subtask-wrapper");
    const picker = wrapper.querySelector(".subtask-user-picker");
    const isOpening = picker.classList.contains("hidden");

    closeAllSubtaskUserPickers(wrapper);
    picker.classList.toggle("hidden", !isOpening);

    if (isOpening) {
      const searchInput = picker.querySelector("[data-subtask-user-search]");
      searchInput.value = "";
      renderSubtaskUserResults(wrapper);
      searchInput.focus();
    }
    return;
  }

  const selectUserButton = event.target.closest("[data-select-subtask-user]");
  if (selectUserButton) {
    const wrapper = selectUserButton.closest(".workflow-subtask-wrapper");
    const row = wrapper.querySelector(":scope > .workflow-subtask-row");
    const step = getWorkflowStepFromRow(row);
    if (!step) return;

    const userId = selectUserButton.dataset.selectSubtaskUser;
    if (!Array.isArray(step.assignedUserIds)) step.assignedUserIds = [];

    step.assignedUserIds = step.assignedUserIds.includes(userId)
      ? step.assignedUserIds.filter(existingId => existingId !== userId)
      : [...step.assignedUserIds, userId];

    refreshWorkflowDesignerAfterUserChange();
    return;
  }

  const removeUserButton = event.target.closest("[data-remove-subtask-user]");
  if (removeUserButton) {
    const row = removeUserButton.closest(".workflow-subtask-row");
    const step = getWorkflowStepFromRow(row);
    if (!step) return;

    step.assignedUserIds = (step.assignedUserIds || [])
      .filter(existingId => existingId !== removeUserButton.dataset.removeSubtaskUser);

    refreshWorkflowDesignerAfterUserChange();
    return;
  }

  const row = event.target.closest(".workflow-subtask-row");
  if (!row) return;

  const wrapper = row.closest(".workflow-subtask-wrapper");
  const list = wrapper.parentElement;

  if (event.target.closest("[data-workflow-chip-remove]")) {
    wrapper.remove();
    refreshWorkflowRowOrder(list);
    return;
  }

  const moveButton = event.target.closest("[data-workflow-chip-move]");
  if (!moveButton) return;

  if (moveButton.dataset.workflowChipMove === "up" && wrapper.previousElementSibling) {
    list.insertBefore(wrapper, wrapper.previousElementSibling);
  }

  if (moveButton.dataset.workflowChipMove === "down" && wrapper.nextElementSibling) {
    list.insertBefore(wrapper.nextElementSibling, wrapper);
  }

  refreshWorkflowRowOrder(list);
});

workflowStatusConfiguration.addEventListener("dragstart", event => {
  const row = event.target.closest(".workflow-subtask-row");
  draggedWorkflowChip = row?.closest(".workflow-subtask-wrapper");
  if (!draggedWorkflowChip) return;
  draggedWorkflowChip.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
});

workflowStatusConfiguration.addEventListener("dragover", event => {
  const targetRow = event.target.closest(".workflow-subtask-row");
  const target = targetRow?.closest(".workflow-subtask-wrapper");

  if (
    !draggedWorkflowChip ||
    !target ||
    target === draggedWorkflowChip ||
    target.parentElement !== draggedWorkflowChip.parentElement
  ) return;

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

  const existingById = new Map();

  template.workflow[selectedWorkflowStage].forEach(step => {
    existingById.set(step.id, step);
    if (step.type === "group") {
      step.children.forEach(child => existingById.set(child.id, child));
    }
  });

  template.workflow[selectedWorkflowStage] = [...list.children]
    .filter(wrapper => wrapper.classList.contains("workflow-subtask-wrapper"))
    .map(wrapper => {
      const row = wrapper.querySelector(":scope > .workflow-subtask-row");
      const id = row.dataset.workflowSubtaskId;

      if (wrapper.dataset.workflowItemType === "group") {
        return {
          id,
          type: "group",
          title: wrapper.querySelector("[data-workflow-group-title]").value.trim() || "Grouped step",
          completionMode: wrapper.querySelector("[data-workflow-group-mode]").value,
          children: [...wrapper.querySelectorAll(".workflow-group-child-row")].map(childRow => {
            const childId = childRow.dataset.workflowChildId;
            const existing = existingById.get(childId);

            return {
              id: childId,
              type: "step",
              title: childRow.querySelector("[data-workflow-child-title]").value.trim() || "Untitled branch",
              complete: false,
              assignedUserIds: [...(existing?.assignedUserIds || [])]
            };
          })
        };
      }

      const existing = existingById.get(id);

      return {
        id,
        type: "step",
        title: row.querySelector(".workflow-subtask-title").textContent.trim(),
        complete: false,
        assignedUserIds: [...(existing?.assignedUserIds || [])]
      };
    });

  synchroniseTasksLinkedToTemplate(template.id);
  saveState();
  renderWorkflowTemplateList();
  openWorkflowEditor(template.id);
  renderBoard();
  showToast("Workflow saved and linked tasks updated.");
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

  const isOpening =
    administrationMenu.classList.contains("hidden");

  administrationMenu.classList.toggle("hidden");
  administrationNavButton.classList.toggle(
    "menu-open",
    isOpening
  );
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

const linkBtn = document.getElementById("linkWorkflowBtn");
const modal = document.getElementById("workflowLinkModal");

linkBtn.addEventListener("click", () => {

    buildHierarchyTree();

    modal.classList.remove("hidden");

});

document
.getElementById("closeWorkflowLinkModal")
.onclick = () => {

    modal.classList.add("hidden");

};

document
.getElementById("cancelWorkflowLink")
.onclick = () => {

    modal.classList.add("hidden");

};

function buildHierarchyTree() {
  const tree = document.getElementById("workflowHierarchyTree");

  if (!tree) {
    console.error("workflowHierarchyTree element was not found.");
    return;
  }

  tree.innerHTML = "";

  const companies = Array.isArray(state.companies)
    ? state.companies
    : [];

  companies.forEach(company => {
    const companyTasks = state.tasks.filter(
      task => task.company === company
    );

    const folders = [
      ...new Set(companyTasks.map(task => task.group))
    ];

    const companyElement = document.createElement("div");
    companyElement.className = "hierarchy-company";

    companyElement.innerHTML = `
      <div class="hierarchy-company-row">
        <button
          type="button"
          class="hierarchy-expand-button"
          aria-label="Expand ${escapeHtml(company)}"
        >
          +
        </button>

        <span class="hierarchy-company-icon">▦</span>

        <strong>${escapeHtml(company)}</strong>
      </div>

      <div class="hierarchy-folder-list hidden">
        ${
          folders.length
            ? folders.map(folder => `
                <label class="hierarchy-folder-row">
                  <input
                    type="checkbox"
                    value="${escapeHtml(company)}|||${escapeHtml(folder)}"
                    data-company="${escapeHtml(company)}"
                    data-folder="${escapeHtml(folder)}"
                  />

                  <span class="hierarchy-folder-icon">▣</span>
                  <span>${escapeHtml(folder)}</span>
                </label>
              `).join("")
            : `
              <div class="hierarchy-no-folders">
                No parent folders available
              </div>
            `
        }
      </div>
    `;

    const expandButton = companyElement.querySelector(
      ".hierarchy-expand-button"
    );

    const folderList = companyElement.querySelector(
      ".hierarchy-folder-list"
    );

    expandButton.addEventListener("click", () => {
      const isHidden = folderList.classList.toggle("hidden");
      expandButton.textContent = isHidden ? "+" : "−";
    });

    tree.appendChild(companyElement);
  });
}
repairLinkedWorkflowTasks();
render();

function renderWorkflowAdminResults(searchTerm = "") {
  const results = document.getElementById("workflowAdminResults");
  const selectedUserId =
    document.getElementById("workflowAdminUserId").value;

  const search = searchTerm.trim().toLowerCase();

  const users = DEMO_USERS.filter(user => {
    return (
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)
    );
  });

  results.innerHTML = users.length
    ? users.map(user => `
        <button
          type="button"
          class="workflow-admin-result ${
            user.id === selectedUserId ? "selected" : ""
          }"
          data-select-workflow-admin="${user.id}"
        >
          <span class="workflow-admin-avatar">
            ${escapeHtml(user.initials)}
          </span>

          <span class="workflow-admin-user-details">
            <strong>${escapeHtml(user.name)}</strong>
            <small>${escapeHtml(user.email)}</small>
          </span>

          <span class="workflow-admin-result-action">
            ${user.id === selectedUserId ? "✓ Selected" : "Select"}
          </span>
        </button>
      `).join("")
    : `
      <div class="workflow-admin-no-results">
        No users found.
      </div>
    `;
}

function selectWorkflowAdmin(userId) {
  const user = DEMO_USERS.find(item => item.id === userId);

  if (!user) return;

  document.getElementById("workflowAdminUserId").value = user.id;

  const selectedAdmin =
    document.getElementById("selectedWorkflowAdmin");

  selectedAdmin.innerHTML = `
    <span
      class="workflow-admin-bubble"
      title="${escapeHtml(user.name)} — ${escapeHtml(user.email)}"
    >
      <span class="workflow-admin-bubble-avatar">
        ${escapeHtml(user.initials)}
      </span>

      <span class="workflow-admin-bubble-name">
        ${escapeHtml(user.name)}
      </span>

      <button
        type="button"
        data-remove-workflow-admin
        title="Remove workflow admin"
      >
        ×
      </button>
    </span>
  `;

  document.getElementById("workflowAdmin").value = "";
  document.getElementById("workflowAdmin").placeholder = "";

  document
    .getElementById("workflowAdminResults")
    .classList.add("hidden");
}

function clearWorkflowAdmin() {
  document.getElementById("workflowAdminUserId").value = "";

  const input = document.getElementById("workflowAdmin");

  input.value = "";
  input.placeholder = "Search users by name or email";

  document.getElementById("selectedWorkflowAdmin").innerHTML = "";
}

const workflowAdminInput =
  document.getElementById("workflowAdmin");

const workflowAdminResults =
  document.getElementById("workflowAdminResults");

workflowAdminInput.addEventListener("focus", () => {
  renderWorkflowAdminResults(workflowAdminInput.value);
  workflowAdminResults.classList.remove("hidden");
});

workflowAdminInput.addEventListener("input", event => {
  renderWorkflowAdminResults(event.target.value);
  workflowAdminResults.classList.remove("hidden");
});

workflowAdminResults.addEventListener("click", event => {
  const button = event.target.closest(
    "[data-select-workflow-admin]"
  );

  if (!button) return;

  selectWorkflowAdmin(
    button.dataset.selectWorkflowAdmin
  );
});

document
  .getElementById("selectedWorkflowAdmin")
  .addEventListener("click", event => {
    if (!event.target.closest("[data-remove-workflow-admin]")) {
      return;
    }

    clearWorkflowAdmin();

    const input = document.getElementById("workflowAdmin");

    input.focus();
    renderWorkflowAdminResults();
    workflowAdminResults.classList.remove("hidden");
  });

document.addEventListener("click", event => {
  if (!event.target.closest(".workflow-admin-picker")) {
    workflowAdminResults.classList.add("hidden");
  }
});

const workflowToggle =
  document.getElementById("workflowViewToggle");

workflowToggle.addEventListener("click", () => {
  workflowViewEnabled = !workflowViewEnabled;

  workflowToggle.classList.toggle(
    "active",
    workflowViewEnabled
  );

  workflowToggle.setAttribute(
    "aria-pressed",
    String(workflowViewEnabled)
  );

  document
    .querySelector(".board-panel")
    .classList.toggle(
      "workflow-view-active",
      workflowViewEnabled
    );

  renderBoard();
});