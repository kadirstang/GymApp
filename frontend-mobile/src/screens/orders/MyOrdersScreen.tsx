import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api';

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    product: {
      id: string;
      name: string;
      category: { name: string };
    };
  }>;
}

export default function MyOrdersScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const response = await apiClient.getMyOrders(user.id, 1);
      if (response.success && response.data) {
        // Convert Decimal totalAmount to number
        const ordersData = (response.data.items || []).map((order: any) => ({
          ...order,
          totalAmount: typeof order.totalAmount === 'string'
            ? parseFloat(order.totalAmount)
            : order.totalAmount || 0,
          items: order.items.map((item: any) => ({
            ...item,
            unitPrice: typeof item.unitPrice === 'string'
              ? parseFloat(item.unitPrice)
              : item.unitPrice || 0,
          })),
        }));
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return '#f59e0b';
      case 'prepared':
        return '#3b82f6';
      case 'completed':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'Pending Approval';
      case 'prepared':
        return 'Prepared';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'time-outline';
      case 'prepared':
        return 'checkmark-circle-outline';
      case 'completed':
        return 'checkmark-done-circle';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
    Alert.alert(
      'Cancel Order',
      `Are you sure you want to cancel order ${orderNumber}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiClient.getClient().put(`/orders/${orderId}`, {
                status: 'cancelled',
                metadata: {
                  cancelledBy: user?.id,
                  cancelledAt: new Date().toISOString(),
                  reason: 'Customer cancellation',
                },
              });

              if (response.data.success) {
                Alert.alert('Success', 'Order cancelled successfully');
                fetchOrders(); // Refresh list
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel order');
            }
          },
        },
      ]
    );
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const canCancel = item.status === 'pending_approval';
    const itemCount = item.items.reduce((sum, i) => sum + i.quantity, 0);

    return (
      <View style={styles.orderCard}>
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Ionicons name={getStatusIcon(item.status) as any} size={16} color="#fff" />
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        {/* Order Items Summary */}
        <View style={styles.itemsSummary}>
          <Text style={styles.itemsCount}>
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.orderTotal}>
            ${typeof item.totalAmount === 'number' ? item.totalAmount.toFixed(2) : '0.00'}
          </Text>
        </View>

        {/* Order Items List */}
        <View style={styles.itemsList}>
          {item.items.map((orderItem) => (
            <View key={orderItem.id} style={styles.orderItem}>
              <View style={styles.orderItemInfo}>
                <Text style={styles.orderItemName} numberOfLines={1}>
                  {orderItem.product?.name || 'Product'}
                </Text>
                <Text style={styles.orderItemCategory}>
                  {orderItem.product?.category?.name || 'Category'}
                </Text>
              </View>
              <View style={styles.orderItemPricing}>
                <Text style={styles.orderItemQuantity}>x{orderItem.quantity}</Text>
                <Text style={styles.orderItemPrice}>
                  ${typeof orderItem.unitPrice === 'number' ? (orderItem.unitPrice * orderItem.quantity).toFixed(2) : '0.00'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.orderActions}>
          {canCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelOrder(item.id, item.orderNumber)}
            >
              <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={80} color="#d1d5db" />
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptyText}>Your orders will appear here</Text>
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => (navigation as any).navigate('Shop')}
        >
          <Text style={styles.shopButtonText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f3f4f6',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  itemsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemsCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  itemsList: {
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  orderItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  orderItemCategory: {
    fontSize: 12,
    color: '#9ca3af',
  },
  orderItemPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderItemQuantity: {
    fontSize: 14,
    color: '#6b7280',
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    minWidth: 60,
    textAlign: 'right',
  },
  orderActions: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
});
