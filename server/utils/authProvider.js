const User = require('../models/User');

class AuthenticationProvider {
  constructor() {
    this.providerType = process.env.AUTH_PROVIDER || 'local';
  }

  async authenticate(identifier, password) {
    if (this.providerType === 'local') {
      // Find the user by email, universityId, or employeeId
      const user = await User.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { universityId: identifier },
          { employeeId: identifier }
        ]
      }).select('+password');

      if (!user) {
        return { success: false, message: 'Invalid credentials' };
      }

      if (!user.isActive) {
        return { success: false, message: 'User account is deactivated', isSuspended: true };
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return { success: false, message: 'Invalid credentials' };
      }

      return { success: true, user };
    } else {
      // Placeholder for future SSO / OIDC / LDAP integrations
      return { success: false, message: `Authentication provider '${this.providerType}' is not configured/implemented.` };
    }
  }
}

module.exports = new AuthenticationProvider();
