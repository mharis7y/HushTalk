import { useState } from "react";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalContext } from "../../context/GlobalProvider";
import { createUser } from "../../lib/firebase";
import { View, Text, ScrollView, Dimensions, Alert, Image } from "react-native";
import { KeyboardAvoidingView } from "react-native";
import CustomButton from "../../components/CustomButton";
import FormField from "../../components/FormField";

const SignUp = () => {
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const submit = async () => {
    if (form.username === "" || form.email === "" || form.password === "") {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (form.password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createUser(form.email, form.password, form.username);
      if (result.success) {
        // User will be automatically set by onAuthStateChanged in GlobalProvider
        router.replace("/home");
      } else {
        Alert.alert("Error", result.msg || "Failed to create account");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView>
    <SafeAreaView className="bg-primary h-full">
      <ScrollView keyboardDismissMode="on-drag">
        <View
          className="w-full flex justify-center h-full px-4 my-6"
          style={{
            minHeight: Dimensions.get("window").height - 100,
          }}
        >
          

          <Text className="text-2xl font-semibold text-white mt-10 font-poppins_semibold text-center">
            Sign Up to Aora
          </Text>

          <FormField
            title="Username"
            value={form.username}
            handleChangeText={(e) => setForm({ ...form, username: e })}
            otherStyles="mt-10"
          />

          <FormField
            title="Email"
            value={form.email}
            handleChangeText={(e) => setForm({ ...form, email: e })}
            otherStyles="mt-7"
            keyboardType="email-address"
          />

          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e })}
            otherStyles="mt-7"
          />

          <CustomButton
            title="Sign Up"
            handlePress={submit}
            containerStyles="mt-7"
            isLoading={isSubmitting}
          />

          <View className="flex justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-gray font-poppins">
              Have an account already?
            </Text>
            <Link
              href="/login"
              className="text-lg font-poppins_semibold text-secondary"
            >
              Login
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default SignUp;
