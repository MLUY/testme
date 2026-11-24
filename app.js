(function () {
  'use strict';

  const STORAGE_KEY = 'project-planner.tasks.v1';
  const DAY_MS = 24 * 60 * 60 * 1000;
  const DAY_WIDTH = 28; // pixels per day in the Gantt chart
  const BAR_COLORS = ['#3b6ef5', '#0f9d8a', '#8e5cd9', '#e0892b', '#d6456b', '#2e8bc0'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const tbody = document.getElementById('task-body');
  const emptyMsg = document.getElementById('empty-msg');
  const gantt = document.getElementById('gantt');
  const addBtn = document.getElementById('add-task');

  let tasks = loadTasks();

  // ---------- Date helpers (all dates handled as UTC midnight to avoid DST issues) ----------

  function parseDate(str) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str || '')) return null;
    const [y, m, d] = str.split('-').map(Number);
    const t = Date.UTC(y, m - 1, d);
    return isNaN(t) ? null : t;
  }

  function formatDate(t) {
    return new Date(t).toISOString().slice(0, 10);
  }

  function todayUTC() {
    const now = new Date();
    return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function isValid(task) {
    return parseDate(task.start) !== null && Number.isFinite(task.duration) && task.duration >= 1;
  }

  // End date is inclusive: a 1-day task ends on its start date.
  function endDate(task) {
    return parseDate(task.start) + (task.duration - 1) * DAY_MS;
  }

  // ---------- Persistence ----------

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not load saved tasks:', e);
    }
    return sampleTasks();
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Could not save tasks:', e);
    }
  }

  function sampleTasks() {
    const t0 = todayUTC();
    return [
      { id: newId(), title: 'Kick-off & requirements', start: formatDate(t0), duration: 3 },
      { id: newId(), title: 'Design', start: formatDate(t0 + 3 * DAY_MS), duration: 5 },
      { id: newId(), title: 'Build', start: formatDate(t0 + 7 * DAY_MS), duration: 10 },
      { id: newId(), title: 'Test & launch', start: formatDate(t0 + 16 * DAY_MS), duration: 4 },
    ];
  }

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ---------- Table ----------

  function renderTable() {
    tbody.innerHTML = '';
    tasks.forEach((task) => tbody.appendChild(buildRow(task)));
    emptyMsg.hidden = tasks.length > 0;
  }

  function buildRow(task) {
    const tr = document.createElement('tr');
    tr.dataset.id = task.id;

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.placeholder = 'Task title';
    titleInput.value = task.title;
    titleInput.setAttribute('aria-label', 'Task title');

    const startInput = document.createElement('input');
    startInput.type = 'date';
    startInput.value = task.start;
    startInput.setAttribute('aria-label', 'Start date');

    const durInput = document.createElement('input');
    durInput.type = 'number';
    durInput.min = '1';
    durInput.step = '1';
    durInput.value = task.duration;
    durInput.setAttribute('aria-label', 'Duration in days');

    const endCell = document.createElement('td');
    endCell.className = 'col-end';

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'delete-btn';
    delBtn.textContent = 'Delete';
    delBtn.setAttribute('aria-label', 'Delete task');

    function refresh() {
      startInput.classList.toggle('invalid', parseDate(task.start) === null);
      durInput.classList.toggle('invalid', !(task.duration >= 1));
      endCell.textContent = isValid(task) ? formatDate(endDate(task)) : '—';
    }

    titleInput.addEventListener('input', () => {
      task.title = titleInput.value;
      commit();
    });
    startInput.addEventListener('input', () => {
      task.start = startInput.value;
      refresh();
      commit();
    });
    durInput.addEventListener('input', () => {
      const n = parseInt(durInput.value, 10);
      task.duration = Number.isFinite(n) ? n : NaN;
      refresh();
      commit();
    });
    delBtn.addEventListener('click', () => {
      tasks = tasks.filter((t) => t.id !== task.id);
      tr.remove();
      emptyMsg.hidden = tasks.length > 0;
      commit();
    });

    tr.append(
      cell(titleInput, 'col-title'),
      cell(startInput, 'col-start'),
      cell(durInput, 'col-duration'),
      endCell,
      cell(delBtn, 'col-actions')
    );
    refresh();
    return tr;
  }

  function cell(child, className) {
    const td = document.createElement('td');
    td.className = className;
    td.appendChild(child);
    return td;
  }

  function addTask() {
    // Default the new task to start the day after the last task ends (or today).
    const valid = tasks.filter(isValid);
    const start = valid.length
      ? Math.max(...valid.map(endDate)) + DAY_MS
      : todayUTC();
    const task = { id: newId(), title: '', start: formatDate(start), duration: 1 };
    tasks.push(task);
    tbody.appendChild(buildRow(task));
    emptyMsg.hidden = true;
    commit();
    tbody.lastElementChild.querySelector('input').focus();
  }

  // ---------- Gantt chart ----------

  function renderGantt() {
    gantt.innerHTML = '';
    const valid = tasks.filter(isValid);

    if (valid.length === 0) {
      const p = document.createElement('div');
      p.className = 'gantt-empty';
      p.textContent = 'Add a task with a start date and a duration to see it here.';
      gantt.appendChild(p);
      return;
    }

    const minStart = Math.min(...valid.map((t) => parseDate(t.start)));
    const maxEnd = Math.max(...valid.map(endDate));
    const totalDays = Math.round((maxEnd - minStart) / DAY_MS) + 1;
    const trackWidth = totalDays * DAY_WIDTH;

    const inner = document.createElement('div');
    inner.className = 'gantt-inner';

    // Header row with day/month labels
    const header = document.createElement('div');
    header.className = 'gantt-row gantt-header';
    header.appendChild(label('Task'));
    const headTrack = track(trackWidth);
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(minStart + i * DAY_MS);
      const c = dayCell(i, d);
      const day = d.getUTCDate();
      if (i === 0 || day === 1) {
        const m = document.createElement('span');
        m.className = 'month';
        m.textContent = MONTHS[d.getUTCMonth()];
        c.appendChild(m);
      }
      const dn = document.createElement('span');
      dn.textContent = day;
      c.appendChild(dn);
      headTrack.appendChild(c);
    }
    header.appendChild(headTrack);
    inner.appendChild(header);

    // One row per task (in table order; invalid tasks are skipped)
    tasks.forEach((task, idx) => {
      if (!isValid(task)) return;
      const row = document.createElement('div');
      row.className = 'gantt-row';
      const name = task.title.trim() || 'Untitled task';
      row.appendChild(label(name));

      const tr = track(trackWidth);
      for (let i = 0; i < totalDays; i++) {
        tr.appendChild(dayCell(i, new Date(minStart + i * DAY_MS)));
      }

      const offset = Math.round((parseDate(task.start) - minStart) / DAY_MS);
      const bar = document.createElement('div');
      bar.className = 'gantt-bar';
      bar.style.left = offset * DAY_WIDTH + 2 + 'px';
      bar.style.width = task.duration * DAY_WIDTH - 4 + 'px';
      bar.style.background = BAR_COLORS[idx % BAR_COLORS.length];
      bar.textContent = task.duration + 'd';
      bar.title = `${name}\n${task.start} → ${formatDate(endDate(task))} (${task.duration} day${task.duration === 1 ? '' : 's'})`;
      tr.appendChild(bar);

      row.appendChild(tr);
      inner.appendChild(row);
    });

    // Today marker, if today falls inside the chart range
    const today = todayUTC();
    if (today >= minStart && today <= maxEnd) {
      const line = document.createElement('div');
      line.className = 'today-line';
      line.title = 'Today';
      const x = ((today - minStart) / DAY_MS + 0.5) * DAY_WIDTH;
      line.style.left = `calc(var(--label-width) + ${x - 1}px)`;
      inner.appendChild(line);
    }

    gantt.appendChild(inner);
  }

  function label(text) {
    const div = document.createElement('div');
    div.className = 'gantt-label';
    const span = document.createElement('span');
    span.textContent = text;
    span.title = text;
    div.appendChild(span);
    return div;
  }

  function track(width) {
    const div = document.createElement('div');
    div.className = 'gantt-track';
    div.style.width = width + 'px';
    div.style.minWidth = width + 'px';
    return div;
  }

  function dayCell(i, date) {
    const c = document.createElement('div');
    const dow = date.getUTCDay();
    c.className = 'day-cell' + (dow === 0 || dow === 6 ? ' weekend' : '');
    c.style.left = i * DAY_WIDTH + 'px';
    c.style.width = DAY_WIDTH + 'px';
    return c;
  }

  // ---------- Wiring ----------

  function commit() {
    saveTasks();
    renderGantt();
  }

  addBtn.addEventListener('click', addTask);

  renderTable();
  renderGantt();
  saveTasks();
})();
