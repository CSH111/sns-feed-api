import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    schema: {
      example: {
        id: 1,
        loginId: 'user123',
        name: '김철수',
        nickname: 'nickname',
        profileImageUrl: 'https://example.com/profile.jpg',
        createdAt: '2023-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '입력값 검증 실패',
    content: {
      'application/json': {
        examples: {
          loginIdError: {
            summary: 'ID 규칙 위반',
            value: {
              message: "ID는 영문소문자와 숫자만 허용됩니다",
              error: "Bad Request",
              statusCode: 400
            }
          },
          passwordError: {
            summary: '비밀번호 규칙 위반',
            value: {
              message: "비밀번호는 8-20자 사이여야 합니다",
              error: "Bad Request",
              statusCode: 400
            }
          },
          nicknameError: {
            summary: '닉네임 규칙 위반',
            value: {
              message: "닉네임은 영문소문자만 허용됩니다",
              error: "Bad Request",
              statusCode: 400
            }
          },
          lengthError: {
            summary: '길이 규칙 위반',
            value: {
              message: "ID는 3-20자 사이여야 합니다",
              error: "Bad Request",
              statusCode: 400
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 409,
    description: '중복된 ID 또는 닉네임',
    content: {
      'application/json': {
        examples: {
          duplicateLoginId: {
            summary: '중복된 ID',
            value: {
              message: "이미 사용 중인 ID입니다",
              error: "Conflict",
              statusCode: 409
            }
          },
          duplicateNickname: {
            summary: '중복된 닉네임',
            value: {
              message: "이미 사용 중인 닉네임입니다",
              error: "Conflict",
              statusCode: 409
            }
          }
        }
      }
    }
  })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get(':loginId')
  @ApiOperation({ summary: '사용자 조회' })
  @ApiParam({ name: 'loginId', description: '사용자 로그인 ID' })
  @ApiResponse({
    status: 200,
    description: '사용자 조회 성공',
    schema: {
      example: {
        id: 1,
        loginId: 'user123',
        name: '김철수',
        nickname: 'nickname',
        profileImageUrl: 'https://example.com/profile.jpg',
        createdAt: '2023-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
    schema: {
      example: {
        message: "사용자를 찾을 수 없습니다",
        error: "Not Found",
        statusCode: 404
      }
    }
  })
  async findUser(@Param('loginId') loginId: string) {
    return this.usersService.findByLoginId(loginId);
  }
}