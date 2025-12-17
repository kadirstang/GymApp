# 📱 Frontend Mobile App (React Native)

**Framework:** React Native + Expo (or React Native CLI)
**Target:** iOS & Android
**Tech Stack:** React Native + TypeScript + React Navigation + Axios

---

## 📁 Project Structure

```
frontend-mobile/GymOS/
├── package.json
├── app.json                     # Expo config
├── tsconfig.json
├── babel.config.js
├── metro.config.js
├── .env                         # API_URL
├── android/                     # Android native code
├── ios/                         # iOS native code
├── index.js                     # Entry point
├── App.tsx                      # Root component
└── src/
    ├── navigation/
    │   ├── AppNavigator.tsx    # Main navigation (Stack + Tab)
    │   ├── AuthNavigator.tsx   # Login/Register flow
    │   └── MainTabs.tsx        # Bottom tab navigator
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.tsx      # ⏳ Login
    │   │   └── RegisterScreen.tsx   # ⏳ Register
    │   ├── home/
    │   │   └── HomeScreen.tsx       # ⏳ Dashboard (today's workout)
    │   ├── program/
    │   │   ├── MyProgramScreen.tsx  # ⏳ Assigned program
    │   │   └── ProgramDetailScreen.tsx # Program exercises
    │   ├── workout/
    │   │   ├── WorkoutActiveScreen.tsx  # ⏳ Active workout logger
    │   │   ├── WorkoutHistoryScreen.tsx # Workout logs
    │   │   └── WorkoutSummaryScreen.tsx # Post-workout summary
    │   ├── scanner/
    │   │   └── QRScannerScreen.tsx  # ⏳ QR scanner (equipment check-in)
    │   ├── shop/
    │   │   ├── ProductsScreen.tsx   # ⏳ Products list
    │   │   ├── CartScreen.tsx       # Shopping cart
    │   │   └── OrdersScreen.tsx     # Order history
    │   ├── profile/
    │   │   ├── ProfileScreen.tsx    # ⏳ User profile
    │   │   ├── MeasurementsScreen.tsx # Body measurements
    │   │   └── SettingsScreen.tsx   # App settings
    │   └── progress/
    │       ├── ProgressScreen.tsx   # ⏳ Charts & analytics
    │       └── HistoryScreen.tsx    # Workout history
    ├── components/
    │   ├── common/
    │   │   ├── Button.tsx          # Reusable button
    │   │   ├── Card.tsx            # Card component
    │   │   ├── Input.tsx           # Form input
    │   │   ├── LoadingSpinner.tsx  # Loading indicator
    │   │   └── Header.tsx          # Screen header
    │   ├── workout/
    │   │   ├── ExerciseCard.tsx    # Exercise display
    │   │   ├── SetTracker.tsx      # Set/rep tracker
    │   │   └── RestTimer.tsx       # Rest timer
    │   └── shop/
    │       ├── ProductCard.tsx     # Product display
    │       └── CartItem.tsx        # Cart item
    ├── services/
    │   ├── api.ts                  # ⏳ Axios client (interceptors)
    │   ├── auth.service.ts         # ⏳ Auth API calls
    │   ├── workout.service.ts      # ⏳ Workout API calls
    │   ├── product.service.ts      # ⏳ Product API calls
    │   └── storage.service.ts      # ⏳ AsyncStorage wrapper
    ├── contexts/
    │   ├── AuthContext.tsx         # ⏳ Auth state management
    │   └── WorkoutContext.tsx      # ⏳ Active workout state
    ├── hooks/
    │   ├── useAuth.ts              # Auth hook
    │   ├── useWorkout.ts           # Workout hook
    │   └── useNotifications.ts     # Push notifications
    ├── types/
    │   ├── api.ts                  # API types
    │   ├── workout.ts              # Workout types
    │   └── navigation.ts           # Navigation types
    ├── utils/
    │   ├── formatters.ts           # Date, time formatters
    │   ├── validators.ts           # Form validation
    │   └── storage.ts              # AsyncStorage helpers
    └── assets/
        ├── images/                 # App images
        ├── icons/                  # Custom icons
        └── fonts/                  # Custom fonts
```

