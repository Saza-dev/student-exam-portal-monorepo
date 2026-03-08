"use client";

import { Typography, Card, Col, Row, Statistic, Button } from "antd";
import {
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "@/stores/authStore";
import Link from "next/link";

const { Title, Text } = Typography;

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "32px" }}>
        <Title level={2}>Welcome back, {user?.fullName || "Student"}!</Title>
        <Text type="secondary">
          Track your progress and start your next practice exam.
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="shadow-sm">
            <Statistic
              title="Available Papers"
              value={12}
              prefix={<BookOutlined />}
              styles={{ content: { color: "#1677ff" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="shadow-sm">
            <Statistic
              title="Completed Exams"
              value={5}
              prefix={<CheckCircleOutlined />}
              styles={{ content: { color: "#52c41a" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="shadow-sm">
            <Statistic
              title="Study Hours"
              value={24.5}
              prefix={<ClockCircleOutlined />}
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Quick Start" style={{ marginTop: "24px" }}>
        <div className="flex flex-col items-center justify-center py-8">
          <Text style={{ marginBottom: "16px" }}>
            Ready to test your knowledge?
          </Text>
          <Link href={'/dashboard/papers'}>
            <Button type="primary" size="large">
              Browse Exam Papers
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
