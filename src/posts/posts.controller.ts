import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { GetPostsDto, PostsWithCursorDto } from './dto/get-posts.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '게시물 등록' })
  @ApiResponse({
    status: 201,
    description: '게시물이 성공적으로 등록되었습니다.',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '텍스트 길이 초과',
    content: {
      'application/json': {
        examples: {
          textTooLong: {
            summary: '텍스트 길이 초과',
            value: {
              statusCode: 400,
              message: '게시물 내용은 최대 280자까지 입력 가능합니다.',
              error: 'Bad Request'
            }
          },
          tooManyImages: {
            summary: '이미지 개수 초과',
            value: {
              statusCode: 400,
              message: '이미지는 최대 4개까지 등록 가능합니다.',
              error: 'Bad Request'
            }
          },
          invalidUrl: {
            summary: '잘못된 URL 형식',
            value: {
              statusCode: 400,
              message: '올바른 URL 형식이어야 합니다.',
              error: 'Bad Request'
            }
          },
          missingContent: {
            summary: '필수 필드 누락',
            value: {
              statusCode: 400,
              message: 'content should not be empty',
              error: 'Bad Request'
            }
          },
          invalidCategoryId: {
            summary: '존재하지 않는 카테고리',
            value: {
              statusCode: 400,
              message: '존재하지 않는 카테고리입니다.',
              error: 'Bad Request'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 사용자',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '존재하지 않는 카테고리',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '존재하지 않는 카테고리입니다.' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  async create(@Request() req, @Body() createPostDto: CreatePostDto): Promise<PostResponseDto> {
    return this.postsService.create(req.user.id, createPostDto);
  }

  @Get()
  @ApiOperation({ summary: '게시물 목록 조회 (커서 기반 페이지네이션)' })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: '마지막으로 조회한 게시물 ID (커서)',
    example: 123,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '조회할 게시물 수 (기본값: 10)',
    example: 10,
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: '카테고리 ID로 필터링',
    example: 1,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: '정렬 기준 (latest: 최신순, oldest: 오래된순)',
    enum: ['latest', 'oldest'],
    example: 'latest',
  })
  @ApiResponse({
    status: 200,
    description: '게시물 목록 조회 성공',
    type: PostsWithCursorDto,
  })
  async findAll(@Query() getPostsDto: GetPostsDto): Promise<PostsWithCursorDto> {
    return this.postsService.findAll(getPostsDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '게시물 상세 조회' })
  @ApiParam({ name: 'id', description: '게시물 ID' })
  @ApiResponse({
    status: 200,
    description: '게시물 상세 조회 성공',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 404, description: '게시물을 찾을 수 없습니다.' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<PostResponseDto> {
    return this.postsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '게시물 수정 (텍스트만)' })
  @ApiParam({ name: 'id', description: '게시물 ID' })
  @ApiResponse({
    status: 200,
    description: '게시물이 성공적으로 수정되었습니다.',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    content: {
      'application/json': {
        examples: {
          textTooLong: {
            summary: '텍스트 길이 초과',
            value: {
              statusCode: 400,
              message: '게시물 내용은 최대 280자까지 입력 가능합니다.',
              error: 'Bad Request'
            }
          },
          invalidCategoryId: {
            summary: '존재하지 않는 카테고리',
            value: {
              statusCode: 400,
              message: '존재하지 않는 카테고리입니다.',
              error: 'Bad Request'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 사용자',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: '게시물을 수정할 권한이 없습니다.' },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '게시물을 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '게시물을 찾을 수 없습니다.' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    return this.postsService.update(id, req.user.id, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '게시물 삭제' })
  @ApiParam({ name: 'id', description: '게시물 ID' })
  @ApiResponse({
    status: 200,
    description: '게시물이 성공적으로 삭제되었습니다.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '게시물이 성공적으로 삭제되었습니다.' }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 사용자',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: '게시물을 삭제할 권한이 없습니다.' },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '게시물을 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '게시물을 찾을 수 없습니다.' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req): Promise<{ message: string }> {
    return this.postsService.remove(id, req.user.id);
  }
}