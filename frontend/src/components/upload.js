import { $ } from '../utils.js';
import { authFetch } from '../api.js';
import { navigate } from '../router.js';
import { getState } from '../state.js';
import { loadGeoJSON } from '../pages/map.js';
import { loadProfile, loadStats } from '../pages/sidebar.js';

export function initUpload() {
    const uploadModal = $('uploadModal');
    const dropZone = $('dropZone');
    const fileInput = $('fileInput');
    const progressBar = $('progressBar');
    const progressFill = $('progressFill');
    const uploadResult = $('uploadResult');
    const statusBadge = $('uploadStatusBadge');
    const toastContainer = $('toastContainer');

    function setUploadBusy(isBusy) {
        if (!statusBadge) return;
        statusBadge.style.display = isBusy ? '' : 'none';
        statusBadge.classList.toggle('active', isBusy);
    }

    function showToast(message, kind = 'info') {
        if (!toastContainer) return;
        const el = document.createElement('div');
        el.className = `toast ${kind}`;
        el.textContent = message;
        toastContainer.appendChild(el);
        requestAnimationFrame(() => el.classList.add('visible'));
        setTimeout(() => {
            el.classList.remove('visible');
            setTimeout(() => el.remove(), 180);
        }, 2800);
    }

    $('uploadBtn').addEventListener('click', () => {
        if (!getState('accessToken')) {
            $('loginModal').classList.add('active');
            return;
        }
        uploadModal.classList.add('active');
        resetUploadUI();
    });

    $('closeModal').addEventListener('click', () => uploadModal.classList.remove('active'));
    uploadModal.addEventListener('click', (e) => {
        if (e.target === uploadModal) uploadModal.classList.remove('active');
    });

    $('browseBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) uploadFiles(fileInput.files);
    });

    function resetUploadUI() {
        progressBar.style.display = 'none';
        progressFill.style.width = '0%';
        progressFill.style.background = '';
        uploadResult.style.display = 'none';
        fileInput.value = '';
    }

    async function uploadFiles(fileList) {
        progressBar.style.display = 'block';
        uploadResult.style.display = 'none';
        progressFill.style.width = '30%';

        const form = new FormData();
        for (const file of fileList) form.append('files', file);

        try {
            setUploadBusy(true);
            progressFill.style.width = '50%';
            const res = await authFetch('/api/v1/upload', { method: 'POST', body: form });

            if (!res.ok) throw new Error('Upload failed');

            progressFill.style.width = '100%';
            setTimeout(() => {
                uploadModal.classList.remove('active');
                resetUploadUI();
                navigate('#uploads');
            }, 250);
            showToast('Upload envoye, traitement en cours', 'success');
            loadStats();
            loadGeoJSON(false);
            loadProfile();
        } catch (e) {
            console.error('Upload error:', e);
            progressFill.style.background = '#dc3545';
            showToast("Echec de l'upload", 'error');
        } finally {
            setTimeout(() => setUploadBusy(false), 1200);
        }
    }
}
