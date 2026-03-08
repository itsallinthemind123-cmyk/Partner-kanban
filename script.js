// ═══════════════════════════════════════════════
// STATIC PARTNERS DATA
// ═══════════════════════════════════════════════
const PARTNERS = [
  { id: 1, name: 'James', role: 'Team Lead', note: 'North  delhi', color: '#1565C0' },
  { id: 2, name: 'Maria', role: 'Cleaner', note: 'hsr layout', color: '#EF4444' },
  { id: 3, name: 'John', role: 'supervisor', note: 'Knk road', color: '#7C3AED' },
  { id: 4, name: 'Saran', role: 'Specialist', note: 'East delhi', color: '#059669' },
  { id: 5, name: 'Jengath', role: 'Technician', note: 'Central delhi', color: '#0284C7' },
  { id: 6, name: 'Linga', role: 'Coordinator', note: 'Eloctronic city', color: '#D97706' },
  { id: 7, name: 'karthik', role: 'Cleaner', note: 'Industrial', color: '#DB2777' },
  { id: 8, name: 'joseph', role: 'Inspector', note: 'Qus Road', color: '#0D9488' },
];

// ═══════════════════════════════════════════════
// STATIC JOBS DATA
// ═══════════════════════════════════════════════
const JOBS = [
  { title: 'Office Deep Clean', detail: 'Downtown corporate office - floors & restrooms', phone: '555-0101', status: 'available' },
  { title: 'Carpet Cleaning', detail: 'Residential - living area & bedrooms', phone: '555-0102', status: 'pending' },
  { title: 'Window Service', detail: 'Commercial building - exterior windows', phone: '555-0103', status: 'issue' },
  { title: 'Post-Construction', detail: 'New facility - general cleanup required', phone: '555-0104', status: 'available' },
  { title: 'Maintenance Visit', detail: 'Regular monthly maintenance', phone: '555-0105', status: 'available' },
  { title: 'Emergency Cleanup', detail: 'Spill cleanup - chemical containment', phone: '555-0106', status: 'issue' },
  { title: 'Eco-Friendly Clean', detail: 'Green cleaning protocols required', phone: '555-0107', status: 'pending' },
  { title: 'Restroom Sanitation', detail: 'High-traffic facility sanitization', phone: '555-0108', status: 'available' },
];

// ═══════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════
const TIME_SLOTS = ['10 AM', '2 PM', '4 PM'];
const VISIBLE_N = 999;

const STATUS_META = {
  available: { label: 'Available', color: '#10B981' },
  pending: { label: 'Pending', color: '#F59E0B' },
  issue: { label: 'Issue', color: '#EF4444' },
};

// ═══════════════════════════════════════════════
// TASK STORE — keyed: "YYYY-MM-DD|pid|slot"
// ═══════════════════════════════════════════════
const store = {};

// ═══════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════
let currentDate = new Date();
currentDate.setHours(0, 0, 0, 0);
let searchQuery = '';

// ═══════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════
const DAYS_L = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_S = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Generate date key format: YYYY-MM-DD
 */
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Generate store key for a specific task
 */
function storeKey(dk, pid, slot) {
  return `${dk}|${pid}|${slot}`;
}

/**
 * Get task from store
 */
function getTask(dk, pid, slot) {
  return store[storeKey(dk, pid, slot)] || null;
}

/**
 * Set task in store
 */
function setTask(dk, pid, slot, task) {
  store[storeKey(dk, pid, slot)] = task;
}

/**
 * Remove task from store
 */
function removeTask(dk, pid, slot) {
  delete store[storeKey(dk, pid, slot)];
}

/**
 * Get initials from name
 */
