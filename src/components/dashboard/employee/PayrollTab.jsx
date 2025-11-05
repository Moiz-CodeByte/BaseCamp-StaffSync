import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PayrollTab({ payslips }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Payroll</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Payslips</CardTitle>
          <CardDescription>View your payment history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payslips.map((slip, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{slip.month}</p>
                  <p className="text-sm text-gray-500">Generated: {new Date(slip.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">${slip.netSalary?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Net Salary</p>
                </div>
              </div>
            ))}
            {payslips.length === 0 && <p className="text-center text-gray-500 py-8">No payslips available yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
