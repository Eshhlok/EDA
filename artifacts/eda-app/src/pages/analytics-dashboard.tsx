'use client'

import React, { useState } from 'react'
import { Menu, X, TrendingUp, Users, Activity, Zap, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import DashboardSidebar from '@/components/dashboard/sidebar'
import StatCard from '@/components/dashboard/stat-card'
import ChartContainer from '@/components/dashboard/chart-container'
import Header from '@/components/dashboard/header'

export default function AnalyticsDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="h-full bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          sidebarOpen={sidebarOpen}
        />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Page Title */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Welcome back! Here&apos;s what&apos;s happening with your data today.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Total Revenue"
                value="$12,428"
                change="+12.5%"
                icon={<TrendingUp className="w-5 h-5" />}
                positive={true}
              />
              <StatCard
                title="Active Users"
                value="3,642"
                change="+8.2%"
                icon={<Users className="w-5 h-5" />}
                positive={true}
              />
              <StatCard
                title="Engagement Rate"
                value="64.3%"
                change="-2.1%"
                icon={<Activity className="w-5 h-5" />}
                positive={false}
              />
              <StatCard
                title="Performance"
                value="98.2%"
                change="+3.8%"
                icon={<Zap className="w-5 h-5" />}
                positive={true}
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Large Chart */}
              <div className="lg:col-span-2">
                <ChartContainer
                  title="Revenue Trend"
                  subtitle="Last 30 days"
                  height="h-80"
                >
                  <div className="w-full h-full flex items-end justify-between px-4 gap-1">
                    {[65, 58, 68, 45, 52, 60, 55, 70, 48, 62, 50, 68, 72, 55, 65].map(
                      (value, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-primary/80 to-primary rounded-t"
                          style={{
                            height: `${(value / 100) * 100}%`,
                            minHeight: '4px',
                          }}
                        />
                      )
                    )}
                  </div>
                </ChartContainer>
              </div>

              {/* Sidebar Chart */}
              <ChartContainer
                title="Top Metrics"
                subtitle="Performance breakdown"
                height="h-80"
              >
                <div className="space-y-4 p-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Conversion</span>
                      <span className="text-sm font-semibold text-foreground">72%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '72%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Retention</span>
                      <span className="text-sm font-semibold text-foreground">85%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Growth</span>
                      <span className="text-sm font-semibold text-foreground">62%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '62%' }} />
                    </div>
                  </div>
                </div>
              </ChartContainer>
            </div>

            {/* Table Section */}
            <ChartContainer
              title="Recent Activity"
              subtitle="Last 10 transactions"
              height="h-auto"
            >
              <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        event: 'Purchase',
                        user: 'Sarah Chen',
                        amount: '$425.00',
                        status: 'Completed',
                      },
                      {
                        event: 'Subscription',
                        user: 'Alex Martinez',
                        amount: '$99.00',
                        status: 'Active',
                      },
                      {
                        event: 'Refund',
                        user: 'Jordan Lee',
                        amount: '-$250.00',
                        status: 'Processed',
                      },
                      {
                        event: 'Purchase',
                        user: 'Taylor White',
                        amount: '$599.00',
                        status: 'Completed',
                      },
                      {
                        event: 'Trial',
                        user: 'Morgan Brown',
                        amount: 'Free',
                        status: 'Active',
                      },
                    ].map((item, i) => (
                      <tr key={i} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-foreground">{item.event}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{item.user}</td>
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                          {item.amount}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              item.status === 'Completed' || item.status === 'Active'
                                ? 'bg-primary/10 text-primary'
                                : item.status === 'Processed'
                                  ? 'bg-muted text-muted-foreground'
                                  : 'bg-destructive/10 text-destructive'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground text-right">
                          Today
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </ChartContainer>
          </div>
        </main>
      </div>
    </div>
  )
}
