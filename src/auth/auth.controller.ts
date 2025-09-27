import { Controller, Post, Body, Req, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import type { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: '로그인',
    description: `로그인 성공 후 받은 accessToken을 사용하는 방법:
1. 응답의 accessToken 값을 복사
2. Swagger 우측 상단 🔒 Authorize 버튼 클릭
3. Value 필드에 accessToken 값만 입력 (Bearer 제외)
4. 이후 모든 API 호출 시 자동으로 Authorization 헤더 추가됨

⚠️ accessToken은 30분 후 만료되며, refreshToken으로 갱신 가능합니다.`
  })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    schema: {
      example: {
        user: {
          id: 1,
          loginId: 'user123',
          name: '김철수',
          nickname: 'nickname',
          profileImageUrl: 'https://picsum.photos/40/40?random=1',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'a1b2c3d4e5f6...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '로그인 실패',
    content: {
      'application/json': {
        examples: {
          invalidCredentials: {
            summary: '잘못된 인증 정보',
            value: {
              message: '아이디 또는 비밀번호가 올바르지 않습니다',
              error: 'Unauthorized',
              statusCode: 401,
            },
          },
        },
      },
    },
  })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(loginDto, req);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: '토큰 갱신' })
  @ApiResponse({
    status: 200,
    description: '토큰 갱신 성공',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'a1b2c3d4e5f6...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '토큰 갱신 실패',
    content: {
      'application/json': {
        examples: {
          invalidToken: {
            summary: '유효하지 않은 토큰',
            value: {
              message: '유효하지 않은 리프레시 토큰입니다',
              error: 'Unauthorized',
              statusCode: 401,
            },
          },
          expiredToken: {
            summary: '만료된 토큰',
            value: {
              message: '만료된 리프레시 토큰입니다',
              error: 'Unauthorized',
              statusCode: 401,
            },
          },
        },
      },
    },
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refresh(refreshTokenDto.refreshToken, req);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({
    status: 200,
    description: '로그아웃 성공',
    schema: {
      example: {
        message: '로그아웃되었습니다',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    content: {
      'application/json': {
        examples: {
          missingToken: {
            summary: '리프레시 토큰 누락',
            value: {
              message: '리프레시 토큰이 필요합니다',
              error: 'Bad Request',
              statusCode: 400,
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    content: {
      'application/json': {
        examples: {
          invalidAccessToken: {
            summary: '유효하지 않은 액세스 토큰',
            value: {
              message: 'Unauthorized',
              statusCode: 401,
            },
          },
          invalidRefreshToken: {
            summary: '유효하지 않은 리프레시 토큰',
            value: {
              message: '유효하지 않은 리프레시 토큰입니다',
              error: 'Unauthorized',
              statusCode: 401,
            },
          },
          expiredRefreshToken: {
            summary: '만료된 리프레시 토큰',
            value: {
              message: '만료된 리프레시 토큰입니다',
              error: 'Unauthorized',
              statusCode: 401,
            },
          },
        },
      },
    },
  })
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.logout(refreshTokenDto.refreshToken);
  }
}