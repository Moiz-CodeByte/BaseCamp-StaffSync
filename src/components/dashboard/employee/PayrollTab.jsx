import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PayrollTab({ payslips }) {
  const getStatusBadge = (status) => {
    const variants = {
      'Pending': 'default',
      'Processing': 'outline',
      'Paid': 'secondary',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Payroll</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Payslips</CardTitle>
          <CardDescription>View your payment history and salary details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payslips.map((slip, idx) => (
              <div key={idx} className="border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800">
                  <div>
                    <p className="font-bold text-lg">{slip.month}</p>
                    <p className="text-sm text-gray-500">
                      Generated: {new Date(slip.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        ${slip.total_salary?.toLocaleString() || slip.net?.toLocaleString() || '0'}
                      </p>
                      <p className="text-xs text-gray-500">Net Salary</p>
                    </div>
                    {getStatusBadge(slip.status || 'Pending')}
                  </div>
                </div>
                
                {/* Salary Breakdown */}
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Basic Salary</p>
                    <p className="font-semibold">${(slip.basic_salary || slip.basic || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Allowance</p>
                    <p className="font-semibold text-green-600">+${(slip.allowance || slip.allowances || 0).toLocaleString()}</p>
                  </div>
                  {slip.bonus > 0 && (
                    <div>
                      <p className="text-gray-500 text-xs">Bonus</p>
                      <p className="font-semibold text-green-600">+${slip.bonus.toLocaleString()}</p>
                    </div>
                  )}
                  {slip.deductions > 0 && (
                    <div>
                      <p className="text-gray-500 text-xs">Deductions</p>
                      <p className="font-semibold text-red-600">-${slip.deductions.toLocaleString()}</p>
                    </div>
                  )}
                  {slip.leave_deduction > 0 && (
                    <div>
                      <p className="text-gray-500 text-xs">Leave Deduction</p>
                      <p className="font-semibold text-red-600">-${slip.leave_deduction.toLocaleString()}</p>
                    </div>
                  )}
                  {slip.payment_date && (
                    <div>
                      <p className="text-gray-500 text-xs">Payment Date</p>
                      <p className="font-semibold">{new Date(slip.payment_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                
                {/* Payslip Link */}
                {slip.payslip_url && (
                  <div className="px-4 pb-4">
                    <a 
                      href={slip.payslip_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      Download Payslip (PDF)
                    </a>
                  </div>
                )}
              </div>
            ))}
            {payslips.length === 0 && (
              <p className="text-center text-gray-500 py-8">No payslips available yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
