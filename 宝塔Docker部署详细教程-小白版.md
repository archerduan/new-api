# New-API 宝塔面板部署教程（小白版）

> 本教程适合没有技术基础的用户，每一步都有详细说明。

---

## 📌 准备工作

### 您需要准备的东西：

1. ✅ 一台云服务器（阿里云/腾讯云/华为云等都可以）
2. ✅ 服务器已安装宝塔面板（如果没安装，看附录A）
3. ✅ 服务器配置建议：至少2核CPU + 2GB内存
4. ✅ 一个记事本（用来记录密码）

---

## 第一步：安装Docker（5分钟）

### 1.1 打开宝塔面板

在浏览器输入：`http://你的服务器IP:8888`

示例：`http://123.45.67.89:8888`

### 1.2 登录宝塔面板

输入您的宝塔账号和密码登录

### 1.3 安装Docker

**操作步骤：**

1. 点击左侧菜单 **"软件商店"**
2. 在搜索框输入：`Docker`
3. 找到 **"Docker管理器"**，点击 **"安装"**
4. 等待安装完成（大约2-3分钟）

**如何确认安装成功？**
- 左侧菜单会出现 **"Docker"** 选项
- 点击进去能看到Docker的管理界面

---

## 第二步：上传项目文件（10分钟）

### 2.1 打开文件管理器

1. 宝塔面板左侧点击 **"文件"**
2. 导航到路径：`/www/wwwroot/`

### 2.2 下载项目代码

**方法A：使用终端（推荐）**

1. 点击宝塔面板右上角的 **"终端"** 按钮
2. 在黑色窗口中，复制粘贴以下命令，按回车：

```bash
cd /www/wwwroot
```

3. 再复制粘贴这条命令，按回车：

```bash
git clone https://github.com/archerduan/new-api.git
```

4. 等待下载完成（显示"done"就是完成了）

**方法B：上传压缩包（备选）**

1. 在本地电脑下载项目：https://github.com/archerduan/new-api/archive/refs/heads/main.zip
2. 在宝塔文件管理器中，进入 `/www/wwwroot/`
3. 点击 **"上传"** 按钮
4. 选择刚才下载的zip文件
5. 上传完成后，右键点击zip文件，选择 **"解压"**
6. 将解压后的文件夹重命名为 `new-api`

### 2.3 确认文件已上传

在 `/www/wwwroot/` 目录下应该能看到 `new-api` 文件夹，点进去能看到很多文件。

---

## 第三步：修改配置文件（重要！）

### 3.1 打开配置文件

1. 在文件管理器中进入：`/www/wwwroot/new-api/`
2. 找到文件：`docker-compose.yml`
3. 右键点击，选择 **"编辑"**

### 3.2 修改密码（必须做！）

**找到以下几行，修改密码：**

#### ① 数据库密码（第30行左右）

**原来的：**
```yaml
- SQL_DSN=postgresql://root:123456@postgres:5432/new-api
```

**改成：**（把123456改成你自己的密码，比如：MyPassword2024）
```yaml
- SQL_DSN=postgresql://root:MyPassword2024@postgres:5432/new-api
```

#### ② Redis密码（第31行左右）

**原来的：**
```yaml
- REDIS_CONN_STRING=redis://:123456@redis:6379
```

**改成：**（同样改成你自己的密码）
```yaml
- REDIS_CONN_STRING=redis://:MyPassword2024@redis:6379
```

#### ③ Session密钥（第38行左右）

**找到这行：**
```yaml
#      - SESSION_SECRET=random_string
```

**改成：**（删除开头的#号，并改成一个随机字符串）
```yaml
      - SESSION_SECRET=MySecretKey2024XYZ
```

#### ④ PostgreSQL密码（第70行左右）

**原来的：**
```yaml
POSTGRES_PASSWORD: 123456
```

**改成：**（必须和第①步的密码一致！）
```yaml
POSTGRES_PASSWORD: MyPassword2024
```

#### ⑤ Redis启动密码（第60行左右）

**原来的：**
```yaml
command: ["redis-server", "--requirepass", "123456"]
```

