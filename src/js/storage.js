class StorageManager {
    constructor() {
        this.KEY_SETTINGS = 'royal_pomodoro_settings';
        this.KEY_TASKS = 'royal_pomodoro_tasks';
        this.KEY_SESSIONS = 'royal_pomodoro_sessions';
        this.KEY_STATISTICS = 'royal_pomodoro_stats';
        
        this.defaultSettings = {
            workDuration: 25,
            breakDuration: 5,
            longBreakDuration: 15,
            sessionsPerSet: 4,
            autoStartBreaks: true,
            notificationsEnabled: true,
            soundEnabled: true,
            theme: 'dark'
        };
        
        this.init();
    }

    init() {
        // Initialize default data if not exists
        if (!this.getSettings()) {
            this.saveSettings(this.defaultSettings);
        }
        
        if (!this.getTasks()) {
            this.saveTasks([]);
        }
        
        if (!this.getSessions()) {
            this.saveSessions([]);
        }
        
        if (!this.getStatistics()) {
            this.saveStatistics(this.getDefaultStatistics());
        }
    }

    // Settings
    getSettings() {
        const data = localStorage.getItem(this.KEY_SETTINGS);
        return data ? JSON.parse(data) : null;
    }

    saveSettings(settings) {
        localStorage.setItem(this.KEY_SETTINGS, JSON.stringify(settings));
    }

    updateSettings(updates) {
        const current = this.getSettings();
        const updated = { ...current, ...updates };
        this.saveSettings(updated);
        return updated;
    }

    resetSettings() {
        this.saveSettings(this.defaultSettings);
        return this.defaultSettings;
    }

    // Tasks
    getTasks() {
        const data = localStorage.getItem(this.KEY_TASKS);
        return data ? JSON.parse(data) : [];
    }

    saveTasks(tasks) {
        localStorage.setItem(this.KEY_TASKS, JSON.stringify(tasks));
    }

    // Sessions
    getSessions() {
        const data = localStorage.getItem(this.KEY_SESSIONS);
        return data ? JSON.parse(data) : [];
    }

    saveSessions(sessions) {
        localStorage.setItem(this.KEY_SESSIONS, JSON.stringify(sessions));
    }

    startSession(taskId = null) {
        const sessions = this.getSessions();
        const session = {
            id: this.generateId(),
            taskId,
            type: 'work',
            startTime: new Date().toISOString(),
            endTime: null,
            duration: 0,
            wasCompleted: false,
            status: 'active'
        };
        
        sessions.push(session);
        this.saveSessions(sessions);
        return session;
    }

    pauseSession() {
        const sessions = this.getSessions();
        const activeSession = sessions.find(s => s.status === 'active');
        
        if (activeSession) {
            activeSession.status = 'paused';
            this.saveSessions(sessions);
        }
    }

    resumeSession() {
        const sessions = this.getSessions();
        const pausedSession = sessions.find(s => s.status === 'paused');
        
        if (pausedSession) {
            pausedSession.status = 'active';
            pausedSession.startTime = new Date().toISOString();
            this.saveSessions(sessions);
        }
    }

    completeSession(taskId = null) {
        const sessions = this.getSessions();
        const activeSession = sessions.find(s => s.status === 'active' && s.type === 'work');
        
        if (activeSession) {
            const endTime = new Date();
            const startTime = new Date(activeSession.startTime);
            const duration = Math.round((endTime - startTime) / 1000 / 60); // minutes
            
            activeSession.endTime = endTime.toISOString();
            activeSession.duration = duration;
            activeSession.wasCompleted = true;
            activeSession.status = 'completed';
            activeSession.taskId = taskId;
            
            this.saveSessions(sessions);
            this.updateStatistics(duration);
            
            return activeSession;
        }
        
        return null;
    }

    resetSession() {
        const sessions = this.getSessions();
        const activeSessionIndex = sessions.findIndex(s => s.status === 'active');
        
        if (activeSessionIndex !== -1) {
            sessions.splice(activeSessionIndex, 1);
            this.saveSessions(sessions);
        }
    }

    // Statistics
    getStatistics() {
        const data = localStorage.getItem(this.KEY_STATISTICS);
        return data ? JSON.parse(data) : this.getDefaultStatistics();
    }

    saveStatistics(stats) {
        localStorage.setItem(this.KEY_STATISTICS, JSON.stringify(stats));
    }

    getDefaultStatistics() {
        const today = new Date().toISOString().split('T')[0];
        
        return {
            totalFocusMinutes: 0,
            totalSessions: 0,
            totalTasksCompleted: 0,
            currentStreak: 0,
            longestStreak: 0,
            dailyTotals: { [today]: 0 },
            weeklyGoal: 20,
            monthlyGoal: 80,
            bestDay: { date: today, minutes: 0 },
            startDate: new Date().toISOString()
        };
    }

    updateStatistics(sessionMinutes) {
        const stats = this.getStatistics();
        const today = new Date().toISOString().split('T')[0];
        
        // Update totals
        stats.totalFocusMinutes += sessionMinutes;
        stats.totalSessions += 1;
        
        // Update daily total
        stats.dailyTotals[today] = (stats.dailyTotals[today] || 0) + sessionMinutes;
        
        // Update best day
        if (stats.dailyTotals[today] > stats.bestDay.minutes) {
            stats.bestDay = { date: today, minutes: stats.dailyTotals[today] };
        }
        
        // Update streak
        this.updateStreak(stats);
        
        this.saveStatistics(stats);
        return stats;
    }

    updateStreak(stats) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        // Check if studied yesterday
        if (stats.dailyTotals[yesterdayStr] > 0) {
            // Continue streak
            stats.currentStreak += 1;
        } else if (stats.dailyTotals[todayStr] > 0 && stats.currentStreak === 0) {
            // Start new streak
            stats.currentStreak = 1;
        } else {
            // Break streak
            if (stats.currentStreak > stats.longestStreak) {
                stats.longestStreak = stats.currentStreak;
            }
            stats.currentStreak = 0;
        }
    }

    // Utility
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    clearAll() {
        localStorage.removeItem(this.KEY_SETTINGS);
        localStorage.removeItem(this.KEY_TASKS);
        localStorage.removeItem(this.KEY_SESSIONS);
        localStorage.removeItem(this.KEY_STATISTICS);
        this.init();
    }

    exportAll() {
        return {
            settings: this.getSettings(),
            tasks: this.getTasks(),
            sessions: this.getSessions(),
            statistics: this.getStatistics(),
            exportDate: new Date().toISOString()
        };
    }

    importAll(data) {
        if (data.settings) this.saveSettings(data.settings);
        if (data.tasks) this.saveTasks(data.tasks);
        if (data.sessions) this.saveSessions(data.sessions);
        if (data.statistics) this.saveStatistics(data.statistics);
        return true;
    }
}

// Initialize storage
const storage = new StorageManager();
