import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            // Fetch user details or decode the token to extract user information
            // For now, let's assume the user is authenticated
            setUser({ username: 'user@example.com', role: 'User' });
        }
    }, []);

    const login = useCallback(async (username, password) => {
        try {
            const response = await axios.post('http://localhost:3000/login', { username, password });
            const { token, role } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('role', role); // Store the user's role in local storage
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser({ username, role }); 
        } catch (error) {
            throw new Error('Invalid credentials');
        }
    }, []);
    

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => useContext(AuthContext);