**改成：**（必须和第②步的密码一致！）
```yaml
command: ["redis-server", "--requirepass", "MyPassword2024"]
```

### 3.3 修改端口（可选）

如果3000端口被占用，可以改成其他端口：

**找到这行（第24行左右）：**
```yaml
- "3000:3000"
```

**改成：**（比如改成3001端口）
```yaml
- "3001:3000"
```

### 3.4 保存文件

点击右上角的 **"保存"** 按钮

### 3.5 记录密码（重要！）

在记事本中记录：
```
数据库密码：MyPassword2024
Redis密码：MyPassword2024
Session密钥：MySecretKey2024XYZ
访问端口：3000
```

---

## 第四步：启动服务（5分钟）

### 4.1 使用终端命令启动（最简单的方法）

1. **打开终端**
   - 在宝塔面板右上角，找到 **"终端"** 按钮（或者按钮上可能写着 "SSH终端"）
   - 点击它，会弹出一个黑色的命令窗口

2. **进入项目目录**
   - 在黑色窗口中，复制下面这行命令，右键粘贴（或按Shift+Insert），然后按回车：
   ```bash
   cd /www/wwwroot/new-api
   ```
   - 看到光标变化就表示成功了

3. **启动服务**
   - 继续复制下面这行命令，粘贴后按回车：
   ```bash
   docker-compose up -d
   ```

4. **等待完成**
   - 这个过程需要5-10分钟，因为要从网上下载镜像
   - 您会看到类似这样的输出：
   ```
   Creating network "new-api_new-api-network" with driver "bridge"
   Creating volume "new-api_pg_data" with default driver
   Pulling redis (redis:latest)...
   Pulling postgres (postgres:15)...
   Pulling new-api (calciumion/new-api:latest)...
   Creating redis ... done
   Creating postgres ... done
   Creating new-api ... done
   ```
   - 最后看到三个 "done" 就表示成功了！

**如果出现错误：**
- 看到 "port is already allocated"（端口被占用）→ 需要修改配置文件的端口
- 看到 "permission denied"（权限不足）→ 在命令前加 `sudo`，即：`sudo docker-compose up -d`

### 4.2 检查服务是否启动成功

启动后等待1-2分钟，让容器完全启动。

**方法1：使用命令检查（推荐）**

在刚才的终端窗口中，输入：
```bash
docker-compose ps
```

**应该看到类似这样的输出：**
```
    Name                  Command              State           Ports
-------------------------------------------------------------------------------
new-api       /new-api                     Up      0.0.0.0:3000->3000/tcp
postgres      postgres                     Up      5432/tcp
redis         redis-server --requirepass   Up      6379/tcp
```

**重点看"State"这一列：**
- 三个服务都显示 **"Up"** 就是成功了！ ✅
- 如果显示 **"Exit"** 或 **"Restarting"** 就是有问题 ❌

**方法2：查看Docker容器**

1. 在宝塔面板，点击左侧 **"Docker"**
2. 点击顶部的 **"容器"** 标签（应该能看到这个）
3. 应该能看到3个容器：
   - `new-api`（状态显示：运行中 或 Up）
   - `postgres`（状态显示：运行中 或 Up）
   - `redis`（状态显示：运行中 或 Up）

如果都是"运行中"，就成功了！✅

### 4.3 查看日志（如果启动失败）

在终端中输入：
```bash
cd /www/wwwroot/new-api
docker-compose logs
```

如果有错误会显示出来，可以截图发给技术人员帮忙。

---

## 第五步：访问系统（2分钟）

### 5.1 开放防火墙端口

**在宝塔面板中：**

1. 点击左侧菜单 **"安全"**
2. 找到 **"防火墙"** 部分
3. 点击 **"添加端口规则"**
4. 填写：
   - **端口**：`3000`（如果你改了端口，填你修改后的）
   - **备注**：`new-api服务`
5. 点击 **"确定"**

**在云服务器控制台中：**

不同云厂商操作不同，但都需要在安全组中开放3000端口：

- **阿里云**：ECS控制台 → 安全组 → 配置规则 → 添加入方向规则
- **腾讯云**：云服务器 → 安全组 → 添加规则
- **华为云**：弹性云服务器 → 安全组 → 添加规则

