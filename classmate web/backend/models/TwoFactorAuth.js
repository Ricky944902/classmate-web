const { DataTypes } = require('sequelize');
const sequelize = require('../server').sequelize;

const TwoFactorAuth = sequelize.define('TwoFactorAuth', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// 定义关联关系
const User = require('./User');
TwoFactorAuth.belongsTo(User, { foreignKey: 'userId' });

module.exports = TwoFactorAuth;