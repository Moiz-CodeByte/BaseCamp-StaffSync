"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Calendar, 
  FileText, 
  LogIn, 
  User, 
  CheckCircle,
  Mail,
  MessageSquare,
  Home
} from 'lucide-react';

export default function HelpPage() {
  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: LogIn,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      content: [
        {
          step: '1',
          title: 'Login to Your Account',
          description: 'Visit the login page and enter your company email and password.',
          tips: ['Contact HR if you forget your password']
        },
        {
          step: '2',
          title: 'Access Your Dashboard',
          description: 'After logging in, you\'ll see your dashboard with leave balance and activities.',
          tips: ['Dashboard shows your available leaves and recent requests']
        }
      ]
    },
    {
      id: 'leave-management',
      title: 'Leave Management',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      content: [
        {
          step: '1',
          title: 'Request Leave',
          description: 'Click "Request Leave" button on the Leaves tab in your dashboard.',
          tips: [
            'Select leave type: Annual, Sick, Casual, or Unpaid',
            'Choose start and end dates',
            'Weekends are automatically excluded',
            'Write a clear reason for your request',
            'Check your available balance before submitting'
          ]
        },
        {
          step: '2',
          title: 'Check Available Balance',
          description: 'View your leave balance on the dashboard. The system shows two types of leaves.',
          tips: [
            '🌴 Annual Leaves: 10 days per year (default)',
            '🤒 Sick Leaves: 3 days per year (default)',
            '📊 Use the filter buttons to switch between Annual and Sick leave views',
            '📅 Balance shows projected availability by end of current month',
            '⚠️ You cannot request more days than available',
            '⚠️ Only one pending request allowed at a time'
          ]
        },
        {
          step: '3',
          title: 'Track Leave Status',
          description: 'View all your leave requests with their current status.',
          tips: [
            '🟡 Pending: Waiting for approval',
            '✅ Approved: Leave confirmed',
            '❌ Rejected: Leave not approved',
            'Delete pending requests if plans change',
            'You\'ll receive email notifications for status updates'
          ]
        }
      ]
    },
    {
      id: 'profile',
      title: 'Profile Management',
      icon: User,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      content: [
        {
          step: '1',
          title: 'View Your Information',
          description: 'Access the Profile tab to see your details.',
          tips: [
            'View your name, email, and department',
            'See your assigned managers',
            'Check your leave limits'
          ]
        },
        {
          step: '2',
          title: 'Change Password',
          description: 'Update your password for security.',
          tips: [
            'Enter your current password first',
            'Set a strong new password',
            'Contact HR to update name or email'
          ]
        }
      ]
    },
    {
      id: 'feedback',
      title: 'Feedback & Support',
      icon: MessageSquare,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      content: [
        {
          step: '1',
          title: 'Submit Feedback',
          description: 'Share your thoughts or report issues.',
          tips: [
            'Use the Feedback menu to submit',
            'Choose appropriate category and priority',
            'Track your feedback status'
          ]
        }
      ]
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      icon: CheckCircle,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100 dark:bg-teal-900/30',
      content: [
        {
          step: '1',
          title: 'Leave Requests',
          description: 'Tips for smooth leave approval.',
          tips: [
            'Submit requests at least 15-30 days in advance',
            'Check your balance before requesting',
            'Provide clear reasons',
            'Inform your team about planned leaves',
            'Wait for approval before submitting another request'
          ]
        }
      ]
    },
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      icon: BookOpen,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      content: [
        {
          step: 'Q1',
          title: 'How many leaves can I take per year?',
          description: 'You have 10 Annual leaves and 3 Sick leaves per year (default). Your HR can adjust these limits. Leaves are earned gradually throughout the year.',
          tips: []
        },
        {
          step: 'Q2',
          title: 'Are weekends counted in my leave?',
          description: 'No, Saturdays and Sundays are automatically excluded. Only weekdays count.',
          tips: []
        },
        {
          step: 'Q3',
          title: 'Can I have multiple pending requests?',
          description: 'No, you must wait for your current request to be approved or rejected before submitting a new one.',
          tips: []
        },
        {
          step: 'Q4',
          title: 'Can I cancel my leave request?',
          description: 'Yes, you can delete pending requests. Once approved or rejected, they cannot be deleted.',
          tips: []
        },
        {
          step: 'Q5',
          title: 'Who approves my leaves?',
          description: 'Your reporting managers approve your leave requests. You can see who they are in your Profile tab.',
          tips: []
        },
        {
          step: 'Q6',
          title: 'How do I contact support?',
          description: 'Contact your HR department for any issues with leave approvals, account access, or system questions.',
          tips: []
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 py-4 sm:py-8">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-primary dark:text-primary" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Employee User Manual</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Quick guide to using the system effectively
          </p>
          <Badge variant="secondary" className="text-sm px-4 py-1">
            Last Updated: January 2026
          </Badge>
        </div>

        {/* Quick Links */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Quick Navigation
            </CardTitle>
            <CardDescription>Jump to specific sections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted dark:hover:bg-muted/50 transition-colors text-left"
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${section.color}`} />
                    <span className="text-sm font-medium break-words">{section.title}</span>
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.id} id={section.id} className="scroll-mt-6">
              <Card>
                <CardHeader className={section.bgColor}>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${section.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${section.color}`} />
                    </div>
                    <span>{section.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {section.content.map((item, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full ${section.bgColor} flex items-center justify-center flex-shrink-0 font-semibold ${section.color}`}>
                            {item.step}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base sm:text-lg mb-1">{item.title}</h3>
                            <p className="text-muted-foreground mb-3">{item.description}</p>
                            {item.tips.length > 0 && (
                              <div className="pl-4 border-l-2 border-muted space-y-2">
                                {item.tips.map((tip, tipIndex) => (
                                  <div key={tipIndex} className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">{tip}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {index < section.content.length - 1 && (
                          <div className="border-b border-muted ml-11"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}

        {/* Contact Support */}
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Need Additional Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              If you still have questions or encounter any issues not covered in this manual:
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-background border">
                <h4 className="font-semibold mb-2">Contact HR Department</h4>
                <p className="text-sm text-muted-foreground">
                  Reach out to your HR team for account issues, leave policies, or system access problems.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background border">
                <h4 className="font-semibold mb-2">Submit Feedback</h4>
                <p className="text-sm text-muted-foreground">
                  Use the Feedback feature to report bugs, suggest improvements, or ask questions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>© 2025 BaseCamp StaffSync. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