function initials(n) {
  return n
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Get today's date at midnight
 */
function today0() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Check if two dates are the same day
 */
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Count bookings for a partner on a specific day
 */
function countBookings(dk, pid) {
  const total = TIME_SLOTS.filter(s => getTask(dk, pid, s)).length;
  const byStatus = {};
  TIME_SLOTS.forEach(s => {
    const t = getTask(dk, pid, s);
    if (t) byStatus[t.status] = (byStatus[t.status] || 0) + 1;
  });
  return { total, byStatus };
}

// ═══════════════════════════════════════════════
// TOPBAR FUNCTIONS
// ═══════════════════════════════════════════════

/**
 * Update topbar date display
 */
function updateTopbarDate() {
  const d = currentDate;
  const dow = d.getDay();
  $('#db-day').text(DAYS_L[dow].slice(0, 3).toUpperCase());
  $('#db-date').html(`${MONTHS_S[d.getMonth()]} <span>${d.getDate()}</span>, ${d.getFullYear()}`);
  updateTopbarStats();
}

/**
 * Count total bookings for a specific date across all partners
 */
function countDayTotal(dk) {
  return PARTNERS.reduce((sum, p) => sum + TIME_SLOTS.filter(s => getTask(dk, p.id, s)).length, 0);
}

/**
 * Get Monday of the current week
 */
function weekStart(d) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

/**
 * Update stats in topbar (Today, This Week, This Month)
 */
function updateTopbarStats() {
  const today = currentDate;

  // Today's total
  const todayTotal = countDayTotal(dateKey(today));

  // This week total (Mon-Sun)
  const mon = weekStart(today);
  let weekTotal = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    weekTotal += countDayTotal(dateKey(d));
  }

  // This month total
  const y = today.getFullYear();
  const m = today.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  let monthTotal = 0;
  for (let i = 1; i <= daysInMonth; i++) {
    monthTotal += countDayTotal(dateKey(new Date(y, m, i)));
  }

  $('#stat-today').text(todayTotal);
  $('#stat-week').text(weekTotal);
  $('#stat-month').text(monthTotal);
}

// ═══════════════════════════════════════════════
// BUILD SCHEDULE TABLE
// ═══════════════════════════════════════════════

/**
 * Build a card for a task
 */
function buildCard(task, partner, dk) {
  const $c = $(`<div class="task-card card-${task.status}" data-pid="${partner.id}" data-slot="${task.slot}" data-dk="${dk}"></div>`);

  const sm = STATUS_META[task.status] || STATUS_META.available;
  let html = `<div class="card-badge badge-${task.status}">${sm.label}</div>`;
  html += `<div class="card-title">${task.title}</div>`;
  if (task.detail) {
    const truncatedDetail = task.detail.substring(0, 60);
    html += `<div class="card-detail">${truncatedDetail}${task.detail.length > 60 ? '…' : ''}</div>`;
  }
  if (task.phone) html += `<div class="card-phone">📞 ${task.phone}</div>`;
  
  $c.html(html);
  $c.data('task', task);
  $c.data('partner', partner);

  $c.on('click', function () {
    if (!$(this).hasClass('ui-draggable-dragging')) {
      openDrawer(task, partner, dk);
    }
  });

  return $c;
}

/**
 * Build a complete schedule table for a group of partners
 */
function buildTable(dk, partners, groupIndex) {
  const $wrap = $('<div class="table-group"></div>');

  // Add divider for 2nd+ tables
  if (groupIndex > 0) {
    const start = groupIndex * VISIBLE_N + 1;
    const end = Math.min((groupIndex + 1) * VISIBLE_N, PARTNERS.length);
    $wrap.append(`
      <div class="table-divider">
        <span class="table-divider-label">Continued</span>
        <div class="table-divider-line"></div>
        <span class="table-divider-badge">👥 Partners ${start}–${end}</span>
        <div class="table-divider-line"></div>
      </div>
    `);
  }

  const $table = $('<table class="sched-table"></table>');

  // Column widths
  const $colgroup = $('<colgroup></colgroup>');
  $colgroup.append(`<col style="width:var(--time-w);min-width:var(--time-w);max-width:var(--time-w)">`);
  partners.forEach(() => $colgroup.append(`<col style="width:var(--col-w); min-width:var(--col-w); max-width:var(--col-w)">`));
  $table.append($colgroup);

  const $thead = $('<thead></thead>');
  const $hr = $('<tr></tr>');
  const $tbody = $('<tbody></tbody>');

  // ── HEADER ──
  $hr.append(`
    <th class="th-corner">
      <div class="corner-inner">
        <span class="corner-label">Time Slot</span>
      </div>
    </th>
  `);

  partners.forEach(p => {
    const { total, byStatus } = countBookings(dk, p.id);
    const $th = $(`<th class="th-partner" data-pid="${p.id}"></th>`);

    let pillsHtml = '';
    if (byStatus.available) pillsHtml += `<span class="bpill bpill-avail">✓${byStatus.available}</span>`;
    if (byStatus.pending) pillsHtml += `<span class="bpill bpill-pending">⏳${byStatus.pending}</span>`;
    if (byStatus.issue) pillsHtml += `<span class="bpill bpill-issue">⚠${byStatus.issue}</span>`;

    $th.html(`
      <div class="th-partner-inner">
        <div class="p-top">
          <div class="p-av" style="background:${p.color}18;color:${p.color};border-color:${p.color}40">${initials(p.name)}</div>
          <div>
            <div class="p-name">${p.name}</div>
            <div class="p-role">${p.role}${p.note ? ' • ' + p.note : ''}</div>
          </div>
        </div>
        <div class="booking-pills">${pillsHtml}</div>
      </div>
    `);
    $hr.append($th);
  });

  $thead.append($hr);
  $table.append($thead);

  // ── BODY ──
  TIME_SLOTS.forEach(slot => {
    const $tr = $('<tr></tr>');

    $tr.append(`
      <td class="td-time">
        <div class="time-inner">
          <div class="time-dot"></div>
          <div class="time-badge">${slot}</div>
        </div>
      </td>
    `);

    partners.forEach(p => {
      const task = getTask(dk, p.id, slot);
      const $td = $(`<td data-pid="${p.id}" data-slot="${slot}" data-dk="${dk}"></td>`);

      if (task) {
        $td.append(buildCard(task, p, dk));
      } else {
        $td.append(`
          <div style="height:100%;display:flex;align-items:center;justify-content:center;">
            <div style="width:6px;height:6px;border-radius:50%;background:#E0E0E0;opacity:.6;"></div>
          </div>
        `);
      }
      $tr.append($td);
    });

    $tbody.append($tr);
  });

  $table.append($tbody);
  $wrap.append($table);
  return $wrap;
}

