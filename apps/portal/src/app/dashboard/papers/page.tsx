"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Card,
  Col,
  Row,
  Select,
  Pagination,
  Skeleton,
  Tag,
  Space,
  Typography,
  Button,
} from "antd";
import { FilterOutlined, BookOutlined } from "@ant-design/icons";
import api from "@/lib/axios";

const { Title, Text } = Typography;
const { Option } = Select;

export default function PaperBrowserPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Read state from URL Query Params (Strict Requirement)
  const page = Number(searchParams.get("page")) || 1;
  const subject = searchParams.get("subject") || undefined;
  const board = searchParams.get("exam_board") || undefined;
  const type = searchParams.get("type") || undefined;

  // 2. Fetch data with TanStack Query
  const { data, isLoading } = useQuery({
    queryKey: ["papers", page, subject, board, type],
    queryFn: async () => {
      const res = await api.get("/papers", {
        params: { page, limit: 12, subject, board, type },
      });
      return res.data;
    },
    // Keep previous data while fetching new pages for smoother UX
    placeholderData: (prev) => prev,
  });

  // 3. Helper to update URL params
  const updateUrl = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 when a filter changes
    if (key !== "page") {
      params.set("page", "1");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Browse Papers
        </Title>
      </div>

      {/* --- FILTERS (Ant Design Select) --- */}
      <Card style={{ marginBottom: 24, background: "#fafafa" }}>
        <Space wrap size="large">
          <div>
            <Text strong style={{ marginRight: 8 }}>
              <FilterOutlined /> Subject:
            </Text>
            <Select
              style={{ width: 150 }}
              placeholder="All Subjects"
              value={subject}
              onChange={(val) => updateUrl("subject", val)}
              allowClear
            >
              <Option value="Physics">Physics</Option>
              <Option value="Mathematics">Mathematics</Option>
              <Option value="Chemistry">Chemistry</Option>
            </Select>
          </div>

          <div>
            <Text strong style={{ marginRight: 8 }}>
              Exam Board:
            </Text>
            <Select
              style={{ width: 150 }}
              placeholder="All Boards"
              value={board}
              onChange={(val) => updateUrl("exam_board", val)}
              allowClear
            >
              <Option value="GCE_A">GCE A/L</Option>
              <Option value="GCE_O">GCE O/L</Option>
              <Option value="Edexcel">Edexcel</Option>
              <Option value="CAIE">CAIE</Option>
            </Select>
          </div>

          <div>
            <Text strong style={{ marginRight: 8 }}>
              Type:
            </Text>
            <Select
              style={{ width: 150 }}
              placeholder="All Types"
              value={type}
              onChange={(val) => updateUrl("type", val)}
              allowClear
            >
              <Option value="past_paper">Past Paper</Option>
              <Option value="model_paper">Model Paper</Option>
            </Select>
          </div>
        </Space>
      </Card>

      {/* --- GRID & SKELETON LOADER --- */}
      <Row gutter={[24, 24]}>
        {isLoading ? (
          // Skeleton Loader Requirement
          Array.from({ length: 8 }).map((_, i) => (
            <Col xs={24} sm={12} md={8} lg={6} key={i}>
              <Card>
                <Skeleton active title={false} paragraph={{ rows: 4 }} />
              </Card>
            </Col>
          ))
        ) : data?.data?.length === 0 ? (
          <Col span={24} style={{ textAlign: "center", padding: 40 }}>
            <Text type="secondary">No papers found matching your filters.</Text>
          </Col>
        ) : (
          // Responsive Ant Design Card Grid
          data?.data?.map((paper: any) => (
            <Col xs={24} sm={12} md={8} lg={6} key={paper.id}>
              <Card
                hoverable
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
                actions={[
                  <Button
                    key="view-paper"
                    type="primary"
                    onClick={() => router.push(`/dashboard/papers/${paper.id}`)}
                  >
                    View Paper
                  </Button>,
                ]}
              >
                <div style={{ flexGrow: 1 }}>
                  <Space orientation="vertical" style={{ width: "100%" }}>
                    <Tag color="blue">{paper.subject}</Tag>
                    <Title level={5} style={{ marginTop: 8, marginBottom: 0 }}>
                      <BookOutlined style={{ marginRight: 8 }} />
                      {paper.title}
                    </Title>
                    <Space size="small" style={{ marginTop: 8 }}>
                      <Tag>{paper.exam_board}</Tag>
                      <Tag>{paper.year}</Tag>
                    </Space>
                    <Text
                      type="success"
                      strong
                      style={{ display: "block", marginTop: 16, fontSize: 16 }}
                    >
                      LKR {paper.price_lkr}
                    </Text>
                  </Space>
                </div>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* --- PAGINATION (Synced with URL) --- */}
      {!isLoading && data?.data?.length > 0 && (
        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 40 }}
        >
          <Pagination
            current={page}
            total={data.total || 50} // Fallback if backend total is missing
            pageSize={12}
            onChange={(newPage) => updateUrl("page", newPage.toString())}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
}
