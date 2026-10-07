import axiosInstance from './axios';

export const getConstraints = async (params = {}) => {
    const response = await axiosInstance.get('/talent_constraints/', { params });
    return response.data;
};

export const getConstraint = async (constraintId) => {
    const response = await axiosInstance.get(`/talent_constraints/${constraintId}`);
    return response.data;
};

export const createConstraint = async (constraintData) => {
    const response = await axiosInstance.post('/talent_constraints/', constraintData);
    return response.data;
};

export const deleteConstraint = async (constraintId) => {
    const response = await axiosInstance.delete(`/talent_constraints/${constraintId}`);
    return response.data;
};

export const createRule = async (ruleData) => {
    const response = await axiosInstance.post('/constraint_rules/', ruleData);
    return response.data;
};

export const deleteRule = async (ruleId) => {
    const response = await axiosInstance.delete(`/constraint_rules/${ruleId}`);
    return response.data;
};
