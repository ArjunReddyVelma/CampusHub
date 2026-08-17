const jwt = require('jsonwebtoken');

// Sign JWT and set HttpOnly Cookie
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  // Cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production'
  };

  // Attach token to response cookie
  res.cookie('token', token, cookieOptions);

  // Return success response with user info (excluding password hash)
  res.status(statusCode).json({
    success: true,
    message: 'Authenticated successfully',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    }
  });
};

module.exports = { sendTokenResponse };
