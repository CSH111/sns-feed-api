import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';

describe('PostsController', () => {
  let controller: PostsController;
  let postsService: PostsService;

  const mockPostsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: mockPostsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<PostsController>(PostsController);
    postsService = module.get<PostsService>(PostsService);
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
    const mockRequest = {
      user: { id: userId },
    };

    it('게시물 생성에 성공해야 한다', async () => {
      const expectedResult = {
        id: 1,
        content: createPostDto.content,
        categoryId: createPostDto.categoryId,
        user: { id: userId, nickname: 'testuser' },
        category: { id: 1, name: '요리' },
        images: [{ id: 1, url: 'https://picsum.photos/500/300?random=1', order: 1 }],
      };

      mockPostsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(mockRequest, createPostDto);

      expect(result).toEqual(expectedResult);
      expect(mockPostsService.create).toHaveBeenCalledWith(userId, createPostDto);
      expect(mockPostsService.create).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 카테고리에 대해 NotFoundException을 던져야 한다', async () => {
      const notFoundError = new NotFoundException('존재하지 않는 카테고리입니다.');
      mockPostsService.create.mockRejectedValue(notFoundError);

      await expect(
        controller.create(mockRequest, createPostDto),
      ).rejects.toThrow(notFoundError);

      expect(mockPostsService.create).toHaveBeenCalledWith(userId, createPostDto);
    });

    it('req.user가 없을 때 적절히 처리되어야 한다', async () => {
      const mockRequestWithoutUser = {
        user: undefined,
      };

      await expect(
        controller.create(mockRequestWithoutUser as any, createPostDto),
      ).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    const getPostsDto: GetPostsDto = {
      limit: 10,
      sortBy: 'latest',
    };

    it('게시물 목록 조회에 성공해야 한다', async () => {
      const expectedResult = {
        posts: [
          {
            id: 1,
            content: '첫 번째 게시물',
            user: { id: 1, nickname: 'user1' },
            category: { id: 1, name: '요리' },
            images: [],
          },
        ],
        nextCursor: undefined,
        hasNextPage: false,
        count: 1,
      };

      mockPostsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(getPostsDto);

      expect(result).toEqual(expectedResult);
      expect(mockPostsService.findAll).toHaveBeenCalledWith(getPostsDto);
      expect(mockPostsService.findAll).toHaveBeenCalledTimes(1);
    });

    it('쿼리 파라미터가 올바르게 전달되어야 한다', async () => {
      const customDto = {
        cursor: 5,
        limit: 20,
        categoryId: 1,
        sortBy: 'oldest' as const,
      };

      const expectedResult = {
        posts: [],
        nextCursor: undefined,
        hasNextPage: false,
        count: 0,
      };

      mockPostsService.findAll.mockResolvedValue(expectedResult);

      await controller.findAll(customDto);

      expect(mockPostsService.findAll).toHaveBeenCalledWith(customDto);
    });

    it('빈 결과를 올바르게 반환해야 한다', async () => {
      const expectedResult = {
        posts: [],
        nextCursor: undefined,
        hasNextPage: false,
        count: 0,
      };

      mockPostsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(getPostsDto);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    const postId = 1;

    it('게시물 상세 조회에 성공해야 한다', async () => {
      const expectedResult = {
        id: postId,
        content: '테스트 게시물',
        user: { id: 1, nickname: 'testuser' },
        category: { id: 1, name: '요리' },
        images: [],
      };

      mockPostsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(postId);

      expect(result).toEqual(expectedResult);
      expect(mockPostsService.findOne).toHaveBeenCalledWith(postId);
      expect(mockPostsService.findOne).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 게시물에 대해 NotFoundException을 던져야 한다', async () => {
      const notFoundError = new NotFoundException('게시물을 찾을 수 없습니다.');
      mockPostsService.findOne.mockRejectedValue(notFoundError);

      await expect(controller.findOne(postId)).rejects.toThrow(notFoundError);

      expect(mockPostsService.findOne).toHaveBeenCalledWith(postId);
    });

    it('postId가 숫자가 아닐 때 적절히 처리되어야 한다', async () => {
      // ParseIntPipe에 의해 처리되므로 컨트롤러 레벨에서는 이미 숫자로 변환됨
      const invalidPostId = NaN;

      await expect(controller.findOne(invalidPostId)).rejects.toThrow();
    });
  });

  describe('update', () => {
    const postId = 1;
    const userId = 1;
    const updatePostDto: UpdatePostDto = {
      content: '수정된 게시물',
      categoryId: 2,
    };
    const mockRequest = {
      user: { id: userId },
    };

    it('게시물 수정에 성공해야 한다', async () => {
      const expectedResult = {
        id: postId,
        content: updatePostDto.content,
        categoryId: updatePostDto.categoryId,
        user: { id: userId, nickname: 'testuser' },
        category: { id: 2, name: '그림' },
        images: [],
      };

      mockPostsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(postId, mockRequest, updatePostDto);

      expect(result).toEqual(expectedResult);
      expect(mockPostsService.update).toHaveBeenCalledWith(postId, userId, updatePostDto);
      expect(mockPostsService.update).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 게시물에 대해 NotFoundException을 던져야 한다', async () => {
      const notFoundError = new NotFoundException('게시물을 찾을 수 없습니다.');
      mockPostsService.update.mockRejectedValue(notFoundError);

      await expect(
        controller.update(postId, mockRequest, updatePostDto),
      ).rejects.toThrow(notFoundError);

      expect(mockPostsService.update).toHaveBeenCalledWith(postId, userId, updatePostDto);
    });

    it('권한이 없을 때 ForbiddenException을 던져야 한다', async () => {
      const forbiddenError = new ForbiddenException('게시물을 수정할 권한이 없습니다.');
      mockPostsService.update.mockRejectedValue(forbiddenError);

      await expect(
        controller.update(postId, mockRequest, updatePostDto),
      ).rejects.toThrow(forbiddenError);

      expect(mockPostsService.update).toHaveBeenCalledWith(postId, userId, updatePostDto);
    });
  });

  describe('remove', () => {
    const postId = 1;
    const userId = 1;
    const mockRequest = {
      user: { id: userId },
    };

    it('게시물 삭제에 성공해야 한다', async () => {
      const expectedResult = {
        message: '게시물이 성공적으로 삭제되었습니다.',
      };

      mockPostsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(postId, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockPostsService.remove).toHaveBeenCalledWith(postId, userId);
      expect(mockPostsService.remove).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 게시물에 대해 NotFoundException을 던져야 한다', async () => {
      const notFoundError = new NotFoundException('게시물을 찾을 수 없습니다.');
      mockPostsService.remove.mockRejectedValue(notFoundError);

      await expect(controller.remove(postId, mockRequest)).rejects.toThrow(
        notFoundError,
      );

      expect(mockPostsService.remove).toHaveBeenCalledWith(postId, userId);
    });

    it('권한이 없을 때 ForbiddenException을 던져야 한다', async () => {
      const forbiddenError = new ForbiddenException('게시물을 삭제할 권한이 없습니다.');
      mockPostsService.remove.mockRejectedValue(forbiddenError);

      await expect(controller.remove(postId, mockRequest)).rejects.toThrow(
        forbiddenError,
      );

      expect(mockPostsService.remove).toHaveBeenCalledWith(postId, userId);
    });
  });

  describe('Authentication Guard', () => {
    it('create 메서드에 JwtAuthGuard가 적용되어야 한다', () => {
      const guards = Reflect.getMetadata('__guards__', PostsController.prototype.create);
      expect(guards).toBeDefined();
    });

    it('update 메서드에 JwtAuthGuard가 적용되어야 한다', () => {
      const guards = Reflect.getMetadata('__guards__', PostsController.prototype.update);
      expect(guards).toBeDefined();
    });

    it('remove 메서드에 JwtAuthGuard가 적용되어야 한다', () => {
      const guards = Reflect.getMetadata('__guards__', PostsController.prototype.remove);
      expect(guards).toBeDefined();
    });

    it('findAll 메서드에는 JwtAuthGuard가 적용되지 않아야 한다', () => {
      const guards = Reflect.getMetadata('__guards__', PostsController.prototype.findAll);
      expect(guards).toBeUndefined();
    });

    it('findOne 메서드에는 JwtAuthGuard가 적용되지 않아야 한다', () => {
      const guards = Reflect.getMetadata('__guards__', PostsController.prototype.findOne);
      expect(guards).toBeUndefined();
    });
  });
});