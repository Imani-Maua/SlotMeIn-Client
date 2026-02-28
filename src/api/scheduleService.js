import axiosInstance from './axios';

// ─── Schedule Generation & History ───────────────────────────────────────────

export const generateSchedule = async (startDate) => {
    // startDate should be YYYY-MM-DD
    const response = await axiosInstance.post('/schedule/generate', { start_date: startDate });
    return response.data;
};

export const commitSchedule = async (data) => {
    const response = await axiosInstance.post('/schedule/commit', data);
    return response.data;
};

export const getSchedules = async () => {
    const response = await axiosInstance.get('/schedule/');
    return response.data;
};

export const getSchedule = async (scheduleId) => {
    const response = await axiosInstance.get(`/schedule/${scheduleId}`);
    return response.data;
};

// ─── Manual Assignments (Overrides) ──────────────────────────────────────────

export const createAssignment = async (data) => {
    const response = await axiosInstance.post('/schedule/assignments/', data);
    return response.data;
};

export const updateAssignment = async (assignmentId, data) => {
    const response = await axiosInstance.patch(`/schedule/assignments/${assignmentId}`, data);
    return response.data;
};

export const deleteAssignment = async (assignmentId) => {
    await axiosInstance.delete(`/schedule/assignments/${assignmentId}`);
};
