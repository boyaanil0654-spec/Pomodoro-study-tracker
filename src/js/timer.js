class PomodoroTimer {
    constructor() {
        this.timer = null;
        this.timeLeft = 25 * 60;
        this.totalTime = 25 * 60;
        this.isRunning = false;
        this.isBreak = false;
        this.sessionCount = 0;
        this.totalSessions = 4;
        this.currentTask = null;
        
        this.audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ'); // Placeholder
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.updateDisplay();
        this.setupEventListeners();
    }

    loadSettings() {
        const settings = storage.getSettings();
        this.totalTime = settings.workDuration * 60;
        this.timeLeft = this.totalTime;
        this.totalSessions = settings.sessionsPerSet;
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.timer = setInterval(() => this.tick(), 1000);
        this.updateControls();
        
        // Start session in storage
        if (!this.isBreak) {
            storage.startSession(this.currentTask?.id);
        }
        
        // Show notification
        notifications.show(`Session ${this.isBreak ? 'Break' : 'Focus'} Started`, 
                         `Time to ${this.isBreak ? 'relax' : 'focus'}!`);
    }

    pause() {
        this.isRunning = false;
        clearInterval(this.timer);
        this.updateControls();
        
        // Pause session in storage
        if (!this.isBreak) {
            storage.pauseSession();
        }
    }

    reset() {
        this.pause();
        this.timeLeft = this.totalTime;
        this.updateDisplay();
        this.updateControls();
        
        // Reset session in storage
        if (!this.isBreak) {
            storage.resetSession();
        }
    }

    skip() {
        if (this.isBreak) {
            this.startWorkSession();
        } else {
            this.startBreakSession();
        }
    }

    tick() {
        this.timeLeft--;
        this.updateDisplay();
        
        if (this.timeLeft <= 0) {
            this.completeSession();
        }
    }

    completeSession() {
        clearInterval(this.timer);
        this.isRunning = false;
        
        if (!this.isBreak) {
            // Complete work session
            this.sessionCount++;
            storage.completeSession(this.currentTask?.id);
            
            if (this.sessionCount >= this.totalSessions) {
                this.sessionCount = 0;
                this.startLongBreak();
            } else {
                this.startBreakSession();
            }
        } else {
            // Complete break session
            this.startWorkSession();
        }
        
        this.playSound();
        this.showCompletionNotification();
    }

    startWorkSession() {
        this.isBreak = false;
        this.totalTime = storage.getSettings().workDuration * 60;
        this.timeLeft = this.totalTime;
        this.updateDisplay();
        this.updateSessionInfo();
        this.start();
    }

    startBreakSession() {
        this.isBreak = true;
        this.totalTime = storage.getSettings().breakDuration * 60;
        this.timeLeft = this.totalTime;
        this.updateDisplay();
        this.updateSessionInfo();
        this.start();
    }

    startLongBreak() {
        this.isBreak = true;
        this.totalTime = 15 * 60; // 15 minutes
        this.timeLeft = this.totalTime;
        this.updateDisplay();
        this.updateSessionInfo();
        notifications.show('Long Break!', 'Great job! Take a 15-minute break.');
        this.start();
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        
        document.getElementById('timer-minutes').textContent = 
            minutes.toString().padStart(2, '0');
        document.getElementById('timer-seconds').textContent = 
            seconds.toString().padStart(2, '0');
        
        // Update progress ring
        const progress = ((this.totalTime - this.timeLeft) / this.totalTime) * 1130;
        const circle = document.querySelector('.progress-ring__circle');
        if (circle) {
            circle.style.strokeDashoffset = 1130 - progress;
        }
        
        // Update mode text
        const modeEl = document.getElementById('timer-mode');
        if (modeEl) {
            modeEl.textContent = this.isBreak ? 'BREAK' : 'FOCUS';
            modeEl.style.color = this.isBreak ? '#00b4d8' : '#ffd700';
        }
    }

    updateSessionInfo() {
        document.getElementById('session-count').textContent = this.sessionCount + 1;
        document.getElementById('current-task').textContent = 
            this.currentTask?.title || 'No active task';
    }

    updateControls() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (this.isRunning) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            startBtn.innerHTML = '<i class="fas fa-play"></i> Running';
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            startBtn.innerHTML = '<i class="fas fa-play"></i> Start';
        }
    }

    setDuration(minutes) {
        this.pause();
        this.totalTime = minutes * 60;
        this.timeLeft = this.totalTime;
        this.updateDisplay();
        
        // Update active preset button
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.minutes) === minutes) {
                btn.classList.add('active');
            }
        });
    }

    setCurrentTask(task) {
        this.currentTask = task;
        this.updateSessionInfo();
    }

    playSound() {
        const settings = storage.getSettings();
        if (settings.soundEnabled) {
            this.audio.play().catch(e => console.log('Audio play failed:', e));
        }
    }

    showCompletionNotification() {
        const message = this.isBreak ? 
            'Break finished! Time to focus.' : 
            'Great work! Time for a break.';
        
        notifications.show('Session Complete!', message);
    }

    setupEventListeners() {
        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const minutes = parseInt(btn.dataset.minutes);
                this.setDuration(minutes);
            });
        });

        // Control buttons
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('skipBtn').addEventListener('click', () => this.skip());
    }

    getStats() {
        return {
            timeLeft: this.timeLeft,
            isRunning: this.isRunning,
            isBreak: this.isBreak,
            sessionCount: this.sessionCount,
            totalSessions: this.totalSessions,
            currentTask: this.currentTask
        };
    }
}

// Initialize timer
let timer = null;
document.addEventListener('DOMContentLoaded', () => {
    timer = new PomodoroTimer();
});
