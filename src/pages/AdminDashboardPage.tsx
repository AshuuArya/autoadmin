import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';
import { Search, Filter, ChevronDown, CheckCircle, Clock, XCircle, ChevronRight, Eye, UserCheck } from 'lucide-react';

// Application type
interface Application {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  preferredBranch: string;
  submittedAt: Date;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
}

const AdminDashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);
  
  // Fetch applications
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('applicationStatus', '!=', 'incomplete'),
          orderBy('applicationStatus'),
          orderBy('submittedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const applicationsData: Application[] = [];
        
        querySnapshot.forEach(doc => {
          const data = doc.data();
          
          if (data.personalInfo && data.academicInfo) {
            applicationsData.push({
              id: doc.id,
              fullName: `${data.personalInfo.firstName} ${data.personalInfo.lastName}`,
              email: data.personalInfo.email,
              phone: data.personalInfo.phone,
              preferredBranch: data.academicInfo.preferredBranch,
              submittedAt: data.submittedAt?.toDate() || new Date(),
              status: data.applicationStatus
            });
          }
        });
        
        setApplications(applicationsData);
        setFilteredApplications(applicationsData);
      } catch (error) {
        console.error('Error fetching applications:', error);
        toast.error('Failed to load applications');
      } finally {
        setLoading(false);
      }
    };
    
    if (isAdmin) {
      fetchApplications();
    }
  }, [isAdmin]);
  
  // Handle search and filters
  useEffect(() => {
    let result = [...applications];
    
    // Search filter
    if (searchTerm) {
      result = result.filter(app => 
        app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.phone.includes(searchTerm)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(app => app.status === statusFilter);
    }
    
    // Branch filter
    if (branchFilter !== 'all') {
      result = result.filter(app => app.preferredBranch === branchFilter);
    }
    
    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'date') {
        return sortDirection === 'asc'
          ? a.submittedAt.getTime() - b.submittedAt.getTime()
          : b.submittedAt.getTime() - a.submittedAt.getTime();
      } else if (sortBy === 'name') {
        return sortDirection === 'asc'
          ? a.fullName.localeCompare(b.fullName)
          : b.fullName.localeCompare(a.fullName);
      } else if (sortBy === 'status') {
        return sortDirection === 'asc'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      }
      return 0;
    });
    
    setFilteredApplications(result);
  }, [applications, searchTerm, statusFilter, branchFilter, sortBy, sortDirection]);
  
  // Update application status
  const updateApplicationStatus = async (id: string, status: 'under_review' | 'approved' | 'rejected') => {
    try {
      const userRef = doc(db, 'users', id);
      await updateDoc(userRef, {
        applicationStatus: status
      });
      
      // Update local state
      setApplications(apps => apps.map(app => 
        app.id === id ? { ...app, status } : app
      ));
      
      toast.success(`Application status updated to ${status.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    }
  };
  
  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };
  
  // Get unique branches
  const uniqueBranches = [...new Set(applications.map(app => app.preferredBranch))];
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock size={12} className="mr-1" /> Submitted</span>;
      case 'under_review':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12} className="mr-1" /> Under Review</span>;
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" /> Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12} className="mr-1" /> Rejected</span>;
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen pt-16 pb-12">
      <div className="container mx-auto px-4 md:px-6 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-gray-600">
              Manage student applications and admissions
            </p>
          </div>
          <div className="mt-4 md:mt-0 bg-blue-50 px-3 py-2 rounded-md">
            <span className="text-sm font-medium text-blue-800">
              {filteredApplications.length} {filteredApplications.length === 1 ? 'application' : 'applications'} found
            </span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={18} className="text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <ChevronDown size={16} className="text-gray-500" />
              </div>
            </div>

            {/* Branch Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={18} className="text-gray-400" />
              </div>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none"
              >
                <option value="all">All Branches</option>
                {uniqueBranches.map((branch, index) => (
                  <option key={index} value={branch}>{branch}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <ChevronDown size={16} className="text-gray-500" />
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Sort by:
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSortBy('date');
                  setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
                }}
                className={`px-3 py-1 text-xs rounded-md ${
                  sortBy === 'date' 
                    ? 'bg-blue-100 text-blue-800 font-medium' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Date {sortBy === 'date' && (sortDirection === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => {
                  setSortBy('name');
                  setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
                }}
                className={`px-3 py-1 text-xs rounded-md ${
                  sortBy === 'name' 
                    ? 'bg-blue-100 text-blue-800 font-medium' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Name {sortBy === 'name' && (sortDirection === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => {
                  setSortBy('status');
                  setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
                }}
                className={`px-3 py-1 text-xs rounded-md ${
                  sortBy === 'status' 
                    ? 'bg-blue-100 text-blue-800 font-medium' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Status {sortBy === 'status' && (sortDirection === 'desc' ? '↓' : '↑')}
              </button>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredApplications.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No applications found matching your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted On
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((application) => (
                    <tr key={application.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {application.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {application.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {application.preferredBranch}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(application.submittedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(application.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateApplicationStatus(application.id, 'under_review')}
                            disabled={application.status === 'under_review'}
                            className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${
                              application.status === 'under_review' ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <Clock size={14} className="mr-1" />
                            Review
                          </button>
                          
                          <button
                            onClick={() => updateApplicationStatus(application.id, 'approved')}
                            disabled={application.status === 'approved'}
                            className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                              application.status === 'approved' ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <UserCheck size={14} className="mr-1" />
                            Approve
                          </button>
                          
                          <button
                            onClick={() => updateApplicationStatus(application.id, 'rejected')}
                            disabled={application.status === 'rejected'}
                            className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                              application.status === 'rejected' ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <XCircle size={14} className="mr-1" />
                            Reject
                          </button>
                          
                          <button className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <Eye size={14} className="mr-1" />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Applications</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {applications.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <UserCheck size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {applications.filter(app => app.status === 'submitted').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                <Clock size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {applications.filter(app => app.status === 'approved').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {applications.filter(app => app.status === 'rejected').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <XCircle size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;