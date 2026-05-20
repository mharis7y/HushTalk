import { Redirect } from 'expo-router';
import { useGlobalContext } from '../context/GlobalProvider';

export default function Index() {
  const { loading, isLogged } = useGlobalContext();

  // While the native auth state is being resolved, render nothing.
  // This prevents the login screen from flashing for authenticated users.
  if (loading) return null;

  if (isLogged) return <Redirect href="/home" />;
  return <Redirect href="/login" />;
}
