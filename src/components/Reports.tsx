import React, { useState } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Users, Calendar, Download, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export default function Reports() {
  const { state } = useApp();
  const [dateRange, setDateRange] = useState('today');
  const [reportType, setReportType] = useState('overview');

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      default:
        return { start: startOfDay(now), end: endOfDay(now) };
    }
  };

  const { start, end } = getDateRange();
  
  const filteredOrders = state.orders.filter(order => 
    order.createdAt >= start && order.createdAt <= end
  );

  const filteredReservations = state.reservations.filter(reservation => 
    reservation.date >= start && reservation.date <= end
  );

  // Sales Analytics
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = filteredOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalCustomers = filteredOrders.filter(order => order.type !== 'dine-in').length + 
    filteredReservations.filter(r => r.status === 'completed').length;

  // Order Type Distribution
  const orderTypes = {
    'dine-in': filteredOrders.filter(o => o.type === 'dine-in').length,
    'takeaway': filteredOrders.filter(o => o.type === 'takeaway').length,
    'delivery': filteredOrders.filter(o => o.type === 'delivery').length,
  };

  // Popular Items
  const itemSales = new Map();
  filteredOrders.forEach(order => {
    order.items.forEach(item => {
      const menuItem = state.menuItems.find(mi => mi.id === item.menuItemId);
      if (menuItem) {
        const current = itemSales.get(menuItem.name) || { quantity: 0, revenue: 0 };
        itemSales.set(menuItem.name, {
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + (item.price * item.quantity)
        });
      }
    });
  });

  const popularItems = Array.from(itemSales.entries())
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 5);

  // Staff Performance
  const staffPerformance = new Map();
  filteredOrders.forEach(order => {
    const staff = state.staff.find(s => s.id === order.staffId) || 
                  state.users.find(u => u.id === order.staffId);
    if (staff) {
      const current = staffPerformance.get(staff.name) || { orders: 0, revenue: 0 };
      staffPerformance.set(staff.name, {
        orders: current.orders + 1,
        revenue: current.revenue + order.total
      });
    }
  });

  const topStaff = Array.from(staffPerformance.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  // Table Utilization
  const tableUtilization = state.tables.map(table => {
    const tableOrders = filteredOrders.filter(order => order.tableId === table.id);
    return {
      table: table.number,
      orders: tableOrders.length,
      revenue: tableOrders.reduce((sum, order) => sum + order.total, 0)
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const exportReport = () => {
    const reportData = {
      period: dateRange,
      dateRange: { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') },
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        totalCustomers
      },
      orderTypes,
      popularItems: popularItems.map(([name, data]) => ({ name, ...data })),
      staffPerformance: topStaff.map(([name, data]) => ({ name, ...data })),
      tableUtilization
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restaurant-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="overview">Overview</option>
            <option value="sales">Sales</option>
            <option value="staff">Staff</option>
            <option value="inventory">Inventory</option>
          </select>
          <button
            onClick={exportReport}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-green-600">+12.5% from last period</p>
            </div>
            <DollarSign className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
              <p className="text-sm text-blue-600">+8.2% from last period</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">${averageOrderValue.toFixed(2)}</p>
              <p className="text-sm text-purple-600">+3.8% from last period</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
              <p className="text-sm text-orange-600">+15.3% from last period</p>
            </div>
            <Users className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Type Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Type Distribution</h3>
          <div className="space-y-4">
            {Object.entries(orderTypes).map(([type, count]) => {
              const percentage = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      type === 'dine-in' ? 'bg-blue-500' :
                      type === 'takeaway' ? 'bg-green-500' : 'bg-purple-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{count}</span>
                    <span className="text-xs text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Popular Items */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h3>
          <div className="space-y-3">
            {popularItems.map(([name, data], index) => (
              <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900">{name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">{data.quantity} sold</div>
                  <div className="text-xs text-gray-500">${data.revenue.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Performance</h3>
          <div className="space-y-3">
            {topStaff.map(([name, data], index) => (
              <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900">{name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">{data.orders} orders</div>
                  <div className="text-xs text-gray-500">${data.revenue.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table Utilization */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Table Performance</h3>
          <div className="space-y-3">
            {tableUtilization.slice(0, 5).map((table, index) => (
              <div key={table.table} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-600 rounded-full text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900">Table {table.table}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">{table.orders} orders</div>
                  <div className="text-xs text-gray-500">${table.revenue.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Trend Chart Placeholder */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Sales trend chart would be rendered here</p>
            <p className="text-sm text-gray-400 mt-1">Integration with charting library needed</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {filteredOrders.slice(0, 10).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-3 border-l-4 border-emerald-500 bg-emerald-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{order.orderNumber}</p>
                <p className="text-sm text-gray-500">
                  {format(order.createdAt, 'MMM dd, HH:mm')} • {order.type}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-600">${order.total.toFixed(2)}</p>
                <p className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                  {order.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'served': return 'bg-emerald-100 text-emerald-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}