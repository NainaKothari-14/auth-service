import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";

const OTP = sequelize.define("OTP", {
  otpCode: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "otp_code", 
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: "expires_at", 
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

OTP.belongsTo(User, { foreignKey: "userId" });
User.hasMany(OTP, { foreignKey: "userId" });

export default OTP;
