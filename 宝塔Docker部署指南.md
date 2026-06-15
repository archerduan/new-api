# New-API 宝塔面板 Docker 部署指南

## 前置要求

1. 宝塔面板已安装
2. 已安装 Docker 和 Docker Compose（在宝塔软件商店安装）
3. 服务器至少 2GB 内存

## 部署步骤

### 方法一：使用官方镜像（推荐，快速）

#### 1. 上传项目文件

将项目上传到服务器，建议路径：`/www/wwwroot/new-api`

```bash
cd /www/wwwroot
git clone https://github.com/archerduan/new-api.git
cd new-api
```

#### 2. 修改配置文件

编辑 `docker-compose.yml`，修改以下关键配置：

```yaml
services:
  new-api:
    image: calciumion/new-api:latest  # 使用官方镜像
    ports:
      - "3000:3000"  # 可以改成其他端口，如 "3001:3000"
    environment:
      # ⚠️ 重要：修改所有密码！
      - SQL_DSN=postgresql://root:YOUR_STRONG_PASSWORD@postgres:5432/new-api
      - REDIS_CONN_STRING=redis://:YOUR_REDIS_PASSWORD@redis:6379
      - TZ=Asia/Shanghai  # 时区设置
      - SESSION_SECRET=YOUR_RANDOM_SECRET_STRING  # 生成一个随机字符串
```

**密码生成建议：**
```bash
# 生成随机密码
openssl rand -base64 32
```

#### 3. 启动服务

在宝塔面板中：

**选项A：使用宝塔Docker管理器**
1. 打开宝塔面板 → Docker → 项目
2. 点击"添加项目"
3. 选择项目路径：`/www/wwwroot/new-api`
4. 选择 `docker-compose.yml` 文件
5. 点击"创建并启动"

**选项B：使用SSH命令**
```bash
cd /www/wwwroot/new-api
docker-compose up -d
```

#### 4. 检查运行状态

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f new-api

# 预期输出应该显示所有服务都在运行
```

#### 5. 访问应用

- 访问地址：`http://您的服务器IP:3000`
- 默认管理员账号：root
- 默认密码：123456（首次登录后立即修改！）

---

### 方法二：构建自己的镜像（包含您的多分组修改）

如果要使用您刚才修改的多分组功能，需要构建自定义镜像：

#### 1. 上传代码到服务器

```bash
cd /www/wwwroot
git clone https://github.com/archerduan/new-api.git
cd new-api
```

#### 2. 构建Docker镜像

```bash
# 构建镜像（需要较长时间，约10-20分钟）
docker build -t new-api-custom:latest .
```

#### 3. 修改 docker-compose.yml

将镜像改为自己构建的版本：

```yaml
services:
  new-api:
    image: new-api-custom:latest  # 改成自己的镜像名
    # ... 其他配置保持不变
```

#### 4. 启动服务

```bash
docker-compose up -d
```

---

## 宝塔面板反向代理配置（可选）

如果要通过域名访问并启用HTTPS：

### 1. 添加站点

1. 宝塔面板 → 网站 → 添加站点
2. 域名：`api.yourdomain.com`
3. 不选择PHP版本
4. 不创建数据库

### 2. 配置反向代理

1. 点击站点设置 → 反向代理
2. 目标URL：`http://127.0.0.1:3000`
3. 发送域名：`$host`
4. 点击提交

### 3. 申请SSL证书

1. 站点设置 → SSL → Let's Encrypt
2. 勾选域名，点击申请
3. 开启"强制HTTPS"

### 4. 反向代理高级配置

在反向代理配置中添加以下内容：

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket 支持
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # 超时设置
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
}
```

---

## 数据库选择

### 使用 PostgreSQL（默认，推荐）

已在 docker-compose.yml 中默认配置，无需额外操作。

### 使用 MySQL

1. 编辑 `docker-compose.yml`
2. 注释掉 postgres 相关配置
3. 取消注释 mysql 相关配置
4. 修改环境变量中的 SQL_DSN

```yaml
environment:
  - SQL_DSN=root:YOUR_PASSWORD@tcp(mysql:3306)/new-api