---

## 🎨 Design System

### Color Palette (React Native)
```typescript
export const Colors = {
  primary: '#3B82F6',      // Blue-600 (brand color)
  primaryDark: '#2563EB',  // Blue-700
  success: '#10B981',      // Green-600
  danger: '#EF4444',       // Red-600
  warning: '#F59E0B',      // Yellow-600
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    600: '#4B5563',
    900: '#111827',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
};
```

### Typography
```typescript
export const Typography = {
  h1: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.gray[900],
  },
  h2: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.gray[900],
  },
  body: {
    fontSize: FontSizes.md,
    color: Colors.gray[600],
  },
  caption: {
    fontSize: FontSizes.sm,
    color: Colors.gray[600],
  },
};
```

---

## 🔐 Authentication Flow

### Login Screen (`screens/auth/LoginScreen.tsx`)

**Status:** ⏳ TODO

```typescript
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      await login(response.data.token, response.data.user);
      // Navigation handled by AuthContext
    } catch (error) {
      Alert.alert('Error', error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GymOS</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Loading...' : 'Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Auth Context (`contexts/AuthContext.tsx`)

**Status:** ⏳ TODO

```typescript
import { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/auth.service';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: { name: string };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load token and user from AsyncStorage on mount
    loadAuth();
  }, []);

  const loadAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string, user: User) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

---

## 🧭 Navigation Structure

### App Navigator (`navigation/AppNavigator.tsx`)

**Status:** ⏳ TODO

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainTabs from './MainTabs';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Main Tabs (`navigation/MainTabs.tsx`)

**Status:** ⏳ TODO

```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeIcon, DumbbellIcon, ShoppingBagIcon, UserIcon } from 'lucide-react-native';

import HomeScreen from '@/screens/home/HomeScreen';
import MyProgramScreen from '@/screens/program/MyProgramScreen';
import ProductsScreen from '@/screens/shop/ProductsScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray[600],
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Program"
        component={MyProgramScreen}
        options={{
          tabBarLabel: 'Program',
          tabBarIcon: ({ color, size }) => <DumbbellIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Shop"
        component={ProductsScreen}
        options={{
          tabBarLabel: 'Shop',
          tabBarIcon: ({ color, size }) => <ShoppingBagIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
```

---

## 📄 Key Screens (Student-Focused)

### 1. Home Screen (`screens/home/HomeScreen.tsx`)

**Status:** ⏳ TODO
**Priority:** HIGH

**Features:**
- Welcome message with user name
- Today's workout card (if assigned)
  - Program name
  - Exercises count
  - Start Workout button
- Quick stats (Total workouts this week, Last workout date)
- Quick actions (Scan QR, Shop, View Progress)

**API Calls:**
```typescript
GET /api/programs?assignedUserId={userId}
GET /api/workout-logs?userId={userId}&page=1&limit=10
```

---

### 2. My Program Screen (`screens/program/MyProgramScreen.tsx`)

**Status:** ⏳ TODO
**Priority:** HIGH

**Features:**
- Assigned program details
  - Name, description, difficulty level
  - Exercises list (ordered)
  - Each exercise: name, target muscle, sets/reps, rest time
- Start Workout button (navigates to WorkoutActiveScreen)
- Empty state: "No program assigned yet. Contact your trainer."

**API Calls:**
```typescript
GET /api/programs?assignedUserId={userId}
GET /api/programs/{programId}
```

---

### 3. Active Workout Screen (`screens/workout/WorkoutActiveScreen.tsx`)

**Status:** ⏳ TODO
**Priority:** HIGH

**Features:**
- Exercise list (swipeable cards)
- Current exercise highlighted
- Set tracker for each exercise:
  - Reps input (number)
  - Weight input (kg)
  - Checkmark when set completed
- Rest timer (countdown after completing set)
- Finish Workout button
- Save draft (offline support)

