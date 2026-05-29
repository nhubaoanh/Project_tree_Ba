import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { Provider as PaperProvider } from 'react-native-paper';
import { ReactNode } from 'react';

export default function RootLayout() {
  return (
    <AuthProvider
      children={
        <PaperProvider
          children={
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          }
        />
      }
    />
  );
}
