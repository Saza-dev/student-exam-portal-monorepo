"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Layout, Menu, Typography } from "antd";
import {
  DashboardOutlined,
  FileTextOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import Link from "next/link";

const { Header, Content, Sider } = Layout;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { clearAuth } = useAuthStore();
  const router = useRouter();
  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");

    if (refreshToken) {
      await api
        .post("/auth/logout", { refresh_token: refreshToken })
        .catch(() => {});
    }
    localStorage.removeItem("refresh_token");
    clearAuth();
    router.push("/login");
  };

  return (
    <ProtectedRoute>
      <Layout style={{ minHeight: "100vh" }}>
        <Sider breakpoint="lg" collapsedWidth="0">
          <div className="p-4">
            <Typography.Title level={4} style={{ color: "white", margin: 0 }}>
              ExamPortal
            </Typography.Title>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={["1"]}
            items={[
              {
                key: "1",
                icon: <DashboardOutlined />,
                label: <Link href="/dashboard">Dashboard</Link>,
              },
              {
                key: "2",
                icon: <FileTextOutlined />,
                label: <Link href="/dashboard/papers">Papers</Link>,
              },
              {
                key: "3",
                icon: <LogoutOutlined />,
                label: "Logout",
                onClick: handleLogout, // Keep your existing logic here
              },
            ]}
          />
        </Sider>
        <Layout>
          <Header style={{ background: "#fff", padding: 0 }} />
          <Content style={{ margin: "24px 16px 0" }}>
            <div style={{ padding: 24, minHeight: 360, background: "#fff" }}>
              {children}
            </div>
          </Content>
        </Layout>
      </Layout>
    </ProtectedRoute>
  );
}
