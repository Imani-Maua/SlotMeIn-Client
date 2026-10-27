import axiosInstance from './axios';
import { getCached, setCached, invalidate, invalidatePrefixed } from '../utils/apiCache';

// ─── Schedule Generation ──────────────────────────────────────────────────────

export const generateSchedule = async (startDate) => {
    const response = await axiosInstance.post('/schedule/generate', { start_date: startDate });
    return response.data;
};

export const getSchedulerConfig = async () => {
    const response = await axiosInstance.get('/schedule/config');
    return response.data;
};

export const saveSchedulerConfig = async (config) => {
    const response = await axiosInstance.put('/schedule/config', config);
    return response.data;
};

export const getJobResult = async (jobId) => {
    const response = await axiosInstance.get(`/schedule/jobs/${jobId}`);
    return response.data;
};

// ─── Schedule CRUD ────────────────────────────────────────────────────────────

export const getSchedules = async () => {
    const cached = getCached('schedules:list');
    if (cached) return cached;
    const response = await axiosInstance.get('/schedule/');
    setCached('schedules:list', response.data, 30_000);
    return response.data;
};

export const getSchedule = async (scheduleId) => {
    const cacheKey = `schedules:${scheduleId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;
    const response = await axiosInstance.get(`/schedule/${scheduleId}`);
    setCached(cacheKey, response.data);
    return response.data;
};

export const commitSchedule = async (data, scheduleStatus = 'final') => {
    const response = await axiosInstance.post('/schedule/commit', { ...data, status: scheduleStatus });
    invalidatePrefixed('schedules:');
    return response.data;
};

export const publishSchedule = async (scheduleId) => {
    const response = await axiosInstance.patch(`/schedule/${scheduleId}/status`, { status: 'final' });
    invalidate('schedules:list', `schedules:${scheduleId}`);
    return response.data;
};

export const deleteSchedule = async (scheduleId) => {
    await axiosInstance.delete(`/schedule/${scheduleId}`);
    invalidate('schedules:list', `schedules:${scheduleId}`);
};

// ─── Manual Assignments ───────────────────────────────────────────────────────

export const createAssignment = async (data) => {
    const response = await axiosInstance.post('/schedule/assignments/', data);
    if (data.schedule_id) invalidate(`schedules:${data.schedule_id}`);
    return response.data;
};

export const updateAssignment = async (assignmentId, data) => {
    const response = await axiosInstance.patch(`/schedule/assignments/${assignmentId}`, data);
    return response.data;
};

export const deleteAssignment = async (assignmentId) => {
    await axiosInstance.delete(`/schedule/assignments/${assignmentId}`);
};

export const validateAssignment = async (data) => {
    const response = await axiosInstance.post('/schedule/validate_assignment', data);
    return response.data;
};