添加规则示例：
- 端口：3000
- 协议：TCP
- 来源：0.0.0.0/0（表示允许所有IP访问）

### 5.2 首次访问

在浏览器中输入：`http://你的服务器IP:3000`

示例：`http://123.45.67.89:3000`

### 5.3 登录系统

**默认账号：**
```
用户名：root
密码：123456
```

**⚠️ 重要：登录后立即修改密码！**

1. 点击右上角的用户头像
2. 选择 **"个人设置"** 或 **"修改密码"**
3. 输入新密码
4. 保存

---

## 第六步：配置域名访问（可选，推荐）

如果您有域名，可以配置通过域名访问（更专业）。

### 6.1 域名解析

1. 登录您的域名服务商（阿里云、腾讯云等）
2. 找到 **"域名解析"** 或 **"DNS解析"**
3. 添加一条A记录：
   - **主机记录**：`api`（或其他子域名）
   - **记录类型**：`A`
   - **记录值**：您的服务器IP（如：123.45.67.89）
   - **TTL**：默认即可

完成后，您的域名就是：`api.yourdomain.com`

### 6.2 在宝塔添加网站

1. 宝塔面板 → **"网站"** → **"添加站点"**
2. 填写信息：
   - **域名**：`api.yourdomain.com`（填您刚才解析的域名）
   - **根目录**：默认即可（不用改）
   - **PHP版本**：选择 **"纯静态"**
   - **数据库**：不勾选
   - **FTP**：不勾选
3. 点击 **"提交"**

### 6.3 配置反向代理

1. 找到刚才添加的网站，点击 **"设置"**
2. 点击左侧的 **"反向代理"**
3. 点击 **"添加反向代理"**
4. 填写信息：
   - **代理名称**：`new-api`
   - **目标URL**：`http://127.0.0.1:3000`
   - **发送域名**：`$host`
5. 点击 **"提交"**

### 6.4 申请SSL证书（启用HTTPS）

1. 在网站设置中，点击左侧 **"SSL"**
2. 选择 **"Let's Encrypt"** 标签
3. 勾选您的域名
4. 点击 **"申请"** 按钮
5. 等待几秒钟，申请成功
6. 开启 **"强制HTTPS"** 开关

### 6.5 访问测试

现在可以通过以下方式访问：
- `https://api.yourdomain.com`（推荐，更安全）
- `http://api.yourdomain.com`（会自动跳转到https）

---

## ✅ 部署完成！

现在您可以：

1. ✅ 通过 `http://IP:3000` 或 `https://域名` 访问系统
2. ✅ 使用新密码登录管理后台
3. ✅ 开始配置API渠道和用户

---

## 🔧 日常维护操作

### 如何查看系统是否正常运行？

**方法1：访问网站**
- 打开浏览器访问您的网址，能正常打开就是运行中

**方法2：查看Docker容器**
- 宝塔面板 → Docker → 容器
- 看到3个容器都显示绿色 "Running" 就是正常

### 如何重启服务？

1. 点击右上角 **"终端"**
2. 输入以下命令：

```bash
cd /www/wwwroot/new-api
docker-compose restart
```

### 如何查看日志？

1. 点击右上角 **"终端"**
2. 输入以下命令：

```bash
cd /www/wwwroot/new-api
docker-compose logs -f
```

按 `Ctrl+C` 可以退出日志查看

### 如何停止服务？

1. 点击右上角 **"终端"**
2. 输入以下命令：

```bash
cd /www/wwwroot/new-api
docker-compose down
```

### 如何重新启动服务？

1. 点击右上角 **"终端"**
2. 输入以下命令：

```bash
cd /www/wwwroot/new-api
docker-compose up -d
```

---

## 🆘 常见问题解决

### 问题1：无法访问网站

**可能原因及解决办法：**

1. **检查服务是否启动**
   - 宝塔 → Docker → 容器，看是否都在运行
   - 如果没运行，按上面的"重新启动服务"操作

2. **检查防火墙**
   - 宝塔面板安全设置中，是否开放了3000端口
   - 云服务器控制台，是否开放了3000端口

