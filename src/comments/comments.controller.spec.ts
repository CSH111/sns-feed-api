import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

describe('CommentsController', () => {
  let controller: CommentsController;
  let commentsService: CommentsService;

  const mockCommentsService = {
    create: jest.fn(),
    findByPost: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CommentsService,
          useValue: mockCommentsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<CommentsController>(CommentsController);
    commentsService = module.get<CommentsService>(CommentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const postId = 1;
    const userId = 1;
    const createCommentDto: CreateCommentDto = {
      content: '테스트 댓글입니다.',
    };
    const mockRequest = {
      user: { id: userId },
    };

    it('댓글 작성에 성공해야 한다', async () => {
      const expectedResult = {
        id: 1,
        content: createCommentDto.content,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: userId,
          nickname: 'testuser',
          profileImageUrl: null,
        },
      };

      mockCommentsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(postId, mockRequest, createCommentDto);

      expect(result).toEqual(expectedResult);
      expect(mockCommentsService.create).toHaveBeenCalledWith(
        postId,
        userId,
        createCommentDto,
      );
      expect(mockCommentsService.create).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 게시물에 대해 NotFoundException을 던져야 한다', async () => {
      const notFoundError = new NotFoundException('게시물을 찾을 수 없습니다.');
      mockCommentsService.create.mockRejectedValue(notFoundError);

      await expect(
        controller.create(postId, mockRequest, createCommentDto),
      ).rejects.toThrow(notFoundError);

      expect(mockCommentsService.create).toHaveBeenCalledWith(
        postId,
        userId,
        createCommentDto,
      );
    });

    it('잘못된 요청 데이터에 대해 적절히 처리되어야 한다', async () => {
      const invalidDto = { content: '' } as CreateCommentDto;
      const notFoundError = new NotFoundException('게시물을 찾을 수 없습니다');
      mockCommentsService.create.mockRejectedValue(notFoundError);

      await expect(
        controller.create(postId, mockRequest, invalidDto),
      ).rejects.toThrow(notFoundError);
    });
  });

  describe('findByPost', () => {
    const postId = 1;

    it('댓글 목록 조회에 성공해야 한다', async () => {
      const expectedResult = {
        comments: [
          {
            id: 1,
            content: '첫 번째 댓글',
            user: { id: 1, nickname: 'user1' },
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      };

      mockCommentsService.findByPost.mockResolvedValue(expectedResult);

      const result = await controller.findByPost(postId, 1, 20);

      expect(result).toEqual(expectedResult);
      expect(mockCommentsService.findByPost).toHaveBeenCalledWith(postId, 1, 20);
      expect(mockCommentsService.findByPost).toHaveBeenCalledTimes(1);
    });

    it('페이지네이션 파라미터가 올바르게 전달되어야 한다', async () => {
      const expectedResult = {
        comments: [],
        total: 0,
        page: 2,
        limit: 10,
      };

      mockCommentsService.findByPost.mockResolvedValue(expectedResult);

      await controller.findByPost(postId, 2, 10);

      expect(mockCommentsService.findByPost).toHaveBeenCalledWith(postId, 2, 10);
    });

    it('기본 페이지네이션 값이 적용되어야 한다', async () => {
      const expectedResult = {
        comments: [],
        total: 0,
        page: 1,
        limit: 20,
      };

      mockCommentsService.findByPost.mockResolvedValue(expectedResult);

      // 기본값 테스트 (DefaultValuePipe에 의해 처리됨)
      await controller.findByPost(postId, 1, 20);

      expect(mockCommentsService.findByPost).toHaveBeenCalledWith(postId, 1, 20);
    });
  });

  describe('update', () => {
    const commentId = 1;
    const userId = 1;
    const updateCommentDto: UpdateCommentDto = {
      content: '수정된 댓글입니다.',
    };
    const mockRequest = {
      user: { id: userId },
    };

    it('댓글 수정에 성공해야 한다', async () => {
      const expectedResult = {
        id: commentId,
        content: updateCommentDto.content,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: userId,
          nickname: 'testuser',
          profileImageUrl: null,
        },
      };

      mockCommentsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(commentId, mockRequest, updateCommentDto);

      expect(result).toEqual(expectedResult);
      expect(mockCommentsService.update).toHaveBeenCalledWith(
        commentId,
        userId,
        updateCommentDto,
      );
      expect(mockCommentsService.update).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 댓글에 대해 NotFoundException을 던져야 한다', async () => {
      const notFoundError = new NotFoundException('댓글을 찾을 수 없습니다.');
      mockCommentsService.update.mockRejectedValue(notFoundError);

      await expect(
        controller.update(commentId, mockRequest, updateCommentDto),
      ).rejects.toThrow(notFoundError);

      expect(mockCommentsService.update).toHaveBeenCalledWith(
        commentId,
        userId,
        updateCommentDto,
      );
    });

    it('권한이 없을 때 ForbiddenException을 던져야 한다', async () => {
      const forbiddenError = new ForbiddenException('댓글을 수정할 권한이 없습니다.');
      mockCommentsService.update.mockRejectedValue(forbiddenError);

      await expect(
        controller.update(commentId, mockRequest, updateCommentDto),
      ).rejects.toThrow(forbiddenError);

      expect(mockCommentsService.update).toHaveBeenCalledWith(
        commentId,
        userId,
        updateCommentDto,
      );
    });
  });

  describe('remove', () => {
    const commentId = 1;
    const userId = 1;
    const mockRequest = {
      user: { id: userId },
    };

    it('댓글 삭제에 성공해야 한다', async () => {
      const expectedResult = {
        message: '댓글이 성공적으로 삭제되었습니다.',
      };

      mockCommentsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(commentId, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockCommentsService.remove).toHaveBeenCalledWith(commentId, userId);
      expect(mockCommentsService.remove).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 댓글에 대해 NotFoundException을 던져야 한다', async () => {
      const notFoundError = new NotFoundException('댓글을 찾을 수 없습니다.');
      mockCommentsService.remove.mockRejectedValue(notFoundError);

      await expect(controller.remove(commentId, mockRequest)).rejects.toThrow(
        notFoundError,
      );

      expect(mockCommentsService.remove).toHaveBeenCalledWith(commentId, userId);
    });

    it('권한이 없을 때 ForbiddenException을 던져야 한다', async () => {
      const forbiddenError = new ForbiddenException('댓글을 삭제할 권한이 없습니다.');
      mockCommentsService.remove.mockRejectedValue(forbiddenError);

      await expect(controller.remove(commentId, mockRequest)).rejects.toThrow(
        forbiddenError,
      );

      expect(mockCommentsService.remove).toHaveBeenCalledWith(commentId, userId);
    });
  });

  describe('Authentication Guard', () => {
    it('create 메서드에 JwtAuthGuard가 적용되어야 한다', () => {
      const guards = Reflect.getMetadata('__guards__', CommentsController.prototype.create);
      expect(guards).toBeDefined();
    });

    it('update 메서드에 JwtAuthGuard가 적용되어야 한다', () => {
      const guards = Reflect.getMetadata('__guards__', CommentsController.prototype.update);
      expect(guards).toBeDefined();
    });

    it('remove 메서드에 JwtAuthGuard가 적용되어야 한다', () => {
      const guards = Reflect.getMetadata('__guards__', CommentsController.prototype.remove);
      expect(guards).toBeDefined();
    });

    it('findByPost 메서드에는 JwtAuthGuard가 적용되지 않아야 한다', () => {
      const guards = Reflect.getMetadata('__guards__', CommentsController.prototype.findByPost);
      expect(guards).toBeUndefined();
    });
  });
});