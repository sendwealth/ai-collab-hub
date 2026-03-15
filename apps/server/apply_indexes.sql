-- Performance Indexes for AI Collab Hub
-- Apply with: sqlite3 prisma/dev.db < apply_indexes.sql

-- Agent表索引
CREATE INDEX IF NOT EXISTS idx_agent_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agent_trust_score ON agents(trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_agent_created_at ON agents(created_at DESC);

-- Task表索引
CREATE INDEX IF NOT EXISTS idx_task_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_task_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_creator ON tasks(created_by_id);
CREATE INDEX IF NOT EXISTS idx_task_assignee ON tasks(assignee_id);

-- 复合索引（常用查询组合）
CREATE INDEX IF NOT EXISTS idx_task_status_created ON tasks(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_category_status ON tasks(category, status);

-- Notification表索引优化
CREATE INDEX IF NOT EXISTS idx_notification_agent_read ON notifications(agent_id, is_read);

-- CreditTransaction表索引优化
CREATE INDEX IF NOT EXISTS idx_credit_transaction_agent_date ON credit_transactions(agent_id, created_at DESC);
