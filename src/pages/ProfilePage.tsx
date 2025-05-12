import { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';
import { Save, User, Phone, MapPin, Mail, AlertTriangle, ChevronDown } from 'lucide-react';

// Profile validation schema
const ProfileSchema = Yup.object().shape({
  displayName: Yup.string()
    .required('Name is required')
    .min(2, 'Name is too short')
    .max(50, 'Name is too long'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits')
    .nullable(),
  address: Yup.string()
    .max(200, 'Address is too long')
    .nullable(),
  city: Yup.string()
    .max(50, 'City name is too long')
    .nullable(),
  state: Yup.string()
    .max(50, 'State name is too long')
    .nullable(),
  zipCode: Yup.string()
    .matches(/^[0-9]{6}$/, 'Zip code must be 6 digits')
    .nullable(),
});

interface ProfileData {
  displayName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        setGeneralError('');
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfileData({
            displayName: userData.displayName || user.displayName || '',
            email: userData.email || user.email || '',
            phone: userData.phone || '',
            address: userData.address || '',
            city: userData.city || '',
            state: userData.state || '',
            zipCode: userData.zipCode || '',
          });
        } else {
          // If user document doesn't exist, create it
          const newUserData = {
            uid: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email,
            createdAt: serverTimestamp(),
            role: 'student',
            applicationStatus: 'incomplete',
            phone: '',
            address: '',
            city: '',
            state: '',
            zipCode: ''
          };
          
          await setDoc(userRef, newUserData);
          
          setProfileData({
            displayName: newUserData.displayName,
            email: newUserData.email || '',
            phone: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setGeneralError('Failed to load profile data. Please try again.');
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleSubmit = async (values: ProfileData, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    if (!user) return;

    try {
      setGeneralError('');
      const userRef = doc(db, 'users', user.uid);
      
      await updateDoc(userRef, {
        displayName: values.displayName,
        phone: values.phone,
        address: values.address,
        city: values.city,
        state: values.state,
        zipCode: values.zipCode,
      });

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setGeneralError('Failed to update profile. Please try again.');
      toast.error('Failed to update profile');
    } finally {
      setSubmitting(false);
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
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="mt-1 text-gray-600">
            Manage your personal information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col items-center pb-6 border-b border-gray-200">
                <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <User size={40} />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {profileData.displayName}
                </h2>
                <p className="text-gray-500 text-sm">{profileData.email}</p>
              </div>

              <div className="pt-4 space-y-3">
                <div className="flex items-center text-gray-700">
                  <Phone size={18} className="mr-2 text-gray-500" />
                  <span>{profileData.phone || 'No phone number'}</span>
                </div>
                <div className="flex items-start text-gray-700">
                  <MapPin size={18} className="mr-2 mt-1 text-gray-500 flex-shrink-0" />
                  <span>
                    {profileData.address
                      ? `${profileData.address}, ${profileData.city}, ${profileData.state} - ${profileData.zipCode}`
                      : 'No address specified'}
                  </span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Mail size={18} className="mr-2 text-gray-500" />
                  <span>{profileData.email}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Profile Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Edit Profile</h2>

              {generalError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
                  <AlertTriangle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
                  <span>{generalError}</span>
                </div>
              )}

              <Formik
                initialValues={profileData}
                validationSchema={ProfileSchema}
                onSubmit={handleSubmit}
                enableReinitialize
              >
                {({ isSubmitting, touched, errors }) => (
                  <Form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Display Name */}
                      <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <Field
                          type="text"
                          name="displayName"
                          id="displayName"
                          className={`block w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
                            touched.displayName && errors.displayName
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                        <ErrorMessage name="displayName" component="p" className="mt-1 text-sm text-red-600" />
                      </div>

                      {/* Email */}
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
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
                          Phone Number
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
                          Address
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
                          City
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
                          State
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
                          Zip/Postal Code
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

                    <div className="pt-4 border-t border-gray-200">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full md:w-auto flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                          <Save size={18} className="mr-2" />
                        )}
                        Save Changes
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;