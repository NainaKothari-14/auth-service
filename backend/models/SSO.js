// models/SSOProvider.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const SSOProvider = sequelize.define("SSOProvider", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: "Provider identifier (e.g., 'okta', 'azure-ad', 'onelogin')"
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "Human-readable name shown to users"
  },
  type: {
    type: DataTypes.ENUM('SAML', 'OIDC'),
    allowNull: false,
    comment: "SSO protocol type"
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: "Whether this provider is currently enabled"
  },
  domains: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: "Email domains that should use this SSO provider"
  },
  config: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: "Provider-specific configuration (entryPoint, issuer, cert, etc.)"
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: "Additional metadata for the provider"
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "sso_providers",
  timestamps: true,
});

export default SSOProvider;