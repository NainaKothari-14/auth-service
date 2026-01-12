import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";

const AuthMethod = sequelize.define("AuthMethod", {
  type: {
    type: DataTypes.ENUM("email", "otp", "oauth2", "sso"),
    allowNull: false,
  },
  provider: {
    type: DataTypes.STRING,
  },
  provider_user_id: {
    type: DataTypes.STRING,
  },
});

AuthMethod.belongsTo(User, { foreignKey: "userId" });
User.hasMany(AuthMethod, { foreignKey: "userId" });

export default AuthMethod;
