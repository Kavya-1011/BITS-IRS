import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axiosClient.post('/auth/login', { email, password });
            console.log("BACKEND DIRECT RESPONSE:", data);
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('userName', data.user.name);
            navigate('/dashboard');
        } catch (error) {
            alert('Login failed. Check credentials.');
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">IRS System Login</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input 
                        type="email" 
                        placeholder="BITS Email" 
                        className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" className="w-full bg-black text-white p-3 rounded hover:bg-gray-800 transition">
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
}