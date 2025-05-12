import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import toast from 'react-hot-toast';
import { ChevronDown, CheckCircle, Upload, File, AlertTriangle } from 'lucide-react';

// Form schema
const admissionFormSchema = Yup.object().shape({
  // Personal Information
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  dateOfBirth: Yup.date().required('Date of birth is required'),
  gender: Yup.string().required('Gender is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits')
    .required('Phone number is required'),
  address: Yup.string().required('Address is required'),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State is required'),
  zipCode: Yup.string()
    .matches(/^[0-9]{6}$/, 'Zip code must be 6 digits')
    .required('Zip code is required'),
  
  // Academic Information
  highSchoolName: Yup.string().required('High school name is required'),
  highSchoolPercentage: Yup.number()
    .min(0, 'Percentage cannot be negative')
    .max(100, 'Percentage cannot exceed 100')
    .required('High school percentage is required'),
  intermediateSchoolName: Yup.string().required('Intermediate school name is required'),
  intermediatePercentage: Yup.number()
    .min(0, 'Percentage cannot be negative')
    .max(100, 'Percentage cannot exceed 100')
    .required('Intermediate percentage is required'),
  entranceExamType: Yup.string().required('Entrance exam type is required'),
  entranceExamRank: Yup.number()
    .positive('Rank must be positive')
    .required('Entrance exam rank is required'),
  
  // Program Information
  preferredBranch: Yup.string().required('Preferred branch is required'),
  
  // Documents - file uploads handled separately
});

// Form values type
interface AdmissionFormValues {
  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Academic Information
  highSchoolName: string;
  highSchoolPercentage: number;
  intermediateSchoolName: string;
  intermediatePercentage: number;
  entranceExamType: string;
  entranceExamRank: number;
  
  // Program Information
  preferredBranch: string;
}

const AdmissionFormPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<AdmissionFormValues>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    highSchoolName: '',
    highSchoolPercentage: 0,
    intermediateSchoolName: '',
    intermediatePercentage: 0,
    entranceExamType: '',
    entranceExamRank: 0,
    preferredBranch: '',
  });
  
  const [activeStep, setActiveStep] = useState(1);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  
  // File upload states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  
  const [highSchoolCertificate, setHighSchoolCertificate] = useState<File | null>(null);
  const [highSchoolCertificateUrl, setHighSchoolCertificateUrl] = useState('');
  const [highSchoolCertificateUploading, setHighSchoolCertificateUploading] = useState(false);
  
  const [intermediateCertificate, setIntermediateCertificate] = useState<File | null>(null);
  const [intermediateCertificateUrl, setIntermediateCertificateUrl] = useState('');
  const [intermediateCertificateUploading, setIntermediateCertificateUploading] = useState(false);
  
  const [entranceExamResult, setEntranceExamResult] = useState<File | null>(null);
  const [entranceExamResultUrl, setEntranceExamResultUrl] = useState('');
  const [entranceExamResultUploading, setEntranceExamResultUploading] = useState(false);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Check if user has already applied
          if (userData.applicationStatus && userData.applicationStatus !== 'incomplete') {
            toast.error('You have already submitted an application');
            navigate('/dashboard');
            return;
          }
          
          // Load existing personal info if available
          if (userData.personalInfo) {
            const personalInfo = userData.personalInfo;
            setFormData(prevState => ({
              ...prevState,
              firstName: personalInfo.firstName || '',
              lastName: personalInfo.lastName || '',
              dateOfBirth: personalInfo.dateOfBirth || '',
              gender: personalInfo.gender || '',
              email: personalInfo.email || user?.email || '',
              phone: personalInfo.phone || '',
              address: personalInfo.address || '',
              city: personalInfo.city || '',
              state: personalInfo.state || '',
              zipCode: personalInfo.zipCode || '',
            }));
          }
          
          // Load existing academic info if available
          if (userData.academicInfo) {
            const academicInfo = userData.academicInfo;
            setFormData(prevState => ({
              ...prevState,
              highSchoolName: academicInfo.highSchoolName || '',
              highSchoolPercentage: academicInfo.highSchoolPercentage || 0,
              intermediateSchoolName: academicInfo.intermediateSchoolName || '',
              intermediatePercentage: academicInfo.intermediatePercentage || 0,
              entranceExamType: academicInfo.entranceExamType || '',
              entranceExamRank: academicInfo.entranceExamRank || 0,
              preferredBranch: academicInfo.preferredBranch || '',
            }));
          }
          
          // Load document URLs if available
          if (userData.documents) {
            const documents = userData.documents;
            setPhotoUrl(documents.photoUrl || '');
            setHighSchoolCertificateUrl(documents.highSchoolCertificateUrl || '');
            setIntermediateCertificateUrl(documents.intermediateCertificateUrl || '');
            setEntranceExamResultUrl(documents.entranceExamResultUrl || '');
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setGeneralError('Failed to load form data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user, navigate]);
  
  // Upload files to Firebase Storage
  const uploadFile = async (
    file: File | null,
    path: string,
    setUploading: React.Dispatch<React.SetStateAction<boolean>>,
    setUrl: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (!file || !user) {
      toast.error('Please select a file to upload');
      return '';
    }
    
    setUploading(true);
    try {
      // Create a unique filename
      const timestamp = Date.now();
      const uniqueFilename = `${user.uid}_${timestamp}_${file.name}`;
      const storageRef = ref(storage, `${path}/${uniqueFilename}`);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadUrl = await getDownloadURL(snapshot.ref);
      setUrl(downloadUrl);
      toast.success('File uploaded successfully');
      return downloadUrl;
    } catch (error: any) {
      console.error(`Error uploading ${path}:`, error);
      toast.error(`Failed to upload file: ${error.message}`);
      throw error;
    } finally {
      setUploading(false);
    }
  };
  
  // Handle file change
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setUrl: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        event.target.value = '';
        return;
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, and PDF files are allowed');
        event.target.value = '';
        return;
      }
      
      setFile(file);
      setUrl(''); // Clear previous URL when new file is selected
    }
  };
  
  // Handle next step
  const handleNext = () => {
    setActiveStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };
  
  // Handle previous step
  const handlePrevious = () => {
    setActiveStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };
  
  // Handle form submission
  const handleSubmit = async (
    values: AdmissionFormValues,
    { setSubmitting }: FormikHelpers<AdmissionFormValues>
  ) => {
    if (!user) return;
    
    setFormSubmitting(true);
    setGeneralError('');
    
    try {
      // Upload all documents if they exist
      let photoUrlFinal = photoUrl;
      let highSchoolCertificateUrlFinal = highSchoolCertificateUrl;
      let intermediateCertificateUrlFinal = intermediateCertificateUrl;
      let entranceExamResultUrlFinal = entranceExamResultUrl;
      
      if (photoFile) {
        photoUrlFinal = await uploadFile(
          photoFile,
          'photos',
          setPhotoUploading,
          setPhotoUrl
        );
      }
      
      if (highSchoolCertificate) {
        highSchoolCertificateUrlFinal = await uploadFile(
          highSchoolCertificate,
          'highSchoolCertificates',
          setHighSchoolCertificateUploading,
          setHighSchoolCertificateUrl
        );
      }
      
      if (intermediateCertificate) {
        intermediateCertificateUrlFinal = await uploadFile(
          intermediateCertificate,
          'intermediateCertificates',
          setIntermediateCertificateUploading,
          setIntermediateCertificateUrl
        );
      }
      
      if (entranceExamResult) {
        entranceExamResultUrlFinal = await uploadFile(
          entranceExamResult,
          'entranceExamResults',
          setEntranceExamResultUploading,
          setEntranceExamResultUrl
        );
      }
      
      // Check if all required documents are uploaded
      if (!photoUrlFinal || !highSchoolCertificateUrlFinal || !intermediateCertificateUrlFinal || !entranceExamResultUrlFinal) {
        setGeneralError('Please upload all required documents');
        return;
      }
      
      // Update user document in Firestore
      const userRef = doc(db, 'users', user.uid);
      
      await updateDoc(userRef, {
        // Personal information
        personalInfo: {
          firstName: values.firstName,
          lastName: values.lastName,
          dateOfBirth: values.dateOfBirth,
          gender: values.gender,
          email: values.email,
          phone: values.phone,
          address: values.address,
          city: values.city,
          state: values.state,
          zipCode: values.zipCode,
        },
        
        // Academic information
        academicInfo: {
          highSchoolName: values.highSchoolName,
          highSchoolPercentage: values.highSchoolPercentage,
          intermediateSchoolName: values.intermediateSchoolName,
          intermediatePercentage: values.intermediatePercentage,
          entranceExamType: values.entranceExamType,
          entranceExamRank: values.entranceExamRank,
          preferredBranch: values.preferredBranch,
        },
        
        // Documents
        documents: {
          photoUrl: photoUrlFinal,
          highSchoolCertificateUrl: highSchoolCertificateUrlFinal,
          intermediateCertificateUrl: intermediateCertificateUrlFinal,
          entranceExamResultUrl: entranceExamResultUrlFinal,
        },
        
        // Application status and timestamp
        applicationStatus: 'submitted',
        submittedAt: serverTimestamp(),
      });
      
      toast.success('Application submitted successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting application:', error);
      setGeneralError('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
      setFormSubmitting(false);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admission Application</h1>
          <p className="mt-1 text-gray-600">
            Please fill out all the required information to apply for admission
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-10">
          <div className="flex items-center justify-between md:justify-center">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                activeStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <span className="text-sm mt-2 font-medium hidden md:block">Personal Info</span>
            </div>
            
            <div className={`flex-1 h-1 mx-2 md:mx-4 ${
              activeStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'
            }`}></div>
            
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                activeStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <span className="text-sm mt-2 font-medium hidden md:block">Academic Info</span>
            </div>
            
            <div className={`flex-1 h-1 mx-2 md:mx-4 ${
              activeStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'
            }`}></div>
            
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                activeStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                3
              </div>
              <span className="text-sm mt-2 font-medium hidden md:block">Documents</span>
            </div>
            
            <div className={`flex-1 h-1 mx-2 md:mx-4 ${
              activeStep >= 4 ? 'bg-blue-600' : 'bg-gray-200'
            }`}></div>
            
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                activeStep >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                4
              </div>
              <span className="text-sm mt-2 font-medium hidden md:block">Review</span>
            </div>
          </div>
        </div>

        {generalError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
            <AlertTriangle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
            <span>{generalError}</span>
          </div>
        )}

        <Formik
          initialValues={formData}
          validationSchema={admissionFormSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, isSubmitting }) => (
            <Form>
              <motion.div
                key={`step-${activeStep}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                {/* Step 1: Personal Information */}
                {activeStep === 1 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* First Name */}
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                          First Name *
                        </label>
                        <Field
                          type="text"
                          name="firstName"
                          id="firstName"
                          className={`block w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
                            touched.firstName && errors.firstName
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                        <ErrorMessage name="firstName" component="p" className="mt-1 text-sm text-red-600" />
                      </div>

                      {/* Last Name */}
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name *
                        </label>
                        <Field
                          type="text"
                          name="lastName"
                          id="lastName"
                          className={`block w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
                            touched.lastName && errors.lastName
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                        <ErrorMessage name="lastName" component="p" className="mt-1 text-sm text-red-600" />
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Birth *
                        </label>
                        <Field
                          type="date"
                          name="dateOfBirth"
                          id="dateOfBirth"
                          className={`block w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
                            touched.dateOfBirth && errors.dateOfBirth
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                        <ErrorMessage name="dateOfBirth" component="p" className="mt-1 text-sm text-red-600" />
                      </div>

                      {/* Gender */}
                      <div>
                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                          Gender *
                        </label>
                        <div className="relative">
                          <Field
                            as="select"
                            name="gender"
                            id="gender"
                            className={`block w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none appearance-none sm:text-sm ${
                              touched.gender && errors.gender
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </Field>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <ChevronDown size={16} className="text-gray-500" />
                          </div>
                        </div>
                        <ErrorMessage name="gender" component="p" className="mt-1 text-sm text-red-600" />
                      </div>

                      {/* Email */}
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address *
                        </label>
                        <Field
                          type="email"
                          name="email"
                          id="email"
                          disabled
                          className="block w-full py-2 px-3 border border-gray-300 bg-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm cursor-not-allowed"
                        />
                        <ErrorMessage name="email" component="p" className="mt-1 text-sm text-red-600" />
                      </div>

                      {/* Phone */}
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number *
                        </label>
                        <Field
                          type="text"
                          name="phone"
                          id="phone"
                          className={`block w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
                            touched.phone && errors.phone
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                        <ErrorMessage name="phone" component="p" className="mt-1 text-sm text-red-600" />
                      </div>

                      {/* Address */}
                      <div className="md:col-span-2">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                          Address *
                        </label>
                        <Field
                          type="text"
                          name="address"
                          id="address"
                          className={`block w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
                            touched.address && errors.address
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                        <ErrorMessage name="address" component="p" className="mt-1 text-sm text-red-600" />
                      </div>

                      {/* City */}
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <Field
                          type="text"
                          name="city"
                          id="city"
                          className={`block w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
                            touched.city && errors.city
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                        <ErrorMessage name="city" component="p" className="mt-1 text-sm text-red-600" />
                      </div>

                      {/* State */}
                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                          State *
                        </label>
                        <div className="relative">
                          <Field
                            as="select"
                            name="state"
                            id="state"
                            className={`block w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none appearance-none sm:text-sm ${
                              touched.state && errors.state
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                          >
                            <option value="">Select State</option>
                            <option value="Andhra Pradesh">Andhra Pradesh</option>
                            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                            <option value="Assam">Assam</option>
                            <option value="Bihar">Bihar</option>
                            <option value="Chhattisgarh">Chhattisgarh</option>
                            <option value="Goa">Goa</option>
                            <option value="Gujarat">Gujarat</option>
                            <option value="Haryana">Haryana</option>
                            <option value="Himachal Pradesh">Himachal Pradesh</option>
                            <option value="Jharkhand">Jharkhand</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Kerala">Kerala</option>
                            <option value="Madhya Pradesh">Madhya Pradesh</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Manipur">Manipur</option>
                            <option value="Meghalaya">Meghalaya</option>
                            <option value="Mizoram">Mizoram</option>
                            <option value="Nagaland">Nagaland</option>
                            <option value="Odisha">Odisha</option>
                            <option value="Punjab">Punjab</option>
                            <option value="Rajasthan">Rajasthan</option>
                            <option value="Sikkim">Sikkim</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Telangana">Telangana</option>
                            <option value="Tripura">Tripura</option>
                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                            <option value="Uttarakhand">Uttarakhand</option>
                            <option value="West Bengal">West Bengal</option>
                          </Field>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <ChevronDown size={16} className="text-gray-500" />
                          </div>
                        </div>
                        <ErrorMessage name="state" component="p" className="mt-1 text-sm text-red-600" />
                      </div>

                      {/* Zip Code */}
                      <div>
                        <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                          Zip/Postal Code *
                        </label>
                        <Field
                          type="text"
                          name="zipCode"
                          id="zipCode"
                          className={`block w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
                            touched.zipCode && errors.zipCode
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                        <ErrorMessage name="zipCode" component="p" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Academic Information */}
                {activeStep === 2 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Academic Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* High School */}
                      <div>
                        <label htmlFor="highSchoolName" className="block text-sm font-medium text-gray-700 mb-1">
                          High School Name *
                        </label>
                        <Field
                          type="text"
                          name="highSchoolName"
                          id="highSchoolName"
                          className={`block w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
                            touched.highSchoolName && errors.highSchoolName
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                        <ErrorMessage name="highSchoolName" component="p" className="mt-1 text-sm text-red-600" />
                      </div>

                      {/* High School Percentage */}
                      <div>
                        <label htmlFor="highSchoolPercentage" className="block text-sm font-medium text-gray-700 mb-1">
                          High School Percentage *
                        </label>
                        <Field
                          type="number"
                          name="highSchoolPercentage"
                          id="highSchoolPercentage"
                          step="0.01"
                          min="0"
                          max="100"
                          className={`block w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
                            touched.highSchoolPercentage && errors.highSchoolPercentage
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                        <ErrorMessage name="highSchoolPercentage" component="p" className="mt-1 text-sm text-red-600" />
                      </div>

                      {/* Intermediate School */}
                      <div>
                        <label htmlFor="intermediateSchoolName" className="block text-sm font-medium text-gray-700 mb-1">
                          Intermediate School Name *
                        </label>
                        <Field
                          type="text"
                          name="intermediateSchoolName"
                          id="intermediateSchoolName"
                          className={`block w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
                            touched.intermediateSchoolName && errors.intermediateSchoolName
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                        <ErrorMessage name="intermediateSchoolName" component="p" className="mt-1 text-sm text-red-600" />
                      </div>

                      {/* Intermediate Percentage */}
                      <div>
                        <label htmlFor="intermediatePercentage" className="block text-sm font-medium text-gray-700 mb-1">
                          Intermediate Percentage *
                        </label>
                        <Field
                          type="number"
                          name="intermediatePercentage"
                          id="intermediatePercentage"
                          step="0.01"
                          min="0"
                          max="100"
                          className={`block w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
                            touched.intermediatePercentage && errors.intermediatePercentage
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                        <ErrorMessage name="intermediatePercentage" component="p" className="mt-1 text-sm text-red-600" />
                      </div>

                      {/* Entrance Exam Type */}
                      <div>
                        <label htmlFor="entranceExamType" className="block text-sm font-medium text-gray-700 mb-1">
                          Entrance Exam Type *
                        </label>
                        <div className="relative">
                          <Field
                            as="select"
                            name="entranceExamType"
                            id="entranceExamType"
                            className={`block w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none appearance-none sm:text-sm ${
                              touched.entranceExamType && errors.entranceExamType
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                          >
                            <option value="">Select Exam Type</option>
                            <option value="JEE Main">JEE Main</option>
                            <option value="JEE Advanced">JEE Advanced</option>
                            <option value="UPSEE">UPSEE</option>
                            <option value="Other">Other</option>
                          </Field>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <ChevronDown size={16} className="text-gray-500" />
                          </div>
                        </div>
                        <ErrorMessage name="entranceExamType" component="p" className="mt-1 text-sm text-red-600" />
                      </div>

                      {/* Entrance Exam Rank */}
                      <div>
                        <label htmlFor="entranceExamRank" className="block text-sm font-medium text-gray-700 mb-1">
                          Entrance Exam Rank *
                        </label>
                        <Field
                          type="number"
                          name="entranceExamRank"
                          id="entranceExamRank"
                          min="1"
                          className={`block w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
                            touched.entranceExamRank && errors.entranceExamRank
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                        <ErrorMessage name="entranceExamRank" component="p" className="mt-1 text-sm text-red-600" />
                      </div>

                      {/* Preferred Branch */}
                      <div>
                        <label htmlFor="preferredBranch" className="block text-sm font-medium text-gray-700 mb-1">
                          Preferred Branch *
                        </label>
                        <div className="relative">
                          <Field
                            as="select"
                            name="preferredBranch"
                            id="preferredBranch"
                            className={`block w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none appearance-none sm:text-sm ${
                              touched.preferredBranch && errors.preferredBranch
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                          >
                            <option value="">Select Branch</option>
                            <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                            <option value="Electronics and Communication Engineering">Electronics and Communication Engineering</option>
                            <option value="Electrical Engineering">Electrical Engineering</option>
                            <option value="Mechanical Engineering">Mechanical Engineering</option>
                            <option value="Civil Engineering">Civil Engineering</option>
                            <option value="Chemical Engineering">Chemical Engineering</option>
                            <option value="Information Technology">Information Technology</option>
                          </Field>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <ChevronDown size={16} className="text-gray-500" />
                          </div>
                        </div>
                        <ErrorMessage name="preferredBranch" component="p" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Documents Upload */}
                {activeStep === 3 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Document Uploads</h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Please upload clear and legible scanned copies of the following documents. All documents should be in PDF, JPG, or PNG format.
                    </p>
                    
                    <div className="space-y-6">
                      {/* Photo Upload */}
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Passport Size Photo *
                        </label>
                        <div className="flex flex-col md:flex-row md:items-center">
                          <div className="flex-1">
                            {photoUrl ? (
                              <div className="flex items-center">
                                <img 
                                  src={photoUrl} 
                                  alt="Passport photo" 
                                  className="w-24 h-24 object-cover rounded"
                                />
                                <div className="ml-4">
                                  <div className="flex items-center text-green-600">
                                    <CheckCircle size={16} className="mr-1" />
                                    <span className="text-sm font-medium">Photo uploaded</span>
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">You can upload a new one to replace it</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center text-gray-500">
                                <File size={20} className="mr-2" />
                                <span className="text-sm">No photo uploaded yet</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 md:mt-0">
                            <label className="block">
                              <span className="sr-only">Choose photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, setPhotoFile, setPhotoUrl)}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                            </label>
                            {photoFile && (
                              <p className="mt-1 text-xs text-gray-500">
                                Selected: {photoFile.name}
                              </p>
                            )}
                            {photoUploading && (
                              <div className="mt-2 flex items-center">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                                <span className="text-xs text-gray-500">Uploading...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* High School Certificate */}
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          High School Certificate *
                        </label>
                        <div className="flex flex-col md:flex-row md:items-center">
                          <div className="flex-1">
                            {highSchoolCertificateUrl ? (
                              <div className="flex items-center">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded flex items-center justify-center">
                                  <File size={24} />
                                </div>
                                <div className="ml-4">
                                  <div className="flex items-center text-green-600">
                                    <CheckCircle size={16} className="mr-1" />
                                    <span className="text-sm font-medium">Document uploaded</span>
                                  </div>
                                  <a 
                                    href={highSchoolCertificateUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                                  >
                                    View Document
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center text-gray-500">
                                <File size={20} className="mr-2" />
                                <span className="text-sm">No document uploaded yet</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 md:mt-0">
                            <label className="block">
                              <span className="sr-only">Choose file</span>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileChange(e, setHighSchoolCertificate, setHighSchoolCertificateUrl)}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                            </label>
                            {highSchoolCertificate && (
                              <p className="mt-1 text-xs text-gray-500">
                                Selected: {highSchoolCertificate.name}
                              </p>
                            )}
                            {highSchoolCertificateUploading && (
                              <div className="mt-2 flex items-center">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                                <span className="text-xs text-gray-500">Uploading...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Intermediate Certificate */}
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Intermediate Certificate *
                        </label>
                        <div className="flex flex-col md:flex-row md:items-center">
                          <div className="flex-1">
                            {intermediateCertificateUrl ? (
                              <div className="flex items-center">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded flex items-center justify-center">
                                  <File size={24} />
                                </div>
                                <div className="ml-4">
                                  <div className="flex items-center text-green-600">
                                    <CheckCircle size={16} className="mr-1" />
                                    <span className="text-sm font-medium">Document uploaded</span>
                                  </div>
                                  <a 
                                    href={intermediateCertificateUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                                  >
                                    View Document
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center text-gray-500">
                                <File size={20} className="mr-2" />
                                <span className="text-sm">No document uploaded yet</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 md:mt-0">
                            <label className="block">
                              <span className="sr-only">Choose file</span>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileChange(e, setIntermediateCertificate, setIntermediateCertificateUrl)}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                            </label>
                            {intermediateCertificate && (
                              <p className="mt-1 text-xs text-gray-500">
                                Selected: {intermediateCertificate.name}
                              </p>
                            )}
                            {intermediateCertificateUploading && (
                              <div className="mt-2 flex items-center">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                                <span className="text-xs text-gray-500">Uploading...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Entrance Exam Result */}
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Entrance Exam Result *
                        </label>
                        <div className="flex flex-col md:flex-row md:items-center">
                          <div className="flex-1">
                            {entranceExamResultUrl ? (
                              <div className="flex items-center">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded flex items-center justify-center">
                                  <File size={24} />
                                </div>
                                <div className="ml-4">
                                  <div className="flex items-center text-green-600">
                                    <CheckCircle size={16} className="mr-1" />
                                    <span className="text-sm font-medium">Document uploaded</span>
                                  </div>
                                  <a 
                                    href={entranceExamResultUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                                  >
                                    View Document
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center text-gray-500">
                                <File size={20} className="mr-2" />
                                <span className="text-sm">No document uploaded yet</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 md:mt-0">
                            <label className="block">
                              <span className="sr-only">Choose file</span>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileChange(e, setEntranceExamResult, setEntranceExamResultUrl)}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                            </label>
                            {entranceExamResult && (
                              <p className="mt-1 text-xs text-gray-500">
                                Selected: {entranceExamResult.name}
                              </p>
                            )}
                            {entranceExamResultUploading && (
                              <div className="mt-2 flex items-center">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                                <span className="text-xs text-gray-500">Uploading...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Review and Submit */}
                {activeStep === 4 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Your Application</h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Please review your information carefully before submitting. Once submitted, you will not be able to make changes.
                    </p>
                    
                    {/* Personal Information Review */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Personal Information</h3>
                      <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Full Name</p>
                          <p className="text-sm text-gray-900">{`${values.firstName} ${values.lastName}`}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                          <p className="text-sm text-gray-900">{values.dateOfBirth}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Gender</p>
                          <p className="text-sm text-gray-900">{values.gender.charAt(0).toUpperCase() + values.gender.slice(1)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email</p>
                          <p className="text-sm text-gray-900">{values.email}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Phone</p>
                          <p className="text-sm text-gray-900">{values.phone}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium text-gray-500">Address</p>
                          <p className="text-sm text-gray-900">{`${values.address}, ${values.city}, ${values.state} - ${values.zipCode}`}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Academic Information Review */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Academic Information</h3>
                      <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6">
                        <div>
                          <p className="text-sm font-medium text-gray-500">High School</p>
                          <p className="text-sm text-gray-900">{values.highSchoolName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">High School Percentage</p>
                          <p className="text-sm text-gray-900">{values.highSchoolPercentage}%</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Intermediate School</p>
                          <p className="text-sm text-gray-900">{values.intermediateSchoolName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Intermediate Percentage</p>
                          <p className="text-sm text-gray-900">{values.intermediatePercentage}%</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Entrance Exam</p>
                          <p className="text-sm text-gray-900">{values.entranceExamType}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Entrance Exam Rank</p>
                          <p className="text-sm text-gray-900">{values.entranceExamRank}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Preferred Branch</p>
                          <p className="text-sm text-gray-900">{values.preferredBranch}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Document Check */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Documents</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center">
                          {photoUrl ? (
                            <CheckCircle size={18} className="text-green-500 mr-2" />
                          ) : (
                            <AlertTriangle size={18} className="text-red-500 mr-2" />
                          )}
                          <span className="text-sm text-gray-900">Passport Size Photo</span>
                        </div>
                        <div className="flex items-center">
                          {highSchoolCertificateUrl ? (
                            <CheckCircle size={18} className="text-green-500 mr-2" />
                          ) : (
                            <AlertTriangle size={18} className="text-red-500 mr-2" />
                          )}
                          <span className="text-sm text-gray-900">High School Certificate</span>
                        </div>
                        <div className="flex items-center">
                          {intermediateCertificateUrl ? (
                            <CheckCircle size={18} className="text-green-500 mr-2" />
                          ) : (
                            <AlertTriangle size={18} className="text-red-500 mr-2" />
                          )}
                          <span className="text-sm text-gray-900">Intermediate Certificate</span>
                        </div>
                        <div className="flex items-center">
                          {entranceExamResultUrl ? (
                            <CheckCircle size={18} className="text-green-500 mr-2" />
                          ) : (
                            <AlertTriangle size={18} className="text-red-500 mr-2" />
                          )}
                          <span className="text-sm text-gray-900">Entrance Exam Result</span>
                        </div>
                      </div>
                      
                      {/* Missing Documents Warning */}
                      {(!photoUrl || !highSchoolCertificateUrl || !intermediateCertificateUrl || !entranceExamResultUrl) && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
                          <div className="flex items-start">
                            <AlertTriangle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                            <span>
                              Some required documents are missing. Please go back to the Documents section and upload all required documents.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Declaration */}
                    <div className="mb-6">
                      <div className="p-4 border border-gray-200 rounded-lg bg-white">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Declaration</h3>
                        <p className="text-sm text-gray-700 mb-4">
                          I hereby declare that the information provided in this application is true and correct to the best of my knowledge. I understand that any false or misleading information may result in the rejection of my application or dismissal from the college.
                        </p>
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            id="declaration" 
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            required
                          />
                          <label htmlFor="declaration" className="ml-2 block text-sm text-gray-900">
                            I agree to the declaration and terms & conditions
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-8 pt-5 border-t border-gray-200 flex justify-between">
                  {activeStep > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Previous
                    </button>
                  ) : (
                    <div></div>
                  )}

                  {activeStep < 4 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={formSubmitting || isSubmitting || !photoUrl || !highSchoolCertificateUrl || !intermediateCertificateUrl || !entranceExamResultUrl}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                      {formSubmitting || isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Upload size={16} className="mr-2" />
                          Submit Application
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AdmissionFormPage;