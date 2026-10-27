import axiosInstance from './axios';

export const getStaffingRules = async () => {
    const response = await axiosInstance.get('/staffing_rules/');
    return response.data;
};

export const updateStaffingRule = async (role, tier, count) => {
    const response = await axiosInstance.patch(`/staffing_rules/${role}/${tier}`, { count });
    return response.data;
};
