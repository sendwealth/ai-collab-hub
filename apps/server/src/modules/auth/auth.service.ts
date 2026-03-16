import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name, role = 'agent' } = registerDto;

    // 检查name是否已存在
    const existingAgent = await this.prisma.agent.findUnique({
      where: { name },
    });

    if (existingAgent) {
      throw new ConflictException('Agent name already exists');
    }

    // 生成API Key
    const apiKey = this.generateApiKey();

    // 创建Agent（简化版，不存储email和password）
    const agent = await this.prisma.agent.create({
      data: {
        name,
        description: `Agent created via registration`,
        apiKey,
        publicKey: 'pending', // 临时值
        status: 'offline',
        trustScore: 0,
      },
    });

    // 生成tokens
    const tokens = await this.generateTokens(agent.id, agent.name);

    return {
      success: true,
      data: {
        agent: {
          id: agent.id,
          name: agent.name,
          apiKey, // 返回API Key供用户保存
        },
        ...tokens,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 由于系统使用API Key认证，这里简化处理
    // 实际应该使用API Key登录
    throw new BadRequestException('Please use API Key authentication');
  }

  async logout(agentId: string) {
    // 更新Agent状态为离线
    await this.prisma.agent.update({
      where: { id: agentId },
      data: { status: 'offline' },
    });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // 验证refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      });

      // 生成新的tokens
      const tokens = await this.generateTokens(payload.sub, payload.name);

      return {
        success: true,
        data: tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(email: string) {
    // 由于系统使用API Key认证，不支持密码重置
    throw new BadRequestException('Password reset not supported. Please use API Key authentication.');
  }

  async resetPassword(token: string, newPassword: string) {
    // 由于系统使用API Key认证，不支持密码重置
    throw new BadRequestException('Password reset not supported. Please use API Key authentication.');
  }

  async getCurrentUser(agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        trustScore: true,
        capabilities: true,
        createdAt: true,
        lastSeen: true,
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return {
      success: true,
      data: agent,
    };
  }

  /**
   * 通用OAuth登录处理
   */
  async oauthLogin(provider: 'github' | 'google', code: string, redirectUri?: string) {
    const state = uuidv4(); // 生成随机state
    
    if (provider === 'github') {
      return this.handleGitHubCallback(code, state);
    } else if (provider === 'google') {
      return this.handleGoogleCallback(code, state);
    } else {
      throw new BadRequestException(`Unsupported OAuth provider: ${provider}`);
    }
  }

  // ============================================
  // GitHub OAuth Implementation
  // ============================================

  /**
   * 生成GitHub OAuth授权URL
   */
  async getGitHubAuthUrl(state: string): Promise<string> {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const callbackUrl = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3007/api/v1/auth/github/callback';
    
    if (!clientId) {
      throw new BadRequestException('GitHub OAuth not configured');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      scope: 'user:email',
      state: state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * GitHub OAuth回调处理
   */
  async handleGitHubCallback(code: string, state: string) {
    try {
      // 1. 用code换取access_token
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code,
          redirect_uri: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3007/api/v1/auth/github/callback',
          state: state,
        },
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      const accessToken = tokenResponse.data.access_token;
      if (!accessToken) {
        throw new UnauthorizedException('Failed to get GitHub access token');
      }

      // 2. 获取GitHub用户信息
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      const githubUser = userResponse.data;

      // 3. 获取用户邮箱（如果公开邮箱为空）
      let email = githubUser.email;
      if (!email) {
        const emailResponse = await axios.get('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
        const primaryEmail = emailResponse.data.find((e: any) => e.primary);
        email = primaryEmail?.email;
      }

      if (!email) {
        throw new BadRequestException('Unable to get email from GitHub');
      }

      // 4. 查找或创建用户
      let user = await this.prisma.user.findUnique({
        where: { email: email },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: email,
            name: githubUser.name || githubUser.login,
            avatar: githubUser.avatar_url,
          },
        });
      } else {
        // 更新用户信息
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            name: githubUser.name || githubUser.login,
            avatar: githubUser.avatar_url,
          },
        });
      }

      // 5. 生成JWT token
      const tokens = await this.generateTokens(user.id, user.name || user.email);

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
          },
          ...tokens,
        },
      };
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      throw new UnauthorizedException('GitHub OAuth failed');
    }
  }

  // ============================================
  // Google OAuth Implementation
  // ============================================

  /**
   * 生成Google OAuth授权URL
   */
  async getGoogleAuthUrl(state: string): Promise<string> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3007/api/v1/auth/google/callback';
    
    if (!clientId) {
      throw new BadRequestException('Google OAuth not configured');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      state: state,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Google OAuth回调处理
   */
  async handleGoogleCallback(code: string, state: string) {
    try {
      // 1. 用code换取access_token
      const tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          code: code,
          redirect_uri: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3007/api/v1/auth/google/callback',
          grant_type: 'authorization_code',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const accessToken = tokenResponse.data.access_token;
      if (!accessToken) {
        throw new UnauthorizedException('Failed to get Google access token');
      }

      // 2. 获取Google用户信息
      const userResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const googleUser = userResponse.data;

      // 3. 查找或创建用户
      let user = await this.prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name,
            avatar: googleUser.picture,
          },
        });
      } else {
        // 更新用户信息
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            name: googleUser.name,
            avatar: googleUser.picture,
          },
        });
      }

      // 4. 生成JWT token
      const tokens = await this.generateTokens(user.id, user.name || user.email);

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
          },
          ...tokens,
        },
      };
    } catch (error) {
      console.error('Google OAuth error:', error);
      throw new UnauthorizedException('Google OAuth failed');
    }
  }

  private async generateTokens(userId: string, name: string) {
    const payload = { sub: userId, name };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'secret',
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15分钟（秒）
    };
  }

  private generateApiKey(): string {
    return `sk_agent_${uuidv4().replace(/-/g, '')}`;
  }
}
