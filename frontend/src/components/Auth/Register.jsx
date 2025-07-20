import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    badgeNumber: '',
    department: '',
    role: 'officer'
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.badgeNumber) newErrors.badgeNumber = 'Badge number is required';
    if (!formData.department) newErrors.department = 'Department is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await register(formData);
    } catch (error) {
      setErrors({ submit: error.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="glass-card p-8 rounded-xl shadow-2xl">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-white">
              Create Account
            </h2>
            <p className="mt-2 text-sm text-blue-200">
              Join the Legal AI Assistant platform
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    name="firstName"
                    type="text"
                    required
                    className="input-field"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                  {errors.firstName && <p className="error-text">{errors.firstName}</p>}
                </div>
                <div>
                  <input
                    name="lastName"
                    type="text"
                    required
                    className="input-field"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                  {errors.lastName && <p className="error-text">{errors.lastName}</p>}
                </div>
              </div>
              
              <div>
                <input
                  name="email"
                  type="email"
                  required
                  className="input-field"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    name="badgeNumber"
                    type="text"
                    required
                    className="input-field"
                    placeholder="Badge Number"
                    value={formData.badgeNumber}
                    onChange={handleChange}
                  />
                  {errors.badgeNumber && <p className="error-text">{errors.badgeNumber}</p>}
                </div>
                <div>
                  <input
                    name="department"
                    type="text"
                    required
                    className="input-field"
                    placeholder="Department"
                    value={formData.department}
                    onChange={handleChange}
                  />
                  {errors.department && <p className="error-text">{errors.department}</p>}
                </div>
              </div>
              
              <div>
                <select
                  name="role"
                  className="input-field"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="officer">Officer</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              
              <div>
                <input
                  name="password"
                  type="password"
                  required
                  className="input-field"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && <p className="error-text">{errors.password}</p>}
              </div>
              
              <div>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  className="input-field"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded">
                {errors.submit}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
            
            <div className="text-center">
              <a href="/login" className="text-blue-300 hover:text-blue-200 transition-colors">
                Already have an account? Sign in
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;