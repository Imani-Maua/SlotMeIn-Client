import axiosInstance from './axios';

export const getTalents = async () => {
    const response = await axiosInstance.get('/talents/');
    return response.data;
};

export const getTalent = async (talentId) => {
    const response = await axiosInstance.get(`/talents/${talentId}`);
    return response.data;
};

export const createTalent = async (talentData) => {
    const response = await axiosInstance.post('/talents/', talentData);
    return response.data;
};

export const updateTalent = async (talentId, talentData) => {
    const response = await axiosInstance.put(`/talents/${talentId}`, talentData);
    return response.data;
};
