const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 100]
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    allowNull: false,
    defaultValue: 'user'
  },
  department: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  position: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password && !user.password.startsWith('$2a$')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && !user.password.startsWith('$2a$')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  },
  defaultScope: {
    attributes: {
      exclude: ['password']
    }
  },
  scopes: {
    withPassword: {
      attributes: ['id', 'username', 'name', 'password', 'role', 'department', 'position', 'email', 'phone', 'status', 'lastLoginAt', 'createdAt', 'updatedAt']
    }
  }
});

// Instance method to check password
User.prototype.checkPassword = async function(password) {
  try {
    const isValid = await bcrypt.compare(password, this.password);
    console.log('Password comparison:', {
      plainPassword: password,
      hashedPassword: this.password,
      isValid
    });
    return isValid;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Instance method to update last login
User.prototype.updateLastLogin = async function() {
  this.lastLoginAt = new Date();
  await this.save();
};

// Class method to safely get user data
User.safeUserData = (user) => {
  if (!user) return null;
  const { password, ...safeData } = user.toJSON();
  return safeData;
};

module.exports = User; 