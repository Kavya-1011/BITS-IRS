import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// A simple wrapper to protect routes that require a JWT
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/" />;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } 
                />
            </Routes>
        </Router>
    );
}

export default App;