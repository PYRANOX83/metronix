'use client';

import { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartData,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  location: string;
  createdAt: string;
  citizen: {
    id: string;
    name: string;
    email: string;
  };
  department?: {
    id: string;
    name: string;
  };
  solver?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

interface Statistics {
  totalComplaints: number;
  pendingComplaints: number;
  inProgressComplaints: number;
  resolvedComplaints: number;
  departmentStats: { department: string; count: number }[];
  priorityStats: { priority: string; count: number }[];
}

interface ReferenceData {
  departments: { id: string; name: string }[];
  solvers: { id: string; name: string; email: string }[];
}

export default function EnhancedAdminDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalComplaints: 0,
    pendingComplaints: 0,
    inProgressComplaints: 0,
    resolvedComplaints: 0,
    departmentStats: [],
    priorityStats: [],
  });
  const [referenceData, setReferenceData] = useState<ReferenceData>({
    departments: [],
    solvers: [],
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    priority: '',
    status: '',
    department: '',
    solver: '',
  });
  const [chartData, setChartData] = useState<ChartData<'line'> | null>(null);
  const [updateModal, setUpdateModal] = useState<{
    isOpen: boolean;
    complaint: Complaint | null;
    action: 'status' | 'assign' | null;
  }>({ isOpen: false, complaint: null, action: null });

  // Fetch all data
  useEffect(() => {
    fetchData();
    fetchAnalytics();
    fetchReferenceData();
  }, []);

  // Fetch complaints when filters change
  useEffect(() => {
    fetchComplaints();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      const [statsRes, complaintsRes] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/complaints'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStatistics({
          totalComplaints: statsData.totalComplaints || 0,
          pendingComplaints: statsData.pendingComplaints || 0,
          inProgressComplaints: statsData.inProgressComplaints || 0,
          resolvedComplaints: statsData.resolvedComplaints || 0,
          departmentStats: statsData.departmentStats || [],
          priorityStats: statsData.priorityStats || [],
        });
      }

      if (complaintsRes.ok) {
        const complaintsData = await complaintsRes.json();
        setComplaints(complaintsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/admin/complaints?${params}`);
      if (response.ok) {
        const data = await response.json();
        setComplaints(data);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics');
      if (response.ok) {
        const data = await response.json();
        
        // Prepare chart data
        const labels = data.complaintsByDay.map((item: { date: string; count: number }) => 
          new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        );
        const values = data.complaintsByDay.map((item: { date: string; count: number }) => item.count);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Complaints per Day',
              data: values,
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
            },
          ],
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const response = await fetch('/api/admin/reference');
      if (response.ok) {
        const data = await response.json();
        setReferenceData(data);
      }
    } catch (error) {
      console.error('Error fetching reference data:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleUpdateComplaint = async (complaintId: string, updateData: { status?: string; solverId?: string | null; departmentId?: string; priority?: string }) => {
    try {
      const response = await fetch('/api/admin/complaints', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaintId, ...updateData }),
      });

      if (response.ok) {
        // Refresh data
        fetchData();
        fetchComplaints();
        setUpdateModal({ isOpen: false, complaint: null, action: null });
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating complaint:', error);
      alert('Error updating complaint');
    }
  };

  const openUpdateModal = (complaint: Complaint, action: 'status' | 'assign') => {
    setUpdateModal({ isOpen: true, complaint, action });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'SUBMITTED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'NORMAL': return 'bg-blue-100 text-blue-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Complaints by Day (Last 30 Days)',
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Monitor and manage all complaints and system statistics</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Complaints</h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">{statistics.totalComplaints}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900">Pending</h3>
            <p className="mt-2 text-3xl font-bold text-yellow-600">{statistics.pendingComplaints}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900">In Progress</h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">{statistics.inProgressComplaints}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900">Resolved</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">{statistics.resolvedComplaints}</p>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Line Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Complaints Trend</h3>
            {chartData ? (
              <Line options={chartOptions} data={chartData} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Loading chart...
              </div>
            )}
          </div>

          {/* Department Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Complaints by Department</h3>
            {statistics.departmentStats.length > 0 ? (
              <Doughnut
                data={{
                  labels: statistics.departmentStats.map(d => d.department),
                  datasets: [{
                    data: statistics.departmentStats.map(d => d.count),
                    backgroundColor: [
                      '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
                      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
                    ],
                  }],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No department data available
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Categories</option>
              <option value="ROADS">Roads</option>
              <option value="WATER">Water</option>
              <option value="ELECTRICITY">Electricity</option>
              <option value="SANITATION">Sanitation</option>
              <option value="NOISE">Noise</option>
              <option value="PARKING">Parking</option>
              <option value="OTHER">Other</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Departments</option>
              {referenceData.departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>

            <select
              value={filters.solver}
              onChange={(e) => handleFilterChange('solver', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Solvers</option>
              {referenceData.solvers.map(solver => (
                <option key={solver.id} value={solver.id}>{solver.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">All Complaints ({complaints.length})</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {complaints.map((complaint) => (
                  <tr key={complaint.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{complaint.title}</div>
                      <div className="text-sm text-gray-500">{complaint.citizen.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{complaint.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {complaint.department?.name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {complaint.solver?.user.name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openUpdateModal(complaint, 'status')}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Update Status
                      </button>
                      <button
                        onClick={() => openUpdateModal(complaint, 'assign')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {complaints.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No complaints found matching your filters.
            </div>
          )}
        </div>

        {/* Update Modal */}
        {updateModal.isOpen && updateModal.complaint && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {updateModal.action === 'status' ? 'Update Status' : 'Assign Complaint'}
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Complaint: {updateModal.complaint.title}</p>
                
                {updateModal.action === 'status' ? (
                  <select
                    id="status"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    defaultValue={updateModal.complaint.status}
                    onChange={(e) => {
                      handleUpdateComplaint(updateModal.complaint!.id, { status: e.target.value });
                    }}
                  >
                    <option value="SUBMITTED">Submitted</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                ) : (
                  <div className="space-y-3">
                    <select
                      id="department"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      onChange={(e) => {
                        const deptId = e.target.value;
                        if (deptId) {
                          handleUpdateComplaint(updateModal.complaint!.id, { departmentId: deptId });
                        }
                      }}
                    >
                      <option value="">Select Department</option>
                      {referenceData.departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                    
                    <select
                      id="solver"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      onChange={(e) => {
                        const solverId = e.target.value;
                        if (solverId) {
                          handleUpdateComplaint(updateModal.complaint!.id, { solverId: solverId });
                        }
                      }}
                    >
                      <option value="">Select Solver</option>
                      {referenceData.solvers.map(solver => (
                        <option key={solver.id} value={solver.id}>{solver.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setUpdateModal({ isOpen: false, complaint: null, action: null })}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}