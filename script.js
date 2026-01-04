


const app = {
    state: {
        files: [],      // Array of { id, file, url, status: 'pending'|'done', result: null }
        isProcessing: false,
        supportsWebP: null, // Will be detected on init
        isInAppBrowser: false // Will detect Facebook/Telegram/Instagram in-app browsers
    },
    
    // Detect if running inside an in-app browser (Facebook, Telegram, Instagram, etc.)
    detectInAppBrowser() {
        const ua = navigator.userAgent || navigator.vendor || window.opera;
        
        // Facebook In-App Browser
        if (ua.includes('FBAN') || ua.includes('FBAV') || ua.includes('FB_IAB')) {
            return { isInApp: true, app: 'Facebook' };
        }
        
        // Instagram In-App Browser
        if (ua.includes('Instagram')) {
            return { isInApp: true, app: 'Instagram' };
        }
        
        // Telegram In-App Browser (various identifiers)
        if (ua.includes('Telegram') || ua.includes('TelegramBot')) {
            return { isInApp: true, app: 'Telegram' };
        }
        
        // Twitter/X In-App Browser
        if (ua.includes('Twitter') || ua.includes('TwitterAndroid')) {
            return { isInApp: true, app: 'Twitter' };
        }
        
        // Snapchat In-App Browser
        if (ua.includes('Snapchat')) {
            return { isInApp: true, app: 'Snapchat' };
        }
        
        // LinkedIn In-App Browser
        if (ua.includes('LinkedInApp')) {
            return { isInApp: true, app: 'LinkedIn' };
        }
        
        // WeChat In-App Browser
        if (ua.includes('MicroMessenger')) {
            return { isInApp: true, app: 'WeChat' };
        }
        
        // Line In-App Browser
        if (ua.includes('Line/')) {
            return { isInApp: true, app: 'Line' };
        }
        
        // Generic WebView detection (Android)
        if (ua.includes('wv') && ua.includes('Android') && !ua.includes('Chrome/')) {
            return { isInApp: true, app: 'التطبيق' };
        }
        
        return { isInApp: false, app: null };
    },
    
    // Show in-app browser warning banner
    showInAppBrowserWarning(appName) {
        const banner = document.createElement('div');
        banner.id = 'inapp-banner';
        banner.className = 'inapp-browser-banner';
        banner.innerHTML = `
            <div class="inapp-content">
                <div class="inapp-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <div class="inapp-text">
                    <strong>أنت تستخدم متصفح ${appName}</strong>
                    <p>لتحويل الصور بشكل صحيح، يرجى فتح الرابط في المتصفح الحقيقي:</p>
                    <ol>
                        <li>اضغط على <strong>⋮</strong> أو <strong>⋯</strong> (القائمة)</li>
                        <li>اختر <strong>"فتح في المتصفح"</strong> أو <strong>"Open in Browser"</strong></li>
                    </ol>
                </div>
                <button class="inapp-close" onclick="app.hideInAppBanner()" title="إغلاق">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <button class="inapp-copy-btn" onclick="app.copyLinkToClipboard()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                نسخ الرابط
            </button>
        `;
        
        // Prevent duplicate banners
        if (document.getElementById('inapp-banner')) return;
        
        // Insert at the top of the page
        document.body.insertBefore(banner, document.body.firstChild);
    },
    
    
    hideInAppBanner() {
        const banner = document.getElementById('inapp-banner');
        if (banner) {
            banner.classList.add('banner-closing');
            setTimeout(() => {
                banner.remove();
                document.body.classList.remove('has-inapp-banner');
            }, 300);
        }
    },
    
    copyLinkToClipboard() {
        const url = window.location.href;
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => {
                this.showToast('✓ تم نسخ الرابط! الصقه في المتصفح');
            }).catch(() => {
                this.fallbackCopyLink(url);
            });
        } else {
            this.fallbackCopyLink(url);
        }
    },
    
    fallbackCopyLink(url) {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showToast('✓ تم نسخ الرابط! الصقه في المتصفح');
        } catch (e) {
            this.showToast('الرابط: ' + url);
        }
        
        document.body.removeChild(textArea);
    },
    
    // Check if browser supports WebP export via canvas
    checkWebPSupport() {
        return new Promise((resolve) => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = 1;
                
                if (!canvas.toBlob) {
                    // Very old browser or restricted environment
                    resolve(false);
                    return;
                }

                // Try to export as WebP
                canvas.toBlob((blob) => {
                    if (blob && blob.type === 'image/webp') {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }, 'image/webp', 0.8);
            } catch (e) {
                console.warn('WebP Support Check Failed:', e);
                resolve(false);
            }
        });
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

    async init() {
        try {
            // Check for in-app browser first (Facebook, Telegram, Instagram, etc.)
            const inAppCheck = this.detectInAppBrowser();
            this.state.isInAppBrowser = inAppCheck.isInApp;
            
            if (inAppCheck.isInApp) {
                // Show warning banner for in-app browsers
                this.showInAppBrowserWarning(inAppCheck.app);
                document.body.classList.add('has-inapp-banner');
            }
            
            // Check WebP support
            this.state.supportsWebP = await this.checkWebPSupport();
            
            if (!this.state.supportsWebP) {
                // Show warning for Safari/iOS users
                this.showToast('متصفحك لا يدعم WebP. سيتم التحويل إلى PNG بدلاً من ذلك.', 5000);
            }
        } catch (e) {
            console.error('Core init failed:', e);
        }
        
        // Essential event listeners (Wrap in try to avoid complete failure)
        try {
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
                const opts = document.getElementById('resize-opts');
                if (opts) opts.classList.toggle('disabled', !e.target.checked);
            });
            document.getElementById('wm-check').addEventListener('change', e => {
                const opts = document.getElementById('wm-opts');
                if (opts) opts.classList.toggle('disabled', !e.target.checked);
            });
            document.getElementById('quality').addEventListener('input', e => {
                const val = document.getElementById('q-val');
                if (val) val.textContent = Math.round(e.target.value * 100) + '%';
            });

            // Main Button Logic
            if (this.ui.actionBtn) {
                this.ui.actionBtn.addEventListener('click', () => this.handleMainAction());
            }

            // PWA Installation
            this.initPWA();
        } catch (e) {
            console.error('Events init failed:', e);
        }
    },

    initPWA() {
        let deferredPrompt;
        const installBtn = document.getElementById('install-btn');

        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            deferredPrompt = e;
            // Update UI notify the user they can install the PWA
            if(installBtn) installBtn.classList.remove('hidden');
        });

        if(installBtn) {
            installBtn.addEventListener('click', async () => {
                if (!deferredPrompt) return;
                // Show the prompt
                deferredPrompt.prompt();
                // Wait for the user to respond to the prompt
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                deferredPrompt = null;
                installBtn.classList.add('hidden');
            });
        }

        window.addEventListener('appinstalled', (evt) => {
            console.log('App successfully installed');
            if(installBtn) installBtn.classList.add('hidden');
            this.showToast('✓ تم تثبيت التطبيق بنجاح!');
        });
    },

    toggleSettings() {
        this.ui.settings.classList.toggle('hidden');
        document.getElementById('settings-overlay').classList.toggle('hidden');
    },

    addFiles(list) {
        if(!list.length) return;
        
        const MAX_FILES = 100;
        let incoming = Array.from(list).filter(f => f.type && f.type.startsWith('image/'));
        
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
                item.resultExt = result.ext || '.webp';
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
        const self = this; // Save reference to avoid closure issues
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            // Set crossOrigin for CORS compatibility
            img.crossOrigin = 'anonymous';
            
            img.onload = function() {
                try {
                    URL.revokeObjectURL(url); 
                    
                    const cvs = document.createElement('canvas');
                    let w = img.width, h = img.height;

                    // Mobile memory protection: limit max dimensions
                    const MAX_DIMENSION = 4096;
                    if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
                        const ratio = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
                        w = Math.floor(w * ratio);
                        h = Math.floor(h * ratio);
                    }

                    // Resize Logic
                    if (s.resize && (s.w || s.h)) {
                        if (s.r) {
                            const r = w/h;
                            if(s.w) { w = parseInt(s.w); h = Math.floor(w/r); }
                            else if(s.h) { h = parseInt(s.h); w = Math.floor(h*r); }
                        } else {
                            if(s.w) w = parseInt(s.w);
                            if(s.h) h = parseInt(s.h);
                        }
                    }
                    
                    // Ensure dimensions are valid
                    w = Math.max(1, Math.floor(w));
                    h = Math.max(1, Math.floor(h));
                    
                    cvs.width = w; 
                    cvs.height = h;
                    const ctx = cvs.getContext('2d');
                    
                    if (!ctx) {
                        reject('فشل إنشاء Canvas context');
                        return;
                    }
                    
                    ctx.drawImage(img, 0, 0, w, h);

                    // Watermark
                    if (s.wm && s.wmTxt) {
                        ctx.font = `bold ${Math.max(12, w*0.05)}px sans-serif`;
                        ctx.fillStyle = s.wmCol;
                        ctx.shadowBlur = 5; 
                        ctx.shadowColor = "rgba(0,0,0,0.5)";
                        const metric = ctx.measureText(s.wmTxt);
                        let x = 20, y = h - 20;
                        if(s.wmPos === 'br') { x = w - metric.width - 20; y = h - 20; }
                        else if(s.wmPos === 'c') { x = (w - metric.width) / 2; y = h / 2; }
                        else if(s.wmPos === 'bl') { x = 20; y = h - 20; }
                        ctx.fillText(s.wmTxt, x, y);
                    }

                    // Use WebP if supported, otherwise fall back to PNG
                    const outputFormat = self.state.supportsWebP ? 'image/webp' : 'image/png';
                    const outputExt = self.state.supportsWebP ? '.webp' : '.png';
                    
                    // Helper to process the blob result
                    const processBlob = (blob) => {
                        if (!blob) throw new Error('Blob creation failed');
                        
                        const resUrl = URL.createObjectURL(blob);
                        const saved = ((file.size - blob.size) / file.size * 100).toFixed(0);
                        
                        resolve({
                            blob: blob,
                            url: resUrl,
                            ext: outputExt,
                            stats: {
                                orig: self.formatBytes(file.size),
                                new: self.formatBytes(blob.size),
                                saved: saved > 0 ? saved : 0
                            }
                        });
                    };

                    // Robust Export Logic (Mobile Safe)
                    try {
                        if (cvs.toBlob) {
                            cvs.toBlob(function(blob) {
                                if (blob) {
                                    processBlob(blob);
                                } else {
                                    // Fallback if toBlob returns null (some browsers do this on failure)
                                    exportViaDataURL();
                                }
                            }, outputFormat, s.q);
                        } else {
                            // Browser doesn't support toBlob
                            exportViaDataURL();
                        }
                    } catch (e) {
                         // Catch any synchronous errors and try fallback
                         console.warn('toBlob failed, trying fallback', e);
                         exportViaDataURL();
                    }

                    function exportViaDataURL() {
                         try {
                            const dataUrl = cvs.toDataURL(outputFormat, s.q);
                            
                            // Check if result is valid
                            if(dataUrl.length < 100 || dataUrl === 'data:,') {
                                reject('Canvas extraction failed');
                                return;
                            }

                            const byteString = atob(dataUrl.split(',')[1]);
                            const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0];
                            const ab = new ArrayBuffer(byteString.length);
                            const ia = new Uint8Array(ab);
                            for (let i = 0; i < byteString.length; i++) {
                                ia[i] = byteString.charCodeAt(i);
                            }
                            const blob = new Blob([ab], { type: mimeType });
                            processBlob(blob);
                        } catch (e) {
                            reject('فشل التحويل (Fallback): ' + e.message);
                        }
                    }
                } catch (e) {
                    reject('خطأ في معالجة الصورة: ' + e.message);
                }
            };
            
            img.onerror = function() {
                URL.revokeObjectURL(url);
                reject('فشل تحميل الصورة');
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
            const ext = item.resultExt || (this.state.supportsWebP ? '.webp' : '.png');
            a.download = item.file.name.replace(/\.[^.]+$/, '') + ext;
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
                 const ext = p.resultExt || (this.state.supportsWebP ? '.webp' : '.png');
                 zip.file(p.file.name.replace(/\.[^.]+$/, '') + ext, p.resultBlob);
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


