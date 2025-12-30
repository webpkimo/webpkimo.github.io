const app = {
    state: {
        files: [],      // Array of { id, file, url, status: 'pending'|'done', result: null }
        isProcessing: false
    },
    
    ui: {
        dropZone: document.getElementById('drop-zone'),
        fileInput: document.getElementById('file-input'),
        resultsGrid: document.getElementById('results-grid'),
        actionBar: document.getElementById('action-bar'),
        msg: document.getElementById('status-msg'),
        actionBtn: document.getElementById('main-action-btn'),
        progress: document.getElementById('progress-bar'),
        fill: document.querySelector('.fill'),
        settings: document.getElementById('settings-panel'),
        toast: document.getElementById('toast')
    },

    init() {
        // Drag Drop interactions
        this.ui.dropZone.addEventListener('click', (e) => {
            if(e.target.closest('button')) return;
            this.ui.fileInput.click();
        });
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.ui.dropZone.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        this.ui.dropZone.addEventListener('drop', (e) => this.addFiles(e.dataTransfer.files));
        this.ui.fileInput.addEventListener('change', e => this.addFiles(e.target.files));
        
        // Settings Toggles
        document.getElementById('resize-check').addEventListener('change', e => {
            document.getElementById('resize-opts').classList.toggle('disabled', !e.target.checked);
        });
        document.getElementById('wm-check').addEventListener('change', e => {
            document.getElementById('wm-opts').classList.toggle('disabled', !e.target.checked);
        });
        document.getElementById('quality').addEventListener('input', e => {
            document.getElementById('q-val').textContent = Math.round(e.target.value * 100) + '%';
        });

        // Main Button Logic
        this.ui.actionBtn.addEventListener('click', () => this.handleMainAction());
    },

    toggleSettings() {
        this.ui.settings.classList.toggle('hidden');
        document.getElementById('settings-overlay').classList.toggle('hidden');
    },

    addFiles(list) {
        if(!list.length) return;
        
        const MAX_FILES = 100;
        let incoming = Array.from(list).filter(f => f.type.match(/image\/(png|jpeg|jpg)/));
        
        const currentCount = this.state.files.length;
        if (currentCount + incoming.length > MAX_FILES) {
            const allowed = MAX_FILES - currentCount;
            if (allowed <= 0) {
                this.showToast('عفواً، الحد الأقصى هو 100 صورة فقط.');
                return;
            }
            incoming = incoming.slice(0, allowed);
            this.showToast(`تم إضافة ${allowed} صور فقط (الحد الأقصى وصل).`);
        }

        // Process incoming files into wrappers with a stagger effect
        let delay = 0;
        incoming.forEach(f => {
            setTimeout(() => {
                const id = Math.random().toString(36).substr(2, 9);
                const item = {
                    id: id,
                    file: f,
                    url: URL.createObjectURL(f),
                    status: 'pending'
                };
                this.state.files.push(item);
                this.renderPendingCard(item);
                this.updateUIState(); // Update UI on each add for dynamic feel
            }, delay);
            delay += 100; // 100ms stagger
        });
    },

    updateUIState() {
        const pending = this.state.files.filter(f => f.status === 'pending').length;
        const done = this.state.files.filter(f => f.status === 'done').length;
        const total = this.state.files.length;

        if (total > 0) {
            this.ui.actionBar.classList.remove('hidden');
            
            // Check if we have pending files to decide button state
            if (pending > 0 && !this.state.isProcessing) {
                this.showActionBar('ready', pending);
            } else if (pending === 0 && done > 0) {
                this.showActionBar('done', done);
            }
        } else {
            this.ui.actionBar.classList.add('hidden');
        }
    },

    showActionBar(mode, count) {
        const btn = this.ui.actionBtn;
        const txt = btn.querySelector('.btn-text');
        const icon = btn.querySelector('svg');
        const cancelBtn = document.getElementById('cancel-btn');

        if (mode === 'ready') {
            this.ui.msg.textContent = `تم اختيار ${count} صور - جاهز للتحويل`;
            txt.textContent = 'تحويل الصور';
            icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>'; // Play Icon
            btn.style.background = 'var(--primary)';
            btn.disabled = false;
            this.ui.progress.classList.add('hidden');
            if(cancelBtn) cancelBtn.classList.remove('hidden');
        } else if (mode === 'processing') {
            this.ui.msg.textContent = 'جاري معالجة الصور...';
            txt.textContent = 'جاري المعالجة...';
             // Spinner or similar could go here, keeping play for simplicity
            btn.disabled = true;
            this.ui.progress.classList.remove('hidden');
            if(cancelBtn) cancelBtn.classList.add('hidden');
        } else if (mode === 'done') {
            this.ui.msg.textContent = `تم تحويل ${count} صور بنجاح`;
            this.ui.progress.classList.add('hidden');
            btn.disabled = false;
            btn.style.background = 'var(--success)';
            txt.textContent = `تحميل الكل (ZIP)`;
            icon.innerHTML = '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>'; // Download Icon
            btn.onclick = () => this.downloadZip();
            if(cancelBtn) cancelBtn.classList.add('hidden');
        }
    },

    cancelSelection() {
        // Remove pending items
        const pending = this.state.files.filter(f => f.status === 'pending');
        pending.forEach(p => {
            URL.revokeObjectURL(p.url);
            const el = document.getElementById(`card-${p.id}`);
            if(el) el.remove();
        });
        
        this.state.files = this.state.files.filter(f => f.status !== 'pending');
        this.updateUIState();
        this.showToast('تم إلغاء التحديد.');
    },

    renderPendingCard(item) {
        const div = document.createElement('div');
        div.className = 'result-card pending';
        div.id = `card-${item.id}`;
        div.innerHTML = `
            <img src="${item.url}" class="img-preview">
            <div class="card-content">
                <div class="card-info">
                    <span>${item.file.name}</span>
                    <span class="stat-tag wait">انتظار...</span>
                </div>
                <div class="card-actions">
                    <button class="btn-sm btn-del" onclick="app.removeFile('${item.id}')" title="حذف">
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            </div>
        `;
        this.ui.resultsGrid.appendChild(div);
    },

    updateCardToDone(item, result) {
        const div = document.getElementById(`card-${item.id}`);
        if(!div) return;
        
        div.className = 'result-card'; // Remove pending class
        // Update Image URL to the WebP one? Optional, but better to keep original preview or update if resized.
        // Let's keep original preview to save memory redrawing, or update if we want to show result quality.
        // We'll update stats and buttons.
        
        div.innerHTML = `
            <img src="${item.url}" class="img-preview">
            <div class="card-content">
                <div class="card-info">
                    <span>${result.stats.orig} → ${result.stats.new}</span>
                    <span class="stat-tag">${result.stats.saved}% توفير</span>
                </div>
                <div class="card-actions">
                    <button class="btn-sm btn-dl" onclick="app.downloadOne('${item.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        تحميل
                    </button>
                    <button class="btn-sm btn-del" onclick="app.removeFile('${item.id}')">
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            </div>
        `;
    },

    async handleMainAction() {
        // If clicking Download ZIP
        if(this.ui.actionBtn.textContent.includes('ZIP')) return;

        const pendingItems = this.state.files.filter(f => f.status === 'pending');
        if(!pendingItems.length) return;

        this.showActionBar('processing', 0);
        this.state.isProcessing = true;

        // Get Settings
        const s = {
            q: parseFloat(document.getElementById('quality').value),
            resize: document.getElementById('resize-check').checked,
            w: document.getElementById('width').value,
            h: document.getElementById('height').value,
            r: document.getElementById('ratio').checked,
            wm: document.getElementById('wm-check').checked,
            wmTxt: document.getElementById('wm-text').value,
            wmPos: document.getElementById('wm-pos').value,
            wmCol: document.getElementById('wm-color').value
        };

        const total = pendingItems.length;
        let completed = 0;

        for(const item of pendingItems) {
            // Check if still exists (wasn't removed mid-process)
            if(!this.state.files.find(f => f.id === item.id)) continue;

            try {
                const result = await this.convert(item.file, s);
                // Update item with result data
                item.status = 'done';
                item.resultBlob = result.blob;
                item.resultUrl = result.url;
                item.stats = result.stats;
                
                this.updateCardToDone(item, result);
            } catch(e) {
                console.error(e);
                this.showToast('فشل تحويل صورة: ' + item.file.name);
            }
            completed++;
            this.ui.fill.style.width = (completed / total * 100) + '%';
        }

        this.state.isProcessing = false;
        this.updateUIState();
    },

    convert(file, s) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(url); 
                
                const cvs = document.createElement('canvas');
                let w = img.width, h = img.height;

                // Resize Logic
                if (s.resize && (s.w || s.h)) {
                    if (s.r) {
                        const r = w/h;
                        if(s.w) { w = parseInt(s.w); h = w/r; }
                        else if(s.h) { h = parseInt(s.h); w = h*r; }
                    } else {
                        if(s.w) w = parseInt(s.w);
                        if(s.h) h = parseInt(s.h);
                    }
                }
                
                cvs.width = w; cvs.height = h;
                const ctx = cvs.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);

                // Watermark
                if (s.wm && s.wmTxt) {
                    ctx.font = `bold ${w*0.05}px sans-serif`;
                    ctx.fillStyle = s.wmCol;
                    ctx.shadowBlur = 5; ctx.shadowColor="rgba(0,0,0,0.5)";
                    const metric = ctx.measureText(s.wmTxt);
                    let x=20, y=h-20;
                    if(s.wmPos === 'br') { x=w-metric.width-20; y=h-20; }
                    else if(s.wmPos === 'c') { x=(w-metric.width)/2; y=h/2; }
                    else if(s.wmPos === 'bl') { x=20; y=h-20; }
                    ctx.fillText(s.wmTxt, x, y);
                }

                cvs.toBlob(blob => {
                    if(!blob) return reject('Conversion failed');
                    
                    const resUrl = URL.createObjectURL(blob);
                    const saved = ((file.size - blob.size) / file.size * 100).toFixed(0);
                    
                    resolve({
                        blob: blob,
                        url: resUrl,
                        stats: {
                            orig: this.formatBytes(file.size),
                            new: this.formatBytes(blob.size),
                            saved: saved > 0 ? saved : 0
                        }
                    });
                }, 'image/webp', s.q);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject('Image load error');
            };
            img.src = url;
        });
    },

    removeFile(id) {
        const idx = this.state.files.findIndex(p => p.id === id);
        if(idx > -1) {
            const item = this.state.files[idx];
            
            // UI Removal
            const el = document.getElementById(`card-${id}`);
            if(el) el.style.display = 'none';

            // Logic separation based on status
            if (item.status === 'pending') {
                // If pending, simple remove (Undo selection)
                URL.revokeObjectURL(item.url); // Clean preview URL
                this.state.files.splice(idx, 1);
                if(el) el.remove();
                this.updateUIState();
                this.showToast('تم إزالة الصورة من القائمة.');
            } else {
                // If done, use Undo Delete logic
                this.showToast(`تم حذف الصورة. <button onclick="app.undoRemove('${id}')" class="undo-btn">تراجع</button>`, 5000);
                
                item.deleteTimeout = setTimeout(() => {
                    // Permanently delete
                    URL.revokeObjectURL(item.url); // Preview (if stored)
                    if(item.resultUrl) URL.revokeObjectURL(item.resultUrl); // Result
                    
                    this.state.files = this.state.files.filter(f => f.id !== id);
                    if(el) el.remove();
                    this.updateUIState();
                }, 5000);
            }
        }
    },

    undoRemove(id) {
        const item = this.state.files.find(p => p.id === id);
        if(item) {
            clearTimeout(item.deleteTimeout);
            const el = document.getElementById(`card-${id}`);
            if(el) el.style.display = 'flex'; 
            this.showToast('تم استعادة الصورة');
        }
    },

    cleanupProcessed() {
        // We do not auto-clean manually now unless user refreshes or we want a "Clear All" button
        // Logic moved to per-item management
    },

    downloadOne(id) {
        const item = this.state.files.find(p => p.id === id);
        if(item && item.resultUrl) {
            const a = document.createElement('a');
            a.href = item.resultUrl;
            a.download = item.file.name.replace(/\.[^.]+$/, '') + '.webp';
            a.click();
        }
    },

    downloadZip() {
        const doneFiles = this.state.files.filter(f => f.status === 'done');
        if(!doneFiles.length) return;
        
        const zip = new JSZip();
        doneFiles.forEach(p => {
             const el = document.getElementById(`card-${p.id}`);
             if(el && el.style.display !== 'none') {
                 zip.file(p.file.name.replace(/\.[^.]+$/, '') + '.webp', p.resultBlob);
             }
        });
        
        this.showToast('جاري ضغط الملفات...');

        zip.generateAsync({type:'blob'}).then(c => {
            const a = document.createElement('a');
            const url = URL.createObjectURL(c);
            a.href = url;
            a.download = 'converted-images.zip';
            a.click();
            
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            this.showToast('تم بدء التحميل');
        });
    },

    formatBytes(bytes, decimals = 1) {
        if (!+bytes) return '0 B';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    },

    showToast(msg, duration = 3000) {
        this.ui.toast.innerHTML = msg;
        this.ui.toast.classList.add('show');
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            this.ui.toast.classList.remove('show');
        }, duration);
    }
};

app.init();
