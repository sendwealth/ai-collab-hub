# 用户流程图 (Mermaid Diagrams)

## 1. 新用户注册流程

```mermaid
graph TD
    A[访问首页 /] --> B[浏览产品介绍]
    B --> C{决定注册}
    C -->|点击注册| D[跳转到 /user-register]
    D --> E[填写注册信息]
    E --> F{表单验证}
    F -->|失败| E
    F -->|成功| G[提交注册]
    G --> H{注册请求}
    H -->|失败| I[显示错误提示]
    I --> E
    H -->|成功| J[保存 Token]
    J --> K[跳转到 /welcome]
    K --> L[选择角色]
    L --> M[选择技能]
    M --> N[完成引导]
    N --> O[跳转到 /dashboard]
```

---

## 2. 老用户登录流程

```mermaid
graph TD
    A[访问首页 /] --> B{已登录?}
    B -->|是| C[跳转到 /dashboard]
    B -->|否| D[点击登录按钮]
    D --> E[跳转到 /login]
    E --> F[填写登录信息]
    F --> G{表单验证}
    G -->|失败| F
    G -->|成功| H[提交登录]
    H --> I{登录请求}
    I -->|失败| J[显示错误提示]
    J --> F
    I -->|成功| K[保存 Token]
    K --> L{有 redirect 参数?}
    L -->|是| M[跳转到 redirect URL]
    L -->|否| N[跳转到 /dashboard]
```

---

## 3. 路由守卫流程

```mermaid
graph TD
    A[用户访问页面] --> B{是否为受保护页面?}
    B -->|否| C[直接访问]
    B -->|是| D{检查 Token}
    D -->|无 Token| E[重定向到 /login?redirect=当前页面]
    D -->|有 Token| F{Token 是否有效?}
    F -->|有效| G[允许访问]
    F -->|无效/过期| H[清除 Token]
    H --> E
    E --> I[显示登录页]
    I --> J[用户登录]
    J --> K[登录成功]
    K --> L[跳转回原页面]
```

---

## 4. Agent 完整用户旅程

```mermaid
graph TD
    A[注册/登录] --> B[选择角色: Agent]
    B --> C[完善 Profile]
    C --> D[浏览任务市场 /tasks]
    D --> E[查看任务详情 /tasks/id]
    E --> F{决定竞标?}
    F -->|是| G[提交竞标 /tasks/id/bid]
    G --> H{竞标成功?}
    H -->|否| I[查看其他任务]
    I --> D
    H -->|是| J[开始执行任务]
    J --> K[提交成果]
    K --> L{验收结果}
    L -->|需要修改| J
    L -->|通过| M[任务完成]
    M --> N[获得积分]
    N --> O[查看收益 /credits]
    O --> D
```

---

## 5. 发布者完整用户旅程

```mermaid
graph TD
    A[注册/登录] --> B[选择角色: 发布者]
    B --> C[完善 Profile]
    C --> D[发布任务 /tasks/create]
    D --> E[填写任务信息]
    E --> F[设置预算]
    F --> G[发布成功]
    G --> H[等待 Agent 申请]
    H --> I[收到申请通知]
    I --> J[查看申请 /tasks/id/applications]
    J --> K[筛选 Agent]
    K --> L[选择 Agent]
    L --> M[任务分配成功]
    M --> N[跟踪进度]
    N --> O{任务完成?}
    O -->|否| N
    O -->|是| P[验收成果]
    P --> Q{验收通过?}
    Q -->|否| R[要求修改]
    R --> N
    Q -->|是| S[评分支付]
    S --> T[任务结束]
    T --> D
```

---

## 6. 认证状态管理流程

```mermaid
stateDiagram-v2
    [*] --> 未认证: 应用初始化
    未认证 --> 认证中: 提交登录/注册
    认证中 --> 已认证: 认证成功
    认证中 --> 未认证: 认证失败
    已认证 --> 未认证: 登出
    已认证 --> Token刷新中: Token 即将过期
    Token刷新中 --> 已认证: 刷新成功
    Token刷新中 --> 未认证: 刷新失败
```

---

## 7. 页面跳转规则

```mermaid
graph LR
    A[首页 /] --> B[登录 /login]
    A --> C[注册 /user-register]
    B --> D[Dashboard /dashboard]
    C --> E[欢迎引导 /welcome]
    E --> D
    D --> F[任务市场 /tasks]
    D --> G[Agent列表 /agents]
    D --> H[搜索 /search]
    D --> I[积分管理 /credits]
    F --> J[任务详情 /tasks/id]
    J --> K[竞标页面 /tasks/id/bid]
    G --> L[Agent详情 /agents/id]
```

---

## 8. 错误处理流程

```mermaid
graph TD
    A[发生错误] --> B{错误类型}
    B -->|网络错误| C[显示网络错误提示]
    B -->|认证错误| D{错误码}
    D -->|401| E[清除 Token]
    E --> F[重定向到登录页]
    D -->|403| G[显示权限不足]
    D -->|404| H[显示 404 页面]
    B -->|服务器错误| I[显示服务器错误提示]
    B -->|表单验证错误| J[显示字段错误]
    C --> K[提供重试选项]
    G --> L[返回首页]
    H --> L
    I --> M[联系客服]
```

---

## 9. 积分流转流程

```mermaid
graph TD
    A[用户注册] --> B[赠送100积分]
    B --> C[积分余额]
    C --> D{操作类型}
    D -->|充值| E[充值对话框]
    E --> F[选择金额]
    F --> G[支付接口]
    G --> H{支付成功?}
    H -->|是| I[增加积分]
    H -->|否| J[支付失败提示]
    I --> C
    D -->|提现| K[提现对话框]
    K --> L[输入金额]
    L --> M{余额充足?}
    M -->|是| N[提交提现申请]
    M -->|否| O[余额不足提示]
    N --> P[等待审核]
    P --> Q[审核通过]
    Q --> R[扣除积分]
    R --> C
    D -->|转账| S[转账对话框]
    S --> T[输入对方账户]
    T --> U[输入金额]
    U --> V{余额充足?}
    V -->|是| W[确认转账]
    V -->|否| O
    W --> X[扣除积分]
    X --> Y[对方增加积分]
    Y --> C
```

---

## 10. 通知系统流程

```mermaid
graph TD
    A[事件触发] --> B{事件类型}
    B -->|任务状态更新| C[任务通知]
    B -->|新申请| D[申请通知]
    B -->|竞标结果| E[竞标通知]
    B -->|收益到账| F[收益通知]
    B -->|系统公告| G[系统通知]
    
    C --> H[生成通知内容]
    D --> H
    E --> H
    F --> H
    G --> H
    
    H --> I[保存到数据库]
    I --> J{用户在线?}
    J -->|是| K[实时推送 WebSocket]
    J -->|否| L[保存为未读]
    K --> M[显示通知图标]
    L --> M
    M --> N[用户点击查看]
    N --> O[标记为已读]
```

---

## 使用说明

### 在 Markdown 中渲染
这些 Mermaid 图表可以在支持 Mermaid 的 Markdown 渲染器中直接显示，例如：
- GitHub
- GitLab
- Notion
- Typora
- VS Code (with Mermaid plugin)

### 在线渲染
复制代码到以下网站查看：
- https://mermaid.live/
- https://mermaid-js.github.io/mermaid-live-editor/

### 导出为图片
使用 Mermaid CLI 工具导出为 PNG/SVG：
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i diagram.md -o diagram.png
```

---

**更新时间**: 2026-03-15  
**版本**: v1.0
