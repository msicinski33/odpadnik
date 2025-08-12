import React from 'react';
import { Card, CardContent } from "./ui/card";
import { CheckCircle, Clock, AlertTriangle, FileText, XCircle } from "lucide-react";

export const OneTimeOrdersStats = ({ total, completed, pending, cancelled, awaitingExecution, containerDelivered, awaitingCompletion }) => {
  const stats = [
    {
      title: "Wszystkie zlecenia",
      value: total,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Oczekuje na realizację",
      value: awaitingExecution,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      title: "Kontener dostarczony",
      value: containerDelivered,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Oczekuje na odbiór",
      value: awaitingCompletion,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Zakończone",
      value: completed,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Anulowane",
      value: cancelled,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      {stats.map((stat, index) => (
        <Card
          key={stat.title}
          className="group hover:shadow-lg transition-all duration-300 hover:scale-105 border-0 bg-white shadow-md animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  {stat.title}
                </p>
                <p className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {stat.value}
                </p>
              </div>
              <div className={`p-2 rounded-full ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
