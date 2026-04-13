import { Redirect } from 'expo-router';

// The default (tabs) route redirects to home
export default function TabIndex() {
  return <Redirect href="/(tabs)/home" />;
}
