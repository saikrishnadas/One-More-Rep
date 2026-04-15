import { supabase } from './supabase';

let GoogleSignin: any = null;

try {
  const mod = require('@react-native-google-signin/google-signin');
  GoogleSignin = mod.GoogleSignin;

  GoogleSignin.configure({
    // Replace with your Web Client ID from Google Cloud Console
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    offlineAccess: true,
  });
} catch {
  // Module not available (e.g. Expo Go)
}

export async function signInWithGoogle(): Promise<{ error?: string }> {
  if (!GoogleSignin) {
    return { error: 'Google Sign-In is not available. Use a development build.' };
  }

  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    const idToken = response?.data?.idToken;

    if (!idToken) {
      return { error: 'Failed to get ID token from Google' };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) return { error: error.message };
    return {};
  } catch (e: any) {
    if (e.code === 'SIGN_IN_CANCELLED') return { error: undefined }; // User cancelled, not an error
    return { error: e.message ?? 'Google Sign-In failed' };
  }
}
