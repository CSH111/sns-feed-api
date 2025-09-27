import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';

describe('PostsService', () => {
  let service: PostsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    post: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    postImage: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const userId = 1;
    const createPostDto: CreatePostDto = {
      content: '테스트 게시물입니다.',
      categoryId: 1,
      imageUrls: ['https://picsum.photos/500/300?random=1'],
    };

    it('게시물 생성에 성공해야 한다', async () => {
      const mockPost = {
        id: 1,
        userId,
        categoryId: createPostDto.categoryId,
        content: createPostDto.content,
        likesCount: 0,
        retweetsCount: 0,
        commentsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: userId,
          nickname: 'testuser',
          profileImageUrl: null,
        },
        category: {
          id: 1,
          name: '요리',
        },
        images: [
          {
            id: 1,
            url: 'https://picsum.photos/500/300?random=1',
            order: 1,
          },
        ],
      };

      mockPrismaService.category.findUnique.mockResolvedValue({ id: 1, name: '요리' });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          post: {
            create: mockPrismaService.post.create.mockResolvedValue({ id: 1 }),
            findUnique: mockPrismaService.post.findUnique.mockResolvedValue(mockPost),
          },
          postImage: {
            createMany: mockPrismaService.postImage.createMany,
          },
        });
      });

      const result = await service.create(userId, createPostDto);

      expect(result).toEqual(mockPost);
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: createPostDto.categoryId },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('존재하지 않는 카테고리일 때 NotFoundException을 던져야 한다', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.create(userId, createPostDto)).rejects.toThrow(
        new NotFoundException('존재하지 않는 카테고리입니다.'),
      );
    });

    it('이미지가 4개를 초과할 때 BadRequestException을 던져야 한다', async () => {
      const invalidDto = {
        ...createPostDto,
        imageUrls: [
          'url1', 'url2', 'url3', 'url4', 'url5', // 5개
        ],
      };

      mockPrismaService.category.findUnique.mockResolvedValue({ id: 1 });

      await expect(service.create(userId, invalidDto)).rejects.toThrow(
        new BadRequestException('이미지는 최대 4개까지 등록 가능합니다.'),
      );
    });

    it('이미지 없이 게시물 생성에 성공해야 한다', async () => {
      const dtoWithoutImages = {
        content: '이미지가 없는 게시물',
        categoryId: 1,
      };

      const mockPost = {
        id: 1,
        userId,
        categoryId: 1,
        content: dtoWithoutImages.content,
        user: { id: userId, nickname: 'testuser' },
        category: { id: 1, name: '요리' },
        images: [],
      };

      mockPrismaService.category.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          post: {
            create: mockPrismaService.post.create.mockResolvedValue({ id: 1 }),
            findUnique: mockPrismaService.post.findUnique.mockResolvedValue(mockPost),
          },
          postImage: {
            createMany: mockPrismaService.postImage.createMany,
          },
        });
      });

      const result = await service.create(userId, dtoWithoutImages);

      expect(result).toEqual(mockPost);
      expect(mockPrismaService.postImage.createMany).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const getPostsDto: GetPostsDto = {
      limit: 10,
      sortBy: 'latest',
    };

    it('커서 기반 게시물 목록 조회에 성공해야 한다', async () => {
      const mockPosts = [
        {
          id: 1,
          content: '첫 번째 게시물',
          user: { id: 1, nickname: 'user1' },
          category: { id: 1, name: '요리' },
          images: [],
        },
      ];

      mockPrismaService.post.findMany.mockResolvedValue(mockPosts);

      const result = await service.findAll(getPostsDto);

      expect(result.posts).toEqual(mockPosts);
      expect(result.count).toBe(1);
      expect(result.hasNextPage).toBe(false);
      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith({
        where: {},
        take: 11, // limit + 1
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: expect.any(Object),
      });
    });

    it('커서가 있을 때 올바른 where 조건을 적용해야 한다', async () => {
      const dtoWithCursor = {
        ...getPostsDto,
        cursor: 5,
      };

      mockPrismaService.post.findMany.mockResolvedValue([]);

      await service.findAll(dtoWithCursor);

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith({
        where: { id: { lt: 5 } },
        take: 11,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: expect.any(Object),
      });
    });

    it('카테고리 필터링이 적용되어야 한다', async () => {
      const dtoWithCategory = {
        ...getPostsDto,
        categoryId: 1,
      };

      mockPrismaService.post.findMany.mockResolvedValue([]);

      await service.findAll(dtoWithCategory);

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith({
        where: { categoryId: 1 },
        take: 11,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: expect.any(Object),
      });
    });

    it('다음 페이지가 있을 때 hasNextPage가 true여야 한다', async () => {
      const mockPosts = Array(11).fill(null).map((_, i) => ({
        id: i + 1,
        content: `게시물 ${i + 1}`,
      }));

      mockPrismaService.post.findMany.mockResolvedValue(mockPosts);

      const result = await service.findAll(getPostsDto);

      expect(result.hasNextPage).toBe(true);
      expect(result.posts).toHaveLength(10); // limit만큼만 반환
      expect(result.nextCursor).toBe(10); // 마지막 게시물의 ID
    });
  });

  describe('findOne', () => {
    const postId = 1;

    it('게시물 상세 조회에 성공해야 한다', async () => {
      const mockPost = {
        id: postId,
        content: '테스트 게시물',
        user: { id: 1, nickname: 'testuser' },
        category: { id: 1, name: '요리' },
        images: [],
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      const result = await service.findOne(postId);

      expect(result).toEqual(mockPost);
      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: postId },
        include: expect.any(Object),
      });
    });

    it('존재하지 않는 게시물일 때 NotFoundException을 던져야 한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.findOne(postId)).rejects.toThrow(
        new NotFoundException('게시물을 찾을 수 없습니다.'),
      );
    });
  });

  describe('update', () => {
    const postId = 1;
    const userId = 1;
    const updatePostDto: UpdatePostDto = {
      content: '수정된 게시물',
      categoryId: 2,
    };

    it('게시물 수정에 성공해야 한다', async () => {
      const mockUpdatedPost = {
        id: postId,
        content: updatePostDto.content,
        categoryId: updatePostDto.categoryId,
        user: { id: userId, nickname: 'testuser' },
        category: { id: 2, name: '그림' },
        images: [],
      };

      mockPrismaService.post.findUnique.mockResolvedValue({ userId });
      mockPrismaService.category.findUnique.mockResolvedValue({ id: 2, name: '그림' });
      mockPrismaService.post.update.mockResolvedValue(mockUpdatedPost);

      const result = await service.update(postId, userId, updatePostDto);

      expect(result).toEqual(mockUpdatedPost);
      expect(mockPrismaService.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: {
          content: updatePostDto.content,
          categoryId: updatePostDto.categoryId,
        },
        include: expect.any(Object),
      });
    });

    it('게시물이 존재하지 않을 때 NotFoundException을 던져야 한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.update(postId, userId, updatePostDto)).rejects.toThrow(
        new NotFoundException('게시물을 찾을 수 없습니다.'),
      );
    });

    it('작성자가 아닐 때 ForbiddenException을 던져야 한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({ userId: 999 });

      await expect(service.update(postId, userId, updatePostDto)).rejects.toThrow(
        new ForbiddenException('게시물을 수정할 권한이 없습니다.'),
      );
    });

    it('존재하지 않는 카테고리로 수정 시 NotFoundException을 던져야 한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({ userId });
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.update(postId, userId, updatePostDto)).rejects.toThrow(
        new NotFoundException('존재하지 않는 카테고리입니다.'),
      );
    });
  });

  describe('remove', () => {
    const postId = 1;
    const userId = 1;

    it('게시물 삭제에 성공해야 한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({ userId });
      mockPrismaService.post.delete.mockResolvedValue({});

      const result = await service.remove(postId, userId);

      expect(result).toEqual({
        message: '게시물이 성공적으로 삭제되었습니다.',
      });
      expect(mockPrismaService.post.delete).toHaveBeenCalledWith({
        where: { id: postId },
      });
    });

    it('게시물이 존재하지 않을 때 NotFoundException을 던져야 한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.remove(postId, userId)).rejects.toThrow(
        new NotFoundException('게시물을 찾을 수 없습니다.'),
      );
    });

    it('작성자가 아닐 때 ForbiddenException을 던져야 한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({ userId: 999 });

      await expect(service.remove(postId, userId)).rejects.toThrow(
        new ForbiddenException('게시물을 삭제할 권한이 없습니다.'),
      );
    });
  });
});