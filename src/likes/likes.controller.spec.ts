import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('LikesController', () => {
  let controller: LikesController;
  let likesService: LikesService;

  const mockLikesService = {
    toggleLike: jest.fn(),
    getLikeStatus: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LikesController],
      providers: [
        {
          provide: LikesService,
          useValue: mockLikesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<LikesController>(LikesController);
    likesService = module.get<LikesService>(LikesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toggleLike', () => {
    const postId = 1;
    const userId = 1;
    const mockRequest = {
      user: { id: userId },
    };

    it('좋아요 등록에 성공해야 한다', async () => {
      const expectedResult = {
        message: '좋아요가 등록되었습니다.',
        isLiked: true,
      };

      mockLikesService.toggleLike.mockResolvedValue(expectedResult);

      const result = await controller.toggleLike(postId, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockLikesService.toggleLike).toHaveBeenCalledWith(postId, userId);
      expect(mockLikesService.toggleLike).toHaveBeenCalledTimes(1);
    });

    it('좋아요 취소에 성공해야 한다', async () => {
      const expectedResult = {
        message: '좋아요가 취소되었습니다.',
        isLiked: false,
      };

      mockLikesService.toggleLike.mockResolvedValue(expectedResult);

      const result = await controller.toggleLike(postId, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockLikesService.toggleLike).toHaveBeenCalledWith(postId, userId);
      expect(mockLikesService.toggleLike).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 게시물에 대해 NotFoundException을 던져야 한다', async () => {
      const notFoundError = new NotFoundException('게시물을 찾을 수 없습니다.');
      mockLikesService.toggleLike.mockRejectedValue(notFoundError);

      await expect(controller.toggleLike(postId, mockRequest)).rejects.toThrow(
        notFoundError,
      );

      expect(mockLikesService.toggleLike).toHaveBeenCalledWith(postId, userId);
      expect(mockLikesService.toggleLike).toHaveBeenCalledTimes(1);
    });

    it('postId가 숫자가 아닐 때 적절히 처리되어야 한다', async () => {
      // ParseIntPipe에 의해 처리되므로 컨트롤러 레벨에서는 이미 숫자로 변환됨
      const invalidPostId = NaN;

      await expect(
        controller.toggleLike(invalidPostId, mockRequest),
      ).rejects.toThrow();
    });

    it('req.user가 없을 때 적절히 처리되어야 한다', async () => {
      const mockRequestWithoutUser = {
        user: undefined,
      };

      await expect(
        controller.toggleLike(postId, mockRequestWithoutUser as any),
      ).rejects.toThrow();
    });
  });

  describe('getLikeStatus', () => {
    const postId = 1;
    const userId = 1;
    const mockRequest = {
      user: { id: userId },
    };

    it('좋아요 상태 조회에 성공해야 한다 (좋아요 O)', async () => {
      const expectedResult = { isLiked: true };
      mockLikesService.getLikeStatus.mockResolvedValue(expectedResult);

      const result = await controller.getLikeStatus(postId, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockLikesService.getLikeStatus).toHaveBeenCalledWith(postId, userId);
      expect(mockLikesService.getLikeStatus).toHaveBeenCalledTimes(1);
    });

    it('좋아요 상태 조회에 성공해야 한다 (좋아요 X)', async () => {
      const expectedResult = { isLiked: false };
      mockLikesService.getLikeStatus.mockResolvedValue(expectedResult);

      const result = await controller.getLikeStatus(postId, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockLikesService.getLikeStatus).toHaveBeenCalledWith(postId, userId);
      expect(mockLikesService.getLikeStatus).toHaveBeenCalledTimes(1);
    });

    it('서비스에서 에러가 발생하면 에러를 전파해야 한다', async () => {
      const serviceError = new Error('서비스 에러');
      mockLikesService.getLikeStatus.mockRejectedValue(serviceError);

      await expect(
        controller.getLikeStatus(postId, mockRequest),
      ).rejects.toThrow(serviceError);

      expect(mockLikesService.getLikeStatus).toHaveBeenCalledWith(postId, userId);
      expect(mockLikesService.getLikeStatus).toHaveBeenCalledTimes(1);
    });

    it('postId 파라미터가 올바르게 전달되어야 한다', async () => {
      const differentPostId = 999;
      const expectedResult = { isLiked: false };

      mockLikesService.getLikeStatus.mockResolvedValue(expectedResult);

      await controller.getLikeStatus(differentPostId, mockRequest);

      expect(mockLikesService.getLikeStatus).toHaveBeenCalledWith(
        differentPostId,
        userId,
      );
    });
  });

  describe('Authentication Guard', () => {
    it('JwtAuthGuard가 적용되어야 한다', () => {
      const guards = Reflect.getMetadata('__guards__', LikesController.prototype.toggleLike);
      expect(guards).toBeDefined();
    });

    it('getLikeStatus 메서드에도 JwtAuthGuard가 적용되어야 한다', () => {
      const guards = Reflect.getMetadata('__guards__', LikesController.prototype.getLikeStatus);
      expect(guards).toBeDefined();
    });
  });
});