3. **检查端口是否被占用**
   - 在终端输入：`netstat -tunlp | grep 3000`
   - 如果显示其他程序占用，需要修改配置文件的端口

### 问题2：访问很慢

**解决办法：**

1. 检查服务器配置是否足够（至少2核2G内存）
2. 查看日志是否有错误：
   ```bash
   cd /www/wwwroot/new-api
   docker-compose logs
   ```

### 问题3：忘记管理员密码

**解决办法：**

1. 点击右上角 **"终端"**
2. 输入以下命令重置为默认密码：

```bash
cd /www/wwwroot/new-api
docker-compose exec new-api /new-api --reset-password
```

3. 密码重置为 `123456`，登录后立即修改

### 问题4：数据库连接失败

**解决办法：**

1. 确认配置文件中的密码是否一致
2. 重启所有服务：
   ```bash
   cd /www/wwwroot/new-api
   docker-compose down
   docker-compose up -d
   ```

### 问题5：显示端口被占用

**解决办法：**

修改配置文件中的端口（参考第三步 3.3）

---

## 📦 数据备份（重要！）

### 为什么要备份？

- 防止数据丢失
- 服务器故障可以快速恢复
- 建议每周备份一次

### 如何备份？

**方法1：使用宝塔计划任务（推荐）**

1. 宝塔面板 → **"计划任务"**
2. 点击 **"添加任务"**
3. 填写信息：
   - **任务类型**：`Shell脚本`
   - **任务名称**：`备份new-api数据库`
   - **执行周期**：`每周`（选择周日凌晨3点）
   - **脚本内容**：
   ```bash
   docker exec postgres pg_dump -U root new-api > /www/backup/new-api-$(date +%Y%m%d).sql
   ```
4. 点击 **"添加"**

**方法2：手动备份**

1. 点击右上角 **"终端"**
2. 输入以下命令：

```bash
docker exec postgres pg_dump -U root new-api > /www/backup/new-api-backup.sql
```

备份文件保存在：`/www/backup/new-api-backup.sql`

### 如何恢复备份？

1. 点击右上角 **"终端"**
2. 输入以下命令：

```bash
docker exec -i postgres psql -U root new-api < /www/backup/new-api-backup.sql
```

---

## 🔄 更新系统

### 更新到最新版本（使用官方版本）

1. 点击右上角 **"终端"**
2. 输入以下命令：

```bash
cd /www/wwwroot/new-api
docker-compose pull
docker-compose up -d
```

### 更新到您的自定义版本（包含多分组功能）

1. 点击右上角 **"终端"**
2. 输入以下命令：

```bash
cd /www/wwwroot/new-api
git pull
docker-compose down
docker-compose up -d --build
```

---

## 📞 获取帮助

如果遇到问题：

1. **查看本文档的"常见问题解决"部分**
2. **查看日志找错误信息**：
   ```bash
   cd /www/wwwroot/new-api
   docker-compose logs
   ```
3. **截图日志错误信息**，在GitHub提交Issue或寻求技术支持

---

## 附录A：如何安装宝塔面板

如果您的服务器还没有安装宝塔面板：

### 1. 连接服务器

使用SSH工具连接服务器（如：PuTTY、Xshell）

### 2. 安装宝塔面板

根据您的系统选择命令：

**CentOS系统：**
```bash
yum install -y wget && wget -O install.sh https://download.bt.cn/install/install_6.0.sh && sh install.sh ed8484bec
```

**Ubuntu系统：**
```bash
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh ed8484bec
```

**Debian系统：**
```bash
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh && bash install.sh ed8484bec
```

### 3. 等待安装完成

安装完成后会显示：
- 访问地址（如：http://123.45.67.89:8888）
- 用户名（如：username）
- 密码（如：password）

**请务必记录这些信息！**

### 4. 首次登录

1. 在浏览器打开访问地址
2. 输入用户名和密码
3. 按照提示完成初始化

---

## 🎉 恭喜您完成部署！

现在您已经成功部署了New-API系统，可以开始使用了！

**记住这些重要信息：**
- ✅ 访问地址
- ✅ 管理员账号密码
- ✅ 数据库密码
- ✅ 定期备份数据

祝您使用愉快！
