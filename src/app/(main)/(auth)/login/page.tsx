import { Metadata } from 'next';
import AuthContainer from '../AuthContainer';

export const metadata: Metadata = {
  title: 'Login | Co~Learn',
  description: 'Sign in or sign up for your Co~Learn account'
};

export default function LoginPage() {
  return <AuthContainer />;
}