// ═══════════════════════════════════════════════
// MAIN RENDER FUNCTION
// ═══════════════════════════════════════════════

/**
 * Render schedule with multiple tables for all partners
 */
function render() {
  if (PARTNERS.length === 0) {
    showEmpty();
    return;
  }

  const dk = dateKey(currentDate);
  const $container = $('#tables-container').empty();

  // Filter partners by search query
  const filtered = searchQuery ? PARTNERS.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) : PARTNERS;

  if (filtered.length === 0) {
    showEmpty();
    return;
  }

  // Split into groups of VISIBLE_N
  const groups = [];
  for (let i = 0; i < filtered.length; i += VISIBLE_N) {
    groups.push(filtered.slice(i, i + VISIBLE_N));
  }

  groups.forEach((group, index) => {
    $container.append(buildTable(dk, group, index));
  });

  initDragDrop(dk);

  // (Inside your render() function)
  groups.forEach((group, index) => {
    $container.append(buildTable(dk, group, index));
  });

  initDragDrop(dk);
  // (Inside your render() function)
  groups.forEach((group, index) => {
    $container.append(buildTable(dk, group, index));
  });

  initDragDrop(dk);
  initPartnerDragDrop(); // <--- CALL THE NEW FUNCTION HERE
}

/**
 * Show empty state
 */
function showEmpty() {
  $('#tables-container').html(
    `<div style="text-align:center;padding:60px;color:#94A3B8;font-size:14px;font-weight:600;">
      No partners match "<strong style='color:#1A202C'>${searchQuery}</strong>"
    </div>`
  );
}

// ═══════════════════════════════════════════════
// DRAG & DROP
// ═══════════════════════════════════════════════

/**
 * Initialize drag and drop functionality
 */
function initDragDrop(dk) {
  $('.task-card').draggable({
    revert: 'invalid',
    zIndex: 9999,
    opacity: 0.88,
    helper: 'clone',
    cursor: 'grabbing',
    start(e, ui) {
      $(this).css('opacity', 0.35);
    },
    stop(e, ui) {
      $(this).css('opacity', '');
    }
  });

  $('td[data-pid][data-slot]').droppable({
    accept: '.task-card',
    drop(e, ui) {
      const $card = ui.draggable;
      const fromPid = parseInt($card.data('pid'));
      const fromSlot = $card.data('slot');
      const toPid = parseInt($(this).data('pid'));
      const toSlot = $(this).data('slot');

      // Don't drop on same slot
      if (fromPid === toPid && fromSlot === toSlot) return;

      // Check if slot already booked
      if (getTask(dk, toPid, toSlot)) {
        showToast(`Slot already booked for ${PARTNERS.find(p => p.id === toPid)?.name}!`, 'error');
        return;
      }

      const task = getTask(dk, fromPid, fromSlot);
      if (!task) return;

      // Move task
      removeTask(dk, fromPid, fromSlot);
      setTask(dk, toPid, toSlot, { ...task, pid: toPid, slot: toSlot });

      const toName = PARTNERS.find(p => p.id === toPid)?.name || 'Partner';
      showToast(`Moved to ${toName} @ ${toSlot}`, 'success');
      render();
    }
  });
}
/**
 * Initialize drag and drop reordering for Partner columns (Safe Table Method)
 */
