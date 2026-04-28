// src/navigation/AppNavigator.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../redux/slices/userSlice';
import { C } from '../components/theme';

// Auth
import LandingScreen from '../screens/LandingScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';

// Main
import HomeScreen from '../screens/HomeScreen';
import SoilAnalysisScreen from '../screens/SoilAnalysisScreen';
import FertilizerScreen from '../screens/FertilizerScreen';
import DashboardScreen from '../screens/DashboardScreen';
import WeatherScreen from '../screens/WeatherScreen';
import DiseaseIdentificationScreen from '../screens/DiseaseIdentificationScreen';
import DiseaseUploadScreen from '../screens/DiseaseUploadScreen';
import DiseaseResultScreen from '../screens/DiseaseResultScreen';
import DiseaseHistoryScreen from '../screens/DiseaseHistoryScreen';
import VarietyHubScreen from '../screens/VarietyHubScreen';
import VarietyIdentifyScreen from '../screens/VarietyIdentifyScreen';
import VarietyInfoScreen from '../screens/VarietyInfoScreen';
import VarietyHistoryScreen from '../screens/VarietyHistoryScreen';

const Stack = createNativeStackNavigator();
const NO_HEADER = ['Landing', 'SignIn', 'SignUp'];

const SCREEN_META = {
  Home: { icon: 'home-outline', color: C.primary },
  SoilAnalysis: { icon: 'leaf-outline', color: C.blue },
  Fertilizer: { icon: 'nutrition-outline', color: C.warning },
  Dashboard: { icon: 'map-outline', color: C.rose },
  Weather: { icon: 'partly-sunny-outline', color: '#0277BD' },
  DiseaseIdentification: { icon: 'bug-outline', color: '#C62828' },
  DiseaseUpload: { icon: 'cloud-upload-outline', color: '#C62828' },
  DiseaseResult: { icon: 'checkmark-circle-outline', color: C.success },
  DiseaseHistory: { icon: 'document-text-outline', color: C.text3 },
  VarietyHub: { icon: 'scan-outline', color: C.teal },
  VarietyIdentify: { icon: 'camera-outline', color: C.teal },
  VarietyInfo: { icon: 'information-circle-outline', color: C.teal },
  VarietyHistory: { icon: 'time-outline', color: C.text3 },
};

function BackButton({ onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={nb.backBtn}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Ionicons name="chevron-back" size={20} color={C.primary} />
    </TouchableOpacity>
  );
}

function HeaderTitle({ title, screenName }) {
  const meta = SCREEN_META[screenName] ?? { icon: 'ellipse-outline', color: C.primary };
  return (
    <View style={nb.titleRow}>
      <View style={[nb.iconWrap, { backgroundColor: meta.color + '18' }]}>
        <Ionicons name={meta.icon} size={16} color={meta.color} />
      </View>
      <Text style={nb.title} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

export default function AppNavigator() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'Home' : 'Landing'}
        screenOptions={({ navigation, route }) => {
          const isAuth = NO_HEADER.includes(route.name);
          return {
            headerShown: !isAuth,
            headerStyle: {
              backgroundColor: C.white,
              elevation: 2,
              shadowOpacity: 0.06,
            },
            headerLeft: ({ canGoBack }) =>
              canGoBack ? <BackButton onPress={() => navigation.goBack()} /> : null,
            headerLeftContainerStyle: { paddingLeft: 10 },
            headerTitleAlign: 'left',

            headerTitle: ({ children }) => (
              <HeaderTitle title={children ?? route.name} screenName={route.name} />
            ),
            headerTitleContainerStyle: {
              left: Platform.OS === 'ios' ? 50 : 0,
              right: 0,
            },
            headerTintColor: C.primary,
            headerBackTitleVisible: false,
            statusBarStyle: 'dark',
            statusBarColor: isAuth ? C.bg : C.white,
            contentStyle: { backgroundColor: C.bg },
            animation: 'slide_from_right',
          };
        }}
      >
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />

        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Dashboard' }} />
        <Stack.Screen
          name="SoilAnalysis"
          component={SoilAnalysisScreen}
          options={{ title: 'Live Soil Monitor' }}
        />
        <Stack.Screen
          name="Fertilizer"
          component={FertilizerScreen}
          options={{ title: 'Fertilizer Advisor' }}
        />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Farm Dashboard' }}
        />
        <Stack.Screen
          name="Weather"
          component={WeatherScreen}
          options={{ title: 'Weather Station' }}
        />

        <Stack.Screen
          name="DiseaseIdentification"
          component={DiseaseIdentificationScreen}
          options={{ title: 'Disease Detection' }}
        />
        <Stack.Screen
          name="DiseaseUpload"
          component={DiseaseUploadScreen}
          options={{ title: 'Upload Leaf Image' }}
        />
        <Stack.Screen
          name="DiseaseResult"
          component={DiseaseResultScreen}
          options={{ title: 'Detection Result' }}
        />
        <Stack.Screen
          name="DiseaseHistory"
          component={DiseaseHistoryScreen}
          options={{ title: 'Detection History' }}
        />

        <Stack.Screen
          name="VarietyHub"
          component={VarietyHubScreen}
          options={{ title: 'Variety Module' }}
        />
        <Stack.Screen
          name="VarietyIdentify"
          component={VarietyIdentifyScreen}
          options={{ title: 'Identify Variety' }}
        />
        <Stack.Screen
          name="VarietyInfo"
          component={VarietyInfoScreen}
          options={{ title: 'Variety Info' }}
        />
        <Stack.Screen
          name="VarietyHistory"
          component={VarietyHistoryScreen}
          options={{ title: 'Scan History' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const nb = StyleSheet.create({
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.xlight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 15, fontWeight: '800', color: C.text },
});
