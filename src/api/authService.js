import axiosInstance from './axios';

/**
 * Login a user.
 * The FastAPI backend expects OAuth2PasswordRequestForm,
 * which means the body must be x-www-form-urlencoded — not JSON.
 *
 * @param {string} username  - e.g. "jane.doe"
 * @param {string} password
 * @returns {Promise<{access_token: string, token_type: string, role: string}>}
 */
export const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await axiosInstance.post('/users/login_token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return response.data;
};

/**
 * Accept an invitation and set a new password.
 *
 * @param {string} token        - The invite JWT from the email link's query param
 * @param {string} new_password
 * @returns {Promise<{message: string}>}
 */
export const acceptInvite = async (token, new_password) => {
    const response = await axiosInstance.post('/users/set_new_password', {
        token,
        new_password,
    });

    return response.data;
};
