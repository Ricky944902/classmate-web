const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const socketIO = require('socket.io');
const http = require('http');
const dotenv = require('dotenv');
const crypto = require('crypto');
const { Sequelize, DataTypes, Op } = require('sequelize');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// 加载环境变量
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 中间件
// Cloudflare DDOS防护配置
app.use(helmet()); // 设置安全HTTP头

// 设置请求频率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP在15分钟内最多100个请求
  standardHeaders: true,
  legacyHeaders: false,
  message: '请求过于频繁，请稍后再试'
});

app.use(limiter); // 应用频率限制
app.use(cors());
app.use(express.json());

// 添加Cloudflare IP验证 (如果使用Cloudflare代理)
app.set('trust proxy', true);

// 连接数据库
// 连接数据库
const sequelize = new Sequelize(process.env.DB_URI || 'mysql://root:password@localhost:3306/classmate-chat', {
  dialect: 'mysql',
  logging: console.log
});

// 测试数据库连接
sequelize.authenticate()
  .then(() => console.log('MySQL数据库连接成功'))
  .catch(err => {
    console.error('MySQL数据库连接错误:', err);
    // 在生产环境中，可能需要优雅地退出进程
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

// 用户模型
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verificationToken: {
    type: DataTypes.STRING
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// 密码加密钩子
User.beforeCreate(async (user) => {
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// 验证密码方法
User.prototype.matchPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// 生成JWT方法
User.prototype.generateToken = function() {
  return jwt.sign({ id: this.id, isAdmin: this.isAdmin }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '24h'
  });
};

// 消息模型
const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  recipientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isEncrypted: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// 定义关联关系
User.hasMany(Message, { foreignKey: 'senderId' });
Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });

User.hasMany(Message, { foreignKey: 'recipientId' });
Message.belongsTo(User, { as: 'recipient', foreignKey: 'recipientId' });

// 敏感词模型
const Profanity = sequelize.define('Profanity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  word: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// 加密函数
function encrypt(text, key) {
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.alloc(16, 0));
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('hex');
}

// 解密函数
function decrypt(encryptedText, key) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.alloc(16, 0));
  let decrypted = decipher.update(Buffer.from(encryptedText, 'hex'));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// 检查敏感词
async function checkProfanity(text) {
  const profanities = await Profanity.findAll({});
  const words = text.toLowerCase().split(/\s+/);
  return profanities.some(profanity => words.includes(profanity.word.toLowerCase()));
}

// 注册路由
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 检查用户是否已存在
    const userExists = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });
    if (userExists) {
      return res.status(400).json({ message: '用户名或邮箱已被注册' });
    }

    // 检查密码强度
    if (password.length < 6) {
      return res.status(400).json({ message: '密码长度至少为6位' });
    }

    // 创建新用户
    const user = await User.create({
      username,
      email,
      password,
      verificationToken: crypto.randomBytes(20).toString('hex')
    });

    res.status(201).json({ message: '注册成功，请登录' });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 登录路由
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({
      where: { username }
    });
    if (!user) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }

    // 检查密码
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }

    // 生成JWT
    const token = user.generateToken();

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户列表 (管理员)
app.get('/api/users', async (req, res) => {
  try {
    // 验证管理员权限
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const admin = await User.findByPk(decoded.id);

    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ message: '无权限访问' });
    }

    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加敏感词 (管理员)
