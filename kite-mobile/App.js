import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { isSetupComplete, setSetupComplete } from './utils/storage';
import apiClient from './services/api';
import { COLORS, APP_NAME } from './utils/constants';

// Import Screens
import SetupScreen from './screens/SetupScreen';
import DashboardScreen from './screens/DashboardScreen';
import TradingScreen from './screens/TradingScreen';
import BacktestScreen from './screens/BacktestScreen';
import SettingsScreen from './screens/SettingsScreen';
import LogsScreen from './screens/LogsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator (after setup)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'Trading') {
            iconName = focused ? 'chart-line' : 'chart-line-variant';
          } else if (route.name === 'Backtest') {
            iconName = focused ? 'chart-bar' : 'chart-bar-stacked';
          } else if (route.name === 'Logs') {
            iconName = focused ? 'text-box' : 'text-box-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'cog' : 'cog-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: COLORS.PRIMARY,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: APP_NAME }}
      />
      <Tab.Screen
        name="Trading"
        component={TradingScreen}
        options={{ title: 'Trading Controls' }}
      />
      <Tab.Screen
        name="Backtest"
        component={BacktestScreen}
        options={{ title: 'Backtest' }}
      />
      <Tab.Screen
        name="Logs"
        component={LogsScreen}
        options={{ title: 'Logs' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [setupFinalized, setSetupFinalized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    setLoading(true);
    try {
      const setupComplete = await isSetupComplete();
      if (setupComplete) {
        await apiClient.initialize();
        setSetupFinalized(true);
      } else {
        setSetupFinalized(false);
      }
    } catch (error) {
      console.error('Error checking setup:', error);
      setSetupFinalized(false);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {setupFinalized ? (
            <Stack.Screen name="Main" component={MainTabs} />
          ) : (
            <Stack.Screen name="Setup">
              {props => <SetupScreen {...props} onSetupComplete={checkSetup} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
