import axiosInstance from './axios';

// Schedule Generation & History 
export const generateSchedule = async (startDate) => {
    const response = await axiosInstance.post('/schedule/generate', { start_date: startDate });
    return response.data;
};

export const commitSchedule = async (data, scheduleStatus = 'final') => {
    const response = await axiosInstance.post('/schedule/commit', {
        ...data,
        status: scheduleStatus,
    });
    return response.data;
};

export const publishSchedule = async (scheduleId) => {
    const response = await axiosInstance.patch(`/schedule/${scheduleId}/status`, { status: 'final' });
    return response.data;
};

export const deleteSchedule = async (scheduleId) => {
    await axiosInstance.delete(`/schedule/${scheduleId}`);
};

export const getSchedules = async () => {
    const response = await axiosInstance.get('/schedule/');
    return response.data;
};

export const getSchedule = async (scheduleId) => {
    const response = await axiosInstance.get(`/schedule/${scheduleId}`);
    return response.data;
};

//Manual Assignments (Overrides) 

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

export const validateAssignment = async (data) => {
    const response = await axiosInstance.post('/schedule/validate_assignment', data);
    return response.data; // { violations: string[] }
};
