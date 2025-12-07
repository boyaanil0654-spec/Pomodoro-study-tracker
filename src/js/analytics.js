class AnalyticsDashboard {
    constructor() {
        this.chart = null;
        this.currentPeriod = 'week';
        this.init();
    }

    init() {
        this.renderChart();
        this.updateStats();
        this.setupEventListeners();
    }

    getWeeklyData() {
        const sessions = storage.getSessions();
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Get last 7 days
        const data = Array(7).fill(0);
        const labels = [];
        
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            const dateStr = date.toISOString().split('T')[0];
            const daySessions = sessions.filter(s => 
                s.startTime.startsWith(dateStr) && s.type === 'work'
            );
            
            const totalMinutes = daySessions.reduce((sum, s) => sum + s.duration, 0);
            data[6 - i] = Math.round(totalMinutes / 60 * 10) / 10; // Convert to hours
            
            labels.push(weekDays[date.getDay()]);
        }
        
        return { labels, data };
    }

    getMonthlyData() {
        const sessions = storage.getSessions();
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        // Get days in month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const data = Array(daysInMonth).fill(0);
        const labels = [];
        
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const daySessions = sessions.filter(s => 
                s.startTime.startsWith(dateStr) && s.type === 'work'
            );
            
            const totalMinutes = daySessions.reduce((sum, s) => sum + s.duration, 0);
            data[i - 1] = Math.round(totalMinutes / 60 * 10) / 10;
            
            if (i % 5 === 0 || i === 1 || i === daysInMonth) {
                labels.push(`Day ${i}`);
            } else {
                labels.push('');
            }
        }
        
        return { labels, data };
    }

    getYearlyData() {
        const sessions = storage.getSessions();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const data = Array(12).fill(0);
        
        const now = new Date();
        const currentYear = now.getFullYear();
        
        for (let month = 0; month < 12; month++) {
            const monthStr = String(month + 1).padStart(2, '0');
            const monthSessions = sessions.filter(s => 
                s.startTime.startsWith(`${currentYear}-${monthStr}`) && s.type === 'work'
            );
            
            const totalMinutes = monthSessions.reduce((sum, s) => sum + s.duration, 0);
            data[month] = Math.round(totalMinutes / 60 * 10) / 10;
        }
        
        return { labels: months, data };
    }

    renderChart() {
        const ctx = document.getElementById('weeklyChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        let chartData;
        switch (this.currentPeriod) {
            case 'month':
                chartData = this.getMonthlyData();
                break;
            case 'year':
                chartData = this.getYearlyData();
                break;
            default:
                chartData = this.getWeeklyData();
        }
        
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Study Hours',
                    data: chartData.data,
                    backgroundColor: this.generateGradient(ctx),
                    borderColor: '#ffd700',
                    borderWidth: 2,
                    borderRadius: 10,
                    hoverBackgroundColor: '#ffed4e'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#f8f9fa',
                            font: {
                                family: 'Inter'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(10, 17, 40, 0.9)',
                        titleColor: '#ffd700',
                        bodyColor: '#f8f9fa',
                        borderColor: '#ffd700',
                        borderWidth: 1,
                        cornerRadius: 10
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#adb5bd',
                            callback: function(value) {
                                return value + 'h';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Hours',
                            color: '#ffd700',
                            font: {
                                family: 'Orbitron',
                                size: 14
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#adb5bd'
                        },
                        title: {
                            display: true,
                            text: this.getPeriodLabel(),
                            color: '#ffd700',
                            font: {
                                family: 'Orbitron',
                                size: 14
                            }
                        }
                    }
                }
            }
        });
    }

    generateGradient(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 237, 78, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0.4)');
        return gradient;
    }

    getPeriodLabel() {
        switch (this.currentPeriod) {
            case 'week': return 'Days';
            case 'month': return 'Days of Month';
            case 'year': return 'Months';
            default: return 'Days';
        }
    }

    updateStats() {
        const stats = storage.getStatistics();
        const taskStats = taskManager ? taskManager.getTaskStats() : { completionRate: 0 };
        
        // Update stat cards
        document.getElementById('total-focus').textContent = 
            this.formatTime(stats.totalFocusMinutes);
        document.getElementById('current-streak').textContent = 
            stats.currentStreak;
        document.getElementById('tasks-completed').textContent = 
            taskStats.completed || 0;
        document.getElementById('productivity-score').textContent = 
            `${Math.round(taskStats.completionRate)}%`;
        
        // Update chart if needed
        if (this.chart) {
            this.renderChart();
        }
    }

    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins.toString().padStart(2, '0')}m`;
    }

    setupEventListeners() {
        // Period buttons
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentPeriod = btn.dataset.period;
                
                // Update active button
                document.querySelectorAll('.period-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                
                // Re-render chart
                this.renderChart();
            });
        });
    }

    getProductivityScore() {
        const stats = storage.getStatistics();
        const taskStats = taskManager ? taskManager.getTaskStats() : { completionRate: 0 };
        
        // Calculate score based on multiple factors
        const streakWeight = Math.min(stats.currentStreak / 30, 1) * 30; // Max 30%
        const focusWeight = Math.min(stats.totalFocusMinutes / 3000, 1) * 30; // Max 30%
        const taskWeight = (taskStats.completionRate / 100) * 40; // Max 40%
        
        return Math.round(streakWeight + focusWeight + taskWeight);
    }

    exportData() {
        const data = {
            settings: storage.getSettings(),
            tasks: storage.getTasks(),
            sessions: storage.getSessions(),
            statistics: storage.getStatistics(),
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `royal-pomodoro-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize analytics
let analytics = null;
document.addEventListener('DOMContentLoaded', () => {
    analytics = new AnalyticsDashboard();
});
