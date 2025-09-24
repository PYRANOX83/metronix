'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'

interface Complaint {
  id: string
  title: string
  description: string
  category: string
  location: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  citizen: {
    name: string
    email: string
    phone?: string
  }
  solver?: {
    id: string
    name: string
    email: string
  }
  mediaUrl?: string
  images?: string[]
  progressLogs: {
    id: string
    status: string
    note: string
    createdAt: string
    user: {
      name: string
      email: string
    }
  }[]
}

export default function SolverComplaintDetail() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const complaintId = params.id as string
  
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [noteLoading, setNoteLoading] = useState(false)
  const [newNote, setNewNote] = useState('')

  const fetchComplaint = useCallback(async () => {
    try {
      const response = await fetch(`/api/solvers/complaints/${complaintId}`)
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.message || 'Failed to fetch complaint')
      } else {
        setComplaint(data.complaint)
      }
    } catch {
      setError('An error occurred while fetching complaint')
    } finally {
      setLoading(false)
    }
  }, [complaintId])

  useEffect(() => {
    if (status === 'loading' || !session) return

    if (session.user.role !== 'SOLVER') {
      router.push('/')
      return
    }

    fetchComplaint()
  }, [session, status, router, complaintId, fetchComplaint])

  const assignToMe = async () => {
    setAssignLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/solvers/complaints/${complaintId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'assign',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Failed to assign complaint')
      } else {
        fetchComplaint()
      }
    } catch {
      setError('An error occurred while assigning complaint')
    } finally {
      setAssignLoading(false)
    }
  }

  const startComplaint = async () => {
    setStatusLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/solvers/complaints/${complaintId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Failed to start complaint')
      } else {
        fetchComplaint()
      }
    } catch {
      setError('An error occurred while starting complaint')
    } finally {
      setStatusLoading(false)
    }
  }

  const resolveComplaint = async () => {
    setStatusLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/solvers/complaints/${complaintId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resolve',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Failed to resolve complaint')
      } else {
        fetchComplaint()
      }
    } catch {
      setError('An error occurred while resolving complaint')
    } finally {
      setStatusLoading(false)
    }
  }

  const addProgressNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return

    setNoteLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/solvers/complaints/${complaintId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add_note',
          note: newNote,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Failed to add progress note')
      } else {
        setNewNote('')
        fetchComplaint()
      }
    } catch {
      setError('An error occurred while adding progress note')
    } finally {
      setNoteLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      case 'MEDIUM':
        return 'bg-orange-100 text-orange-800'
      case 'LOW':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
          <button
            onClick={fetchComplaint}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            Complaint not found
          </div>
          <button
            onClick={() => router.push('/solver/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/solver/dashboard')}
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Complaint Details
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Complaint Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {complaint.title}
              </h2>
              <p className="text-gray-600 mb-4">
                {complaint.description}
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Category:</span> {complaint.category}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Location:</span> {complaint.location}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Created:</span> {new Date(complaint.createdAt).toLocaleString()}
                </p>
                {complaint.updatedAt !== complaint.createdAt && (
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Last Updated:</span> {new Date(complaint.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <div>
              <div className="space-y-4">
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Status</span>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(complaint.status)}`}>
                    {complaint.status}
                  </span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Priority</span>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(complaint.priority)}`}>
                    {complaint.priority}
                  </span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Citizen</span>
                  <p className="text-sm text-gray-600">
                    {complaint.citizen.name} ({complaint.citizen.email})
                  </p>
                  {complaint.citizen.phone && (
                    <p className="text-sm text-gray-600">
                      Phone: {complaint.citizen.phone}
                    </p>
                  )}
                </div>
                {complaint.solver && (
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">Assigned Solver</span>
                    <p className="text-sm text-gray-600">
                      {complaint.solver.name} ({complaint.solver.email})
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Media */}
        {(complaint.mediaUrl || (complaint.images && complaint.images.length > 0)) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {complaint.mediaUrl && (
                <div className="relative">
                  <Image
                    src={complaint.mediaUrl}
                    alt="Complaint media"
                    className="w-full h-48 object-cover rounded-lg"
                    width={400}
                    height={192}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
              {complaint.images && complaint.images.map((image, index) => (
                <div key={index} className="relative">
                  <Image
                    src={image}
                    alt={`Complaint image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                    width={400}
                    height={192}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
          <div className="flex flex-wrap gap-4">
            {!complaint.solver && (
              <button
                onClick={assignToMe}
                disabled={assignLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {assignLoading ? 'Assigning...' : 'Assign to Me'}
              </button>
            )}
            
            {complaint.solver?.email === session?.user?.email && (
              <>
                {complaint.status === 'PENDING' && (
                  <button
                    onClick={startComplaint}
                    disabled={statusLoading}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {statusLoading ? 'Starting...' : 'Start Working'}
                  </button>
                )}
                
                {complaint.status === 'IN_PROGRESS' && (
                  <button
                    onClick={resolveComplaint}
                    disabled={statusLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {statusLoading ? 'Resolving...' : 'Mark as Resolved'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Progress Logs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Logs</h3>
          
          {complaint.solver?.email === session?.user?.email && (
            <form onSubmit={addProgressNote} className="mb-6">
              <div className="mb-4">
                <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                  Add Progress Note
                </label>
                <textarea
                  id="note"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add your progress notes about this complaint..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={noteLoading || !newNote.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {noteLoading ? 'Adding...' : 'Add Progress Note'}
              </button>
            </form>
          )}

          <div className="space-y-4">
            {complaint.progressLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No progress logs yet</p>
            ) : (
              complaint.progressLogs.map((log) => (
                <div key={log.id} className="border-l-4 border-blue-200 pl-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium text-gray-900">{log.user.name}</span>
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {log.note && <p className="text-gray-700">{log.note}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}