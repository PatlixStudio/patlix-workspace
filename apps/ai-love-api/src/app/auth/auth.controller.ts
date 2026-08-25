import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  register(
    @Body()
    data: {
      email: string;
      password: string;
      name: string;
      surname: string;
    }
  ) {
    try {
      return this.authService.register(data);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  login(@Body() data: { email: string; password: string }) {
    try {
      return this.authService.login(data.email, data.password);
    } catch (err: any) {
      throw new UnauthorizedException(err.message);
    }
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user from token' })
  me(@Request() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('No token provided');

    const user = this.authService.validateToken(token);
    if (!user) throw new UnauthorizedException('Invalid token');

    const { passwordHash, ...publicUser } = user;
    return publicUser;
  }

  @Post('subscribe')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe the current user' })
  subscribe(@Request() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('No token provided');

    const user = this.authService.validateToken(token);
    if (!user) throw new UnauthorizedException('Invalid token');

    return this.authService.subscribe(user.id);
  }

  @Get('messages-left')
  @ApiOperation({ summary: 'Check remaining free messages for guests' })
  checkMessagesLeft(@Request() req: any, @Body() data: { companionId: string }) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    let userId: string | null = null;

    if (token) {
      const user = this.authService.validateToken(token);
      if (user) userId = user.id;
    }

    return this.authService.canSendMessage(userId, data.companionId);
  }
}