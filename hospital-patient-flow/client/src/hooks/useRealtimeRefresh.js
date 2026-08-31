import { useEffect } from 'react';
import { getSocket } from '../services/socket';

export const useRealtimeRefresh = (callback) => {
  useEffect(() => {
    const socket = getSocket();
    const events = ['bedUpdated', 'patientAdmitted', 'patientTransferred', 'patientDischarged', 'dashboardUpdated', 'notificationCreated'];
    events.forEach((event) => socket.on(event, callback));
    return () => events.forEach((event) => socket.off(event, callback));
  }, [callback]);
};
