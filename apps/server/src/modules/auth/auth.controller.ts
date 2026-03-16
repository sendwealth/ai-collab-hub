import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  OAuthDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/register
   * 用户注册
   */
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * POST /api/v1/auth/login
   * 用户登录
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * POST /api/v1/auth/logout
   * 用户登出
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  /**
   * POST /api/v1/auth/refresh
   * 刷新token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  /**
   * POST /api/v1/auth/forgot-password
   * 忘记密码
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  /**
   * POST /api/v1/auth/reset-password
   * 重置密码
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  /**
   * GET /api/v1/auth/me
   * 获取当前用户信息
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'User info retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@CurrentUser('id') userId: string) {
    return this.authService.getCurrentUser(userId);
  }

  // ============================================
  // GitHub OAuth Routes
  // ============================================

  /**
   * GET /api/v1/auth/github
   * GitHub OAuth登录 - 重定向到GitHub授权页面
   */
  @Get('github')
  @ApiOperation({ summary: 'GitHub OAuth login - redirect to GitHub' })
  @ApiResponse({ status: 302, description: 'Redirect to GitHub authorization page' })
  async githubLogin(@Res() res: Response, @Req() req: Request) {
    // 生成state参数用于防止CSRF攻击
    const state = uuidv4();
    
    // 将state存储到session或临时存储中（这里简化处理，实际应该使用Redis等）
    // 实际生产环境应该使用Redis存储state，并设置过期时间
    
    const authUrl = await this.authService.getGitHubAuthUrl(state);
    
    // 将state设置为cookie，回调时验证
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000, // 10分钟
    });
    
    return res.redirect(authUrl);
  }

  /**
   * GET /api/v1/auth/github/callback
   * GitHub OAuth回调
   */
  @Get('github/callback')
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @ApiQuery({ name: 'code', description: 'GitHub authorization code' })
  @ApiQuery({ name: 'state', description: 'OAuth state for CSRF protection' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend with token' })
  @ApiResponse({ status: 401, description: 'GitHub OAuth failed' })
  async githubCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      // 验证state
      const cookieState = req.cookies?.oauth_state;
      if (!cookieState || cookieState !== state) {
        throw new Error('Invalid OAuth state');
      }

      // 处理GitHub OAuth
      const result = await this.authService.handleGitHubCallback(code, state);

      // 重定向到前端，携带token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const redirectUrl = `${frontendUrl}/auth/callback?token=${result.data.accessToken}&refresh_token=${result.data.refreshToken}`;
      
      // 清除state cookie
      res.clearCookie('oauth_state');
      
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/login?error=github_oauth_failed`);
    }
  }

  // ============================================
  // Google OAuth Routes
  // ============================================

  /**
   * GET /api/v1/auth/google
   * Google OAuth登录 - 重定向到Google授权页面
   */
  @Get('google')
  @ApiOperation({ summary: 'Google OAuth login - redirect to Google' })
  @ApiResponse({ status: 302, description: 'Redirect to Google authorization page' })
  async googleLogin(@Res() res: Response, @Req() req: Request) {
    // 生成state参数用于防止CSRF攻击
    const state = uuidv4();
    
    const authUrl = await this.authService.getGoogleAuthUrl(state);
    
    // 将state设置为cookie，回调时验证
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000, // 10分钟
    });
    
    return res.redirect(authUrl);
  }

  /**
   * GET /api/v1/auth/google/callback
   * Google OAuth回调
   */
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiQuery({ name: 'code', description: 'Google authorization code' })
  @ApiQuery({ name: 'state', description: 'OAuth state for CSRF protection' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend with token' })
  @ApiResponse({ status: 401, description: 'Google OAuth failed' })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      // 验证state
      const cookieState = req.cookies?.oauth_state;
      if (!cookieState || cookieState !== state) {
        throw new Error('Invalid OAuth state');
      }

      // 处理Google OAuth
      const result = await this.authService.handleGoogleCallback(code, state);

      // 重定向到前端，携带token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const redirectUrl = `${frontendUrl}/auth/callback?token=${result.data.accessToken}&refresh_token=${result.data.refreshToken}`;
      
      // 清除state cookie
      res.clearCookie('oauth_state');
      
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/login?error=google_oauth_failed`);
    }
  }

  // ============================================
  // Legacy OAuth Routes (保持向后兼容)
  // ============================================

  /**
   * POST /api/v1/auth/github
   * GitHub OAuth (旧版本，保持向后兼容)
   */
  @Post('github')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'GitHub OAuth login (legacy)' })
  @ApiResponse({ status: 200, description: 'GitHub OAuth successful' })
  @ApiResponse({ status: 401, description: 'GitHub OAuth failed' })
  async githubOAuth(@Body() oauthDto: OAuthDto) {
    const state = uuidv4();
    return this.authService.handleGitHubCallback(oauthDto.code, state);
  }

  /**
   * POST /api/v1/auth/google
   * Google OAuth (旧版本，保持向后兼容)
   */
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Google OAuth login (legacy)' })
  @ApiResponse({ status: 200, description: 'Google OAuth successful' })
  @ApiResponse({ status: 401, description: 'Google OAuth failed' })
  async googleOAuth(@Body() oauthDto: OAuthDto) {
    const state = uuidv4();
    return this.authService.handleGoogleCallback(oauthDto.code, state);
  }
}
