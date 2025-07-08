"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"

interface Event {
  event_id: number
  title: string
  description: string
  category: string
  event_date: string
  location: string
  poster_url?: string
  organizer_id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  target_audience: string[]
  max_participants?: number
  registration_required: boolean
  registration_link?: string
  created_at: string
  updated_at: string
  broadcast_sent: boolean
}

export default function EventsManagement() {
  const [pendingEvents, setPendingEvents] = useState<Event[]>([])
  const [approvedEvents, setApprovedEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    category: '',
    event_date: '',
    location: '',
    poster_url: '',
    target_audience: [] as string[],
    max_participants: '',
    registration_required: false,
    registration_link: ''
  })

  const categories = ['Tech', 'Arts', 'Sports', 'Academic', 'Cultural', 'Social', 'Career', 'Other']

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events')
      const data = await response.json()
      setPendingEvents(data.pendingEvents)
      setApprovedEvents(data.approvedEvents)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const approveEvent = async (eventId: number) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/approve`, {
        method: 'POST'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Event approved and broadcast initiated",
        })
        fetchEvents()
      } else {
        throw new Error('Failed to approve event')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve event",
        variant: "destructive",
      })
    }
  }

  const createEvent = async () => {
    try {
      const eventData = {
        ...newEvent,
        max_participants: newEvent.max_participants ? parseInt(newEvent.max_participants) : null,
        organizer_id: 'admin' // In real app, get from auth
      }

      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Event created successfully",
        })
        setShowCreateForm(false)
        setNewEvent({
          title: '',
          description: '',
          category: '',
          event_date: '',
          location: '',
          poster_url: '',
          target_audience: [],
          max_participants: '',
          registration_required: false,
          registration_link: ''
        })
        fetchEvents()
      } else {
        throw new Error('Failed to create event')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Events Management</h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'Create Event'}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="Event title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Select value={newEvent.category} onValueChange={(value) => setNewEvent({...newEvent, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date & Time</label>
                <Input
                  type="datetime-local"
                  value={newEvent.event_date}
                  onChange={(e) => setNewEvent({...newEvent, event_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  placeholder="Event location"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                placeholder="Event description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Poster URL (optional)</label>
                <Input
                  value={newEvent.poster_url}
                  onChange={(e) => setNewEvent({...newEvent, poster_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Participants (optional)</label>
                <Input
                  type="number"
                  value={newEvent.max_participants}
                  onChange={(e) => setNewEvent({...newEvent, max_participants: e.target.value})}
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="registration"
                checked={newEvent.registration_required}
                onChange={(e) => setNewEvent({...newEvent, registration_required: e.target.checked})}
              />
              <label htmlFor="registration" className="text-sm font-medium">Registration Required</label>
            </div>

            {newEvent.registration_required && (
              <div>
                <label className="block text-sm font-medium mb-2">Registration Link</label>
                <Input
                  value={newEvent.registration_link}
                  onChange={(e) => setNewEvent({...newEvent, registration_link: e.target.value})}
                  placeholder="https://..."
                />
              </div>
            )}

            <Button onClick={createEvent} className="w-full">
              Create Event
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Approval ({pendingEvents.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingEvents.map(event => (
              <div key={event.event_id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{event.title}</h3>
                  <Badge variant="outline">{event.category}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>📅 {formatDate(event.event_date)}</p>
                  <p>📍 {event.location}</p>
                  <p>👤 Organizer: {event.organizer_id}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => approveEvent(event.event_id)}>
                    Approve & Broadcast
                  </Button>
                  <Button size="sm" variant="outline">
                    Reject
                  </Button>
                </div>
              </div>
            ))}
            {pendingEvents.length === 0 && (
              <p className="text-gray-500 text-center py-8">No pending events</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approved Events ({approvedEvents.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {approvedEvents.slice(0, 10).map(event => (
              <div key={event.event_id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{event.title}</h3>
                  <div className="flex gap-1">
                    <Badge variant="outline">{event.category}</Badge>
                    {event.broadcast_sent && <Badge className="bg-green-500">Broadcasted</Badge>}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>📅 {formatDate(event.event_date)}</p>
                  <p>📍 {event.location}</p>
                </div>
              </div>
            ))}
            {approvedEvents.length === 0 && (
              <p className="text-gray-500 text-center py-8">No approved events</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}