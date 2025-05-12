import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { FileText, User, CheckCircle, Clock, AlertCircle, PenSquare } from 'lucide-react';

// Application status type
type ApplicationStatus = 'incomplete' | 'submitted' | 'under_review' | 'approved' | 'rejected';

const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>('incomplete');
  const [hasPersonalInfo, setHasPersonalInfo] = useState(false);
  const [hasAcademicInfo, setHasAcademicInfo] = useState(false);
  const [hasDocuments, setHasDocuments] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setApplicationStatus(userData.applicationStatus || 'incomplete');
          setHasPersonalInfo(!!userData.personalInfo);
          setHasAcademicInfo(!!userData.academicInfo);
          setHasDocuments(!!userData.documents);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Get status UI elements
  const getStatusBadge = () => {
    switch (applicationStatus) {
      case 'incomplete':
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">Incomplete</span>;
      case 'submitted':
        return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Submitted</span>;
      case 'under_review':
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">Under Review</span>;
      case 'approved':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Approved</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">Rejected</span>;
      default:
        return null;
    }
  };

  // Get progress indicator
  const getProgressIndicator = () => {
    if (applicationStatus === 'approved') return 100;
    if (applicationStatus === 'rejected') return 100;
    if (applicationStatus === 'under_review') return 75;
    if (applicationStatus === 'submitted') return 50;
    
    let progress = 0;
    if (hasPersonalInfo) progress += 20;
    if (hasAcademicInfo) progress += 20;
    if (hasDocuments) progress += 10;
    return progress;
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-16 pb-12">
      <div className="container mx-auto px-4 md:px-6 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-gray-600">
              Welcome back, {user?.displayName || 'Student'}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            {getStatusBadge()}
          </div>
        </div>

        {/* Application Progress */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Application Progress</h2>
            <span className="text-sm font-medium text-gray-500 mt-2 md:mt-0">
              {getProgressIndicator()}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${getProgressIndicator()}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className={`p-4 rounded-lg border ${hasPersonalInfo ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-start">
                <div className={`rounded-full p-2 mr-3 ${hasPersonalInfo ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {hasPersonalInfo ? <CheckCircle size={20} /> : <User size={20} />}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Personal Information</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {hasPersonalInfo ? 'Completed' : 'Not completed'}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${hasAcademicInfo ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-start">
                <div className={`rounded-full p-2 mr-3 ${hasAcademicInfo ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {hasAcademicInfo ? <CheckCircle size={20} /> : <FileText size={20} />}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Academic Information</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {hasAcademicInfo ? 'Completed' : 'Not completed'}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${hasDocuments ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-start">
                <div className={`rounded-full p-2 mr-3 ${hasDocuments ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {hasDocuments ? <CheckCircle size={20} /> : <FileText size={20} />}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Documents</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {hasDocuments ? 'Uploaded' : 'Not uploaded'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {applicationStatus === 'incomplete' && (
            <div className="mt-6">
              <Link 
                to="/admission" 
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PenSquare size={16} className="mr-2" />
                Complete Application
              </Link>
            </div>
          )}
        </motion.div>

        {/* Application Status */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Status</h2>
          
          <div className="flex items-start">
            {applicationStatus === 'incomplete' && (
              <div className="bg-gray-100 p-3 rounded-full mr-4">
                <Clock size={24} className="text-gray-500" />
              </div>
            )}
            {applicationStatus === 'submitted' && (
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <Clock size={24} className="text-blue-600" />
              </div>
            )}
            {applicationStatus === 'under_review' && (
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                <Clock size={24} className="text-yellow-600" />
              </div>
            )}
            {applicationStatus === 'approved' && (
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <CheckCircle size={24} className="text-green-600" />
              </div>
            )}
            {applicationStatus === 'rejected' && (
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <AlertCircle size={24} className="text-red-600" />
              </div>
            )}
            
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                {applicationStatus === 'incomplete' && 'Application Not Submitted'}
                {applicationStatus === 'submitted' && 'Application Submitted'}
                {applicationStatus === 'under_review' && 'Application Under Review'}
                {applicationStatus === 'approved' && 'Application Approved'}
                {applicationStatus === 'rejected' && 'Application Rejected'}
              </h3>
              <p className="text-gray-600 mt-1">
                {applicationStatus === 'incomplete' && 'Please complete your application to proceed with the admission process.'}
                {applicationStatus === 'submitted' && 'Your application has been submitted and is waiting for review.'}
                {applicationStatus === 'under_review' && 'Your application is currently being reviewed by our admission team.'}
                {applicationStatus === 'approved' && 'Congratulations! Your application has been approved. Please check your email for further instructions.'}
                {applicationStatus === 'rejected' && 'Unfortunately, your application has been rejected. Please contact the admission office for more information.'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Important Announcements */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Important Announcements</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <h3 className="font-medium text-blue-800">Admission Schedule Update</h3>
              <p className="text-sm text-blue-700 mt-1">
                The last date for application submission has been extended to June 30, 2025.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
              <h3 className="font-medium text-green-800">Scholarship Opportunity</h3>
              <p className="text-sm text-green-700 mt-1">
                Merit-based scholarships are available for top performers. Submit your application early.
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
              <h3 className="font-medium text-yellow-800">Document Verification</h3>
              <p className="text-sm text-yellow-700 mt-1">
                All applicants must bring original documents for verification during the counseling process.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;