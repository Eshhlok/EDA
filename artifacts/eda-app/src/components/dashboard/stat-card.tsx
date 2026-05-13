import React from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string
  change: string
  icon: React.ReactNode
  positive: boolean
}

export default function StatCard({
  title,
  value,
  change,
  icon,
  positive,
}: StatCardProps) {
  return (
    <Card className="p-6 bg-card border-card-border hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-foreground mt-2">{value}</h3>
          <div className="flex items-center gap-1 mt-3">
            <div
              className={`flex items-center gap-0.5 text-sm font-semibold ${
                positive ? 'text-primary' : 'text-destructive'
              }`}
            >
              {positive ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
              {change}
            </div>
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        </div>
        <div className="text-muted-foreground opacity-60">{icon}</div>
      </div>
    </Card>
  )
}
