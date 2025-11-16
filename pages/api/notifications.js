// Global notifications storage (in production, use database)
let globalNotifications = [];

export default function handler(req, res) {
  let notifications = globalNotifications;

  if (req.method === 'GET') {
    const { userId } = req.query;
    if (userId) {
      const userNotifications = notifications.filter(n => n.userId === parseInt(userId));
      res.status(200).json(userNotifications);
    } else {
      res.status(200).json(notifications);
    }
  } else if (req.method === 'POST') {
    const { userIds, message, type } = req.body;
    const newNotifications = userIds.map(userId => ({
      id: Date.now() + Math.random(),
      userId,
      message,
      type,
      read: false,
      timestamp: new Date().toISOString()
    }));
    globalNotifications.push(...newNotifications);
    res.status(201).json(newNotifications);
  } else if (req.method === 'PUT') {
    const { notificationId } = req.body;
    const notification = globalNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      res.status(200).json(notification);
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }
  } else if (req.method === 'DELETE') {
    globalNotifications.length = 0;
    res.status(200).json({ message: 'All notifications cleared' });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}