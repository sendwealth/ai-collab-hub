-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "public_key" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "capabilities" TEXT,
    "endpoint" TEXT,
    "metadata" TEXT,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "trust_score" INTEGER NOT NULL DEFAULT 0,
    "last_seen" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'independent',
    "category" TEXT,
    "requirements" TEXT,
    "reward" TEXT,
    "result" TEXT,
    "deadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by_id" TEXT,
    "assignee_id" TEXT,
    CONSTRAINT "tasks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "task_relations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parent_id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_relations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "task_relations_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bids" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposal" TEXT NOT NULL,
    "estimated_time" INTEGER,
    "estimated_cost" REAL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "task_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    CONSTRAINT "bids_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bids_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "owner_id" TEXT NOT NULL,
    CONSTRAINT "teams_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joined_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "team_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "team_members_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "task_id" TEXT,
    "agent_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "files_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "files_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "files_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "files" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agent_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "credits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agent_id" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "frozen_balance" INTEGER NOT NULL DEFAULT 0,
    "total_earned" INTEGER NOT NULL DEFAULT 0,
    "total_spent" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agent_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "task_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "credit_transactions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "credits" ("agent_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agent_capabilities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agent_id" TEXT NOT NULL,
    "coding" INTEGER NOT NULL DEFAULT 0,
    "writing" INTEGER NOT NULL DEFAULT 0,
    "analysis" INTEGER NOT NULL DEFAULT 0,
    "design" INTEGER NOT NULL DEFAULT 0,
    "testing" INTEGER NOT NULL DEFAULT 0,
    "devops" INTEGER NOT NULL DEFAULT 0,
    "data_science" INTEGER NOT NULL DEFAULT 0,
    "machine_learning" INTEGER NOT NULL DEFAULT 0,
    "project_mgmt" INTEGER NOT NULL DEFAULT 0,
    "specialized" TEXT,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "agent_performance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agent_id" TEXT NOT NULL,
    "tasks_completed" INTEGER NOT NULL DEFAULT 0,
    "tasks_failed" INTEGER NOT NULL DEFAULT 0,
    "total_bids" INTEGER NOT NULL DEFAULT 0,
    "accepted_bids" INTEGER NOT NULL DEFAULT 0,
    "avg_rating" REAL NOT NULL DEFAULT 0,
    "on_time_delivery" REAL NOT NULL DEFAULT 0,
    "avg_response_time" INTEGER NOT NULL DEFAULT 0,
    "avg_completion_time" INTEGER NOT NULL DEFAULT 0,
    "total_earned" INTEGER NOT NULL DEFAULT 0,
    "avg_task_value" REAL NOT NULL DEFAULT 0,
    "period_start" DATETIME NOT NULL,
    "period_end" DATETIME NOT NULL,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "recommendation_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "input_id" TEXT NOT NULL,
    "inputFeatures" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "context" TEXT,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "task_id" TEXT,
    "task_type" TEXT,
    "difficulty" TEXT,
    "suggested_price" INTEGER NOT NULL,
    "final_price" INTEGER NOT NULL,
    "avg_market_price" INTEGER NOT NULL,
    "supply_level" TEXT NOT NULL,
    "demand_level" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "market_trends" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "total_tasks" INTEGER NOT NULL DEFAULT 0,
    "avg_price" INTEGER NOT NULL DEFAULT 0,
    "avg_completion_time" INTEGER NOT NULL DEFAULT 0,
    "available_agents" INTEGER NOT NULL DEFAULT 0,
    "open_tasks" INTEGER NOT NULL DEFAULT 0,
    "ratio" REAL NOT NULL DEFAULT 0,
    "period_start" DATETIME NOT NULL,
    "period_end" DATETIME NOT NULL,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "agents_name_key" ON "agents"("name");

-- CreateIndex
CREATE UNIQUE INDEX "agents_api_key_key" ON "agents"("api_key");

-- CreateIndex
CREATE INDEX "task_relations_parent_id_idx" ON "task_relations"("parent_id");

-- CreateIndex
CREATE INDEX "task_relations_child_id_idx" ON "task_relations"("child_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_relations_parent_id_child_id_key" ON "task_relations"("parent_id", "child_id");

-- CreateIndex
CREATE INDEX "bids_task_id_idx" ON "bids"("task_id");

-- CreateIndex
CREATE INDEX "bids_agent_id_idx" ON "bids"("agent_id");

-- CreateIndex
CREATE INDEX "teams_owner_id_idx" ON "teams"("owner_id");

-- CreateIndex
CREATE INDEX "team_members_team_id_idx" ON "team_members"("team_id");

-- CreateIndex
CREATE INDEX "team_members_agent_id_idx" ON "team_members"("agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_team_id_agent_id_key" ON "team_members"("team_id", "agent_id");

-- CreateIndex
CREATE INDEX "files_task_id_idx" ON "files"("task_id");

-- CreateIndex
CREATE INDEX "files_agent_id_idx" ON "files"("agent_id");

-- CreateIndex
CREATE INDEX "files_parent_id_idx" ON "files"("parent_id");

-- CreateIndex
CREATE INDEX "notifications_agent_id_idx" ON "notifications"("agent_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE UNIQUE INDEX "credits_agent_id_key" ON "credits"("agent_id");

-- CreateIndex
CREATE INDEX "credit_transactions_agent_id_idx" ON "credit_transactions"("agent_id");

-- CreateIndex
CREATE INDEX "credit_transactions_type_idx" ON "credit_transactions"("type");

-- CreateIndex
CREATE INDEX "credit_transactions_created_at_idx" ON "credit_transactions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "agent_capabilities_agent_id_key" ON "agent_capabilities"("agent_id");

-- CreateIndex
CREATE INDEX "agent_capabilities_agent_id_idx" ON "agent_capabilities"("agent_id");

-- CreateIndex
CREATE INDEX "agent_performance_agent_id_idx" ON "agent_performance"("agent_id");

-- CreateIndex
CREATE INDEX "agent_performance_period_start_idx" ON "agent_performance"("period_start");

-- CreateIndex
CREATE INDEX "recommendation_logs_type_idx" ON "recommendation_logs"("type");

-- CreateIndex
CREATE INDEX "recommendation_logs_input_id_idx" ON "recommendation_logs"("input_id");

-- CreateIndex
CREATE INDEX "recommendation_logs_created_at_idx" ON "recommendation_logs"("created_at");

-- CreateIndex
CREATE INDEX "price_history_category_idx" ON "price_history"("category");

-- CreateIndex
CREATE INDEX "price_history_task_id_idx" ON "price_history"("task_id");

-- CreateIndex
CREATE INDEX "price_history_created_at_idx" ON "price_history"("created_at");

-- CreateIndex
CREATE INDEX "market_trends_category_idx" ON "market_trends"("category");

-- CreateIndex
CREATE INDEX "market_trends_period_start_idx" ON "market_trends"("period_start");
