class NotificationsService {
  private key = btoa('notifications');
  private notifications: any;

  hasNotification = (): boolean => {
    this.notifications = localStorage.getItem(this.key);
    return !!this.notifications;
  };

  addNotification = (noti: any): void => {
    const { block_hash } = noti;
    let msgStack;
    if (this.hasNotification()) {
      msgStack = {
        ...JSON.parse(this.notifications),
        [block_hash]: noti,
      };
    } else {
      msgStack = {
        [block_hash]: noti,
      };
    }
    localStorage.setItem(this.key, JSON.stringify(msgStack));
  };

  getNotification = () => {
    if (this.hasNotification()) {
      return JSON.parse(this.notifications);
    } else {
      return [];
    }
  };

  removeNotification = (txHash): void => {
    if (this.hasNotification()) {
      const noti = JSON.parse(this.notifications);
      delete noti[txHash];
      localStorage.setItem(this.key, JSON.stringify(noti));
    }
  };

  resetNoti = () => {
    localStorage.removeItem(this.key);
  };
}

export const iNotificationsService: NotificationsService = new NotificationsService();
