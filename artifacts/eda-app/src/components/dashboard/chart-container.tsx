import React from 'react'
import { Card } from '@/components/ui/card'

interface ChartContainerProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  height?: string
}

export default function ChartContainer({
  title,
  subtitle,
  children,
  height = 'h-96',
}: ChartContainerProps) {
  return (
    <Card className="p-6 bg-card border-card-border">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      <div className={height}>
        {children}
      </div>
    </Card>
  )
}
