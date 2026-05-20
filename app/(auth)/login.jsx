import { useState } from "react";
import { Link, router } from "expo-router";
import {
  View,
  Text,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  Pressable,
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Lock, Mail } from "lucide-react-native";
import { signIn, resetPassword } from "../../lib/firebase";
import CustomButton from "../../components/CustomButton";
import FormField from "../../components/FormField";
import Toast from "react-native-toast-message";

const Login = () => {
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const [forgotVisible, setForgotVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const submit = async () => {
    if (!form.email || !form.password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      const result = await signIn(form.email, form.password);
      if (result.success) {
        router.replace("/home");
      } else {
        Alert.alert("Error", result.msg || "Failed to sign in");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    setResetLoading(true);
    try {
      const result = await resetPassword(resetEmail.trim());
      if (result.success) {
        setForgotVisible(false);
        setResetEmail("");
        Toast.show({
          type: "success",
          text1: "Email Sent",
          text2: "Check your inbox for the password reset link.",
          position: "bottom",
        });
      } else {
        Alert.alert("Error", result.msg || "Failed to send reset email.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      <KeyboardAwareScrollView
        style={{ flex: 1, backgroundColor: "#161622" }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={20}
        bounces={false}
      >
        <View
          className="w-full flex justify-center px-4 my-6"
          style={{ minHeight: Dimensions.get("window").height - 100 }}
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

          <Pressable
            onPress={() => {
              setResetEmail(form.email);
              setForgotVisible(true);
            }}
            className="self-end mt-3"
            hitSlop={8}
          >
            <Text className="text-secondary font-poppins_medium text-sm">
              Forgot password?
            </Text>
          </Pressable>

          <CustomButton
            title="Sign In"
            handlePress={submit}
            containerStyles="mt-6"
            isLoading={isSubmitting}
          />

          <View className="flex justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-gray font-poppins">
              Don't have an account?
            </Text>
            <Link href="/signup" className="text-lg font-poppins_semibold text-orange-400">
              Signup
            </Link>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <Modal
        visible={forgotVisible}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setForgotVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", padding: 24 }}
          onPress={() => setForgotVisible(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ width: "100%", backgroundColor: "#1E1E28", borderRadius: 24, padding: 24 }}
          >
            <View className="flex-row items-center gap-3 mb-2">
              <Mail size={24} color="#FF9C01" />
              <Text className="text-2xl text-white font-poppins_bold">
                Reset Password
              </Text>
            </View>
            <Text className="text-white/60 font-poppins text-sm mb-6 leading-5">
              Enter your account email and we'll send you a link to reset your password.
            </Text>

            <Text className="text-white font-poppins_medium mb-2">Email</Text>
            <TextInput
              value={resetEmail}
              onChangeText={setResetEmail}
              placeholder="you@example.com"
              placeholderTextColor="#8D8DAA"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                backgroundColor: "#161622",
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: "#FFFFFF",
                fontFamily: "Poppins_400Regular",
                marginBottom: 24,
              }}
            />

            <CustomButton
              title="Send Reset Link"
              handlePress={handleResetPassword}
              isLoading={resetLoading}
            />

            <Pressable
              onPress={() => setForgotVisible(false)}
              className="mt-4 items-center"
              hitSlop={8}
            >
              <Text className="text-white/50 font-poppins_medium">Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default Login;
