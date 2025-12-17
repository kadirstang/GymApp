import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/contexts/AuthContext';
import LoginScreen from '@/screens/auth/LoginScreen';
import MainTabs from './MainTabs';
import ActiveWorkoutScreen from '@/screens/workout/ActiveWorkoutScreen';
import CartScreen from '@/screens/shop/CartScreen';
import ProductDetailScreen from '@/screens/shop/ProductDetailScreen';
import MyOrdersScreen from '@/screens/orders/MyOrdersScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="ActiveWorkout"
              component={ActiveWorkoutScreen}
              options={{
                headerShown: true,
                title: 'Active Workout',
                headerStyle: { backgroundColor: '#fff' },
                headerTitleStyle: { fontWeight: '600' },
              }}
            />
            <Stack.Screen
              name="Cart"
              component={CartScreen}
              options={{
                headerShown: true,
                title: 'Shopping Cart',
                headerStyle: { backgroundColor: '#fff' },
                headerTitleStyle: { fontWeight: '600' },
              }}
            />
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{
                headerShown: true,
                title: 'Product Details',
                headerStyle: { backgroundColor: '#fff' },
                headerTitleStyle: { fontWeight: '600' },
              }}
            />
            <Stack.Screen
              name="MyOrders"
              component={MyOrdersScreen}
              options={{
                headerShown: true,
                title: 'My Orders',
                headerStyle: { backgroundColor: '#fff' },
                headerTitleStyle: { fontWeight: '600' },
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
