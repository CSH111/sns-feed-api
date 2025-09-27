import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { GetPostsDto, PostsWithCursorDto } from './dto/get-posts.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createPostDto: CreatePostDto): Promise<PostResponseDto> {
    const { content, categoryId, imageUrls } = createPostDto;

    // 카테고리 존재 확인
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('존재하지 않는 카테고리입니다.');
    }

    // 이미지 URL 개수 검증
    if (imageUrls && imageUrls.length > 4) {
      throw new BadRequestException('이미지는 최대 4개까지 등록 가능합니다.');
    }

    // 트랜잭션으로 게시물과 이미지 생성
    const post = await this.prisma.$transaction(async (tx) => {
      // 게시물 생성
      const newPost = await tx.post.create({
        data: {
          userId,
          categoryId,
          content,
        },
      });

      // 이미지가 있다면 이미지 생성
      if (imageUrls && imageUrls.length > 0) {
        await tx.postImage.createMany({
          data: imageUrls.map((url, index) => ({
            postId: newPost.id,
            url,
            order: index + 1,
          })),
        });
      }

      // 완성된 게시물 조회
      return await tx.post.findUnique({
        where: { id: newPost.id },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              profileImageUrl: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          images: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              url: true,
              order: true,
            },
          },
        },
      });
    });

    return post as PostResponseDto;
  }

  async findAll(getPostsDto: GetPostsDto): Promise<PostsWithCursorDto> {
    const { cursor, limit = 10, categoryId, sortBy = 'latest' } = getPostsDto;

    // 최대 50개로 제한
    const take = Math.min(limit, 50);

    const where: any = {};

    // 카테고리 필터링
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // 커서 조건 추가
    if (cursor) {
      if (sortBy === 'latest') {
        where.id = { lt: cursor }; // ID가 cursor보다 작은 것들 (최신순에서 다음 페이지)
      } else {
        where.id = { gt: cursor }; // ID가 cursor보다 큰 것들 (오래된순에서 다음 페이지)
      }
    }

    const orderBy = sortBy === 'latest'
      ? [{ createdAt: 'desc' as const }, { id: 'desc' as const }]
      : [{ createdAt: 'asc' as const }, { id: 'asc' as const }];

    // take + 1로 조회하여 다음 페이지 존재 여부 확인
    const posts = await this.prisma.post.findMany({
      where,
      take: take + 1,
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImageUrl: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            url: true,
            order: true,
          },
        },
      },
    });

    const hasNextPage = posts.length > take;
    const resultPosts = hasNextPage ? posts.slice(0, take) : posts;
    const nextCursor = resultPosts.length > 0 ? resultPosts[resultPosts.length - 1].id : undefined;

    return {
      posts: resultPosts as PostResponseDto[],
      nextCursor: hasNextPage ? nextCursor : undefined,
      hasNextPage,
      count: resultPosts.length,
    };
  }


  async findOne(id: number): Promise<PostResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profileImageUrl: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            url: true,
            order: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    return post as PostResponseDto;
  }
}