**State Management:**
```typescript
interface WorkoutState {
  programId: string;
  startedAt: Date;
  exercises: Array<{
    exerciseId: string;
    sets: Array<{
      reps: number;
      weight: number;
      completed: boolean;
    }>;
  }>;
}
```

**API Calls:**
```typescript
POST /api/workout-logs
// Body: { programId, startedAt, endedAt, entries: [...] }
```

---

### 4. QR Scanner Screen (`screens/scanner/QRScannerScreen.tsx`)

**Status:** ⏳ TODO
**Priority:** MEDIUM

**Features:**
- Camera view with QR scanner overlay
- Scan equipment QR code
- Display equipment info (name, type, status)
- Log usage (optional check-in/check-out)

**Dependencies:**
```bash
expo install expo-camera
# OR
npm install react-native-camera
```

**API Calls:**
```typescript
GET /api/equipment/{qrCode}
POST /api/equipment/{id}/log-usage
```

---

### 5. Products Screen (`screens/shop/ProductsScreen.tsx`)

**Status:** ⏳ TODO
**Priority:** MEDIUM

**Features:**
- Products list (FlatList)
- Each product: image, name, price, stock status
- Add to cart button
- Cart icon with badge (item count)
- Category filter (tabs at top)

**API Calls:**
```typescript
GET /api/products?page=1&limit=20
GET /api/product-categories
```

---

### 6. Cart & Checkout (`screens/shop/CartScreen.tsx`)

**Status:** ⏳ TODO
**Priority:** MEDIUM

**Features:**
- Cart items list (quantity, price)
- Total amount
- Notes textarea (delivery notes)
- Place Order button
- Order placed → Status: pending_approval

**API Calls:**
```typescript
POST /api/orders
// Body: { items: [{ productId, quantity }], metadata: { deliveryNotes } }
```

---

### 7. Profile Screen (`screens/profile/ProfileScreen.tsx`)

**Status:** ⏳ TODO
**Priority:** LOW

**Features:**
- User info (name, email, phone)
- Avatar (with edit)
- Body measurements (weight, height, body fat)
- Settings button
- Logout button

**API Calls:**
```typescript
GET /api/users/{userId}
PATCH /api/users/{userId}
POST /api/users/{userId}/measurements
```

---

### 8. Progress Screen (`screens/progress/ProgressScreen.tsx`)

**Status:** ⏳ TODO
**Priority:** LOW

**Features:**
- Workout stats (total workouts, avg per week)
- Charts (react-native-chart-kit):
  - Workout frequency (bar chart)
  - Volume over time (line chart)
- Personal records (PRs)
- Body measurements chart (weight, body fat)

**Dependencies:**
```bash
npm install react-native-chart-kit react-native-svg
```

---

## 🔧 Services & API Integration

### API Client (`services/api.ts`)

**Status:** ⏳ TODO

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

