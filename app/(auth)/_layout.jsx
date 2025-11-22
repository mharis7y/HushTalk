import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import Loader from "../../components/Loader";
import { useGlobalContext } from "../../context/GlobalProvider";

function AuthLayout() {
  const { loading, isLogged } = useGlobalContext();

  if (!loading && isLogged) return <Redirect href="/home" />;

  return (
    <>
      <Stack>
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="signup"
          options={{
            headerShown: false,
          }}
        />
      </Stack>

      {loading && <Loader overlay={true} />}
      <StatusBar backgroundColor="#161622" style="light" />
    </>
  );
}

AuthLayout.displayName = 'AuthLayout';

export default AuthLayout;
