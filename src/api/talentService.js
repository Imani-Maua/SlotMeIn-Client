import axiosInstance from './axios';
import { getCached, setCached, invalidatePrefixed } from '../utils/apiCache';

export const getTalents = async () => {
    const cached = getCached('talents:all');
    if (cached) return cached;
    const response = await axiosInstance.get('/talents/');
    setCached('talents:all', response.data);
    return response.data;
};

export const getTalent = async (talentId) => {
    const response = await axiosInstance.get(`/talents/${talentId}`);
    return response.data;
};

export const createTalent = async (talentData) => {
    const response = await axiosInstance.post('/talents/', talentData);
    invalidatePrefixed('talents:');
    return response.data;
};

export const updateTalent = async (talentId, talentData) => {
    const response = await axiosInstance.put(`/talents/${talentId}`, talentData);
    invalidatePrefixed('talents:');
    return response.data;
};
