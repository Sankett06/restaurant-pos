import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { mockUsers, mockStaff, mockTables, mockMenuItems, mockReservations, mockOrders, mockKOTs, mockRestaurants } from './data/mockData';
import Layout from './components/Layout';
import Login from './components/Login';
import RestaurantSelector from './components/RestaurantSelector';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import Staff from './components/Staff';
import Tables from './components/Tables';
import MenuItems from './components/MenuItems';
import Reservations from './components/Reservations';
import Orders from './components/Orders';
import NewOrder from './components/NewOrder';
import Kitchen from './components/Kitchen';
import Reports from './components/Reports';
import Restaurants from './components/Restaurants';

function AppContent() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    // Load initial mock data
    dispatch({
      type: 'LOAD_INITIAL_DATA',
      payload: {
        currentUser: null,
        currentRestaurant: null,
        restaurants: mockRestaurants,
        users: mockUsers,
        staff: mockStaff,
        tables: mockTables,
        menuItems: mockMenuItems,
        reservations: mockReservations,
        orders: mockOrders,
        kots: mockKOTs,
        selectedTable: null,
      },
    });
  }, [dispatch]);

  // Filter data based on current restaurant
  const getFilteredData = () => {
    if (!state.currentRestaurant) return state;

    return {
      ...state,
      staff: state.staff.filter(s => s.restaurantId === state.currentRestaurant?.id),
      tables: state.tables.filter(t => t.restaurantId === state.currentRestaurant?.id),
      menuItems: state.menuItems.filter(m => m.restaurantId === state.currentRestaurant?.id),
      reservations: state.reservations.filter(r => r.restaurantId === state.currentRestaurant?.id),
      orders: state.orders.filter(o => o.restaurantId === state.currentRestaurant?.id),
      kots: state.kots.filter(k => k.restaurantId === state.currentRestaurant?.id),
    };
  };

  // Update context with filtered data
  const filteredState = getFilteredData();

  return (
    <Router>
      <Routes>
        {!state.currentUser ? (
          <Route path="*" element={<Login />} />
        ) : !state.currentRestaurant ? (
          <Route path="*" element={<RestaurantSelector />} />
        ) : (
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/tables" element={<Tables />} />
            <Route path="/menu" element={<MenuItems />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/new-order" element={<NewOrder />} />
            <Route path="/kitchen" element={<Kitchen />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/restaurants" element={<Restaurants />} />
          </Route>
        )}
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;