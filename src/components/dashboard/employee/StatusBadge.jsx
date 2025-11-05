import { Badge } from '@/components/ui/badge';

export default function StatusBadge({ status }) {
  const variants = {
    'Pending': 'default',
    'Approved': 'secondary',
    'Rejected': 'destructive',
    'Present': 'secondary',
    'Absent': 'destructive',
    'Half-Day': 'outline'
  };
  
  return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
}
