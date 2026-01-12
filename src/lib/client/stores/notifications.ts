import { writable } from 'svelte/store';
import { CONFIG } from '../../../public-config';

export type NotificationType = 'error' | 'success' | 'info' | 'warning';

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    duration: number;
}

function createNotificationStore() {
    const { subscribe, update } = writable<Notification[]>([]);

    return {
        subscribe,
        add: (type: NotificationType, message: string, duration: number = 5000) => {
            const id = `notification-${Date.now()}-${Math.random()}`;
            const notification: Notification = { id, type, message, duration };

            update(notifications => {
                const newNotifications = [...notifications, notification];
                
                // Limit to max display count, remove oldest if exceeded
                if (newNotifications.length > CONFIG.notifications.maxDisplayCount) {
                    return newNotifications.slice(-CONFIG.notifications.maxDisplayCount);
                }
                
                return newNotifications;
            });

            // Auto-remove after duration
            setTimeout(() => {
                notificationStore.remove(id);
            }, duration);

            return id;
        },
        remove: (id: string) => {
            update(notifications => notifications.filter(n => n.id !== id));
        },
        clear: () => {
            update(() => []);
        }
    };
}

export const notificationStore = createNotificationStore();

// Main notification function
export function showNotification(type: NotificationType, message: string, duration?: number) {
    return notificationStore.add(type, message, duration);
}
