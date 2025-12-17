import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/services/api';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/types/api';

export default function ProductDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { addToCart, isInCart } = useCart();
  const { productId } = route.params as { productId: string };

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await apiClient.getClient().get(`/products/${productId}`);
      if (response.data.success && response.data.data) {
        const productData = response.data.data;
        // Convert Decimal price to number
        productData.price = typeof productData.price === 'string'
          ? parseFloat(productData.price)
          : productData.price;
        setProduct(productData);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      Alert.alert('Error', 'Failed to load product details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }

    Alert.alert(
      'Added to Cart',
      `${quantity} x ${product.name} added to cart`,
      [
        { text: 'Continue Shopping', style: 'cancel' },
        {
          text: 'View Cart',
          onPress: () => navigation.navigate('Cart' as never),
        },
      ]
    );
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stockQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  const inStock = product.stockQuantity > 0;
  const inCartStatus = isInCart(product.id);

  return (
    <ScrollView style={styles.container}>
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={80} color="#9ca3af" />
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>
        <View style={styles.header}>
          <Text style={styles.category}>{product.category.name}</Text>
          {inCartStatus && (
            <View style={styles.inCartBadge}>
              <Text style={styles.inCartText}>In Cart</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{product.name}</Text>

        <Text style={styles.price}>${product.price.toFixed(2)}</Text>

        {/* Stock Status */}
        <View style={styles.stockContainer}>
          <Ionicons
            name={inStock ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color={inStock ? '#10b981' : '#ef4444'}
          />
          <Text style={[styles.stockText, !inStock && styles.outOfStock]}>
            {inStock
              ? `${product.stockQuantity} units in stock`
              : 'Out of stock'}
          </Text>
        </View>

        {/* Description */}
        {product.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
        )}

        {/* Quantity Selector */}
        {inStock && (
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                onPress={decrementQuantity}
                disabled={quantity <= 1}
              >
                <Ionicons name="remove" size={20} color={quantity <= 1 ? '#9ca3af' : '#fff'} />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  quantity >= product.stockQuantity && styles.quantityButtonDisabled,
                ]}
                onPress={incrementQuantity}
                disabled={quantity >= product.stockQuantity}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={quantity >= product.stockQuantity ? '#9ca3af' : '#fff'}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Add to Cart Button */}
        <TouchableOpacity
          style={[styles.addToCartButton, !inStock && styles.addToCartButtonDisabled]}
          onPress={handleAddToCart}
          disabled={!inStock}
        >
          <Ionicons name="cart" size={20} color="#fff" />
          <Text style={styles.addToCartButtonText}>
            {inStock ? 'Add to Cart' : 'Out of Stock'}
          </Text>
        </TouchableOpacity>

        {/* Product Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Product Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>{product.category.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Stock:</Text>
            <Text style={styles.detailValue}>
              {inStock ? `${product.stockQuantity} units` : 'Out of stock'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={styles.detailValue}>
              {product.isActive ? 'Available' : 'Unavailable'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f3f4f6',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  imageContainer: {
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  inCartBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inCartText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 16,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stockText: {
    fontSize: 14,
    color: '#10b981',
    marginLeft: 8,
    fontWeight: '500',
  },
  outOfStock: {
    color: '#ef4444',
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 36,
    height: 36,
    backgroundColor: '#3b82f6',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    minWidth: 40,
    textAlign: 'center',
  },
  addToCartButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  detailsContainer: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
});
