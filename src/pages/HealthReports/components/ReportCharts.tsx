import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface ReportChartsProps {
  days: number;
  includeMetrics: boolean;
}

const ReportCharts: React.FC<ReportChartsProps> = ({ days, includeMetrics }) => {
  const getMockData = () => {
    if (days === 7) {
      return [
        { name: "Mon", bp: 118, sleep: 7.2 },
        { name: "Tue", bp: 120, sleep: 6.8 },
        { name: "Wed", bp: 122, sleep: 8.0 },
        { name: "Thu", bp: 119, sleep: 7.5 },
        { name: "Fri", bp: 117, sleep: 6.5 },
        { name: "Sat", bp: 115, sleep: 8.5 },
        { name: "Sun", bp: 118, sleep: 7.8 },
      ];
    }
    return [
      { name: "Week 1", bp: 120, sleep: 7.1 },
      { name: "Week 2", bp: 118, sleep: 7.5 },
      { name: "Week 3", bp: 121, sleep: 6.9 },
      { name: "Week 4", bp: 117, sleep: 7.8 },
    ];
  };

  if (!includeMetrics) {
    return (
      <div className="p-8 border rounded-lg border-dashed text-center text-sm text-muted-foreground">
        Metrics chart visualization is disabled. Toggle setting on the left to show trends.
      </div>
    );
  }

  const data = getMockData();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Systolic Blood Pressure Trends (mmHg)
        </h4>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorBp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
              <YAxis domain={[100, 140]} stroke="#888888" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }} />
              <Area type="monotone" dataKey="bp" stroke="#ef4444" fillOpacity={1} fill="url(#colorBp)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Daily Sleep Duration (Hours)
        </h4>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
              <YAxis domain={[5, 10]} stroke="#888888" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }} />
              <Area type="monotone" dataKey="sleep" stroke="#10b981" fillOpacity={1} fill="url(#colorSleep)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ReportCharts;