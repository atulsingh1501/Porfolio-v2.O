document.addEventListener('DOMContentLoaded', () => {
    // --- Static Metrics (No JS Required) ---
    // The stats section is now fully static HTML for instant loading and reliability.
    // Dynamic fetchers have been removed to prevent 'Loading...' states.

    // --- Smooth Scrolling for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // --- Active Navigation Link Highlighting ---
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // --- LeetCode Stats (Real-time) ---
    async function fetchLeetCodeStats() {
        try {
            const username = "Atulya_15";
            const response = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);
            const data = await response.json();

            if (data.status === "success") {
                document.getElementById('leetcode-total').innerText = data.totalSolved;

                // Update text counts
                document.getElementById('leetcode-easy-count').innerText = data.easySolved;
                document.getElementById('leetcode-medium-count').innerText = data.mediumSolved;
                document.getElementById('leetcode-hard-count').innerText = data.hardSolved;

                // Update bars (Normalize widths based on total solved or fixed max)
                // Using percentage of total solved for relative distribution
                const total = data.totalSolved;
                document.getElementById('leetcode-easy-bar').style.width = `${(data.easySolved / total) * 100}%`;
                document.getElementById('leetcode-medium-bar').style.width = `${(data.mediumSolved / total) * 100}%`;
                document.getElementById('leetcode-hard-bar').style.width = `${(data.hardSolved / total) * 100}%`;
            } else {
                document.getElementById('leetcode-total').innerText = "250+"; // Fallback static
            }
        } catch (error) {
            console.error("LeetCode fetch failed:", error);
            document.getElementById('leetcode-total').innerText = "250+"; // Fallback static
        }
    }
    fetchLeetCodeStats();

    // --- GitHub Streak (Real-time) ---
    async function fetchGitHubStreak() {
        try {
            const username = "atulsingh1501";
            // Using a public API proxy for contributions (cors-enabled)
            const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}`);
            const data = await response.json();

            if (data.contributions) {
                const contribMap = new Map();
                data.contributions.forEach(c => contribMap.set(c.date, c.count));

                const formatDate = (date) => {
                    const offset = date.getTimezoneOffset();
                    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                    return localDate.toISOString().split('T')[0];
                };

                let d = new Date();
                let streak = 0;
                let dateStr = formatDate(d);

                // If today has 0, check yesterday (streak is preserved if missed today but active yesterday)
                if (!contribMap.has(dateStr) || contribMap.get(dateStr) === 0) {
                    d.setDate(d.getDate() - 1);
                    dateStr = formatDate(d);
                }

                while (contribMap.get(dateStr) > 0) {
                    streak++;
                    d.setDate(d.getDate() - 1);
                    dateStr = formatDate(d);
                }

                const streakEl = document.getElementById('github-streak');
                // Calculate Total Contributions for all years
                let totalContribs = 0;
                if (data.total) {
                    Object.values(data.total).forEach(val => totalContribs += val);
                } else {
                    // Fallback if total object isn't as expected, sum array
                    totalContribs = data.contributions.reduce((acc, curr) => acc + curr.count, 0);
                }

                if (streakEl) {
                    streakEl.innerHTML = `<span style="font-weight: 500; font-size: 0.85rem; color: var(--text-secondary);">Total: <span style="color: var(--text-primary);">${totalContribs}</span></span> &nbsp;|&nbsp; Streak: <div class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--success-color); border: 1px solid rgba(16, 185, 129, 0.2); margin-left: 4px;"><span class="live-dot"></span> ${streak}</div>`;
                }

                // --- Year Filtering Logic ---
                const graphContainer = document.getElementById('graph-weeks');
                // Note: The graph container usually exists inside .calendar div. We need to make sure basic structure exists.
                // The structure is usually injected by the HTML replace we did? No, the HTML has <div class="calendar">Loading...</div>
                // So we need to inject the skeleton first.

                const calendarEl = document.querySelector(".calendar");
                if (calendarEl) {
                    calendarEl.innerHTML = '<div class="custom-calendar"><div class="graph-weeks" id="graph-weeks"></div><div class="graph-footer"><span>Learn how we count contributions</span><div style="display:flex; gap:3px; align-items: center"><span>Less</span><div style="display:flex; gap:3px;"><span class="graph-day" data-level="0"></span><span class="graph-day" data-level="1"></span><span class="graph-day" data-level="2"></span><span class="graph-day" data-level="3"></span><span class="graph-day" data-level="4"></span></div><span>More</span></div></div></div>';
                }

                const graphContainerRecheck = document.getElementById('graph-weeks');

                if (graphContainerRecheck) {
                    graphContainerRecheck.innerHTML = '';

                    // 1. Create Layout Structure
                    const mainWrapper = document.createElement('div');
                    mainWrapper.className = 'calendar-main-wrapper';

                    // Year Selector (Tabs)
                    const yearSelector = document.createElement('div');
                    yearSelector.className = 'year-selector';
                    mainWrapper.appendChild(yearSelector);

                    // Graph Wrapper (Content)
                    const graphContent = document.createElement('div');
                    graphContent.className = 'calendar-grid-wrapper';
                    mainWrapper.appendChild(graphContent);

                    graphContainerRecheck.appendChild(mainWrapper);

                    const allContribs = data.contributions;

                    // Identify available years
                    const yearsSet = new Set();
                    allContribs.forEach(d => yearsSet.add(new Date(d.date).getFullYear()));
                    const years = Array.from(yearsSet).sort((a, b) => a - b); // Ascending

                    let activeYear = years[years.length - 1]; // Default to latest

                    // Function to render graph for a specific year
                    const renderYear = (targetYear) => {
                        graphContent.innerHTML = ''; // Clear previous

                        // Filter data
                        const yearData = allContribs.filter(d => new Date(d.date).getFullYear() === targetYear);
                        const yearTotal = yearData.reduce((acc, curr) => acc + curr.count, 0);

                        // Update Year Total display if needed
                        if (streakEl) {
                            streakEl.innerHTML = `<span style="font-weight: 500; font-size: 0.85rem; color: var(--text-secondary);">${targetYear}: <span style="color: var(--text-primary);">${yearTotal}</span></span> &nbsp;|&nbsp; Streak: <div class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--success-color); border: 1px solid rgba(16, 185, 129, 0.2); margin-left: 4px;"><span class="live-dot"></span> ${streak}</div>`;
                        }

                        // --- Render Tabs ---
                        yearSelector.innerHTML = '';
                        years.forEach(y => {
                            const btn = document.createElement('button');
                            btn.className = `year-btn ${y === targetYear ? 'active' : ''}`;
                            btn.innerText = y;
                            btn.onclick = () => renderYear(y);
                            yearSelector.appendChild(btn);
                        });

                        // --- Render Graph ---
                        // 1. Months Header
                        const monthsHeader = document.createElement('div');
                        monthsHeader.className = 'months-header';
                        monthsHeader.style.display = 'flex';
                        monthsHeader.style.gap = '3px';
                        monthsHeader.style.marginBottom = '4px';
                        monthsHeader.style.height = '15px'; // Ensure height for labels
                        monthsHeader.style.fontSize = '0.75rem';
                        monthsHeader.style.color = 'var(--text-secondary)';

                        // 2. Main Body (Grid)
                        const calendarBody = document.createElement('div');
                        calendarBody.className = 'calendar-body';

                        // Group by weeks
                        const weeks = [];
                        let currentWeek = [];
                        yearData.forEach((d, i) => {
                            currentWeek.push(d);
                            if (new Date(d.date).getDay() === 6 || i === yearData.length - 1) {
                                weeks.push(currentWeek);
                                currentWeek = [];
                            }
                        });

                        // Render Months and Weeks
                        let lastMonth = -1;

                        weeks.forEach((week, index) => {
                            // Month Label Logic
                            const firstDayOfWeek = new Date(week[0].date);
                            const monthIndex = firstDayOfWeek.getMonth();
                            const monthName = firstDayOfWeek.toLocaleString('default', { month: 'short' });

                            const monthLabelSlot = document.createElement('div');
                            monthLabelSlot.style.width = '10px'; // Match week column width
                            monthLabelSlot.style.textAlign = 'left';
                            monthLabelSlot.style.position = 'relative';
                            monthLabelSlot.style.flexShrink = '0'; // Prevent shrinking

                            // Only show label if month changed and we have enough space (e.g. at least 2 weeks till next label or end)
                            if (monthIndex !== lastMonth) {
                                const label = document.createElement('span');
                                label.innerText = monthName;
                                label.style.position = 'absolute'; // Overflow to right
                                monthLabelSlot.appendChild(label);
                                lastMonth = monthIndex;
                            }

                            monthsHeader.appendChild(monthLabelSlot);

                            // Week Column Render
                            const weekCol = document.createElement('div');
                            weekCol.style.display = 'flex';
                            weekCol.style.flexDirection = 'column';
                            weekCol.style.gap = '3px';
                            weekCol.style.flexShrink = '0'; // Prevent shrinking

                            week.forEach(day => {
                                const dayEl = document.createElement('div');
                                dayEl.className = 'graph-day';
                                dayEl.style.width = '10px';
                                dayEl.style.height = '10px';
                                dayEl.style.borderRadius = '2px';

                                // Level Logic
                                let level = 0;
                                if (day.count > 0) level = 1;
                                if (day.count >= 3) level = 2;
                                if (day.count >= 6) level = 3;
                                if (day.count >= 10) level = 4;

                                dayEl.setAttribute('data-level', level);
                                dayEl.title = `${day.date}: ${day.count} contributions`;
                                weekCol.appendChild(dayEl);
                            });
                            calendarBody.appendChild(weekCol);
                        });

                        calendarBody.style.display = 'flex';
                        calendarBody.style.gap = '3px';

                        graphContent.appendChild(monthsHeader);
                        graphContent.appendChild(calendarBody);
                    };

                    renderYear(activeYear);
                }
            }
        } catch (error) {
            console.error("GitHub fetch failed:", error);
            const calendarEl = document.querySelector(".calendar");
            if (calendarEl) calendarEl.innerText = "Unable to load contributions.";
        }
    }
    fetchGitHubStreak();

    // --- Sidebar Toggle for Mobile ---
    const sidebar = document.querySelector('.sidebar');
    // Add a toggle button logic here if you add a burger menu later
});
