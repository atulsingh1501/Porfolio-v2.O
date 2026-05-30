document.addEventListener('DOMContentLoaded', () => {

  // ---- Smooth Scrolling ----
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id && id !== '#') {
        e.preventDefault();
        const el = document.querySelector(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ---- Active Nav Highlight ----
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navAnchors.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => observer.observe(s));

  // ---- Mobile Nav ----
  const menuBtn = document.getElementById('mobile-menu-btn');
  const overlay = document.getElementById('mobile-nav-overlay');
  const closeBtn = document.getElementById('close-mobile-nav');

  menuBtn?.addEventListener('click', () => overlay?.classList.add('active'));
  closeBtn?.addEventListener('click', () => overlay?.classList.remove('active'));
  overlay?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => overlay.classList.remove('active'));
  });

  // ---- Achievements accordion ----
  window.toggleExp = function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('open');
  };

  // ---- LeetCode Stats ----
  async function fetchLeetCode() {
    try {
      const res = await fetch('https://alfa-leetcode-api.onrender.com/Atulya_15/solved');
      const data = await res.json();
      if (data && data.solvedProblem !== undefined) {
        document.getElementById('leetcode-total').innerText = data.solvedProblem;
        document.getElementById('leetcode-easy-count').innerText = data.easySolved;
        document.getElementById('leetcode-medium-count').innerText = data.mediumSolved;
        document.getElementById('leetcode-hard-count').innerText = data.hardSolved;
        const total = data.solvedProblem || 1;
        document.getElementById('leetcode-easy-bar').style.width = `${(data.easySolved / total) * 100}%`;
        document.getElementById('leetcode-medium-bar').style.width = `${(data.mediumSolved / total) * 100}%`;
        document.getElementById('leetcode-hard-bar').style.width = `${(data.hardSolved / total) * 100}%`;
      } else {
        document.getElementById('leetcode-total').innerText = '250+';
      }
    } catch {
      document.getElementById('leetcode-total').innerText = '250+';
    }
  }
  fetchLeetCode();

  // ---- GitHub Contributions ----
  async function fetchGitHub() {
    try {
      const res = await fetch('https://github-contributions-api.jogruber.de/v4/atulsingh1501');
      const data = await res.json();
      if (!data.contributions) return;

      const contribMap = new Map();
      data.contributions.forEach(c => contribMap.set(c.date, c.count));

      const fmt = d => {
        const off = d.getTimezoneOffset();
        return new Date(d.getTime() - off * 60000).toISOString().split('T')[0];
      };

      let d = new Date(), streak = 0, dateStr = fmt(d);
      if (!contribMap.get(dateStr)) { d.setDate(d.getDate() - 1); dateStr = fmt(d); }
      while ((contribMap.get(dateStr) || 0) > 0) {
        streak++;
        d.setDate(d.getDate() - 1);
        dateStr = fmt(d);
      }

      let totalContribs = data.total
        ? Object.values(data.total).reduce((a, v) => a + v, 0)
        : data.contributions.reduce((a, c) => a + c.count, 0);

      const streakEl = document.getElementById('github-streak');
      if (streakEl) {
        streakEl.innerHTML = `<span style="color:var(--fg-muted)">Total: <strong style="color:var(--fg)">${totalContribs}</strong></span> &nbsp;|&nbsp; Streak: <strong style="color:var(--accent)">${streak}</strong>`;
      }

      // Build calendar
      const calendarEl = document.querySelector('.calendar');
      if (!calendarEl) return;
      calendarEl.innerHTML = '<div class="calendar-main-wrapper"><div class="year-selector" id="year-selector"></div><div class="calendar-grid-wrapper" id="graph-content"></div></div>';

      const allContribs = data.contributions;
      const yearsSet = new Set(allContribs.map(c => new Date(c.date).getFullYear()));
      const years = Array.from(yearsSet).sort();
      let activeYear = years[years.length - 1];

      const yearSelector = document.getElementById('year-selector');
      const graphContent = document.getElementById('graph-content');

      const renderYear = (yr) => {
        activeYear = yr;

        // --- Compute responsive cell size BEFORE building DOM ---
        const wrap = document.querySelector('.github-cal-wrap');
        const containerW = wrap ? wrap.clientWidth - 2 : 300;
        const weeksInYear = 53; // max weeks per year
        const gap = 2;
        // cellSize = (available width - gaps) / number of weeks
        const cellSize = Math.max(5, Math.floor((containerW - (weeksInYear * gap)) / weeksInYear));
        const fontSize = Math.max(8, cellSize - 2);

        // Render year tabs
        yearSelector.innerHTML = '';
        years.forEach(y => {
          const btn = document.createElement('button');
          btn.innerText = y;
          btn.style.cssText = `background:${y === yr ? 'rgba(0,199,88,0.15)' : 'transparent'};color:${y === yr ? 'var(--accent)' : 'var(--fg-muted)'};border:1px solid ${y === yr ? 'var(--accent)' : 'var(--border)'};border-radius:99px;padding:4px 12px;font-size:0.72rem;cursor:pointer;font-family:var(--font-body)`;
          btn.onclick = () => renderYear(y);
          yearSelector.appendChild(btn);
        });
        yearSelector.style.cssText = 'display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap';

        // Render graph
        graphContent.innerHTML = '';
        const yearData = allContribs.filter(c => new Date(c.date).getFullYear() === yr);

        // Group into weeks
        const weeks = [];
        let week = [];
        yearData.forEach((c, i) => {
          week.push(c);
          if (new Date(c.date).getDay() === 6 || i === yearData.length - 1) {
            weeks.push(week); week = [];
          }
        });

        // Months header
        const monthsHeader = document.createElement('div');
        monthsHeader.style.cssText = `display:flex;gap:${gap}px;margin-bottom:4px;height:${fontSize + 2}px;font-size:${fontSize}px;color:var(--fg-muted);`;

        // Calendar body
        const calBody = document.createElement('div');
        calBody.className = 'calendar-body';

        let lastMonth = -1;
        weeks.forEach(w => {
          const firstDay = new Date(w[0].date);
          const mon = firstDay.getMonth();
          const slot = document.createElement('div');
          slot.style.cssText = `width:${cellSize}px;flex-shrink:0;position:relative;`;
          if (mon !== lastMonth) {
            const lbl = document.createElement('span');
            lbl.innerText = firstDay.toLocaleString('default', { month: 'short' });
            lbl.style.cssText = `position:absolute;white-space:nowrap;font-size:${fontSize}px;`;
            slot.appendChild(lbl);
            lastMonth = mon;
          }
          monthsHeader.appendChild(slot);

          const col = document.createElement('div');
          col.style.cssText = `display:flex;flex-direction:column;gap:${gap}px;flex-shrink:0;`;
          w.forEach(day => {
            const cell = document.createElement('div');
            cell.className = 'graph-day';
            let lv = 0;
            if (day.count > 0) lv = 1;
            if (day.count >= 3) lv = 2;
            if (day.count >= 6) lv = 3;
            if (day.count >= 10) lv = 4;
            cell.setAttribute('data-level', lv);
            cell.style.cssText = `width:${cellSize}px;height:${cellSize}px;border-radius:${Math.max(1, Math.floor(cellSize / 5))}px;flex-shrink:0;`;
            cell.title = `${day.date}: ${day.count}`;
            col.appendChild(cell);
          });
          calBody.appendChild(col);
        });

        calBody.style.cssText = `display:flex;gap:${gap}px;overflow:visible;`;
        graphContent.style.cssText = `overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;`;
        graphContent.appendChild(monthsHeader);
        graphContent.appendChild(calBody);

        // Reset any previous scale/height overrides
        const calWrap = document.querySelector('.calendar-main-wrapper');
        if (calWrap) { calWrap.style.transform = ''; }
        if (wrap) { wrap.style.height = ''; }
      };

      // Re-render on resize (recalculates cell size for new viewport)
      if (window._calResizeHandler) window.removeEventListener('resize', window._calResizeHandler);
      window._calResizeHandler = () => renderYear(activeYear);
      window.addEventListener('resize', window._calResizeHandler);

      renderYear(activeYear);

    } catch (err) {
      console.error('GitHub fetch failed:', err);
      const c = document.querySelector('.calendar');
      if (c) c.innerText = 'Unable to load contributions.';
    }
  }
  fetchGitHub();

});
