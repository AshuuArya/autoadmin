import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, BookOpen, Award, Users, Calendar } from 'lucide-react';

const HomePage = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <motion.div 
              className="md:w-1/2 mb-10 md:mb-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Begin Your Journey at ABES Engineering College
              </h1>
              <p className="text-blue-100 text-lg mb-8 max-w-lg">
                Join a premier institute with exceptional academic programs, state-of-the-art facilities, and promising career opportunities.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="btn px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-md transition-colors">
                  Apply Now
                </Link>
                <Link to="/login" className="btn px-6 py-3 bg-white hover:bg-gray-100 text-blue-700 font-medium rounded-md transition-colors">
                  Login
                </Link>
              </div>
            </motion.div>
            <motion.div 
              className="md:w-1/2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <img 
                src="https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg" 
                alt="ABES Engineering College Campus" 
                className="rounded-lg shadow-2xl w-full"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose ABES?</h2>
            <p className="text-lg text-gray-600">
              ABES Engineering College offers exceptional academic programs and a vibrant campus experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div 
              className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center"
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={28} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Top-Ranked Programs</h3>
              <p className="text-gray-600">
                Offering AICTE-approved engineering programs with exceptional faculty and curriculum.
              </p>
            </motion.div>

            <motion.div 
              className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center"
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award size={28} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Excellent Placements</h3>
              <p className="text-gray-600">
                Strong industry connections with top companies for internships and job placements.
              </p>
            </motion.div>

            <motion.div 
              className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center"
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={28} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Vibrant Community</h3>
              <p className="text-gray-600">
                Diverse student body with numerous clubs, events, and activities to enhance your college experience.
              </p>
            </motion.div>

            <motion.div 
              className="bg-white p-6 rounded-lg shadow-md border border-gray-100 text-center"
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={28} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Modern Facilities</h3>
              <p className="text-gray-600">
                State-of-the-art labs, libraries, sports facilities, and comfortable hostels for students.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Academic Programs</h2>
            <p className="text-lg text-gray-600">
              Explore our diverse range of undergraduate and postgraduate programs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-blue-700"></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">B.Tech in Computer Science</h3>
                <p className="text-gray-600 mb-4">
                  A comprehensive program focusing on computer science fundamentals, programming, and software development.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">4-year full-time program</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Industry-oriented curriculum</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Specializations available</span>
                  </li>
                </ul>
                <Link 
                  to="/register" 
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  Learn More <ArrowRight size={16} className="ml-1" />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-amber-500"></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">B.Tech in Electronics</h3>
                <p className="text-gray-600 mb-4">
                  Study electronics engineering with focus on circuit design, electronic systems, and telecommunications.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">4-year full-time program</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">State-of-the-art laboratories</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Research opportunities</span>
                  </li>
                </ul>
                <Link 
                  to="/register" 
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  Learn More <ArrowRight size={16} className="ml-1" />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-green-600"></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">B.Tech in Mechanical</h3>
                <p className="text-gray-600 mb-4">
                  Learn mechanical engineering principles, design, thermodynamics, and manufacturing processes.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">4-year full-time program</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Hands-on project work</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Industry partnerships</span>
                  </li>
                </ul>
                <Link 
                  to="/register" 
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  Learn More <ArrowRight size={16} className="ml-1" />
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link 
              to="/register" 
              className="btn px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              Apply for Admission
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Begin Your Academic Journey?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join ABES Engineering College and take the first step toward a successful career.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                to="/register" 
                className="btn px-8 py-3 bg-white hover:bg-gray-100 text-blue-600 font-medium rounded-md transition-colors"
              >
                Apply Now
              </Link>
              <Link 
                to="/login" 
                className="btn px-8 py-3 bg-transparent hover:bg-blue-700 text-white border border-white font-medium rounded-md transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;