"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  Typography,
  Button,
  Radio,
  Space,
  Layout,
  Row,
  Col,
  message,
  Spin,
  Modal,
} from "antd";
import {
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import api from "@/lib/axios";

const { Title, Text, Paragraph } = Typography;
const { Sider, Content } = Layout;

export default function LiveExamPage() {
  const { sessionId } = useParams();
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  // Local state for optimistic updates: Record<question_id, selected_option_id>
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Timer (Server Authoritative)
  useQuery({
    queryKey: ["timer", sessionId],
    queryFn: async () => {
      const res = await api.get(`/exam/sessions/${sessionId}/timer`);
      setTimeLeft(res.data.data.remaining_seconds);
      return res.data;
    },
    refetchInterval: 60000, // Re-sync with server every 60 seconds
  });

  // 2. Fetch Session Data (Assuming this endpoint returns the paper and questions for the session)
  // If your backend requires you to fetch the paper separately, you can chain the queries.
  const { data: sessionData, isLoading } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const res = await api.get(`/exam/sessions/${sessionId}`);
      return res.data;
    },
  });

  const questions = sessionData?.data?.paper?.questions || [];
  const currentQuestion = questions[currentIndex];

  // 3. Submit Exam Logic (Moved ABOVE the timer)
  const submitExamMutation = useMutation({
    mutationFn: async () => api.post(`/exam/sessions/${sessionId}/submit`),
    onSuccess: () => {
      message.success("Exam submitted successfully!");
      router.push(`/dashboard/exams/${sessionId}/results`);
    },
    onError: () => {
      message.error("Failed to submit exam.");
      setIsSubmitting(false);
    },
  });

  const handleAutoSubmit = () => {
    setIsSubmitting(true);
    message.warning("Time is up! Auto-submitting your exam.");
    submitExamMutation.mutate();
  };

  const handleManualSubmit = () => {
    Modal.confirm({
      title: "Submit Exam?",
      icon: <ExclamationCircleOutlined />,
      content:
        "Are you sure you want to submit? You cannot change your answers after this.",
      okText: "Yes, Submit",
      cancelText: "Cancel",
      onOk: () => {
        setIsSubmitting(true);
        submitExamMutation.mutate();
      },
    });
  };

  // 4. Timer Countdown Logic (Now it can safely see handleAutoSubmit)
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev && prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // 5. Optimistic Answer Update Logic
  const answerMutation = useMutation({
    mutationFn: async (data: { questionId: string; optionId: string }) =>
      api.post(`/exam/sessions/${sessionId}/answer`, {
        // 🚨 FIX: Match the Zod schema keys exactly
        questionId: data.questionId,
        selectedOptionId: data.optionId,
      }),
    onError: (error, variables) => {
      message.error("Failed to save answer. Retrying...");
      setAnswers((prev) => {
        const newState = { ...prev };
        delete newState[variables.questionId];
        return newState;
      });
    },
  });

  const handleOptionSelect = (optionId: string) => {
    if (!currentQuestion || timeLeft === 0 || isSubmitting) return;

    // OPTIMISTIC UPDATE: Update UI instantly without waiting for API
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));

    // Fire the API call in the background
    answerMutation.mutate({ questionId: currentQuestion.id, optionId });
  };

  if (isLoading)
    return (
      <div style={{ textAlign: "center", padding: "100px" }}>
        <Spin size="large" />
      </div>
    );
  if (!sessionData)
    return (
      <div style={{ textAlign: "center", padding: "100px" }}>
        <Title level={4}>Session not found</Title>
      </div>
    );

  return (
    <Layout style={{ minHeight: "80vh", background: "transparent" }}>
      {/* --- QUESTION NAVIGATOR SIDEBAR --- */}
      <Sider
        width={280}
        style={{ background: "transparent", paddingRight: 24 }}
      >
        <Card
          title="Question Navigator"
          style={{ height: "100%", position: "sticky", top: 24 }}
        >
          <Row gutter={[8, 8]}>
            {questions.map((q: any, i: number) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = i === currentIndex;
              return (
                <Col span={6} key={q.id}>
                  <Button
                    type={
                      isCurrent ? "primary" : isAnswered ? "default" : "dashed"
                    }
                    style={{
                      width: "100%",
                      borderColor: isAnswered ? "#52c41a" : undefined,
                      color: isAnswered && !isCurrent ? "#52c41a" : undefined,
                    }}
                    onClick={() => setCurrentIndex(i)}
                  >
                    {i + 1}
                  </Button>
                </Col>
              );
            })}
          </Row>

          <div style={{ marginTop: 32, textAlign: "center" }}>
            <Title
              level={3}
              style={{
                color: timeLeft && timeLeft < 60 ? "#ff4d4f" : "inherit",
              }}
            >
              <ClockCircleOutlined style={{ marginRight: 8 }} />
              {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
            </Title>
            <Button
              type="primary"
              danger
              block
              size="large"
              style={{ marginTop: 16 }}
              onClick={handleManualSubmit}
              loading={isSubmitting}
            >
              Submit Exam
            </Button>
          </div>
        </Card>
      </Sider>

      {/* --- MAIN QUESTION AREA --- */}
      <Content>
        <Card
          title={
            <Text strong style={{ fontSize: 18 }}>
              Question {currentIndex + 1} of {questions.length}
            </Text>
          }
          style={{ minHeight: 400 }}
        >
          {currentQuestion ? (
            <Space
              orientation="vertical"
              size="large"
              style={{ width: "100%" }}
            >
              <Paragraph style={{ fontSize: 18, marginBottom: 24 }}>
                {currentQuestion.questionText || currentQuestion.question_text}
              </Paragraph>

              <Radio.Group
                onChange={(e) => handleOptionSelect(e.target.value)}
                value={answers[currentQuestion.id]}
                style={{ width: "100%" }}
                disabled={timeLeft === 0 || isSubmitting}
              >
                <Space
                  orientation="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  {currentQuestion.options?.map((opt: any) => (
                    <Radio
                      key={opt.id}
                      value={opt.id}
                      style={{
                        display: "flex",
                        padding: "12px 16px",
                        border: "1px solid #d9d9d9",
                        borderRadius: 8,
                        width: "100%",
                      }}
                    >
                      {opt.text}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 40,
                }}
              >
                <Button
                  onClick={() => setCurrentIndex((c) => Math.max(0, c - 1))}
                  disabled={currentIndex === 0}
                >
                  Previous
                </Button>
                <Button
                  type="primary"
                  onClick={() =>
                    setCurrentIndex((c) =>
                      Math.min(questions.length - 1, c + 1),
                    )
                  }
                  disabled={currentIndex === questions.length - 1}
                >
                  Next
                </Button>
              </div>
            </Space>
          ) : (
            <Text type="danger">Question data missing.</Text>
          )}
        </Card>
      </Content>
    </Layout>
  );
}
