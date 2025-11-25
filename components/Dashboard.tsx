import React from 'react';
import { Users, Activity, TrendingUp, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Client, Workout } from '../types';

interface DashboardProps {
  clients: Client[];
  workouts: Workout[];
}

const Dashboard: React.FC<DashboardProps> = ({ clients, workouts }) => {
  const activeClients = clients.filter(c => c.status === 'Active').length;

  const activityData = [
    { name: 'Mon', workouts: 12 },
    { name: 'Tue', workouts: 19 },
    { name: 'Wed', workouts: 15 },
    { name: 'Thu', workouts: 22 },
    { name: 'Fri', workouts: 18 },
    { name: 'Sat', workouts: 25 },
    { name: 'Sun', workouts: 8 },
  ];

  const clientGrowthData = [
    { month: 'Jan', clients: 5 },
    { month: 'Feb', clients: 8 },
    { month: 'Mar', clients: 12 },
    { month: 'Apr', clients: 15 },
    { month: 'May', clients: 20 },
    { month: 'Jun', clients: 24 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Overview</h2>
        <span className="text-sm text-slate-500">Last updated: Just now</span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Active Clients" value={activeClients.toString()} change="+12%" color="bg-blue-500" />
        <StatCard icon={Activity} label="Workouts Created" value={workouts.length.toString()} change="+5%" color="bg-indigo-500" />
        <StatCard icon={TrendingUp} label="Completion Rate" value="87%" change="+2.4%" color="bg-emerald-500" />
        <StatCard icon={DollarSign} label="Est. Revenue" value="$4,250" change="+18%" color="bg-purple-500" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Weekly Workout Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="workouts" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Client Growth Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Client Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={clientGrowthData}>
                <defs>
                  <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="clients" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorClients)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Recent Actions List - Simplified for demo */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h3>
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <Activity size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-800">Assigned "HIIT Blast" to Sarah Johnson</p>
                            <p className="text-xs text-slate-500">2 hours ago</p>
                        </div>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">Completed</span>
                </div>
            ))}
        </div>
      </div>

    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, change, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <h3 className="text-3xl font-bold text-slate-800 mt-2">{value}</h3>
      <p className="text-xs font-medium text-emerald-600 mt-1">{change} from last month</p>
    </div>
    <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-opacity-100`}>
      <Icon size={24} className={color.replace('bg-', 'text-')} />
    </div>
  </div>
);

export default Dashboard;