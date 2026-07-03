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
            <div class="gh-contrib-calendar">
                <img id="gh-contrib-img" src="https://ghchart.rshah.org/3b82f6/shironxiao" alt="shironxiao's GitHub Contributions Calendar">
            </div>
        </div>

        ${languages.length > 0 ? '<hr style="border: 0; border-top: 1px solid var(--border); margin: 2rem 0;">' : ''}

        ${languagesHTML}
        ${fallbackNotice}
    `;

    container.innerHTML = html;
}

window.switchContribYear = function(year, btn) {
    document.querySelectorAll('.gh-year-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const img = document.getElementById('gh-contrib-img');
    if (img) {
        if (year === 'last') {
            img.src = `https://ghchart.rshah.org/3b82f6/shironxiao`;
        } else {
            img.src = `https://ghchart.rshah.org/3b82f6/${year}shironxiao`;
        }
    }
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
