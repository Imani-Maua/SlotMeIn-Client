import axiosInstance from './axios';

// ─── Shift Periods ────────────────────────────────────────────────────────────

export const getShiftPeriods = async () => {
    const response = await axiosInstance.get('/shift_periods/');
    return response.data;
};

export const getShiftPeriod = async (periodId) => {
    const response = await axiosInstance.get(`/shift_periods/${periodId}`);
    return response.data;
};

export const createShiftPeriod = async (data) => {
    const response = await axiosInstance.post('/shift_periods/', data);
    return response.data;
};

export const updateShiftPeriod = async (periodId, data) => {
    const response = await axiosInstance.patch(`/shift_periods/${periodId}`, data);
    return response.data;
};

export const deleteShiftPeriod = async (periodId) => {
    await axiosInstance.delete(`/shift_periods/${periodId}`);
};

// ─── Shift Templates ──────────────────────────────────────────────────────────

export const getShiftTemplates = async (params = {}) => {
    const response = await axiosInstance.get('/shift_templates/', { params });
    return response.data;
};

export const createShiftTemplate = async (data) => {
    const response = await axiosInstance.post('/shift_templates/', data);
    return response.data;
};

export const updateShiftTemplate = async (templateId, data) => {
    const response = await axiosInstance.put(`/shift_templates/${templateId}`, data);
    return response.data;
};

export const deleteShiftTemplate = async (templateId) => {
    await axiosInstance.delete(`/shift_templates/${templateId}`);
};
