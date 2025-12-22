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
          tips: ['Keep your password secure and don\'t share it with anyone', 'Contact HR if you forget your password']
        },
        {
          step: '2',
          title: 'Access Your Dashboard',
          description: 'After logging in, you\'ll be redirected to your employee dashboard where you can see your leave balance and recent activities.',
          tips: ['The dashboard shows your earned leaves and used leaves for the current year (January 1 - Today)']
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
            'Select leave type (Annual, Sick, Emergency, etc.)',
            'Choose start and end dates',
            'Weekend days (Saturday & Sunday) are automatically excluded',
            'Provide a clear reason for your leave request',
            'You can add additional email recipients who should be notified'
          ]
        },
        {
          step: '2',
          title: 'Check Available Balance',
          description: 'Before requesting leave, check your available balance shown on the dashboard.',
          tips: [
            'Available leave balance varies by employee depending on your leave limit',
            'Leaves are earned daily based on your annual limit',
            'Formula: (Days from Jan 1 to Today) × Leave Limit ÷ 365',
            'Your leave limit is set by HR and may differ from other employees',
            'You cannot request more days than available',
            'Pending requests block new submissions until approved/rejected',
            'Leave balance resets every January 1st'
          ]
        },
        {
          step: '3',
          title: 'Track Leave Status',
          description: 'View all your leave requests with their current status.',
          tips: [
            'Pending: Waiting for manager approval',
            'Approved: Your leave has been approved',
            'Rejected: Your leave was not approved (check reason)',
            'You can delete pending leave requests if plans change'
          ]
        },
        {
          step: '4',
          title: 'Email Notifications',
          description: 'You\'ll receive email notifications about your leave request status.',
          tips: [
            'Approval confirmation emails',
            'Rejection notification with reason',
            'Additional recipients will also receive notifications'
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
          title: 'View Profile Information',
          description: 'Access your profile from the Profile tab to view your details.',
          tips: [
            'Name and email',
            'Department and designation',
            'Reporting managers',
            'Leave limit and role'
          ]
        },
        {
          step: '2',
          title: 'Update Profile',
          description: 'You can update your name, email, and password.',
          tips: [
            'Enter current password to make changes',
            'Leave new password blank to keep current password',
            'Contact HR to update department or designation'
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
          description: 'Use the Feedback link in the navigation menu.',
          tips: [
            'Report bugs you encounter',
            'Request new features',
            'Share general feedback',
            'Submit complaints if needed'
          ]
        },
        {
          step: '2',
          title: 'Track Your Feedback',
          description: 'View all your submitted feedback and their status.',
          tips: [
            'Open: Newly submitted',
            'In Progress: Being worked on',
            'Resolved: Issue fixed or feedback addressed',
            'Closed: Completed'
          ]
        },
        {
          step: '3',
          title: 'Priority Levels',
          description: 'Choose appropriate priority when submitting feedback.',
          tips: [
            'Low: Minor issues or suggestions',
            'Medium: Regular feedback',
            'High: Important issues affecting work',
            'Critical: Urgent problems requiring immediate attention'
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
          description: 'Tips for smooth leave approval process.',
          tips: [
            'Submit leave requests in advance (at least 3-5 days)',
            'Provide clear and honest reasons',
            'Check your leave balance before requesting',
            'Inform your team about planned leaves',
            'Only submit one request at a time'
          ]
        },
        {
          step: '3',
          title: 'Communication',
          description: 'Stay informed and communicate effectively.',
          tips: [
            'Check your email regularly for notifications',
            'Add relevant people as additional recipients in leave requests',
            'Use feedback system for suggestions and issues',
            'Keep your profile information up to date'
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
          description: 'Your annual leave limit is set by HR (typically 10 days per year). You earn leaves daily based on this limit - calculated as (Days from January 1 to Today) × Your Leave Limit ÷ 365. For example, with a 10-day annual limit, you earn approximately 0.027 days per day. Leaves do not carry over to the next year.',
          tips: []
        },
        {
          step: 'Q2',
          title: 'Are weekends counted in leave duration?',
          description: 'No, Saturdays and Sundays are automatically excluded from leave calculations. Only business days (Monday-Friday) are counted.',
          tips: []
        },
        {
          step: 'Q3',
          title: 'Can I request leave if I have a pending request?',
          description: 'No, you must wait for your current request to be approved or rejected before submitting a new one.',
          tips: []
        },
        {
          step: 'Q4',
          title: 'Can I delete my leave request?',
          description: 'Yes, you can delete pending leave requests if your plans change. Once approved or rejected, requests cannot be deleted.',
          tips: []
        },
        {
          step: 'Q5',
          title: 'Who approves my leave requests?',
          description: 'Your reporting managers approve leave requests. If you have multiple managers, all must approve. Additional recipients can also approve if added.',
          tips: []
        },
        {
          step: 'Q6',
          title: 'How do I change my password?',
          description: 'Go to Profile tab, enter your current password and new password, then click Update Profile.',
          tips: []
        },
        {
          step: 'Q7',
          title: 'Who can I contact for help?',
          description: 'Contact your HR and development department for any issues with the system, leave approvals, or account-related questions.',
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
            Complete guide to using BaseCamp StaffSync - Your workplace management system
          </p>
          <Badge variant="secondary" className="text-sm px-4 py-1">
            Last Updated: December 2025
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
