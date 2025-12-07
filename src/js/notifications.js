class NotificationManager {
    constructor() {
        this.permission = 'default';
        this.notificationContainer = null;
        this.init();
    }

    init() {
        this.notificationContainer = document.getElementById('notificationContainer');
        this.requestPermission();
    }

    async requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            this.permission = await Notification.requestPermission();
        }
    }

    show(title, message, type = 'info', duration = 5000) {
        const settings = storage.getSettings();
        
        if (!settings.notificationsEnabled) {
            return;
        }

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/src/assets/icons/icon-192.png',
                badge: '/src/assets/icons/icon-72.png',
                tag: 'pomodoro-notification',
                requireInteraction: false,
                silent: !settings.soundEnabled
            });
        }

        // In-app notification
        this.showInAppNotification(title, message, type, duration);
    }

    showInAppNotification(title, message, type, duration) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = this.getNotificationIcon(type);
        
        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">&times;</button>
        `;

        this.notificationContainer.appendChild(notification);

        // Add entrance animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.removeNotification(notification);
        });

        // Auto-remove
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }
    }

    getNotificationIcon(type) {
        const icons = {
            info: '<i class="fas fa-info-circle"></i>',
            success: '<i class="fas fa-check-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            error: '<i class="fas fa-times-circle"></i>',
            focus: '<i class="fas fa-brain"></i>',
            break: '<i class="fas fa-coffee"></i>'
        };
        return icons[type] || icons.info;
    }

    removeNotification(notification) {
        notification.classList.remove('show');
        notification.classList.add('hide');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    playSound(type = 'notification') {
        const settings = storage.getSettings();
        
        if (!settings.soundEnabled) {
            return;
        }

        const audio = new Audio();
        
        // Different sounds for different events
        const sounds = {
            notification: 'https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3',
            focus: 'https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3',
            break: 'https://assets.mixkit.co/sfx/preview/mixkit-happy-bells-notification-937.mp3',
            complete: 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3',
            alert: 'https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3'
        };

        audio.src = sounds[type] || sounds.notification;
        audio.volume = 0.3;
        
        audio.play().catch(e => {
            console.log('Audio play failed:', e);
        });
    }

    showSessionNotification(sessionType) {
        const messages = {
            focus: {
                title: 'Focus Session Started',
                message: 'Time to concentrate! You got this!',
                type: 'focus'
            },
            break: {
                title: 'Break Time!',
                message: 'Take a moment to relax and recharge.',
                type: 'break'
            },
            complete: {
                title: 'Session Complete!',
                message: 'Great work! Ready for the next one?',
                type: 'success'
            },
            longBreak: {
                title: 'Long Break!',
                message: 'Excellent progress! Take a 15-minute break.',
                type: 'break'
            }
        };

        const msg = messages[sessionType] || messages.focus;
        this.show(msg.title, msg.message, msg.type);
        
        // Play appropriate sound
        this.playSound(msg.type);
    }

    showAchievement(title, description) {
        this.show(title, description, 'success', 8000);
        this.playSound('complete');
    }
}

// Initialize notifications
const notifications = new NotificationManager();
