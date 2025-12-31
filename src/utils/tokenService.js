const jwt = require('jsonwebtoken');

class TokenService {
    // Generate access token
    static generateAccessToken(userId) {
        return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
            expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
        });
    }

    // Generate refresh token
    static generateRefreshToken(userId) {
        return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
        });
    }

    // Generate invite token
    static generateInviteToken(projectId, email, role) {
        return jwt.sign(
            { projectId, email, role },
            process.env.JWT_INVITE_SECRET,
            { expiresIn: process.env.JWT_INVITE_EXPIRE || '7d' }
        );
    }

    // Verify access token
    static verifyAccessToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired access token');
        }
    }

    // Verify refresh token
    static verifyRefreshToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired refresh token');
        }
    }

    // Verify invite token
    static verifyInviteToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_INVITE_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired invite token');
        }
    }

    // Generate token pair
    static generateTokenPair(userId) {
        return {
            accessToken: this.generateAccessToken(userId),
            refreshToken: this.generateRefreshToken(userId),
        };
    }
}

module.exports = TokenService;
