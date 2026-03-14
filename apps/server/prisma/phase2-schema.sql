-- Phase 2: 激励系统和协作工具数据库Schema

-- 1. 积分系统
CREATE TABLE "Credit" (
  "id" TEXT PRIMARY KEY,
  "agentId" TEXT NOT NULL,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "frozenBalance" INTEGER NOT NULL DEFAULT 0,
  "totalEarned" INTEGER NOT NULL DEFAULT 0,
  "totalSpent" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE
);

CREATE TABLE "CreditTransaction" (
  "id" TEXT PRIMARY KEY,
  "agentId" TEXT NOT NULL,
  "type" TEXT NOT NULL, -- 'earn', 'spend', 'withdraw', 'deposit', 'transfer'
  "amount" INTEGER NOT NULL,
  "balance" INTEGER NOT NULL,
  "taskId" TEXT,
  "description" TEXT,
  "metadata" TEXT, -- JSON
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL
);

-- 2. 团队系统
CREATE TABLE "Team" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "ownerId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("ownerId") REFERENCES "Agent"("id") ON DELETE CASCADE
);

CREATE TABLE "TeamMember" (
  "id" TEXT PRIMARY KEY,
  "teamId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE,
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE
);

-- 3. 任务关系 (分解)
CREATE TABLE "TaskRelation" (
  "id" TEXT PRIMARY KEY,
  "parentId" TEXT NOT NULL,
  "childId" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("parentId") REFERENCES "Task"("id") ON DELETE CASCADE,
  FOREIGN KEY ("childId") REFERENCES "Task"("id") ON DELETE CASCADE
);

-- 4. 文件管理
CREATE TABLE "File" (
  "id" TEXT PRIMARY KEY,
  "taskId" TEXT,
  "agentId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "parentId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE,
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE
  FOREIGN KEY ("parentId") REFERENCES "File"("id") ON DELETE SET NULL
);

-- 5. 社交功能
CREATE TABLE "Follow" (
  "id" TEXT PRIMARY KEY,
  "followerId" TEXT NOT NULL,
  "followingId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("followerId") REFERENCES "Agent"("id") ON DELETE CASCADE,
  FOREIGN KEY ("followingId") REFERENCES "Agent"("id") ON DELETE CASCADE
);

CREATE TABLE "Comment" (
  "id" TEXT PRIMARY KEY,
  "taskId" TEXT,
  "agentId" TEXT NOT NULL,
  "parentId" TEXT,
  "content" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE,
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE,
  FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE
);

CREATE TABLE "Like" (
  "id" TEXT PRIMARY KEY,
  "agentId" TEXT NOT NULL,
  "targetType" TEXT NOT NULL, -- 'task', 'comment'
  "targetId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_credit_agent ON "Credit"("agentId");
CREATE INDEX idx_credit_transaction_agent ON "CreditTransaction"("agentId");
CREATE INDEX idx_credit_transaction_task ON "CreditTransaction"("taskId");
CREATE INDEX idx_team_owner ON "Team"("ownerId");
CREATE INDEX idx_team_member_team ON "TeamMember"("teamId");
CREATE INDEX idx_team_member_agent ON "TeamMember"("agentId");
CREATE INDEX idx_task_relation_parent ON "TaskRelation"("parentId");
CREATE INDEX idx_task_relation_child ON "TaskRelation"("childId");
CREATE INDEX idx_file_task ON "File"("taskId");
CREATE INDEX idx_file_agent ON "File"("agentId");
CREATE INDEX idx_follow_follower ON "Follow"("followerId");
CREATE INDEX idx_follow_following ON "Follow"("followingId");
CREATE INDEX idx_comment_task ON "Comment"("taskId");
CREATE INDEX idx_comment_agent ON "Comment"("agentId");
CREATE INDEX idx_like_agent ON "Like"("agentId");
