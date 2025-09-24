'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { MapPin, Upload, X, Camera, Send } from 'lucide-react'

const CATEGORIES = [
  'ROADS',
  'WATER',
  'ELECTRICITY',
  'SANITATION',
  'NOISE',
  'PARKING',
  'OTHER'
]

const PRIORITIES = [
  { value: 'LOW', label: 'Low', color: 'text-green-600 bg-green-100' },
  { value: 'NORMAL', label: 'Normal', color: 'text-blue-600 bg-blue-100' },
  { value: 'HIGH', label: 'High', color: 'text-orange-600 bg-orange-100' }
]

interface Location {
  lat: number
  lng: number
}

export default function NewComplaint() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [location, setLocation] = useState<Location | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'NORMAL',
    location: ''
  })

  // Move useCallback to the top to avoid conditional hook calls
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(prev => [...prev, ...acceptedFiles])
  }, [])



  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'CITIZEN') {
    return null
  }

  const getCurrentLocation = () => {
    setLocationLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLocation({ lat: latitude, lng: longitude })
          setLocationLoading(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          let errorMessage = 'Unable to get your location. '
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please check your browser permissions and allow location access.'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable.'
              break
            case error.TIMEOUT:
              errorMessage += 'Location request timed out.'
              break
            default:
              errorMessage += 'An unknown error occurred.'
              break
          }
          
          alert(errorMessage)
          setLocationLoading(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      )
    } else {
      alert('Geolocation is not supported by this browser.')
      setLocationLoading(false)
    }
  }

  // Move useDropzone inside a component to avoid conditional hook calls
  const DropzoneComponent = () => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
        'video/*': ['.mp4', '.mov', '.avi']
      },
      maxSize: 10 * 1024 * 1024 // 10MB
    })

    return (
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag & drop files here, or click to select files'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Max 10MB each. Images and videos only.
        </p>
      </div>
    )
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      alert('Please fill in all required fields.')
      return
    }
    
    setSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title.trim())
      formDataToSend.append('description', formData.description.trim())
      formDataToSend.append('category', formData.category)
      formDataToSend.append('priority', formData.priority)
      formDataToSend.append('location', formData.location.trim())
      if (location && !isNaN(location.lat) && !isNaN(location.lng)) {
        formDataToSend.append('lat', location.lat.toString())
        formDataToSend.append('lng', location.lng.toString())
      }
      
      uploadedFiles.forEach((file) => {
        formDataToSend.append('media', file)
      })

      const response = await fetch('/api/complaints', {
        method: 'POST',
        body: formDataToSend,
      })

      if (response.ok) {
        await response.json()
        router.push('/complaints')
        router.refresh()
      } else {
        const errorData = await response.json()
        alert(errorData.message || 'Failed to submit complaint')
      }
    } catch (error) {
      console.error('Error submitting complaint:', error)
      alert('Failed to submit complaint. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Submit New Complaint</h1>
          <p className="mt-2 text-gray-600">Report an issue in your area</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
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
                placeholder="Provide detailed information about the issue"
              />
            </div>

            {/* Category */}
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
                <option value="">Select a category</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0) + category.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {PRIORITIES.map((priority) => (
                  <button
                    key={priority.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      formData.priority === priority.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm font-medium ${priority.color}`}>
                      {priority.label}
                    </span>
                  </button>
                ))}
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
              {location && location.lat && location.lng && (
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
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Uploaded Files ({uploadedFiles.length})
                  </h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
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
                onClick={() => router.push('/complaints')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {submitting ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}