import { Card, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { ReactNode } from 'react';

export interface KPICardProps {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  trend?: { value: number; label: string };
  loading?: boolean;
}

export const KPICard = ({ icon, iconBg, label, value, trend, loading }: KPICardProps) => {
  if (loading) {
    return (
      <Card className="kpi-card animate-pulse">
        <div className="h-6 bg-neutral-200 rounded w-3/4 mb-2" />
        <div className="h-8 bg-neutral-200 rounded w-1/2" />
        {trend && <div className="h-4 bg-neutral-200 rounded w-1/3 mt-2" />}
      </Card>
    );
  }

  return (
    <Card className="kpi-card">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-body-sm text-text-secondary">{label}</p>
          <p className="text-display-sm font-bold text-text-primary mt-1">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.value > 0 ? (
                <svg className="w-4 h-4 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
              ) : trend.value < 0 ? (
                <svg className="w-4 h-4 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
              ) : (
                <svg className="w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>
              )}
              <span className={`text-body-sm font-medium ${trend.value > 0 ? 'text-success-600' : trend.value < 0 ? 'text-danger-600' : 'text-text-tertiary'}`}>
                {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBg}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

export interface ActivityItemProps {
  icon: ReactNode;
  iconBg: string;
  title: string;
  description: string;
  time: string;
}

export const ActivityItem = ({ icon, iconBg, title, description, time }: ActivityItemProps) => (
  <div className="flex items-start gap-4 px-6 py-4 hover:bg-surface-hover transition-colors">
    <div className={`p-2 rounded-xl ${iconBg} flex-shrink-0`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-text-primary">{title}</p>
      <p className="text-body-sm text-text-secondary mt-0.5">{description}</p>
    </div>
    <span className="text-caption text-text-tertiary flex-shrink-0">{time}</span>
  </div>
);

export interface AgentStatusCardProps {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  lastRun: string;
}

export const AgentStatusCard = ({ name, icon, iconBg, description, status, lastRun }: AgentStatusCardProps) => {
  const Icon = icon;

  const statusConfig = {
    idle: { label: 'Idle', color: 'text-neutral-500', bg: 'bg-neutral-100', dot: 'bg-neutral-400' },
    running: { label: 'Running', color: 'text-primary-600', bg: 'bg-primary-50', dot: 'bg-primary-500 animate-pulse' },
    completed: { label: 'Completed', color: 'text-success-600', bg: 'bg-success-50', dot: 'bg-success-500' },
    failed: { label: 'Failed', color: 'text-danger-600', bg: 'bg-danger-50', dot: 'bg-danger-500' },
  };

  const config = statusConfig[status];

  return (
    <Card className="kpi-card">
      <div className="flex items-start gap-3">
        <div className={`p-3 rounded-xl ${iconBg} flex-shrink-0`}>
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-text-primary truncate">{name}</h3>
            <Badge variant={status === 'running' ? 'info' : status === 'completed' ? 'success' : status === 'failed' ? 'danger' : 'neutral'} size="sm">
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5`} aria-hidden="true" />
              {config.label}
            </Badge>
          </div>
          <p className="text-body-sm text-text-secondary mt-1">{description}</p>
          <p className="text-caption text-text-tertiary mt-2">Last run: {lastRun}</p>
        </div>
      </div>
    </Card>
  );
};