const api = axios.create({
  baseURL: API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - add JWT token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // Trigger logout via EventEmitter or Context
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Workout Service (`services/workout.service.ts`)

**Status:** ⏳ TODO

```typescript
import api from './api';
import { WorkoutLog, WorkoutEntry } from '@/types/workout';

export const workoutService = {
  async getAssignedProgram(userId: string) {
    const response = await api.get(`/programs?assignedUserId=${userId}`);
    return response.data.data.items[0]; // Assume 1 program per student
  },

  async startWorkout(programId: string) {
    return {
      programId,
      startedAt: new Date().toISOString(),
      entries: [],
    };
  },

  async saveWorkout(data: WorkoutLog) {
    const response = await api.post('/workout-logs', data);
    return response.data;
  },

  async getWorkoutHistory(userId: string, page = 1) {
    const response = await api.get(`/workout-logs?userId=${userId}&page=${page}&limit=20`);
    return response.data.data;
  },
};
```

---

## 📦 Dependencies

**Core:**
- `react-native` - Mobile framework
- `react` - UI library
- `typescript` - Type safety
- `expo` (optional) - Expo SDK for easier development

**Navigation:**
- `@react-navigation/native` - Navigation library
- `@react-navigation/native-stack` - Stack navigator
- `@react-navigation/bottom-tabs` - Tab navigator
- `react-native-screens` - Native screens
- `react-native-safe-area-context` - Safe area handling

**Data & State:**
- `axios` - HTTP client
- `@react-native-async-storage/async-storage` - Local storage
- `@tanstack/react-query` (optional) - Server state management

**UI Components:**
- `react-native-paper` (optional) - Material Design components
- `react-native-vector-icons` - Icon library
- `lucide-react-native` - Lucide icons
- `react-native-gesture-handler` - Gestures
- `react-native-reanimated` - Animations

**Forms:**
- `react-hook-form` - Form management
- `zod` - Validation

**Camera & QR:**
- `expo-camera` OR `react-native-camera` - Camera access
- `react-native-qrcode-scanner` - QR scanning

**Charts:**
- `react-native-chart-kit` - Charts
- `react-native-svg` - SVG support

**Notifications:**
- `expo-notifications` OR `@react-native-firebase/messaging` - Push notifications

**Utilities:**
- `date-fns` - Date formatting
- `react-native-dotenv` - Environment variables

---

## 🌐 Environment Variables

**File:** `.env`

```bash
# Backend API URL
API_URL=http://localhost:3001/api
# OR for physical device testing:
# API_URL=http://192.168.1.100:3001/api

# Optional: Push notifications
EXPO_PUBLIC_ONESIGNAL_APP_ID=your-app-id

# Optional: Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

---

## 🚀 Getting Started

### Setup (Expo)

```bash
# Install Expo CLI
npm install -g expo-cli

# Navigate to project
cd frontend-mobile/GymOS

# Install dependencies
npm install

# Start development server
expo start

# Run on iOS simulator
expo start --ios

# Run on Android emulator
expo start --android
```

### Setup (React Native CLI)

```bash
# Navigate to project
cd frontend-mobile/GymOS

# Install dependencies
npm install

# iOS: Install pods
cd ios && pod install && cd ..

# Run on iOS
npm run ios

# Run on Android
npm run android
```

---

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### E2E Tests (Detox)
```bash
npm install --save-dev detox
detox test
```

---

## 🔮 Future Enhancements

### Phase 9+:
- **Offline Mode**: SQLite local database, sync when online
- **Social Features**: Share workouts, leaderboards
- **Video Guides**: Exercise video tutorials
- **Apple Health / Google Fit**: Sync health data
- **Wearable Integration**: Apple Watch, Fitbit
- **Advanced Analytics**: ML-based workout recommendations
- **Dark Mode**: Theme support
- **Multi-language**: i18n support (TR/EN)

---

## 📊 Development Roadmap

### Week 1: Foundation
- [x] Project setup (React Native + TypeScript)
- [ ] Navigation structure (Stack + Tabs)
- [ ] Auth flow (Login/Register)
- [ ] API client setup (Axios + interceptors)
- [ ] Auth context (AsyncStorage)

### Week 2: Core Features
- [ ] Home screen (dashboard)
- [ ] My Program screen (assigned program)
- [ ] Active Workout screen (set/rep tracker)
- [ ] Rest timer component
- [ ] Save workout to backend

### Week 3: Shop & Profile
- [ ] Products screen (list + categories)
- [ ] Cart & checkout
- [ ] Orders history
- [ ] Profile screen (edit user)
- [ ] Body measurements

### Week 4: Polish & Advanced
- [ ] QR scanner (equipment check-in)
- [ ] Progress charts (workout analytics)
- [ ] Push notifications setup
- [ ] Offline support (basic)
- [ ] Testing & bug fixes

---

**Last Updated:** 16 Aralık 2025
**Status:** 0/8 screens complete (⏳ Ready to Start)
**Next Priority:** Setup project → Auth flow → Home & Program screens
**Estimated Duration:** 2-3 weeks for MVP
