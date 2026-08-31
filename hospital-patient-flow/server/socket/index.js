let ioInstance;

export const initSocket = (io) => {
  ioInstance = io;
  io.on('connection', (socket) => {
    socket.emit('connected', { message: 'Real-time hospital dashboard connected' });
  });
};

export const emitHospitalEvent = (event, payload = {}) => {
  if (ioInstance) {
    ioInstance.emit(event, payload);
    ioInstance.emit('dashboardUpdated', { changedAt: new Date() });
  }
};
