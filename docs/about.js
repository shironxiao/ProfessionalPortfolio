document.addEventListener('DOMContentLoaded', () => {
    fetchGitHubData();
});

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
        renderGitHubSection(profile, languages);

    } catch (error) {
        console.error('GitHub Fetch Error:', error);
        container.innerHTML = `
            <div style="text-align: center; color: var(--muted-text); padding: 2rem;">
                <p>Failed to load GitHub data.</p>
                <p style="font-size: 0.8rem;">${error.message}</p>
                <button class="btn btn-color-2" onclick="location.reload()" style="margin-top:1rem;">Retry</button>
            </div>
        `;
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

function renderGitHubSection(profile, languages) {
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
                     <button class="btn btn-color-2" onclick="window.open('${profile.html_url}', '_blank')">
                        Visit GitHub Profile
                     </button>
                </div>
            </div>
        </div>
        
        ${languages.length > 0 ? '<hr style="border: 0; border-top: 1px solid var(--border); margin: 2rem 0;">' : ''}
        
        ${languagesHTML}
    `;

    container.innerHTML = html;
}

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
