import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    // === STATE MANAGEMENT ===
    const [resources, setResources] = useState([]);
    const [selectedResource, setSelectedResource] = useState(null);
    const [bookingData, setBookingData] = useState({ start_time: '', end_time: '', purpose: '' });
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    
    // UI State
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'queue', 'ledger', 'my-bookings'
    
    // Data States
    const [queue, setQueue] = useState([]);
    const [myBookings, setMyBookings] = useState([]); 
    const [resourceSchedule, setResourceSchedule] = useState([]);
    const [ledger, setLedger] = useState([]); 

    const navigate = useNavigate();

    // === AUTH & ROLE MANAGEMENT ===
    const token = sessionStorage.getItem('token');
    let userRole = 4; 
    let userEmail = '';
    let userName = '';

    
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log("THE RAW TOKEN PAYLOAD:", payload);
            userRole = payload.role;
            userEmail = payload.email || 'User';
            userName = sessionStorage.getItem('userName') || 'User';
        } catch (e) {
            console.error("Invalid token format");
        }
    }

    const getRoleName = (roleId) => {
        switch(roleId) {
            case 1: return 'Admin';
            case 2: return 'Club Secretary';
            case 3: return 'Faculty Incharge';
            case 4: return 'Student';
            default: return 'User';
        }
    };

    // === DATA FETCHING ===
    const fetchResources = async () => {
        try {
            const { data } = await axiosClient.get('/resources');
            setResources(data);
        } catch (error) {
            console.error('Failed to fetch resources', error);
        }
    };

    const fetchQueue = async () => {
        try {
            const { data } = await axiosClient.get('/bookings/queue');
            setQueue(data);
        } catch (error) {
            console.error('Failed to fetch queue', error);
        }
    };

    const fetchMyBookings = async () => {
        try {
            const { data } = await axiosClient.get('/bookings/me');
            setMyBookings(data);
        } catch (error) {
            console.error('Failed to fetch personal bookings', error);
        }
    };

    const fetchLedger = async () => {
        if (userRole === 4) return; 
        try {
            const { data } = await axiosClient.get('/bookings/ledger');
            setLedger(data);
        } catch (error) {
            console.error('Failed to fetch ledger', error);
        }
    };

    useEffect(() => {
        fetchResources();
        if (userRole === 4) {
            fetchMyBookings(); 
        } else {
            fetchQueue(); 
            fetchLedger(); 
        }
    }, [userRole]);

    useEffect(() => {
        if (selectedResource) {
            const fetchSchedule = async () => {
                try {
                    const { data } = await axiosClient.get(`/bookings/resource/${selectedResource.resource_id}`);
                    setResourceSchedule(data);
                } catch (err) {
                    console.error('Failed to fetch schedule', err);
                }
            };
            fetchSchedule();
        } else {
            setResourceSchedule([]); 
        }
    }, [selectedResource]);

    // === ACTIONS ===
    const handleLogout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userName');
        navigate('/');
    };

    const submitBooking = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        try {
            await axiosClient.post('/bookings', {
                resource_id: selectedResource.resource_id,
                start_time: bookingData.start_time,
                end_time: bookingData.end_time,
                purpose: bookingData.purpose
            });
            
            setSuccessMsg('Booking submitted successfully!');
            setTimeout(() => {
                setSelectedResource(null);
                setSuccessMsg('');
                setBookingData({ start_time: '', end_time: '', purpose: '' });
                fetchResources();
                if (userRole === 4) fetchMyBookings(); 
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to process booking.');
        }
    };

    const handleQueueAction = async (bookingId, newStatus) => {
        try {
            await axiosClient.patch(`/bookings/${bookingId}/status`, { new_status: newStatus });
            fetchQueue();
            fetchLedger();
            fetchResources();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to update status");
        }
    };

    const toggleMaintenance = async (resource) => {
        const isCurrentlyBroken = resource.status === 'maintenance';
        const newStatus = isCurrentlyBroken ? 'available' : 'maintenance';
        
        let eta = null;
        if (newStatus === 'maintenance') {
            // Quick native prompt to ask the admin when it will be fixed
            const days = prompt("How many days will this be in maintenance?");
            if (!days) return; // Cancel if they click cancel
            
            const date = new Date();
            date.setDate(date.getDate() + parseInt(days));
            eta = date.toISOString();
        }

        try {
            await axiosClient.patch(`/resources/${resource.resource_id}/maintenance`, {
                status: newStatus,
                eta: eta
            });
            fetchResources(); // Refresh the grid
        } catch (err) {
            alert("Failed to update status");
        }
    };

    // === HELPERS ===
    const getStatusColor = (status) => {
        switch(status?.toLowerCase()) {
            case 'available': return 'text-green-500';
            case 'reserved': return 'text-yellow-500';
            case 'in_use': return 'text-blue-500';
            case 'maintenance': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    const renderApprovalBadge = (status) => {
        switch(status) {
            case 'pending': return <span className="bg-yellow-900/30 text-yellow-500 px-2 py-1 rounded text-xs font-bold border border-yellow-900/50">PENDING</span>;
            case 'approved_by_secretary': return <span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-xs font-bold border border-blue-900/50">SEC. APPROVED</span>;
            case 'approved_by_faculty': return <span className="bg-green-900/30 text-green-500 px-2 py-1 rounded text-xs font-bold border border-green-900/50">FULLY APPROVED</span>;
            case 'rejected': return <span className="bg-red-900/30 text-red-500 px-2 py-1 rounded text-xs font-bold border border-red-900/50">REJECTED</span>;
            default: return <span>{status}</span>;
        }
    };

    // === RENDER ===
    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-[#0B0F19] text-gray-100' : 'bg-gray-50 text-gray-800'} font-sans relative transition-colors duration-200`}>
            
            <nav className={`px-8 py-5 flex justify-between items-center ${isDarkMode ? 'bg-[#0B0F19]' : 'bg-white border-b border-gray-200'} sticky top-0 z-10`}>
                <h1 className="text-2xl font-bold tracking-tight">Resource Dashboard</h1>
                <div className="flex items-center space-x-4">
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-md ${isDarkMode ? 'bg-[#1A202C] hover:bg-gray-800' : 'bg-gray-100 hover:bg-gray-200'} transition`}>
                        {isDarkMode ? '☀️' : '🌙'}
                    </button>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${isDarkMode ? 'bg-[#1A202C] text-[#818CF8]' : 'bg-indigo-50 text-indigo-600'}`}>
                        {getRoleName(userRole)}
                    </span>
                    {/* NEW: Stacked Name and Email UI */}
                    <div className="flex flex-col text-right mr-2">
                        <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {userName}
                        </span>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {userEmail}
                        </span>
                    </div>
                    <button onClick={handleLogout} className={`text-sm font-medium px-4 py-1.5 rounded border transition ${isDarkMode ? 'border-red-900/50 text-red-500 hover:bg-red-900/20' : 'border-red-200 text-red-600 hover:bg-red-50'}`}>
                        Logout
                    </button>
                </div>
            </nav>

            {/* TAB NAVIGATION */}
            <div className={`px-8 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="flex space-x-6">
                    <button 
                        onClick={() => setActiveTab('inventory')}
                        className={`py-4 text-sm font-medium border-b-2 transition ${activeTab === 'inventory' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        Campus Inventory
                    </button>
                    
                    {userRole === 4 ? (
                        <button 
                            onClick={() => setActiveTab('my-bookings')}
                            className={`py-4 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeTab === 'my-bookings' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            My Bookings
                        </button>
                    ) : (
                        <>
                            <button 
                                onClick={() => setActiveTab('queue')}
                                className={`py-4 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeTab === 'queue' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                            >
                                Action Queue
                                {queue.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{queue.length}</span>}
                            </button>
                            <button 
                                onClick={() => setActiveTab('ledger')}
                                className={`py-4 text-sm font-medium border-b-2 transition ${activeTab === 'ledger' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                            >
                                {userRole === 2 ? 'Club Ledger' : 'Master Ledger'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <main className="max-w-7xl mx-auto p-8 pt-6">
                
                {/* --- TAB 1: INVENTORY GRID --- */}
                {activeTab === 'inventory' && (
                    <>
                        <div className="mb-8">
                            <input type="text" placeholder="🔍 Search resources..." className={`w-full max-w-md px-4 py-2.5 rounded-lg border-none focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-[#1A202C] text-white placeholder-gray-500' : 'bg-white shadow-sm text-gray-800 placeholder-gray-400'}`} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {resources.map((res) => (
                                <div key={res.resource_id} className={`p-6 rounded-xl border ${isDarkMode ? 'bg-[#151923] border-gray-800' : 'bg-white border-gray-200'} shadow-sm flex flex-col justify-between transition-colors relative overflow-hidden`}>
                                    
                                    {/* Admin-Only Wrench Button */}
                                    {userRole === 1 && (
                                        <button 
                                            onClick={() => toggleMaintenance(res)}
                                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 transition"
                                            title={res.status === 'maintenance' ? 'Mark Available' : 'Send to Maintenance'}
                                        >
                                            {res.status === 'maintenance' ? '✅' : '🔧'}
                                        </button>
                                    )}

                                    <div className="flex justify-between items-start mb-6 pr-8">
                                        <h3 className="font-semibold text-lg">{res.resource_name}</h3>
                                        <span className={`text-xs font-bold uppercase tracking-wider ${getStatusColor(res.status)}`}>{res.status.replace('_', ' ')}</span>
                                    </div>
                                    
                                    <div className="space-y-3 mb-6 text-sm">
                                        <div className="flex justify-between items-center border-b pb-2 border-opacity-10 border-gray-500">
                                            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>ID:</span>
                                            <span className="font-mono">#{res.resource_id}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b pb-2 border-opacity-10 border-gray-500">
                                            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>Rate:</span>
                                            <span>₹{res.hourly_rate}/hr</span>
                                        </div>
                                        
                                        {/* NEW: Show the ETA if it's broken */}
                                        {res.status === 'maintenance' && res.maintenance_eta && (
                                            <div className="flex justify-between items-center pt-1">
                                                <span className="text-red-400/80 text-xs font-medium">Expected Return:</span>
                                                <span className="text-red-400 text-xs font-bold">
                                                    {new Date(res.maintenance_eta).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <button 
                                        onClick={() => setSelectedResource(res)}
                                        disabled={res.status !== 'available'}
                                        className={`w-full py-2.5 rounded-lg font-medium transition ${res.status === 'available' ? 'bg-[#2563EB] text-white hover:bg-blue-600 shadow-lg shadow-blue-900/20' : isDarkMode ? 'bg-[#1A202C] text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                    >
                                        {res.status === 'available' ? 'Book Resource' : 'Unavailable'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* --- TAB 2: ACTION QUEUE (Approvers) --- */}
                {activeTab === 'queue' && userRole !== 4 && (
                    <div className={`rounded-xl border overflow-hidden shadow-sm ${isDarkMode ? 'bg-[#151923] border-gray-800' : 'bg-white border-gray-200'}`}>
                        <table className="w-full text-left text-sm">
                            <thead className={`text-xs uppercase bg-opacity-50 ${isDarkMode ? 'bg-[#1A202C] text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                                <tr>
                                    <th className="px-6 py-4">Resource</th>
                                    <th className="px-6 py-4">Requester</th>
                                    <th className="px-6 py-4">Date/Time</th>
                                    <th className="px-6 py-4">Purpose</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
                                {queue.length === 0 ? (
                                    <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No pending requests in your queue.</td></tr>
                                ) : (
                                    queue.map((req) => (
                                        <tr key={req.booking_id} className={`transition ${isDarkMode ? 'hover:bg-[#1A202C]' : 'hover:bg-gray-50'}`}>
                                            <td className="px-6 py-4 font-medium">{req.resource_name}</td>
                                            <td className="px-6 py-4">{req.requester_name}</td>
                                            <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                                {new Date(req.start_time).toLocaleString()} <br/>to {new Date(req.end_time).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 max-w-xs truncate" title={req.purpose}>{req.purpose}</td>
                                            <td className="px-6 py-4 flex justify-end gap-2 items-center h-full">
                                                <button onClick={() => handleQueueAction(req.booking_id, 'rejected')} className={`px-3 py-1.5 text-xs font-medium rounded border transition ${isDarkMode ? 'border-red-900/50 text-red-500 hover:bg-red-900/20' : 'border-red-200 text-red-600 hover:bg-red-50'}`}>Reject</button>
                                                <button onClick={() => handleQueueAction(req.booking_id, userRole === 2 ? 'approved_by_secretary' : 'approved_by_faculty')} className="px-3 py-1.5 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-900/20 transition">{userRole === 3 ? 'Final Approve' : 'Approve'}</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- TAB 3: THE LEDGER (Approvers) --- */}
                {activeTab === 'ledger' && userRole !== 4 && (
                    <div className={`rounded-xl border overflow-hidden shadow-sm ${isDarkMode ? 'bg-[#151923] border-gray-800' : 'bg-white border-gray-200'}`}>
                        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-800 bg-[#1A202C]' : 'border-gray-200 bg-gray-50'}`}>
                            <h2 className="font-semibold text-sm">
                                {userRole === 3 ? 'Campus-Wide Booking History' : 'Club Member Booking History'}
                            </h2>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className={`text-xs uppercase bg-opacity-50 ${isDarkMode ? 'bg-[#1A202C] text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                                <tr>
                                    <th className="px-6 py-4">Resource</th>
                                    <th className="px-6 py-4">Requester</th>
                                    <th className="px-6 py-4">Time Slot</th>
                                    <th className="px-6 py-4">Purpose</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
                                {ledger.length === 0 ? (
                                    <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No booking history found.</td></tr>
                                ) : (
                                    ledger.map((req) => (
                                        <tr key={req.booking_id} className={`transition ${isDarkMode ? 'hover:bg-[#1A202C]' : 'hover:bg-gray-50'}`}>
                                            <td className="px-6 py-4 font-medium">{req.resource_name}</td>
                                            <td className="px-6 py-4">{req.requester_name}</td>
                                            <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                                {new Date(req.start_time).toLocaleString()} <br/>to {new Date(req.end_time).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 max-w-xs truncate" title={req.purpose}>{req.purpose}</td>
                                            <td className="px-6 py-4 text-right">
                                                {renderApprovalBadge(req.approval_status)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- TAB 4: MY BOOKINGS (Students) --- */}
                {activeTab === 'my-bookings' && userRole === 4 && (
                    <div className={`rounded-xl border overflow-hidden shadow-sm ${isDarkMode ? 'bg-[#151923] border-gray-800' : 'bg-white border-gray-200'}`}>
                        <table className="w-full text-left text-sm">
                            <thead className={`text-xs uppercase bg-opacity-50 ${isDarkMode ? 'bg-[#1A202C] text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                                <tr>
                                    <th className="px-6 py-4">Resource</th>
                                    <th className="px-6 py-4">Time Slot</th>
                                    <th className="px-6 py-4">Purpose</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
                                {myBookings.length === 0 ? (
                                    <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500">You haven't made any booking requests yet.</td></tr>
                                ) : (
                                    myBookings.map((req) => (
                                        <tr key={req.booking_id} className={`transition ${isDarkMode ? 'hover:bg-[#1A202C]' : 'hover:bg-gray-50'}`}>
                                            <td className="px-6 py-4 font-medium">{req.resource_name}</td>
                                            <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                                {new Date(req.start_time).toLocaleString()} <br/>to {new Date(req.end_time).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 max-w-xs truncate" title={req.purpose}>{req.purpose}</td>
                                            <td className="px-6 py-4 text-right">
                                                {renderApprovalBadge(req.approval_status)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* --- BOOKING MODAL --- */}
            {selectedResource && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className={`w-full max-w-md p-8 rounded-xl shadow-2xl border ${isDarkMode ? 'bg-[#151923] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold">Book {selectedResource.resource_name}</h3>
                            <button onClick={() => setSelectedResource(null)} className="text-gray-400 hover:text-white transition text-lg">✕</button>
                        </div>
                        
                        {/* Schedule Viewer */}
                        <div className="mb-6">
                            <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Blocked Times:</h4>
                            {resourceSchedule.length === 0 ? (
                                <p className="text-xs text-green-500 bg-green-900/20 p-2 rounded border border-green-900/50">No upcoming reservations. Fully available!</p>
                            ) : (
                                <ul className={`text-xs space-y-1.5 max-h-32 overflow-y-auto pr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {resourceSchedule.map((slot, idx) => {
                                        const start = new Date(slot.start_time);
                                        const end = new Date(slot.end_time);
                                        const dateStr = start.toLocaleDateString([], { month: 'short', day: 'numeric' });
                                        const timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                        return (
                                            <li key={idx} className={`flex justify-between p-2 rounded ${isDarkMode ? 'bg-[#1A202C]' : 'bg-gray-100'}`}>
                                                <span>{dateStr}, {timeStr}</span>
                                                <span className="opacity-75 uppercase text-[10px] tracking-wider">{slot.approval_status.replace(/_/g, ' ')}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {error && <div className="mb-4 p-3 bg-red-900/20 text-red-400 text-sm rounded border border-red-900/50">{error}</div>}
                        {successMsg && <div className="mb-4 p-3 bg-green-900/20 text-green-400 text-sm rounded border border-green-900/50">{successMsg}</div>}
                        
                        <form onSubmit={submitBooking} className="space-y-4">
                            <div>
                                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Start Time</label>
                                <input type="datetime-local" required className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none ${isDarkMode ? 'bg-[#1A202C] border-gray-800 text-white' : 'bg-white border-gray-300'}`} onChange={(e) => setBookingData({...bookingData, start_time: e.target.value})} />
                            </div>
                            <div>
                                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>End Time</label>
                                <input type="datetime-local" required className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none ${isDarkMode ? 'bg-[#1A202C] border-gray-800 text-white' : 'bg-white border-gray-300'}`} onChange={(e) => setBookingData({...bookingData, end_time: e.target.value})} />
                            </div>
                            <div>
                                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Purpose</label>
                                <textarea required placeholder="Briefly describe the usage..." className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm h-24 resize-none outline-none ${isDarkMode ? 'bg-[#1A202C] border-gray-800 text-white placeholder-gray-600' : 'bg-white border-gray-300 placeholder-gray-400'}`} onChange={(e) => setBookingData({...bookingData, purpose: e.target.value})}></textarea>
                            </div>
                            <button type="submit" className="w-full bg-[#2563EB] text-white p-3 rounded-lg hover:bg-blue-600 transition mt-4 font-medium shadow-lg shadow-blue-900/20">Confirm Booking</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}