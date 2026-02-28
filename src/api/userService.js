import axiosInstance from './axios';

/**
 * List all users (superuser only).
 */
export const listUsers = async () => {
    const response = await axiosInstance.get('/users/list');
    return response.data;
};

/**
 * Create a new user account.
 */
export const createUser = async (data) => {
    const response = await axiosInstance.post('/users/create', data);
    return response.data;
};

/**
 * Send an invitation email to a user by their ID.
 */
export const sendInvite = async (userId) => {
    const response = await axiosInstance.post('/users/send_invite', { user_id: userId });
    return response.data;
};