function initPartnerDragDrop() {
  // Prevent reordering while searching
  if (searchQuery) return;

  // 1. Make the partner headers draggable
  $('.th-partner').draggable({
    revert: 'invalid',
    helper: 'clone',
    axis: 'x', // Lock horizontal
    cursor: 'grabbing',
    zIndex: 9999,
    start: function(e, ui) {
      $(this).css('opacity', 0.4);
      ui.helper.css({
        'box-shadow': '0 16px 32px rgba(21, 101, 192, 0.25)',
        'background': '#ffffff',
        'border': '2px solid #1565C0'
      });
    },
    stop: function(e, ui) {
      $(this).css('opacity', 1);
    }
  });

  // 2. Make the partner headers droppable targets
  $('.th-partner').droppable({
    accept: '.th-partner',
    hoverClass: 'sortable-placeholder-th', // Highlights the column you are hovering over
    drop: function(e, ui) {
      const fromId = parseInt(ui.draggable.data('pid'));
      const toId = parseInt($(this).data('pid'));

      if (fromId === toId) return;

      // Find where they currently sit in the array
      const fromIndex = PARTNERS.findIndex(p => p.id === fromId);
      const toIndex = PARTNERS.findIndex(p => p.id === toId);

      if (fromIndex > -1 && toIndex > -1) {
        // Remove the dragged partner from their old spot
        const [movedPartner] = PARTNERS.splice(fromIndex, 1);
        
        // Insert them into the new spot
        PARTNERS.splice(toIndex, 0, movedPartner);

        showToast('Partner order updated', 'success');
        
        // Instantly redraw the board with the new order
        render(); 
      }
    }
  });
}

// ═══════════════════════════════════════════════
// DRAWER (Task Details)
// ═══════════════════════════════════════════════

/**
 * Open drawer with task details
 */
function openDrawer(task, partner, dk) {
  const sm = STATUS_META[task.status] || STATUS_META.available;
  $('#d-title').text(task.title);

  $('#d-body').html(`
    <div class="dr">
      <div class="dr-label">Partner</div>
      <div class="dr-val" style="display:flex;align-items:center;gap:10px;margin-top:3px">
        <div style="width:33px;height:33px;border-radius:9px;background:${partner.color}18;color:${partner.color};border:2px solid ${partner.color}35;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;flex-shrink:0">${initials(partner.name)}</div>
        <div>
          <div style="font-weight:700;color:#1A202C">${partner.name}</div>
          <div style="font-size:11px;color:#64748B">${partner.role}${partner.note ? ' • ' + partner.note : ''}</div>
        </div>
      </div>
    </div>
    <div class="dr">
      <div class="dr-label">Time Slot</div>
      <div class="dr-val">${task.slot}</div>
    </div>
    <div class="dr">
      <div class="dr-label">Status</div>
      <div class="dr-val">
        <span class="status-badge" style="background:${sm.color}14;color:${sm.color};border:1.5px solid ${sm.color}30">
          <span style="width:7px;height:7px;border-radius:50%;background:${sm.color};flex-shrink:0;display:inline-block"></span>
          ${sm.label}
        </span>
      </div>
    </div>
    <div class="dr">
      <div class="dr-label">Job Details</div>
      <div class="dr-val">${task.detail || '—'}</div>
    </div>
    ${task.phone ? `<div class="dr"><div class="dr-label">Contact</div><div class="dr-val dr-mono">📞 ${task.phone}</div></div>` : ''}
    <div style="margin-top:24px;padding-top:18px;border-top:1px solid #F1F5F9;display:flex;gap:8px;">
      <button onclick="deleteFromDrawer('${dk}',${partner.id},'${task.slot}')"
        style="flex:1;padding:9px;border-radius:9px;background:#FEF2F2;border:1.5px solid #FCA5A5;color:#EF4444;font-weight:700;font-size:13px;cursor:pointer;"
        onmouseover="this.style.background='#FEE2E2'" onmouseout="this.style.background='#FEF2F2'">
        Delete Booking
      </button>
    </div>
  `);

  $('#dov').addClass('open');
}

/**
 * Close drawer
 */
function closeDrawer() {
  $('#dov').removeClass('open');
}

/**
 * Delete task from drawer
 */
function deleteFromDrawer(dk, pid, slot) {
  removeTask(dk, pid, slot);
  closeDrawer();
  showToast('Booking removed', 'success');
  render();
}

// ═══════════════════════════════════════════════
// DATE NAVIGATION
// ═══════════════════════════════════════════════

/**
 * Change date by delta days
 */
