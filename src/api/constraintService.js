import axiosInstance from './axios';



export const getConstraints = async (params = {}) => {
    const response = await axiosInstance.get('/talent_constraints/retrieve_all_constraints', { params });
    return response.data;
};

export const getConstraint = async (constraintId) => {
    const response = await axiosInstance.get(`/talent_constraints/retrieve_constraint/${constraintId}`);
    return response.data;
};

export const createConstraint = async (constraintData) => {
    const response = await axiosInstance.post('/talent_constraints/create', constraintData);
    return response.data;
};

export const deleteConstraint = async (constraintId) => {
    const response = await axiosInstance.delete(`/talent_constraints/delete/${constraintId}`);
    return response.data;
};


export const createRule = async (ruleData) => {
    const response = await axiosInstance.post('/constraint_rules/create', ruleData);
    return response.data;
};

export const deleteRule = async (ruleId) => {
    const response = await axiosInstance.delete(`/constraint_rules/delete/${ruleId}`);
    return response.data;
};
