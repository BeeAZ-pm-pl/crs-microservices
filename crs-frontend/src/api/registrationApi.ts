import axiosClient from './axiosClient';
import type { Registration, RegistrationRequest } from '../types/registration';

export const registerCourse = (payload: RegistrationRequest) => {
  return axiosClient.post<Registration>('/api/registrations', payload);
};

export const cancelRegistration = (id: number) => {
  return axiosClient.delete(`/api/registrations/${id}`);
};

export const getMyRegistrations = () => {
  return axiosClient.get<Registration[]>('/api/registrations/my');
};