function changeDate(delta) {
  currentDate = new Date(currentDate);
  currentDate.setDate(currentDate.getDate() + delta);
  updateTopbarDate();
  render();
}

/**
 * Go to today
 */
function goToday() {
  currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  updateTopbarDate();
  render();
}

// ═══════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════

let toastTimer;

/**
 * Show toast notification
 */
function showToast(msg, type = 'info') {
  clearTimeout(toastTimer);
  $('#toast').text(msg).removeClass('success error info').addClass(type + ' show');
  toastTimer = setTimeout(() => $('#toast').removeClass('show'), 2800);
}

// ═══════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════

$(function () {
  // Date navigation
  $('#btn-prev').on('click', () => changeDate(-1));
  $('#btn-next').on('click', () => changeDate(1));

  // --- NEW: CALENDAR PICKER LOGIC ---
  $('#calendar-picker').datepicker({
    dateFormat: 'yy-mm-dd',
    onSelect: function(dateText) {
      // When a user picks a date, update the current date and re-render
      currentDate = new Date(dateText + 'T00:00:00'); // Prevent timezone jumping
      currentDate.setHours(0, 0, 0, 0);
      updateTopbarDate();
      render();
    }
  });

  // Open calendar when clicking the date area
  $('#date-btn').on('click', function () {
    $('#calendar-picker').datepicker('show');
  });

 // --- NEW: EDITABLE PERCENTAGE ZOOM LOGIC ---
  $('#zoom-slider').on('input', function () {
    const zoomPercent = $(this).val();
    const zoomFactor = zoomPercent / 100; // Converts 85% to 0.85
    
    // 1. Update the text label next to the slider
    $('#zoom-label').text(zoomPercent + '%');

    // 2. Dynamically calculate and update the column widths
    // Note: Assuming your default column is 280px and time column is 80px. 
    // Change these two numbers if your default CSS sizes are different!
    const baseColWidth = 280; 
    const baseTimeWidth = 80;

    document.documentElement.style.setProperty('--col-w', (baseColWidth * zoomFactor) + 'px');
    document.documentElement.style.setProperty('--time-w', (baseTimeWidth * zoomFactor) + 'px');
    
    // 3. Set a global zoom variable so we can scale text/padding in CSS
    document.documentElement.style.setProperty('--zoom-factor', zoomFactor);
  });

  // Update topbar on page load
  updateTopbarDate();

  // Search functionality
  $('#partner-search').on('input', function () {
    searchQuery = $(this).val().trim();
    if (searchQuery) {
      $('#search-clear').addClass('visible');
    } else {
      $('#search-clear').removeClass('visible');
    }
    render();
  });

  // Clear search button
  $('#search-clear').on('click', function () {
    $('#partner-search').val('');
    searchQuery = '';
    $(this).removeClass('visible');
    render();
    $('#partner-search').focus();
  });

  // Load sample data and render
  loadSampleData();
  render();
});

// ═══════════════════════════════════════════════
// SAMPLE DATA LOADER
// ═══════════════════════════════════════════════

/**
 * Load sample jobs data for demo
 */
function loadSampleData() {
  const today = dateKey(currentDate);

  // Add jobs to today
  const jobIndices = [0, 1, 2, 3, 4];
  jobIndices.forEach((jobIdx, pIdx) => {
    const partnerIdx = pIdx % PARTNERS.length;
    const partner = PARTNERS[partnerIdx];
    const slot = TIME_SLOTS[pIdx % TIME_SLOTS.length];
    const job = JOBS[jobIdx];
    
    // Create task with partner assignment
    const task = {
      ...job,
      pid: partner.id,  // Explicitly set partner ID
      slot: slot,
      partnerId: partner.id  // Double ensure partner ID
    };
    
    setTask(today, partner.id, slot, task);
  });

  // Add jobs for tomorrow
  const tomorrow = new Date(currentDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = dateKey(tomorrow);

  jobIndices.forEach((jobIdx, pIdx) => {
    const partnerIdx = (pIdx + 1) % PARTNERS.length;
    const partner = PARTNERS[partnerIdx];
    const slot = TIME_SLOTS[(pIdx + 1) % TIME_SLOTS.length];
    const jobIdx2 = (jobIdx + 2) % JOBS.length;
    const job = JOBS[jobIdx2];
    
    // Create task with partner assignment
    const task = {
      ...job,
      pid: partner.id,  // Explicitly set partner ID
      slot: slot,
      partnerId: partner.id  // Double ensure partner ID
    };
    
    setTask(tomorrowKey, partner.id, slot, task);
  });

  showToast('✓ Demo data loaded', 'success');
}