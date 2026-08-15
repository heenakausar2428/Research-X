/**
 * Handles Socket.io connections, event registrations, and broadcasts.
 * @param {object} io Socket.io Server instance
 */
const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join user-specific notification room
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`Socket ${socket.id} joined room user:${userId}`);
      }
    });

    // Join authorities notification room
    socket.on('join_authorities', () => {
      socket.join('authorities');
      console.log(`Socket ${socket.id} joined room: authorities`);
    });

    // Leave a user room
    socket.on('leave_user', (userId) => {
      if (userId) {
        socket.leave(`user:${userId}`);
        console.log(`Socket ${socket.id} left room user:${userId}`);
      }
    });

    // Disconnect event
    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });
};

/**
 * Utility functions to emit socket events from services.
 */
export const socketEvents = {
  /**
   * Send notification to a specific citizen user.
   */
  notifyUser: (io, userId, eventName, data) => {
    if (io) {
      io.to(`user:${userId}`).emit(eventName, data);
    }
  },

  /**
   * Broadcast notification to all authorities.
   */
  notifyAuthorities: (io, eventName, data) => {
    if (io) {
      io.to('authorities').emit(eventName, data);
    }
  },

  /**
   * Broadcast public event (e.g. upvote updates, comments).
   */
  broadcastPublic: (io, eventName, data) => {
    if (io) {
      io.emit(eventName, data);
    }
  },
};

export default initSocket;
