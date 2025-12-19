"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Bug, Lightbulb, Send, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function FeedbackPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Bug Report',
    subject: '',
    description: '',
    priority: 'Medium'
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please login to submit feedback');
      router.push('/login');
    }
  }, [user, loading, router]);

  const loadFeedbacks = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/api/feedback');
      setFeedbacks(data.feedbacks || []);
    } catch (error) {
      console.error('Failed to load feedbacks:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadFeedbacks();
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/feedback', formData);
      toast.success('Feedback submitted successfully');
      setFormData({
        type: 'Bug Report',
        subject: '',
        description: '',
        priority: 'Medium'
      });
      setShowForm(false);
      loadFeedbacks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Open': { variant: 'default', icon: Clock, color: 'text-blue-600' },
      'In Progress': { variant: 'secondary', icon: Clock, color: 'text-yellow-600' },
      'Resolved': { variant: 'default', icon: CheckCircle, color: 'text-green-600' },
      'Closed': { variant: 'outline', icon: XCircle, color: 'text-gray-600' }
    };
    const config = variants[status] || variants['Open'];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      'Low': 'bg-gray-100 text-gray-700 border-gray-300',
      'Medium': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'High': 'bg-orange-100 text-orange-700 border-orange-300',
      'Critical': 'bg-red-100 text-red-700 border-red-300'
    };
    return (
      <Badge variant="outline" className={colors[priority] || colors['Medium']}>
        {priority}
      </Badge>
    );
  };

  const getTypeIcon = (type) => {
    const icons = {
      'Bug Report': Bug,
      'Feature Request': Lightbulb,
      'General Feedback': MessageSquare,
      'Complaint': MessageSquare
    };
    return icons[type] || MessageSquare;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feedback & Support</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Report bugs, request features, or share your feedback
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Submit Feedback'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Submit Feedback
            </CardTitle>
            <CardDescription>Help us improve by sharing your thoughts</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Feedback Type *</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(val) => setFormData({...formData, type: val})}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bug Report">🐛 Bug Report</SelectItem>
                      <SelectItem value="Feature Request">💡 Feature Request</SelectItem>
                      <SelectItem value="General Feedback">💬 General Feedback</SelectItem>
                      <SelectItem value="Complaint">⚠️ Complaint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(val) => setFormData({...formData, priority: val})}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="Brief summary of your feedback"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Provide detailed information about your feedback..."
                  className="min-h-[120px] resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      type: 'Bug Report',
                      subject: '',
                      description: '',
                      priority: 'Medium'
                    });
                  }}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Clear
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">My Feedback History ({feedbacks.length})</h2>
        
        {feedbacks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-medium">No feedback submitted yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Click &quot;Submit Feedback&quot; to share your thoughts
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback) => {
              const TypeIcon = getTypeIcon(feedback.type);
              return (
                <Card key={feedback._id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <TypeIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <CardTitle className="text-lg">{feedback.subject}</CardTitle>
                            {getStatusBadge(feedback.status)}
                            {getPriorityBadge(feedback.priority)}
                          </div>
                          <CardDescription className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {feedback.type}
                            </Badge>
                            <span>•</span>
                            <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1 font-medium">Description:</p>
                        <p className="text-sm whitespace-pre-wrap">{feedback.description}</p>
                      </div>
                      
                      {feedback.resolvedAt && (
                        <p className="text-xs text-muted-foreground">
                          Resolved on {new Date(feedback.resolvedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
