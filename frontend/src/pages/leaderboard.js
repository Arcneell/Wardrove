import { $, escapeHtml } from '../utils.js';
import { navigate } from '../router.js';
import { setProfileUser } from './profile.js';

const PAGE_SIZE = 50;
let currentOffset = 0;

const RANK_MEDALS = {
    1: '<svg class="lb-medal" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M8 14l-2 8 6-3 6 3-2-8"/><text x="12" y="11" text-anchor="middle" fill="#d4af37" stroke="none" font-size="8" font-weight="bold" font-family="monospace">1</text></svg>',
    2: '<svg class="lb-medal" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M8 14l-2 8 6-3 6 3-2-8"/><text x="12" y="11" text-anchor="middle" fill="#a0a0a0" stroke="none" font-size="8" font-weight="bold" font-family="monospace">2</text></svg>',
    3: '<svg class="lb-medal" viewBox="0 0 24 24" fill="none" stroke="#cd7f32" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M8 14l-2 8 6-3 6 3-2-8"/><text x="12" y="11" text-anchor="middle" fill="#cd7f32" stroke="none" font-size="8" font-weight="bold" font-family="monospace">3</text></svg>',
};

export function initLeaderboard() {
    $('lbSortBy').addEventListener('change', loadLeaderboard);
    const prevBtn = $('lbPrev');
    const nextBtn = $('lbNext');
    if (prevBtn) prevBtn.addEventListener('click', () => {
        currentOffset = Math.max(0, currentOffset - PAGE_SIZE);
        loadLeaderboard();
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
        currentOffset += PAGE_SIZE;
        loadLeaderboard();
    });
}

function viewProfile(userId) {
    setProfileUser(userId);
    navigate('#profile');
}

window._viewProfile = viewProfile;

export async function loadLeaderboard() {
    try {
        const sortBy = $('lbSortBy').value;
        const res = await fetch(`/api/v1/stats/leaderboard?sort_by=${sortBy}&limit=${PAGE_SIZE}&offset=${currentOffset}`);
        const data = await res.json();
        const tbody = $('lbTableBody');

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="bt-empty">No players yet</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(u => {
            const avatar = u.avatar_url
                ? `<img src="${u.avatar_url}" class="lb-avatar">`
                : `<div class="lb-avatar lb-avatar-placeholder">${escapeHtml((u.username || '?')[0].toUpperCase())}</div>`;
            const topClass = u.rank <= 3 ? `lb-top${u.rank}` : '';
            const rankDisplay = RANK_MEDALS[u.rank] || `<span class="lb-rank-num">#${u.rank}</span>`;
            const rankTitle = u.rank_title || '';
            return `<tr class="${topClass} lb-row-clickable" onclick="window._viewProfile(${u.user_id})">
                <td class="lb-rank-cell">${rankDisplay}</td>
                <td class="lb-user-cell">
                    ${avatar}
                    <div class="lb-user-info">
                        <span class="lb-username">${escapeHtml(u.username)}</span>
                        <span class="lb-rank-title">${escapeHtml(rankTitle)}</span>
                    </div>
                </td>
                <td><span class="lb-level-badge">Lv.${u.level}</span></td>
                <td class="lb-xp">${(u.xp || 0).toLocaleString()}</td>
                <td>${(u.wifi_discovered || 0).toLocaleString()}</td>
                <td>${(u.bt_discovered || 0).toLocaleString()}</td>
                <td>${(u.cell_discovered || 0).toLocaleString()}</td>
            </tr>`;
        }).join('');

        const pageInfo = $('lbPageInfo');
        const prevBtn = $('lbPrev');
        const nextBtn = $('lbNext');
        if (pageInfo) pageInfo.textContent = `Page ${Math.floor(currentOffset / PAGE_SIZE) + 1}`;
        if (prevBtn) prevBtn.disabled = currentOffset === 0;
        if (nextBtn) nextBtn.disabled = !data || data.length < PAGE_SIZE;
    } catch (e) {
        console.error('Failed to load leaderboard:', e);
    }
}
