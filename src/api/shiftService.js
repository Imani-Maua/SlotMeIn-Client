import axiosInstance from './axios';
import { getCached, setCached, invalidatePrefixed } from '../utils/apiCache';

// ─── Shift Periods ────────────────────────────────────────────────────────────

export const getShiftPeriods = async () => {
    const cached = getCached('shifts:periods');
    if (cached) return cached;
    const response = await axiosInstance.get('/shift_periods/');
    setCached('shifts:periods', response.data);
    return response.data;
};

export const getShiftPeriod = async (periodId) => {
    const response = await axiosInstance.get(`/shift_periods/${periodId}`);
    return response.data;
};

export const createShiftPeriod = async (data) => {
    const response = await axiosInstance.post('/shift_periods/', data);
    invalidatePrefixed('shifts:');
    return response.data;
};

export const updateShiftPeriod = async (periodId, data) => {
    const response = await axiosInstance.patch(`/shift_periods/${periodId}`, data);
    invalidatePrefixed('shifts:');
    return response.data;
};

export const deleteShiftPeriod = async (periodId) => {
    await axiosInstance.delete(`/shift_periods/${periodId}`);
    invalidatePrefixed('shifts:');
};

// ─── Shift Templates ──────────────────────────────────────────────────────────

export const getShiftTemplates = async (params = {}) => {
    const hasParams = Object.keys(params).length > 0;
    const cacheKey = 'shifts:templates';
    if (!hasParams) {
        const cached = getCached(cacheKey);
        if (cached) return cached;
    }
    const response = await axiosInstance.get('/shift_templates/', { params });
    if (!hasParams) setCached(cacheKey, response.data);
    return response.data;
};

export const createShiftTemplate = async (data) => {
    const response = await axiosInstance.post('/shift_templates/', data);
    invalidatePrefixed('shifts:');
    return response.data;
};

export const updateShiftTemplate = async (templateId, data) => {
    const response = await axiosInstance.put(`/shift_templates/${templateId}`, data);
    invalidatePrefixed('shifts:');
    return response.data;
};

export const deleteShiftTemplate = async (templateId) => {
    await axiosInstance.delete(`/shift_templates/${templateId}`);
    invalidatePrefixed('shifts:');
};
