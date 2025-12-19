"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { MessageSquare, Bug, Lightbulb, Clock, CheckCircle, XCircle, User } from 'lucide-react';

export default function AdminFeedbackTab() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', adminNotes: '' });

  const loadFeedbacks = async () => {
    try {
      const { data } = await api.get('/api/feedback/all');
      setFeedbacks(data.feedbacks || []);
    } catch (error) {
      console.error('Failed to load feedbacks:', error);
      toast.error('Failed to load feedback');
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const handleUpdate = async (feedbackId) => {
    try {
      await api.patch('/api/feedback/all', {
        feedbackId,
        ...editForm
      });
      toast.success('Feedback updated successfully');
      setEditingId(null);
      setEditForm({ status: '', adminNotes: '' });
      loadFeedbacks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update feedback');
    }
  };

  const startEdit = (feedback) => {
    setEditingId(feedback._id);
    setEditForm({
      status: feedback.status,
      adminNotes: feedback.adminNotes || ''
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Open': { variant: 'default', icon: Clock, color: 'bg-blue-100 text-blue-700 border-blue-300' },
      'In Progress': { variant: 'secondary', icon: Clock, color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
      'Resolved': { variant: 'default', icon: CheckCircle, color: 'bg-green-100 text-green-700 border-green-300' },
      'Closed': { variant: 'outline', icon: XCircle, color: 'bg-gray-100 text-gray-700 border-gray-300' }
    };
    const config = variants[status] || variants['Open'];
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`gap-1 ${config.color}`}>
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

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesStatus = statusFilter === 'All' || feedback.status === statusFilter;
    const matchesType = typeFilter === 'All' || feedback.type === typeFilter;
    return matchesStatus && matchesType;
  });

  const stats = {
    total: feedbacks.length,
    open: feedbacks.filter(f => f.status === 'Open').length,
    inProgress: feedbacks.filter(f => f.status === 'In Progress').length,
    resolved: feedbacks.filter(f => f.status === 'Resolved').length,
    bugs: feedbacks.filter(f => f.type === 'Bug Report').length,
    critical: feedbacks.filter(f => f.priority === 'Critical').length
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Feedback Management</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review and respond to user feedback and bug reports
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
            <p className="text-xs text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.bugs}</div>
            <p className="text-xs text-muted-foreground">Bugs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-700">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="w-48">
          <Label>Status Filter</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Label>Type Filter</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Bug Report">Bug Report</SelectItem>
              <SelectItem value="Feature Request">Feature Request</SelectItem>
              <SelectItem value="General Feedback">General Feedback</SelectItem>
              <SelectItem value="Complaint">Complaint</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedbacks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium">No feedback found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your filters
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredFeedbacks.map((feedback) => {
            const TypeIcon = getTypeIcon(feedback.type);
            const isEditing = editingId === feedback._id;

            return (
              <Card key={feedback._id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <TypeIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <CardTitle className="text-lg">{feedback.subject}</CardTitle>
                          {getStatusBadge(feedback.status)}
                          {getPriorityBadge(feedback.priority)}
                        </div>
                        <CardDescription className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {feedback.type}
                          </Badge>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {feedback.user?.name} ({feedback.user?.role})
                          </span>
                          <span>•</span>
                          <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                        </CardDescription>
                      </div>
                    </div>
                    {!isEditing && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(feedback)}
                      >
                        Update
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Description:</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {feedback.description}
                    </p>
                  </div>

                  {isEditing ? (
                    <div className="space-y-4 p-4 rounded-lg bg-muted">
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={editForm.status}
                          onValueChange={(val) => setEditForm({...editForm, status: val})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Resolved">Resolved</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Admin Notes</Label>
                        <Textarea
                          value={editForm.adminNotes}
                          onChange={(e) => setEditForm({...editForm, adminNotes: e.target.value})}
                          placeholder="Add notes or response for the user..."
                          className="min-h-[80px]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(feedback._id)}
                        >
                          Save Changes
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(null);
                            setEditForm({ status: '', adminNotes: '' });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : feedback.adminNotes ? (
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Admin Response:
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {feedback.adminNotes}
                      </p>
                    </div>
                  ) : null}

                  {feedback.resolvedAt && (
                    <p className="text-xs text-muted-foreground">
                      Resolved on {new Date(feedback.resolvedAt).toLocaleDateString()}
                      {feedback.resolvedBy && ` by ${feedback.resolvedBy.name}`}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
