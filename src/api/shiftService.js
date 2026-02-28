import axiosInstance from './axios';

// ─── Shift Periods ────────────────────────────────────────────────────────────

export const getShiftPeriods = async () => {
    const response = await axiosInstance.get('/shift_periods/retrieve_all_periods');
    return response.data;
};

export const getShiftPeriod = async (periodId) => {
    const response = await axiosInstance.get(`/shift_periods/retrieve_period/${periodId}`);
    return response.data;
};

export const createShiftPeriod = async (data) => {
    const response = await axiosInstance.post('/shift_periods/create', data);
    return response.data;
};

export const updateShiftPeriod = async (periodId, data) => {
    const response = await axiosInstance.patch(`/shift_periods/update/${periodId}`, data);
    return response.data;
};

export const deleteShiftPeriod = async (periodId) => {
    await axiosInstance.delete(`/shift_periods/delete/${periodId}`);
};

// ─── Shift Templates ──────────────────────────────────────────────────────────

export const getShiftTemplates = async (params = {}) => {
    const response = await axiosInstance.get('/shift_templates/retrieve_all_templates', { params });
    return response.data;
};

export const createShiftTemplate = async (data) => {
    const response = await axiosInstance.post('/shift_templates/create', data);
    return response.data;
};

export const updateShiftTemplate = async (templateId, data) => {
    const response = await axiosInstance.put(`/shift_templates/update/${templateId}`, data);
    return response.data;
};

export const deleteShiftTemplate = async (templateId) => {
    await axiosInstance.delete(`/shift_templates/delete/${templateId}`);
};