app.post('/api/profanity', async (req, res) => {
  try {
    // 验证管理员权限
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const admin = await User.findByPk(decoded.id);

    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ message: '无权限访问' });
    }

    const { word } = req.body;
    const existingWord = await Profanity.findOne({
      where: { word }
    });

    if (existingWord) {
      return res.status(400).json({ message: '敏感词已存在' });
    }

    await Profanity.create({
      word
    });

    res.status(201).json({ message: '敏感词添加成功' });
  } catch (error) {
    console.error('添加敏感词错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取敏感词列表 (管理员)
app.get('/api/profanity', async (req, res) => {
  try {
    // 验证管理员权限
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const admin = await User.findByPk(decoded.id);

    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ message: '无权限访问' });
    }

    const profanities = await Profanity.findAll({});
    res.json(profanities);
  } catch (error) {
    console.error('获取敏感词列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除敏感词 (管理员)
app.delete('/api/profanity/:id', async (req, res) => {
  try {
    // 验证管理员权限
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const admin = await User.findByPk(decoded.id);

    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ message: '无权限访问' });
    }

    await Profanity.destroy({
      where: { id: req.params.id }
    });
    res.json({ message: '敏感词删除成功' });
  } catch (error) {
    console.error('删除敏感词错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更改用户权限 (管理员)
app.put('/api/users/:id/role', async (req, res) => {
  try {
    // 验证管理员权限
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const admin = await User.findByPk(decoded.id);

    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ message: '无权限访问' });
    }

    const { isAdmin } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    user.isAdmin = isAdmin;
    await user.save();

    res.json({ message: '用户权限更新成功' });
  } catch (error) {
    console.error('更改用户权限错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除用户 (管理员)
app.delete('/api/users/:id', async (req, res) => {
  try {
    // 验证管理员权限
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const admin = await User.findByPk(decoded.id);

    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ message: '无权限访问' });
    }

    // 不能删除自己
    if (decoded.id === req.params.id) {
      return res.status(400).json({ message: '不能删除自己' });
    }

    await User.destroy({
      where: { id: req.params.id }
    });
    res.json({ message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 搜索用户
app.get('/api/users/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: '搜索关键词不能为空' });
    }

    const users = await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } }
        ]
      },
      attributes: { exclude: ['password'] }
    });

    res.json(users);
  } catch (error) {
    console.error('搜索用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取消息历史
app.get('/api/messages/:userId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const currentUser = await User.findByPk(decoded.id);

    if (!currentUser) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: decoded.id, recipientId: req.params.userId },
          { senderId: req.params.userId, recipientId: decoded.id }
        ]
      },
      order: [['createdAt', 'ASC']],
      include: [
        { model: User, as: 'sender', attributes: ['username'] },
        { model: User, as: 'recipient', attributes: ['username'] }
      ]
    });

    res.json(messages);
  } catch (error) {
    console.error('获取消息历史错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// WebSocket 连接处理
io.on('connection', (socket) => {
  console.log('新用户连接');

  // 加入私人聊天房间
  socket.on('joinChat', ({ userId }) => {
    socket.join(userId);
    console.log(`用户 ${userId} 加入了聊天室`);
  });

  // 发送消息
  socket.on('sendMessage', async ({ sender, recipient, content, encryptionKey }) => {
    try {
      // 检查敏感词
      const hasProfanity = await checkProfanity(content);
      if (hasProfanity) {
        socket.emit('messageError', { message: '消息包含敏感词' });
        return;
      }

      // 加密消息
      const encryptedContent = encrypt(content, encryptionKey);

      // 保存消息
      const message = await Message.create({
        senderId: sender,
        recipientId: recipient,
        content: encryptedContent,
        isEncrypted: true
      });

      // 发送消息给接收者
      io.to(recipient).emit('messageReceived', {
        sender,
        recipient,
        content: encryptedContent,
        createdAt: message.createdAt,
        isEncrypted: true
      });

      // 发送消息给自己
      socket.emit('messageSent', {
        sender,
        recipient,
        content: encryptedContent,
        createdAt: message.createdAt,
        isEncrypted: true
      });
    } catch (error) {
      console.error('发送消息错误:', error);
      socket.emit('messageError', { message: '发送消息失败' });
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('用户断开连接');
  });
});

// 创建管理员账户
async function createAdmin() {
  try {
    const adminExists = await User.findOne({
      where: { username: 'admin' }
    });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin',
        isAdmin: true,
        isVerified: true
      });
      console.log('管理员账户创建成功');
    }
  } catch (error) {
    console.error('创建管理员账户错误:', error);
  }
}

// 导入联系人模型
const Contact = require('./models/Contact');

// 导入双因素认证模型
const TwoFactorAuth = require('./models/TwoFactorAuth');

// 生成随机验证码
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 发送验证码（模拟，实际项目中应使用nodemailer发送邮件）
function sendVerificationEmail(email, code) {
  console.log(`[模拟发送邮件] 验证码 ${code} 已发送至 ${email}`);
  // 实际项目中应使用以下代码发送邮件
  /*
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: '安全聊天应用 - 验证码',
    text: `您的验证码是: ${code}，有效期为10分钟。`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('发送邮件错误:', error);
    } else {
      console.log('邮件发送成功:', info.response);
    }
  });
  */
}

