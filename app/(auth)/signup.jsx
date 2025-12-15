import { useState } from "react";
import { Link, router } from "expo-router";
import { createUser } from "../../lib/firebase";
import { View, Text, ScrollView, Dimensions, Alert, Image } from "react-native";
import { KeyboardAvoidingView } from "react-native";
import { Lock } from "lucide-react-native";
import CustomButton from "../../components/CustomButton";
import FormField from "../../components/FormField";

const SignUp = () => {
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    phoneNumber: "",
  });

  const submit = async () => {
    if (form.username === "" || form.email === "" || form.password === "" || form.phoneNumber === "") {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (form.password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    if (form.phoneNumber.length < 11) {
      Alert.alert("Error", "Phone number must be 11 digits");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createUser(form.email, form.password, form.username, form.phoneNumber);
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
    <KeyboardAvoidingView behavior="padding" className="bg-primary h-full">
      <ScrollView keyboardDismissMode="on-drag">
        <View
          className="w-full flex justify-center h-full px-4 my-6"
          style={{
            minHeight: Dimensions.get("window").height - 100,
          }}
        >
          <View className="items-center mt-10">
            <Lock size={48} color="#FF9C01" />
            <Text className="text-2xl text-white mt-4 font-poppins_semibold text-center">
              Sign Up to HushTalk
            </Text>
          </View>

          <FormField
            title="Username"
            value={form.username}
            placeholder="Muhammad Haris"
            handleChangeText={(e) => setForm({ ...form, username: e })}
            otherStyles="mt-10"
          />

          <FormField
            title="Email"
            value={form.email}
            placeholder="mharis7y@gmail.com"
            handleChangeText={(e) => setForm({ ...form, email: e })}
            otherStyles="mt-7"
            keyboardType="email-address"
          />

          <FormField
            title="Phone Number"
            value={form.phoneNumber}
            handleChangeText={(e) => setForm({ ...form, phoneNumber: e })}
            placeholder="03xxxxxxxxx"
            otherStyles="mt-7"
            keyboardType="phone-number"
          />

          <FormField
            title="Password"
            value={form.password}
            placeholder="********"
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
    
    </KeyboardAvoidingView>
  );
};

export default SignUp;
