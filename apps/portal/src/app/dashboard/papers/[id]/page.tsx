"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, Typography, Button, Spin, Tag, Space, message } from "antd";
import {
  LockOutlined,
  PlayCircleOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import api from "@/lib/axios";

const { Title, Text, Paragraph } = Typography;

export default function PaperDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  // Fetch paper details
  const { data: paperData, isLoading } = useQuery({
    queryKey: ["paper", id],
    queryFn: async () => {
      const res = await api.get(`/papers/${id}`);
      return res.data;
    },
  });

  // Handle Exam Start
  const handleStartExam = async () => {
    try {
      // 🚨 FIX: Change paper_id to paperId
      const res = await api.post(`/exam/sessions`, { paperId: id as string });

      message.success("Exam session started!");
      router.push(`/dashboard/exams/${res.data.data.session_id}`);
    } catch (error: any) {
      if (error.response?.status === 403) {
        message.error("You need to purchase this paper first!");
      } else if (error.response?.status === 409) {
        message.warning("You already have an active session for this exam.");
      } else {
        message.error("Failed to start exam.");
      }
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "success";
      case "medium":
        return "warning";
      case "hard":
        return "error";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!paperData) return <Text type="danger">Paper not found.</Text>;

  // 1. Extract the main paper object based on your actual API response structure
  const paper = paperData.data || paperData;
  const questions = paper.questions || [];

  // 2. Derive if the paper is purchased by checking if any questions are locked
  // Looking at your data, unpurchased papers return { is_preview: false } without a questionText
  const hasLockedQuestions = questions.some(
    (q: any) => !q.questionText && q.is_preview === false,
  );
  const isPurchased = !hasLockedQuestions;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 60 }}>
      {/* --- METADATA HEADER --- */}
      <Card style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <Space>
              <Tag color="blue">{paper.subject}</Tag>
              {/* Notice the change to camelCase: examBoard */}
              <Tag>{paper.examBoard}</Tag>
              {paper.year && <Tag>{paper.year}</Tag>}
            </Space>
            <Title level={2} style={{ marginTop: 16 }}>
              {paper.title}
            </Title>
            {/* Notice the change to camelCase: priceLkr */}
            <Text type="secondary" style={{ fontSize: 16 }}>
              Price: LKR {paper.priceLkr}
            </Text>
          </div>
          <div>
            {isPurchased ? (
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={handleStartExam}
              >
                Start Exam
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                style={{ background: "#52c41a" }}
                icon={<ShoppingCartOutlined />}
              >
                Purchase - LKR {paper.priceLkr}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Title level={4} style={{ marginBottom: 24 }}>
        Preview Questions
      </Title>

      {/* --- QUESTIONS LIST --- */}
      <Space orientation="vertical" size="large" style={{ width: "100%" }}>
        {questions.map((q: any, index: number) => {
          // Check for missing text to determine if it's locked
          const isLocked = !q.questionText && q.is_preview === false;

          return (
            <Card
              key={q.id || index}
              style={{ position: "relative", overflow: "hidden" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <Text strong>Question {index + 1}</Text>
                {!isLocked && q.difficulty && (
                  <Tag color={getDifficultyColor(q.difficulty)}>
                    {q.difficulty.toUpperCase()}
                  </Tag>
                )}
              </div>

              {isLocked ? (
                // --- LOCKED VIEW ---
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      filter: "blur(5px)",
                      opacity: 0.6,
                      pointerEvents: "none",
                    }}
                  >
                    <Paragraph>
                      This question is locked. Purchase the paper to view the
                      full content and options.
                    </Paragraph>
                    <Space
                      orientation="vertical"
                      style={{ width: "100%", marginTop: 16 }}
                    >
                      <div
                        style={{
                          background: "#f0f0f0",
                          height: 32,
                          borderRadius: 4,
                          width: "60%",
                        }}
                      />
                      <div
                        style={{
                          background: "#f0f0f0",
                          height: 32,
                          borderRadius: 4,
                          width: "50%",
                        }}
                      />
                    </Space>
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      background: "rgba(255, 255, 255, 0.5)",
                    }}
                  >
                    <LockOutlined
                      style={{
                        fontSize: 32,
                        color: "#ff4d4f",
                        marginBottom: 12,
                      }}
                    />
                    <Button type="primary" danger>
                      Purchase to Unlock
                    </Button>
                  </div>
                </div>
              ) : (
                // --- UNLOCKED VIEW ---
                <div>
                  {/* Notice the change to camelCase: questionText */}
                  <Paragraph style={{ fontSize: 16 }}>
                    {q.questionText}
                  </Paragraph>
                  <Space
                    orientation="vertical"
                    style={{ width: "100%", marginTop: 16 }}
                  >
                    {q.options?.map((opt: any, optIndex: number) => (
                      <div
                        key={opt.id || optIndex}
                        style={{
                          padding: "8px 12px",
                          border: "1px solid #d9d9d9",
                          borderRadius: 6,
                        }}
                      >
                        {opt.text}
                      </div>
                    ))}
                  </Space>
                </div>
              )}
            </Card>
          );
        })}
      </Space>
    </div>
  );
}
