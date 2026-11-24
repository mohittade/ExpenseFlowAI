import { Card, CardBody } from './ui/Card';
import { Bot, Brain, AlertTriangle, Shield, CheckCircle, FileText, Send, Database, Tag, UserCheck, Calculator, Search } from 'lucide-react';

const agents = [
  { name: 'Supervisor', icon: Bot, color: 'bg-purple-100 text-purple-600', description: 'Planning & orchestration' },
  { name: 'Expense Intelligence', icon: Brain, color: 'bg-blue-100 text-blue-600', description: 'Retrieval & categorization' },
  { name: 'Exception Handler', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-600', description: 'Missing data detection' },
  { name: 'Validation', icon: Shield, color: 'bg-green-100 text-green-600', description: 'Policy check & PDF generation' },
];

const steps = [
  { name: 'Parse Request', icon: Search },
  { name: 'Retrieve Expenses', icon: Database },
  { name: 'Categorize Expenses', icon: Tag },
  { name: 'Check Missing Data', icon: AlertTriangle },
  { name: 'Validate Policies', icon: Shield },
  { name: 'Calculate Totals', icon: Calculator },
  { name: 'Generate PDF', icon: FileText },
  { name: 'Validate Report', icon: CheckCircle },
  { name: 'Request Approval', icon: UserCheck },
  { name: 'Send Email', icon: Send },
];

export const Sidebar = () => (
  <aside className="w-72 bg-white border-r border-gray-200 hidden lg:block flex flex-col">
    <div className="p-6 border-b border-gray-200">
      <h2 className="text-lg font-bold text-gray-900">About ExpenseFlow AI</h2>
      <p className="text-sm text-gray-500 mt-1">Multi-agent autonomous travel expense reporting system</p>
    </div>

    <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Agents</h3>
        <div className="space-y-3">
          {agents.map((agent, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className={`p-2 rounded-lg ${agent.color} flex-shrink-0`}>
                <agent.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{agent.name}</p>
                <p className="text-xs text-gray-500">{agent.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Workflow Steps</h3>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
              <step.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>{step.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sample Data</h3>
        <Card>
          <CardBody className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Month</span>
              <span className="font-medium text-gray-900">July 2025</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Transactions</span>
              <span className="font-medium text-gray-900">11</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Categories</span>
              <span className="font-medium text-gray-900">5</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Violations</span>
              <span className="font-medium text-red-600">2</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Missing Data</span>
              <span className="font-medium text-yellow-600">3</span>
            </div>
          </CardBody>
        </Card>
      </section>
    </nav>

    <div className="p-4 border-t border-gray-200">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Configuration</h3>
      <div className="space-y-1 text-xs text-gray-500 font-mono">
        <div>NVIDIA_API_KEY</div>
        <div>SMTP_SERVER/PORT</div>
        <div>DATABASE_PATH</div>
      </div>
    </div>
  </aside>
);