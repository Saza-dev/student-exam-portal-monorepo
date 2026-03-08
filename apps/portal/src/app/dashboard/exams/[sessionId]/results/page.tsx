"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, Row, Col, Typography, Button, Spin, Space, Alert } from "antd";
import {
  LeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import api from "@/lib/axios";

const { Title, Text, Paragraph } = Typography;

export default function ExamResultsPage() {
  const { sessionId } = useParams();
  const router = useRouter();

  // 1. Fetch comprehensive review data (Requirement 4)
  const { data: results, isLoading } = useQuery({
    queryKey: ["results", sessionId],
    queryFn: async () => {
      const res = await api.get(`/exam/sessions/${sessionId}/review`);
      return res.data.data;
    },
  });

  if (isLoading)
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );

  // 2. Data Processing for Charts
  const total = results.length;
  const correctCount = results.filter(
    (r: any) => r.selected === r.correct,
  ).length;
  const scorePct = Math.round((correctCount / total) * 100);

  // RadialBarChart Data (Requirement 4)
  const radialData = [
    {
      name: "Score",
      value: scorePct,
      fill: scorePct > 50 ? "#52c41a" : "#faad14",
    },
  ];

  // Topic Breakdown Data
  const topicMap: Record<
    string,
    { topic: string; correct: number; total: number }
  > = {};
  results.forEach((r: any) => {
    const topic = r.topic_tag || "General";
    if (!topicMap[topic]) topicMap[topic] = { topic, correct: 0, total: 0 };
    topicMap[topic].total++;
    if (r.selected === r.correct) topicMap[topic].correct++;
  });
  const barData = Object.values(topicMap);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px" }}>
      <Button
        icon={<LeftOutlined />}
        onClick={() => router.push("/dashboard/papers")}
        style={{ marginBottom: 24 }}
      >
        Back to Dashboard
      </Button>

      <Row gutter={[24, 24]}>
        {/* --- RADIAL SCORE CHART (Requirement 4) --- */}
        <Col xs={24} md={10}>
          <Card
            title="Final Score"
            style={{ textAlign: "center", height: "100%" }}
          >
            <div style={{ height: 250, position: "relative" }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="70%"
                  outerRadius="100%"
                  barSize={20}
                  data={radialData}
                  startAngle={90}
                  endAngle={450}
                >
                  <RadialBar background dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <Title level={1} style={{ margin: 0 }}>
                  {scorePct}%
                </Title>
                <Text type="secondary">
                  {correctCount}/{total} Correct
                </Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* --- TOPIC BAR CHART (Requirement 4) --- */}
        <Col xs={24} md={14}>
          <Card title="Topic Performance" style={{ height: "100%" }}>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="topic"
                    type="category"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip cursor={{ fill: "transparent" }} />
                  <Bar dataKey="correct" fill="#1890ff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* --- QUESTION-BY-QUESTION REVIEW (Requirement 4) --- */}
        <Col span={24}>
          <Title level={3} style={{ marginTop: 24 }}>
            Detailed Review
          </Title>
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            {results.map((item: any, idx: number) => {
              const isCorrect = item.selected === item.correct;
              const selectedOptText =
                item.options.find((o: any) => o.id === item.selected)?.text ||
                "No Answer Provided";
              const correctOptText = item.options.find(
                (o: any) => o.id === item.correct,
              )?.text;

              return (
                <Card
                  key={idx}
                  variant="borderless"
                  style={{
                    borderLeft: `6px solid ${isCorrect ? "#52c41a" : "#ff4d4f"}`,
                    background: "#fff",
                  }}
                >
                  <Title level={5}>Question {idx + 1}</Title>
                  <Paragraph strong>{item.question}</Paragraph>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Text type="secondary">Your Answer:</Text>
                      <div
                        style={{
                          color: isCorrect ? "#52c41a" : "#ff4d4f",
                          fontWeight: "bold",
                        }}
                      >
                        {isCorrect ? (
                          <CheckCircleOutlined />
                        ) : (
                          <CloseCircleOutlined />
                        )}{" "}
                        {selectedOptText}
                      </div>
                    </Col>
                    {!isCorrect && (
                      <Col span={12}>
                        <Text type="secondary">Correct Answer:</Text>
                        <div style={{ color: "#52c41a", fontWeight: "bold" }}>
                          <CheckCircleOutlined /> {correctOptText}
                        </div>
                      </Col>
                    )}
                  </Row>

                  <Alert
                    title="Explanation"
                    description={
                      item.explanation ||
                      "No explanation provided for this question."
                    }
                    type="info"
                    showIcon
                    icon={<InfoCircleOutlined />}
                    style={{ marginTop: 16 }}
                  />
                </Card>
              );
            })}
          </Space>
        </Col>
      </Row>
    </div>
  );
}
