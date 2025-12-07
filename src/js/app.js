class RoyalPomodoroApp {
    constructor() {
        this.currentTheme = 'dark';
        this.init();
    }

    init() {
        this.loadTheme();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.checkServiceWorker();
        this.setupPeriodicUpdates();
    }

    loadTheme() {
        const settings = storage.getSettings();
        this.currentTheme = settings.theme || 'dark';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Settings modal
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsModal = document.getElementById('settingsModal');
        const closeSettings = settingsModal.querySelector('.close-modal');

        settingsBtn.addEventListener('click', () => {
            this.openSettingsModal();
        });

        closeSettings.addEventListener('click', () => {
            settingsModal.classList.remove('active');
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.remove('active');
            }
            
            const taskModal = document.getElementById('taskModal');
            if (e.target === taskModal) {
                taskModal.classList.remove('active');
            }
        });

        // Settings save
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        // Settings reset
        document.getElementById('resetSettings').addEventListener('click', () => {
            if (confirm('Reset all settings to default?')) {
                storage.resetSettings();
                this.loadTheme();
                timer.loadSettings();
                settingsModal.classList.remove('active');
                notifications.show('Settings Reset', 'All settings have been reset to default.');
            }
        });

        // Theme selection
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentTheme = btn.dataset.theme;
                
                // Update active theme button
                document.querySelectorAll('.theme-option').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
            });
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });

        // Task modal close
        document.querySelectorAll('#taskModal .close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('taskModal').classList.remove('active');
            });
        });

        // Premium button
        document.getElementById('premiumBtn').addEventListener('click', () => {
            this.showPremiumModal();
        });
    }

    toggleTheme() {
        const themes = ['dark', 'royal', 'purple', 'gold'];
        let currentIndex = themes.indexOf(this.currentTheme);
        currentIndex = (currentIndex + 1) % themes.length;
        this.currentTheme = themes[currentIndex];
        
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        // Update theme in settings
        storage.updateSettings({ theme: this.currentTheme });
        
        notifications.show('Theme Changed', `Switched to ${this.currentTheme} theme`);
    }

    openSettingsModal() {
        const settings = storage.getSettings();
        const modal = document.getElementById('settingsModal');
        
        // Populate form
        document.getElementById('focusDuration').value = settings.workDuration;
        document.getElementById('breakDuration').value = settings.breakDuration;
        document.getElementById('sessionsPerSet').value = settings.sessionsPerSet;
        document.getElementById('enableNotifications').checked = settings.notificationsEnabled;
        document.getElementById('enableSounds').checked = settings.soundEnabled;
        
        // Update theme buttons
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.theme === settings.theme) {
                btn.classList.add('active');
            }
        });
        
        this.currentTheme = settings.theme;
        modal.classList.add('active');
    }

    saveSettings() {
        const settings = {
            workDuration: parseInt(document.getElementById('focusDuration').value) || 25,
            breakDuration: parseInt(document.getElementById('breakDuration').value) || 5,
            sessionsPerSet: parseInt(document.getElementById('sessionsPerSet').value) || 4,
            notificationsEnabled: document.getElementById('enableNotifications').checked,
            soundEnabled: document.getElementById('enableSounds').checked,
            theme: this.currentTheme
        };

        storage.updateSettings(settings);
        timer.loadSettings();
        
        document.getElementById('settingsModal').classList.remove('active');
        notifications.show('Settings Saved', 'Your preferences have been updated.');
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch(e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    if (timer.isRunning) {
                        timer.pause();
                    } else {
                        timer.start();
                    }
                    break;
                    
                case 'n':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        timer.skip();
                    }
                    break;
                    
                case 'r':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        timer.reset();
                    }
                    break;
                    
                case 't':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.toggleTheme();
                    }
                    break;
                    
                case '1':
                case '2':
                case '3':
                case '4':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        const minutes = [25, 15, 50, 5][parseInt(e.key) - 1];
                        timer.setDuration(minutes);
                    }
                    break;
            }
        });
    }

    checkServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('ServiceWorker registration successful');
                    })
                    .catch(err => {
                        console.log('ServiceWorker registration failed: ', err);
                    });
            });
        }
    }

    setupPeriodicUpdates() {
        // Update stats every minute
        setInterval(() => {
            if (analytics) {
                analytics.updateStats();
            }
        }, 60000);

        // Auto-save every 30 seconds
        setInterval(() => {
            if (taskManager) {
                storage.saveTasks(taskManager.tasks);
            }
        }, 30000);
    }

    showPremiumModal() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content royal-modal">
                <div class="modal-header">
                    <h2><i class="fas fa-gem"></i> Royal Premium</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="premium-features">
                        <h3>Upgrade to Royal Premium</h3>
                        <ul>
                            <li><i class="fas fa-check-circle"></i> Unlimited cloud sync</li>
                            <li><i class="fas fa-check-circle"></i> Advanced analytics</li>
                            <li><i class="fas fa-check-circle"></i> Custom themes</li>
                            <li><i class="fas fa-check-circle"></i> Priority support</li>
                            <li><i class="fas fa-check-circle"></i> Export to PDF/Excel</li>
                        </ul>
                        <div class="premium-price">
                            <h4>$4.99<span>/month</span></h4>
                            <p>or $49.99/year</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="royal" id="upgradeBtn">Upgrade Now</button>
                    <button class="secondary" id="closePremiumBtn">Maybe Later</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('#closePremiumBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('#upgradeBtn').addEventListener('click', () => {
            notifications.show('Coming Soon', 'Premium features will be available soon!');
            document.body.removeChild(modal);
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    showWelcomeTour() {
        if (!localStorage.getItem('royal_welcome_shown')) {
            setTimeout(() => {
                notifications.show(
                    'Welcome to Royal Pomodoro!',
                    'Use Space to start/pause, Ctrl+N to skip sessions. Try the royal themes!',
                    'info',
                    10000
                );
                localStorage.setItem('royal_welcome_shown', 'true');
            }, 2000);
        }
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    const app = new RoyalPomodoroApp();
    app.showWelcomeTour();
});
