'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { MapPin, Camera, Clock, User, FileText, Image as ImageIcon } from 'lucide-react';

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  location: string | null;
  lat: number | null;
  lng: number | null;
  mediaUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
}

const CATEGORIES = [
  'ROADS',
  'WATER',
  'ELECTRICITY',
  'SANITATION',
  'NOISE',
  'PARKING',
  'OTHER'
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low', color: 'text-green-600 bg-green-100' },
  { value: 'NORMAL', label: 'Normal', color: 'text-blue-600 bg-blue-100' },
  { value: 'HIGH', label: 'High', color: 'text-orange-600 bg-orange-100' }
];

const STATUS_COLORS = {
  SUBMITTED: 'text-blue-600 bg-blue-100',
  ASSIGNED: 'text-yellow-600 bg-yellow-100',
  RESOLVED: 'text-green-600 bg-green-100'
};

interface CitizenDashboardClientProps {
  initialComplaints: Complaint[];
  user: User;
}

export default function CitizenDashboardClient({ initialComplaints }: CitizenDashboardClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'NORMAL',
    location: '',
    lat: null as number | null,
    lng: null as number | null
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    if (session.user.role !== 'CITIZEN') {
      router.push('/dashboard');
      return;
    }
    // Only fetch if we don't have initial data
    if (initialComplaints.length === 0) {
      fetchComplaints();
    }
  }, [session, status, router, initialComplaints]);

  const fetchComplaints = async () => {
    try {
      const response = await fetch('/api/complaints/citizen');
      if (response.ok) {
        const data = await response.json();
        setComplaints(data);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          setFormData(prev => ({
            ...prev,
            lat: latitude,
            lng: longitude
          }));
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationLoading(false);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
      setLocationLoading(false);
    }
  };

  // Move useDropzone inside the form modal to avoid conditional hook calls
  const DropzoneComponent = () => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: {
        'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
        'video/*': ['.mp4', '.avi', '.mov']
      },
      maxFiles: 3,
      maxSize: 10 * 1024 * 1024, // 10MB
      onDrop: (acceptedFiles) => {
        setUploadedFiles(prev => [...prev, ...acceptedFiles].slice(0, 3));
      }
    });

    return (
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-gray-600">
          {isDragActive ? (
            <p>Drop the files here...</p>
          ) : (
            <div>
              <p className="mb-2">Drag & drop files here, or click to select</p>
              <p className="text-sm text-gray-500">Max 3 files, 10MB each</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('priority', formData.priority);
      formDataToSend.append('location', formData.location);
      if (formData.lat) formDataToSend.append('lat', formData.lat.toString());
      if (formData.lng) formDataToSend.append('lng', formData.lng.toString());
      
      uploadedFiles.forEach((file) => {
        formDataToSend.append('media', file);
      });

      const response = await fetch('/api/complaints', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({
          title: '',
          description: '',
          category: '',
          priority: 'NORMAL',
          location: '',
          lat: null,
          lng: null
        });
        setUploadedFiles([]);
        setLocation(null);
        fetchComplaints();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit complaint');
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert('Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'CITIZEN') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Citizen Dashboard</h1>
        <p className="mt-2 text-gray-600">Submit complaints and track their progress</p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Total Complaints: {complaints.length}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Submit New Complaint
        </button>
      </div>

      {/* Complaint Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Submit Complaint</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of your complaint"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Detailed description of the issue"
                  />
                </div>

                {/* Category and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Category</option>
                      {CATEGORIES.map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0) + category.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {PRIORITIES.map(priority => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter location or use GPS"
                    />
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={locationLoading}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {locationLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                      GPS
                    </button>
                  </div>
                  {location && (
                    <p className="mt-1 text-sm text-green-600">
                      Location captured: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </p>
                  )}
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attach Media (Images/Videos)
                  </label>
                  <DropzoneComponent />

                  {uploadedFiles.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</p>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <div className="flex items-center gap-2">
                              {file.type.startsWith('image/') ? (
                                <ImageIcon className="h-4 w-4 text-gray-600" />
                              ) : (
                                <Camera className="h-4 w-4 text-gray-600" />
                              )}
                              <span className="text-sm text-gray-700">{file.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Complaint'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Complaints List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Complaints</h2>
        </div>
        
        {complaints.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600">No complaints submitted yet</p>
            <p className="mt-2 text-sm text-gray-500">Submit your first complaint using the button above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {complaints.map((complaint) => (
              <div key={complaint.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{complaint.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        PRIORITIES.find(p => p.value === complaint.priority)?.color || 'text-gray-600 bg-gray-100'
                      }`}>
                        {complaint.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        STATUS_COLORS[complaint.status as keyof typeof STATUS_COLORS] || 'text-gray-600 bg-gray-100'
                      }`}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{complaint.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {complaint.category.charAt(0) + complaint.category.slice(1).toLowerCase()}
                      </span>
                      
                      {complaint.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {complaint.location}
                        </span>
                      )}
                      
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </span>
                      
                      {complaint.mediaUrl && (
                        <span className="flex items-center gap-1">
                          <ImageIcon className="h-4 w-4" />
                          Has media
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}