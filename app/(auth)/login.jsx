import { useState } from "react";
import { Link, router } from "expo-router";
import { View, Text, ScrollView, Dimensions, Alert, Image , KeyboardAvoidingView } from "react-native";
import { Lock} from "lucide-react-native";
import { signIn } from "../../lib/firebase";
import CustomButton from "../../components/CustomButton";
import FormField from "../../components/FormField";

const login = () => {
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const submit = async () => {
    if (form.email === "" || form.password === "") {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const result = await signIn(form.email, form.password);
      if (result.success) {
        // User will be automatically set by onAuthStateChanged in GlobalProvider
        router.replace("/home");
      } else  {
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
          <View className="items-center mt-10 mb-6">
            <Lock size={48} color="#FF9C01" />
            <Text className="text-2xl font-semibold text-white mt-4 font-poppins_semibold text-center">
              Log in to HushTalk
            </Text>
          </View>
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
            title="Sign In"
            handlePress={submit}
            containerStyles="mt-7"
            isLoading={isSubmitting}
          />

          <View className="flex justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-gray font-poppins">
              Don't have an account?
            </Text>
            <Link
              href="/signup"
              className="text-lg font-poppins_semibold text-orange-400"
            >
              Signup
            </Link>
          </View>
        </View>
      </ScrollView>
      
      </KeyboardAvoidingView>
  );
};

export default login;
