"use client";

import { Form, Input, Button, Card, Typography, message } from "antd";
import { useAuthStore } from "../../../stores/authStore";
import { useRouter } from "next/navigation";
import { z } from "zod";
import api from "../../../lib/axios";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    try {
      // 1. Requirement 1: Validate with Zod before the API call
      loginSchema.parse(values);

      const { data } = await api.post("/auth/login", values);

      localStorage.setItem("refresh_token", data.data.refresh_token);
      // 2. Requirement 2: Store access_token in Zustand (Memory-only)
      setAuth(data.data.user, data.data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      // 3. Requirement 5: Map Zod issues to Ant Design fields
      if (err instanceof z.ZodError) {
        const fieldErrors = err.issues.map((issue) => ({
          name: issue.path[0], // The field name (e.g., 'email')
          errors: [issue.message], // The validation message
        }));
        form.setFields(fieldErrors);
      } else {
        // Handle API errors (e.g., 401 Unauthorized)
        const errorMsg = err.response?.data?.message || "Invalid credentials";
        message.error(errorMsg);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <Typography.Title level={2} className="text-center">
          Student Login
        </Typography.Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Form.Item label="Email" name="email">
            <Input size="large" placeholder="student@example.com" />
          </Form.Item>
          <Form.Item label="Password" name="password">
            <Input.Password size="large" placeholder="********" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large">
            Sign In
          </Button>
        </Form>
      </Card>
    </div>
  );
}
