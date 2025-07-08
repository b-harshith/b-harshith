"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"

interface FAQ {
  faq_id: number
  question: string
  answer: string
  keywords: string[]
  category: string
  created_by: string
  is_active: boolean
  view_count: number
  created_at: string
  updated_at: string
}

export default function FAQsManagement() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newFaq, setNewFaq] = useState({
    question: '',
    answer: '',
    keywords: '',
    category: ''
  })

  const categories = ['Academic', 'Campus', 'Tech', 'Sports', 'Hostel', 'Other']

  useEffect(() => {
    fetchFAQs()
  }, [])

  const fetchFAQs = async () => {
    try {
      const response = await fetch('/api/admin/faqs')
      const data = await response.json()
      setFaqs(data.faqs)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch FAQs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createFAQ = async () => {
    try {
      const faqData = {
        ...newFaq,
        keywords: newFaq.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
      }

      const response = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faqData)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "FAQ created successfully",
        })
        setShowCreateForm(false)
        setNewFaq({
          question: '',
          answer: '',
          keywords: '',
          category: ''
        })
        fetchFAQs()
      } else {
        throw new Error('Failed to create FAQ')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create FAQ",
        variant: "destructive",
      })
    }
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
        <h1 className="text-3xl font-bold">FAQs Management</h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'Add FAQ'}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New FAQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Question</label>
              <Input
                value={newFaq.question}
                onChange={(e) => setNewFaq({...newFaq, question: e.target.value})}
                placeholder="What is the question?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Answer</label>
              <Textarea
                value={newFaq.answer}
                onChange={(e) => setNewFaq({...newFaq, answer: e.target.value})}
                placeholder="Provide a detailed answer"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Select value={newFaq.category} onValueChange={(value) => setNewFaq({...newFaq, category: value})}>
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
                <label className="block text-sm font-medium mb-2">Keywords (comma-separated)</label>
                <Input
                  value={newFaq.keywords}
                  onChange={(e) => setNewFaq({...newFaq, keywords: e.target.value})}
                  placeholder="library, location, timings, hours"
                />
              </div>
            </div>

            <Button onClick={createFAQ} className="w-full">
              Create FAQ
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {faqs.map(faq => (
          <Card key={faq.faq_id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{faq.question}</h3>
                <div className="flex gap-2">
                  <Badge variant="outline">{faq.category}</Badge>
                  <Badge variant="secondary">{faq.view_count} views</Badge>
                </div>
              </div>
              <p className="text-gray-700 mb-3">{faq.answer}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {faq.keywords.map((keyword, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
              <div className="text-xs text-gray-500">
                Created: {new Date(faq.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
        {faqs.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No FAQs found. Create your first FAQ to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}