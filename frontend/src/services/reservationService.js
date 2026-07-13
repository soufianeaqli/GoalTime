import * as directReservationService from './directReservationService';

export const getAllReservations = async () => {
  return directReservationService.getAllReservations();
};

export const getUserReservations = async (username) => {
  return directReservationService.getUserReservations(username);
};

export const createReservation = async (reservationData) => {
  return directReservationService.createReservation(reservationData);
};

export const updateReservation = async (id, reservationData) => {
  const updatedData = {
    name: reservationData.name,
    date: reservationData.date,
    time_slot: reservationData.timeSlot,
    is_paid: reservationData.isPaid
  };
  return directReservationService.updateReservation(id, updatedData);
};

export const deleteReservation = async (id) => {
  return directReservationService.deleteReservation(id);
};

export const checkAvailability = async (terrainId, date, timeSlot) => {
  return directReservationService.checkAvailability(terrainId, date, timeSlot);
};

export const acceptReservation = async (id) => {
  return directReservationService.updateReservation(id, { accepted: true });
};

export const rejectReservation = async (id) => {
  return directReservationService.updateReservation(id, { rejected: true });
};

export const markAsPaid = async (id) => {
  return directReservationService.markAsPaid(id);
};