// 发送联系人请求
app.post('/api/contacts/request', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const { contactId } = req.body;

    // 不能添加自己为联系人
    if (decoded.id === contactId) {
      return res.status(400).json({ message: '不能添加自己为联系人' });
    }

    // 检查联系人是否存在
    const contactUser = await User.findByPk(contactId);
    if (!contactUser) {
      return res.status(404).json({ message: '联系人不存在' });
    }

    // 检查是否已经发送过请求
    const existingRequest = await Contact.findOne({
      where: {
        [Op.or]: [
          { userId: decoded.id, contactId },
          { userId: contactId, contactId: decoded.id }
        ]
      }
    });

    if (existingRequest) {
      return res.status(400).json({ message: '已经发送过联系人请求或对方已发送请求' });
    }

    // 创建联系人请求
    await Contact.create({
      userId: decoded.id,
      contactId,
      status: 'pending'
    });

    res.status(201).json({ message: '联系人请求发送成功' });
  } catch (error) {
    console.error('发送联系人请求错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 接受联系人请求
app.put('/api/contacts/accept/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const contact = await Contact.findByPk(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: '联系人请求不存在' });
    }

    // 确保只有被请求方可以接受请求
    if (contact.contactId !== decoded.id) {
      return res.status(403).json({ message: '无权限接受此请求' });
    }

    contact.status = 'accepted';
    await contact.save();

    // 创建反向联系人记录
    await Contact.create({
      userId: decoded.id,
      contactId: contact.userId,
      status: 'accepted'
    });

    res.json({ message: '联系人请求已接受' });
  } catch (error) {
    console.error('接受联系人请求错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 拒绝联系人请求
app.delete('/api/contacts/reject/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const contact = await Contact.findByPk(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: '联系人请求不存在' });
    }

    // 确保只有被请求方可以拒绝请求
    if (contact.contactId !== decoded.id) {
      return res.status(403).json({ message: '无权限拒绝此请求' });
    }

    await contact.destroy();
    res.json({ message: '联系人请求已拒绝' });
  } catch (error) {
    console.error('拒绝联系人请求错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除联系人
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const contact = await Contact.findByPk(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: '联系人不存在' });
    }

    // 确保只有联系人关系中的一方可以删除
    if (contact.userId !== decoded.id && contact.contactId !== decoded.id) {
      return res.status(403).json({ message: '无权限删除此联系人' });
    }

    // 删除反向联系人记录
    await Contact.destroy({
      where: {
        userId: contact.contactId,
        contactId: contact.userId
      }
    });

    await contact.destroy();
    res.json({ message: '联系人已删除' });
  } catch (error) {
    console.error('删除联系人错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取联系人列表
app.get('/api/contacts', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const contacts = await Contact.findAll({
      where: {
        userId: decoded.id,
        status: 'accepted'
      },
      include: [{
        model: User,
        as: 'contact',
        attributes: ['username', 'email']
      }]
    });

    res.json(contacts);
  } catch (error) {
    console.error('获取联系人列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取联系人请求
app.get('/api/contacts/requests', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const requests = await Contact.findAll({
      where: {
        contactId: decoded.id,
        status: 'pending'
      },
      include: [{
        model: User,
        attributes: ['username', 'email']
      }]
    });

    res.json(requests);
  } catch (error) {
    console.error('获取联系人请求错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 发送双因素验证码
app.post('/api/two-factor/send', async (req, res) => {
  try {
    const { email } = req.body;

    // 查找用户
    const user = await User.findOne({
      where: { email }
    });
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 生成验证码
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    // 删除旧的验证码
    await TwoFactorAuth.destroy({
      where: { userId: user.id }
    });

    // 保存新的验证码
    await TwoFactorAuth.create({
      userId: user.id,
      email,
      code,
      expiresAt
    });

    // 发送验证码
    sendVerificationEmail(email, code);

    res.json({ message: '验证码已发送' });
  } catch (error) {
    console.error('发送验证码错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 验证双因素验证码
app.post('/api/two-factor/verify', async (req, res) => {
  try {
    const { email, code } = req.body;

    // 查找验证码
    const twoFactorAuth = await TwoFactorAuth.findOne({
      where: {
        email,
        code
      }
    });

    if (!twoFactorAuth) {
      return res.status(400).json({ message: '验证码无效' });
    }

    // 检查验证码是否过期
    if (twoFactorAuth.expiresAt < new Date()) {
      await twoFactorAuth.destroy();
      return res.status(400).json({ message: '验证码已过期' });
    }

    // 查找用户
    const user = await User.findByPk(twoFactorAuth.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 标记用户为已验证
    user.isVerified = true;
    await user.save();

    // 删除已使用的验证码
    await twoFactorAuth.destroy();

    // 生成JWT
    const token = user.generateToken();

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('验证验证码错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 同步数据库
sequelize.sync({ alter: true })
.then(() => {
  console.log('数据库已同步');
  // 启动服务器
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
    createAdmin(); // 创建管理员账户
  });
})
.catch(err => console.log('数据库同步错误:', err));