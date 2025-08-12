import React from 'react';
import { Card, CardContent } from "./ui/card";
import { CheckCircle, Clock, AlertTriangle, FileText } from "lucide-react";

export const WorkOrdersStats = ({ total, completed, pending, failed }) => {
  const stats = [
    {
      title: "Wszystkie zlecenia",
      value: total,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Zrealizowane",
      value: completed,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Oczekujące",
      value: pending,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      title: "Niezrealizowane",
      value: failed,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card
          key={stat.title}
          className="group hover:shadow-lg transition-all duration-300 hover:scale-105 border-0 bg-white shadow-md animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 