```

### 使用外部数据库

如果使用宝塔面板已有的数据库：

```yaml
environment:
  # PostgreSQL
  - SQL_DSN=postgresql://username:password@127.0.0.1:5432/new-api
  
  # 或 MySQL
  - SQL_DSN=username:password@tcp(127.0.0.1:3306)/new-api
```

**注意：** 使用外部数据库时，需要从 `docker-compose.yml` 中移除数据库服务。

---

## 常用管理命令

```bash
cd /www/wwwroot/new-api

# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f new-api

# 查看所有容器状态
docker-compose ps

# 更新到最新版本（官方镜像）
docker-compose pull
docker-compose up -d

# 进入容器内部
docker exec -it new-api sh

# 备份数据
docker exec postgres pg_dump -U root new-api > backup_$(date +%Y%m%d).sql

# 清理数据（危险操作！）
docker-compose down -v
```

---

## 性能优化建议

### 1. 限制资源使用

在 `docker-compose.yml` 中添加资源限制：

```yaml
services:
  new-api:
    # ... 其他配置
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 2. 日志轮转

编辑 `docker-compose.yml`：

```yaml
services:
  new-api:
    # ... 其他配置
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 3. 数据库性能优化

PostgreSQL 调优（在 docker-compose.yml 中）：

```yaml
postgres:
  # ... 其他配置
  command:
    - "postgres"
    - "-c"
    - "shared_buffers=256MB"
    - "-c"
    - "max_connections=200"
```

---

## 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker-compose logs

# 查看特定服务日志
docker-compose logs new-api
docker-compose logs postgres
docker-compose logs redis
```

### 端口被占用

```bash
# 检查端口占用
netstat -tunlp | grep 3000

# 修改端口（在 docker-compose.yml 中）
ports:
  - "3001:3000"  # 改为其他端口
```

### 数据库连接失败

1. 检查数据库容器是否运行：`docker-compose ps`
2. 检查密码是否正确
3. 等待数据库初始化完成（首次启动需要1-2分钟）

### 内存不足

```bash
# 查看容器资源使用
docker stats

# 如果内存不足，考虑：
# 1. 升级服务器配置
# 2. 使用外部数据库服务
# 3. 减少并发处理数
```

---

## 安全建议

1. ✅ 修改所有默认密码
2. ✅ 设置强随机的 SESSION_SECRET
3. ✅ 启用 HTTPS（通过宝塔反向代理）
4. ✅ 配置防火墙，只开放必要端口（80, 443）
5. ✅ 定期备份数据库
6. ✅ 定期更新镜像版本
7. ✅ 监控日志文件大小

---

## 更新部署（使用您的多分组功能）

当您推送新代码到GitHub后：

```bash
cd /www/wwwroot/new-api

# 拉取最新代码
git pull

# 重新构建镜像
docker build -t new-api-custom:latest .

# 重启服务
docker-compose down
docker-compose up -d
```

---

## 备份和恢复

### 数据备份

```bash
# 备份 PostgreSQL 数据库
docker exec postgres pg_dump -U root new-api > backup.sql

# 备份配置文件和数据目录
tar -czf new-api-backup-$(date +%Y%m%d).tar.gz \
  docker-compose.yml \
  data/ \
  logs/
```

### 数据恢复

```bash
# 恢复 PostgreSQL 数据库
docker exec -i postgres psql -U root new-api < backup.sql

# 恢复配置文件
tar -xzf new-api-backup-20240615.tar.gz
```

---

## 监控配置（可选）

在宝塔面板添加监控任务：

1. 计划任务 → 添加任务
2. 任务类型：Shell脚本
3. 执行周期：每小时

```bash
#!/bin/bash
cd /www/wwwroot/new-api
if ! docker-compose ps | grep -q "Up"; then
    docker-compose up -d
    echo "$(date): New-API 服务已重启" >> /var/log/new-api-monitor.log
fi
```

---

## 技术支持

- 项目地址：https://github.com/archerduan/new-api
- 官方文档：https://github.com/QuantumNous/new-api
- 问题反馈：提交 GitHub Issue

---

**最后提醒：首次部署后，立即登录修改默认密码！**
