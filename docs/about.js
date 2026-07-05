document.addEventListener('DOMContentLoaded', () => {
    fetchGitHubData();
});

// Fallback data so the page always renders, even when GitHub API is rate-limited
const FALLBACK_PROFILE = {
    login: 'shironxiao',
    name: 'Ronald Sevilla',
    avatar_url: 'https://avatars.githubusercontent.com/u/171462414?v=4',
    bio: 'Full Stack Developer | IT Student',
    html_url: 'https://github.com/shironxiao',
    public_repos: 5,
    followers: 0,
    following: 0,
    created_at: '2024-07-01T00:00:00Z'
};

const FALLBACK_LANGUAGES = [
    { name: 'HTML', count: 4, percentage: '36.4' },
    { name: 'CSS', count: 3, percentage: '27.3' },
    { name: 'JavaScript', count: 2, percentage: '18.2' },
    { name: 'PHP', count: 1, percentage: '9.1' },
    { name: 'Java', count: 1, percentage: '9.1' }
];

async function fetchGitHubData() {
    const container = document.getElementById('github-content');
    const username = 'shironxiao';

    try {
        const [profileRes, reposRes] = await Promise.all([
            fetch(`https://api.github.com/users/${username}`),
            fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`)
        ]);

        if (!profileRes.ok) throw new Error('Failed to fetch profile data');
        const profile = await profileRes.json();

        let repos = [];
        if (reposRes.ok) {
            repos = await reposRes.json();
        }

        const languages = calculateTopLanguages(repos);
        renderGitHubSection(profile, languages, false);

    } catch (error) {
        console.warn('GitHub API unavailable, using fallback data:', error.message);
        renderGitHubSection(FALLBACK_PROFILE, FALLBACK_LANGUAGES, true);
    }
}

function calculateTopLanguages(repos) {
    const langCount = {};
    let total = 0;

    repos.forEach(repo => {
        if (repo.language) {
            langCount[repo.language] = (langCount[repo.language] || 0) + 1;
            total++;
        }
    });

    const langArray = Object.keys(langCount).map(lang => ({
        name: lang,
        count: langCount[lang],
        percentage: ((langCount[lang] / total) * 100).toFixed(1)
    })).sort((a, b) => b.count - a.count);

    return langArray.slice(0, 5);
}

function renderGitHubSection(profile, languages, isFallback) {
    const container = document.getElementById('github-content');

    const joinedDate = new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
    });

    let languagesHTML = '';
    if (languages.length > 0) {
        languagesHTML = `
            <div class="gh-languages">
                <h3>Top Languages</h3>
                <div class="lang-bars">
                    ${languages.map(lang => `
                        <div class="lang-item">
                            <div class="lang-info">
                                <span class="lang-name">${lang.name}</span>
                                <span class="lang-percent">${lang.percentage}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${lang.percentage}%; background-color: ${getLanguageColor(lang.name)}"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    const fallbackNotice = isFallback
        ? `<p style="font-size: 0.75rem; color: var(--muted-text); text-align: center; margin-top: 1.5rem; opacity: 0.7;">
             <i class="fas fa-info-circle"></i> Showing cached data &mdash; live stats update when available.
           </p>`
        : '';

    const createdYear = new Date(profile.created_at || '2024-07-01').getFullYear();
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= createdYear; y--) {
        years.push(y);
    }

    const html = `
        <div class="github-profile-header">
            <div class="gh-avatar-wrapper">
                <img src="${profile.avatar_url}" alt="${profile.login}" class="gh-avatar">
            </div>
            <div class="gh-profile-info">
                <h3>${profile.name || profile.login}</h3>
                <p class="gh-bio">${profile.bio || 'Developer'}</p>

                <div class="gh-details">
                    <span><i class="fas fa-calendar-alt"></i> Joined ${joinedDate}</span>
                </div>

                <div class="gh-stats">
                    <div class="stat-box">
                        <span class="stat-value">${profile.public_repos}</span>
                        <span class="stat-label">Repositories</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value">${profile.followers}</span>
                        <span class="stat-label">Followers</span>
                    </div>
                     <div class="stat-box">
                        <span class="stat-value">${profile.following}</span>
                        <span class="stat-label">Following</span>
                    </div>
                </div>

                <div class="gh-actions">
                     <a href="${profile.html_url}" target="_blank" class="btn btn-color-2 gh-visit-btn">
                        <i class="fab fa-github"></i> Visit GitHub Profile
                     </a>
                </div>
            </div>
        </div>

        <hr style="border: 0; border-top: 1px solid var(--border); margin: 2rem 0;">

        <div class="gh-contributions">
            <div class="gh-contrib-header">
                <h3>GitHub Contributions</h3>
                <div class="gh-year-buttons">
                    <button class="gh-year-btn active" onclick="switchContribYear('last', this)">Last Year</button>
                    ${years.map(y => `<button class="gh-year-btn" onclick="switchContribYear('${y}', this)">${y}</button>`).join('')}
                </div>
            </div>
            <div class="gh-contrib-calendar" id="gh-contrib-calendar">
                <div class="gh-contrib-loading"><i class="fas fa-spinner fa-spin"></i> Loading contributions...</div>
            </div>
        </div>

        ${languages.length > 0 ? '<hr style="border: 0; border-top: 1px solid var(--border); margin: 2rem 0;">' : ''}

        ${languagesHTML}
        ${fallbackNotice}
    `;

    container.innerHTML = html;

    // Load the default "last year" calendar after rendering
    loadContribCalendar('last');
}

// Fetch contribution data and render the grid
async function loadContribCalendar(year) {
    const calendarEl = document.getElementById('gh-contrib-calendar');
    if (!calendarEl) return;

    calendarEl.innerHTML = `<div class="gh-contrib-loading"><i class="fas fa-spinner fa-spin"></i> Loading contributions...</div>`;

    const username = 'shironxiao';
    const url = year === 'last'
        ? `https://github-contributions-api.jogruber.de/v4/${username}?y=last`
        : `https://github-contributions-api.jogruber.de/v4/${username}?y=${year}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('API error');
        const data = await res.json();

        // data.contributions is an array of { date, count, level }
        calendarEl.innerHTML = renderContribGrid(data.contributions, data.total, year);
    } catch (e) {
        calendarEl.innerHTML = `<p style="text-align:center; color: var(--muted-text); padding: 2rem;">Unable to load contribution data.</p>`;
    }
}

// Build the GitHub-style contribution grid
function renderContribGrid(contributions, totals, year) {
    if (!contributions || contributions.length === 0) {
        return `<p style="text-align:center; color: var(--muted-text); padding: 2rem;">No contribution data available.</p>`;
    }

    // Get total for selected year
    const totalCount = year === 'last'
        ? (totals && totals['lastYear'] !== undefined ? totals['lastYear'] : contributions.reduce((s, d) => s + d.count, 0))
        : (totals && totals[year] !== undefined ? totals[year] : contributions.reduce((s, d) => s + d.count, 0));

    // Group by week (Sunday-start columns)
    const weeks = [];
    let week = [];

    // Pad the first week with empty days if it doesn't start on Sunday
    const firstDay = new Date(contributions[0].date);
    const startPad = firstDay.getDay(); // 0=Sun, 1=Mon...
    for (let p = 0; p < startPad; p++) {
        week.push(null);
    }

    contributions.forEach(day => {
        week.push(day);
        if (week.length === 7) {
            weeks.push(week);
            week = [];
        }
    });
    if (week.length > 0) {
        weeks.push(week);
    }

    // Month labels
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthLabels = [];
    let lastMonth = -1;
    weeks.forEach((w, wi) => {
        const firstReal = w.find(d => d !== null);
        if (firstReal) {
            const m = new Date(firstReal.date).getMonth();
            if (m !== lastMonth) {
                monthLabels.push({ col: wi, label: monthNames[m] });
                lastMonth = m;
            }
        }
    });

    // Contribution level colors (matching GitHub's green palette)
    const levelColors = [
        'var(--contrib-0)',
        'var(--contrib-1)',
        'var(--contrib-2)',
        'var(--contrib-3)',
        'var(--contrib-4)'
    ];

    // Build the SVG-style grid as HTML
    const cellSize = 11;
    const gap = 3;
    const totalCols = weeks.length;
    const gridWidth = totalCols * (cellSize + gap);
    const gridHeight = 7 * (cellSize + gap);
    const labelH = 18;

    // Month label row
    let monthHTML = `<div class="gh-month-labels" style="width:${gridWidth}px">`;
    monthLabels.forEach(ml => {
        const leftPos = ml.col * (cellSize + gap);
        monthHTML += `<span style="left:${leftPos}px">${ml.label}</span>`;
    });
    monthHTML += `</div>`;

    // Day grid
    let gridHTML = `<div class="gh-grid" style="width:${gridWidth}px; height:${gridHeight}px;">`;
    weeks.forEach(w => {
        gridHTML += `<div class="gh-col">`;
        w.forEach(day => {
            if (day === null) {
                gridHTML += `<div class="gh-cell gh-cell-empty"></div>`;
            } else {
                const color = levelColors[day.level] || levelColors[0];
                const tooltip = `${day.count} contribution${day.count !== 1 ? 's' : ''} on ${day.date}`;
                gridHTML += `<div class="gh-cell" style="background:${color}" title="${tooltip}" data-date="${day.date}" data-count="${day.count}"></div>`;
            }
        });
        gridHTML += `</div>`;
    });
    gridHTML += `</div>`;

    // Day of week labels
    const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    let dayLabelHTML = `<div class="gh-day-labels">`;
    dayLabels.forEach((d, i) => {
        // Only show Mon, Wed, Fri to match GitHub style
        const visible = [1, 3, 5].includes(i);
        dayLabelHTML += `<span style="opacity:${visible ? 1 : 0}">${d}</span>`;
    });
    dayLabelHTML += `</div>`;

    const labelYear = year === 'last' ? 'the last year' : year;

    return `
        <div class="gh-contrib-total">${totalCount.toLocaleString()} contributions in ${labelYear}</div>
        <div class="gh-contrib-wrapper">
            ${dayLabelHTML}
            <div class="gh-contrib-right">
                ${monthHTML}
                ${gridHTML}
            </div>
        </div>
        <div class="gh-contrib-legend">
            <span>Less</span>
            <div class="gh-cell" style="background:var(--contrib-0)"></div>
            <div class="gh-cell" style="background:var(--contrib-1)"></div>
            <div class="gh-cell" style="background:var(--contrib-2)"></div>
            <div class="gh-cell" style="background:var(--contrib-3)"></div>
            <div class="gh-cell" style="background:var(--contrib-4)"></div>
            <span>More</span>
        </div>
    `;
}

window.switchContribYear = function(year, btn) {
    document.querySelectorAll('.gh-year-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    loadContribCalendar(year);
};

function getLanguageColor(language) {
    const colors = {
        'JavaScript': '#f1e05a',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'Python': '#3572A5',
        'Java': '#b07219',
        'TypeScript': '#2b7489',
        'C#': '#178600',
        'C++': '#f34b7d',
        'PHP': '#4F5D95',
        'Ruby': '#701516'
    };
    return colors[language] || 'var(--accent)';
}
