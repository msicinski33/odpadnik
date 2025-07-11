import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Truck, Activity, Fuel, TrendingUp, Wrench } from 'lucide-react';

const StatsCards = ({ vehicles }) => {
  const totalVehicles = vehicles.length;
  const inactiveVehicles = vehicles.filter(v => v.faultStatus === 'faulty').length;
  const activeVehicles = totalVehicles - inactiveVehicles;

  const stats = [
    {
      title: 'Wszystkie pojazdy',
      value: totalVehicles,
      icon: Truck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+12%',
      changeColor: 'text-green-600'
    },
    {
      title: 'Aktywne pojazdy',
      value: activeVehicles,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+8%',
      changeColor: 'text-green-600'
    },
    {
      title: 'Niesprawne pojazdy',
      value: inactiveVehicles,
      icon: Wrench,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      change: '-4%',
      changeColor: 'text-green-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 justify-items-center mx-auto max-w-5xl">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50 w-full max-w-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {stat.value}
            </div>
            <p className={`text-xs ${stat.changeColor} flex items-center`}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {stat.change} względem zeszłego miesiąca
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
