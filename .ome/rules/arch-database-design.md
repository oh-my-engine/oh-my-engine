---
category: architecture
priority: high
tags: [database, sql, schema-design]
applies_to: [backend, fullstack]
---

# 数据库设计规范

## 命名规范

```sql
-- ✅ 表名：复数、小写、下划线分隔
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ 外键：表名单数_id
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL
);

-- ❌ 避免驼峰命名
CREATE TABLE UserProfiles (
  userId INTEGER,
  firstName VARCHAR(100)
);
```

## 主键设计

```sql
-- ✅ 自增整数主键（小型应用）
id SERIAL PRIMARY KEY

-- ✅ UUID 主键（分布式系统）
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- ✅ 雪花 ID（高并发场景）
id BIGINT PRIMARY KEY
```

## 索引策略

```sql
-- 单列索引
CREATE INDEX idx_users_email ON users(email);

-- 复合索引（查询顺序：status + created_at）
CREATE INDEX idx_posts_status_created 
  ON posts(status, created_at DESC);

-- 唯一索引
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- 部分索引（只索引活跃用户）
CREATE INDEX idx_active_users 
  ON users(email) WHERE status = 'active';
```

## 外键约束

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  
  FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
```

## 数据类型选择

```sql
-- 字符串
email VARCHAR(255)        -- 变长字符串
code CHAR(6)             -- 定长字符串
description TEXT         -- 长文本

-- 数字
age SMALLINT             -- 小整数 (-32768 ~ 32767)
price DECIMAL(10, 2)     -- 精确小数（金额）
rating REAL              -- 浮点数

-- 日期时间
created_at TIMESTAMP     -- 时间戳
birth_date DATE          -- 日期
duration INTERVAL        -- 时间间隔

-- 布尔
is_active BOOLEAN

-- JSON
metadata JSONB           -- 二进制 JSON（推荐）
```

## 规范化

### 第一范式（1NF）

```sql
-- ❌ 违反 1NF：多值属性
CREATE TABLE users (
  id INTEGER,
  tags VARCHAR(255)  -- 'tag1,tag2,tag3'
);

-- ✅ 符合 1NF
CREATE TABLE users (
  id INTEGER PRIMARY KEY
);

CREATE TABLE user_tags (
  user_id INTEGER REFERENCES users(id),
  tag VARCHAR(50),
  PRIMARY KEY (user_id, tag)
);
```

### 第三范式（3NF）

```sql
-- ❌ 违反 3NF：传递依赖
CREATE TABLE orders (
  id INTEGER,
  user_id INTEGER,
  user_email VARCHAR(255)  -- 依赖于 user_id
);

-- ✅ 符合 3NF
CREATE TABLE orders (
  id INTEGER,
  user_id INTEGER REFERENCES users(id)
);
```

## 软删除

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  deleted_at TIMESTAMP NULL,
  
  -- 查询时过滤已删除记录
  CHECK (deleted_at IS NULL OR deleted_at <= CURRENT_TIMESTAMP)
);

-- 查询未删除记录
SELECT * FROM posts WHERE deleted_at IS NULL;
```

## 审计字段

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  
  -- 审计字段
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
);

-- 自动更新 updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## 性能优化

- 为频繁查询的列添加索引
- 避免 SELECT *，只查询需要的列
- 使用 EXPLAIN ANALYZE 分析查询计划
- 定期 VACUUM 和 ANALYZE
- 使用连接池管理数据库连接
