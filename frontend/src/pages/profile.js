import { escapeHtml, $ } from '../utils.js';

let currentUserId = null;

const CAT_LABELS = {
    wifi: 'WiFi Discoveries', bluetooth: 'Bluetooth', cell: 'Cell Towers',
    upload: 'Uploads', xp: 'Experience', level: 'Level Milestones', special: 'Special',
};

const CAT_ICONS = {
    wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>',
    bluetooth: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11"/></svg>',
    cell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 20V4"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    xp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    level: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 15l-3 3 1.5 1.5L12 18l1.5 1.5L15 18l-3-3z"/><path d="M18 6l-3-3-3 3-3-3-3 3 6 6 6-6z"/><path d="M6 6v6l6 6 6-6V6"/></svg>',
    special: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
};

export function setProfileUser(userId) {
    currentUserId = userId;
}

export async function loadProfile() {
    const root = $('profilePageContent');
    if (!root || !currentUserId) {
        if (root) root.innerHTML = '<div class="rpg-empty">User not found</div>';
        return;
    }

    try {
        const res = await fetch(`/api/v1/profile/${currentUserId}`);
        if (!res.ok) {
            root.innerHTML = '<div class="rpg-empty">User not found</div>';
            return;
        }
        const s = await res.json();
        const badges = s.badges || [];

        const earnedCount = badges.filter(b => b.earned).length;
        const totalCount = badges.length;
        const progressPct = s.xp_needed > 0 ? Math.min(100, Math.round((s.xp_progress / s.xp_needed) * 100)) : 100;
        const isMaxLevel = s.level >= 100;
        const memberSince = s.created_at ? new Date(s.created_at).toLocaleDateString() : '--';

        const categories = {};
        badges.forEach(b => {
            const cat = b.category || 'other';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(b);
        });

        const badgeSectionsHtml = Object.entries(categories).map(([cat, catBadges]) => {
            const icon = CAT_ICONS[cat] || CAT_ICONS.special;
            const badgesHtml = catBadges.map(b => {
                const tierClass = `tier-${b.tier || 1}`;
                const earnedClass = b.earned ? 'earned' : 'locked';
                const badgeIcon = b.icon_svg || icon;
                return `<div class="rpg-badge ${earnedClass} ${tierClass}" title="${escapeHtml(b.description)}">
                    <div class="rpg-badge-icon">${badgeIcon}</div>
                    <span class="rpg-badge-name">${escapeHtml(b.name)}</span>
                </div>`;
            }).join('');
            return `<div class="rpg-badge-category">
                <div class="rpg-badge-category-title"><span class="rpg-cat-icon">${icon}</span>${CAT_LABELS[cat] || cat}</div>
                <div class="rpg-badge-grid">${badgesHtml}</div>
            </div>`;
        }).join('');

        const avatarHtml = s.avatar_url
            ? `<img src="${s.avatar_url}" class="rpg-profile-avatar" alt="">`
            : `<div class="rpg-profile-avatar rpg-profile-avatar-placeholder">${escapeHtml((s.username || '?')[0].toUpperCase())}</div>`;

        root.innerHTML = `
            <div class="rpg-profile-hero">
                <div class="rpg-profile-avatar-section">
                    <div class="rpg-level-ring">
                        <svg viewBox="0 0 120 120" class="rpg-level-svg">
                            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(13,147,115,0.12)" stroke-width="5"/>
                            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--accent)" stroke-width="5"
                                stroke-dasharray="${Math.round(339.3 * progressPct / 100)} 339.3"
                                stroke-linecap="round" transform="rotate(-90 60 60)"
                                class="rpg-level-progress"/>
                        </svg>
                        ${avatarHtml}
                        <div class="rpg-level-badge">${s.level}</div>
                    </div>
                    <div class="rpg-profile-info">
                        <div class="rpg-profile-name">${escapeHtml(s.username || '--')}</div>
                        <div class="rpg-profile-rank">${escapeHtml(s.rank || 'Script Kiddie')}</div>
                        <div class="rpg-profile-meta">Rank #${(s.global_rank || 0).toLocaleString()} &middot; Joined ${memberSince}</div>
                    </div>
                </div>
                <div class="rpg-xp-section">
                    <div class="rpg-xp-bar">
                        <div class="rpg-xp-bar-fill" style="width:${progressPct}%"></div>
                    </div>
                    <div class="rpg-xp-labels">
                        <span>${isMaxLevel ? 'MAX LEVEL' : `${s.xp_progress.toLocaleString()} / ${s.xp_needed.toLocaleString()} XP`}</span>
                        <span>${s.xp.toLocaleString()} XP total</span>
                    </div>
                </div>
            </div>

            <div class="rpg-stats-grid">
                <div class="rpg-stat-card"><div class="rpg-stat-icon">${CAT_ICONS.wifi}</div><div class="rpg-stat-value">${(s.wifi_discovered || 0).toLocaleString()}</div><div class="rpg-stat-label">WiFi</div></div>
                <div class="rpg-stat-card"><div class="rpg-stat-icon">${CAT_ICONS.bluetooth}</div><div class="rpg-stat-value">${(s.bt_discovered || 0).toLocaleString()}</div><div class="rpg-stat-label">Bluetooth</div></div>
                <div class="rpg-stat-card"><div class="rpg-stat-icon">${CAT_ICONS.cell}</div><div class="rpg-stat-value">${(s.cell_discovered || 0).toLocaleString()}</div><div class="rpg-stat-label">Cell</div></div>
                <div class="rpg-stat-card"><div class="rpg-stat-icon">${CAT_ICONS.upload}</div><div class="rpg-stat-value">${(s.total_uploads || 0).toLocaleString()}</div><div class="rpg-stat-label">Uploads</div></div>
            </div>

            <div class="rpg-badges-section">
                <div class="rpg-badges-header">
                    <h3>Achievements</h3>
                    <span class="rpg-badges-count">${earnedCount} / ${totalCount} unlocked</span>
                </div>
                ${badgeSectionsHtml}
            </div>
        `;
    } catch (e) {
        console.error('Failed to load profile:', e);
        root.innerHTML = '<div class="rpg-empty">Failed to load profile</div>';
    }
}
