import axiosInstance from './axios';
import { getCached, setCached, invalidatePrefixed } from '../utils/apiCache';

export const getConstraints = async (params = {}) => {
    const hasParams = Object.keys(params).length > 0;
    const cacheKey = hasParams ? `constraints:${JSON.stringify(params)}` : 'constraints:all';
    const cached = getCached(cacheKey);
    if (cached) return cached;
    const response = await axiosInstance.get('/talent_constraints/', { params });
    setCached(cacheKey, response.data);
    return response.data;
};

export const getConstraint = async (constraintId) => {
    const response = await axiosInstance.get(`/talent_constraints/${constraintId}`);
    return response.data;
};

export const createConstraint = async (constraintData) => {
    const response = await axiosInstance.post('/talent_constraints/', constraintData);
    invalidatePrefixed('constraints:');
    return response.data;
};

export const deleteConstraint = async (constraintId) => {
    const response = await axiosInstance.delete(`/talent_constraints/${constraintId}`);
    invalidatePrefixed('constraints:');
    return response.data;
};

export const createRule = async (ruleData) => {
    const response = await axiosInstance.post('/constraint_rules/', ruleData);
    invalidatePrefixed('constraints:');
    return response.data;
};

export const deleteRule = async (ruleId) => {
    const response = await axiosInstance.delete(`/constraint_rules/${ruleId}`);
    invalidatePrefixed('constraints:');
    return response.data;
};
