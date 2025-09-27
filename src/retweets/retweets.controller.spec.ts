import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RetweetsController } from './retweets.controller';
import { RetweetsService } from './retweets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('RetweetsController', () => {
  let controller: RetweetsController;
  let retweetsService: RetweetsService;

  const mockRetweetsService = {
    toggleRetweet: jest.fn(),
    getRetweetStatus: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RetweetsController],
      providers: [
        {
          provide: RetweetsService,
          useValue: mockRetweetsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<RetweetsController>(RetweetsController);
    retweetsService = module.get<RetweetsService>(RetweetsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toggleRetweet', () => {
    const postId = 1;
    const userId = 1;
    const mockRequest = {
      user: { id: userId },
    };

    it('리트윗 등록에 성공해야 한다', async () => {
      const expectedResult = {
        message: '리트윗이 등록되었습니다.',
        isRetweeted: true,
      };

      mockRetweetsService.toggleRetweet.mockResolvedValue(expectedResult);

      const result = await controller.toggleRetweet(postId, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockRetweetsService.toggleRetweet).toHaveBeenCalledWith(postId, userId);
      expect(mockRetweetsService.toggleRetweet).toHaveBeenCalledTimes(1);
    });

    it('리트윗 취소에 성공해야 한다', async () => {
      const expectedResult = {
        message: '리트윗이 취소되었습니다.',
        isRetweeted: false,
      };

      mockRetweetsService.toggleRetweet.mockResolvedValue(expectedResult);

      const result = await controller.toggleRetweet(postId, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockRetweetsService.toggleRetweet).toHaveBeenCalledWith(postId, userId);
      expect(mockRetweetsService.toggleRetweet).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 게시물에 대해 NotFoundException을 던져야 한다', async () => {
      const notFoundError = new NotFoundException('게시물을 찾을 수 없습니다.');
      mockRetweetsService.toggleRetweet.mockRejectedValue(notFoundError);

      await expect(controller.toggleRetweet(postId, mockRequest)).rejects.toThrow(
        notFoundError,
      );

      expect(mockRetweetsService.toggleRetweet).toHaveBeenCalledWith(postId, userId);
      expect(mockRetweetsService.toggleRetweet).toHaveBeenCalledTimes(1);
    });

    it('postId가 숫자가 아닐 때 적절히 처리되어야 한다', async () => {
      // ParseIntPipe에 의해 처리되므로 컨트롤러 레벨에서는 이미 숫자로 변환됨
      const invalidPostId = NaN;

      await expect(
        controller.toggleRetweet(invalidPostId, mockRequest),
      ).rejects.toThrow();
    });

    it('req.user가 없을 때 적절히 처리되어야 한다', async () => {
      const mockRequestWithoutUser = {
        user: undefined,
      };

      await expect(
        controller.toggleRetweet(postId, mockRequestWithoutUser as any),
      ).rejects.toThrow();
    });
  });

  describe('getRetweetStatus', () => {
    const postId = 1;
    const userId = 1;
    const mockRequest = {
      user: { id: userId },
    };

    it('리트윗 상태 조회에 성공해야 한다 (리트윗 O)', async () => {
      const expectedResult = { isRetweeted: true };
      mockRetweetsService.getRetweetStatus.mockResolvedValue(expectedResult);

      const result = await controller.getRetweetStatus(postId, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockRetweetsService.getRetweetStatus).toHaveBeenCalledWith(postId, userId);
      expect(mockRetweetsService.getRetweetStatus).toHaveBeenCalledTimes(1);
    });

    it('리트윗 상태 조회에 성공해야 한다 (리트윗 X)', async () => {
      const expectedResult = { isRetweeted: false };
      mockRetweetsService.getRetweetStatus.mockResolvedValue(expectedResult);

      const result = await controller.getRetweetStatus(postId, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockRetweetsService.getRetweetStatus).toHaveBeenCalledWith(postId, userId);
      expect(mockRetweetsService.getRetweetStatus).toHaveBeenCalledTimes(1);
    });

    it('서비스에서 에러가 발생하면 에러를 전파해야 한다', async () => {
      const serviceError = new Error('서비스 에러');
      mockRetweetsService.getRetweetStatus.mockRejectedValue(serviceError);

      await expect(
        controller.getRetweetStatus(postId, mockRequest),
      ).rejects.toThrow(serviceError);

      expect(mockRetweetsService.getRetweetStatus).toHaveBeenCalledWith(postId, userId);
      expect(mockRetweetsService.getRetweetStatus).toHaveBeenCalledTimes(1);
    });

    it('postId 파라미터가 올바르게 전달되어야 한다', async () => {
      const differentPostId = 999;
      const expectedResult = { isRetweeted: false };

      mockRetweetsService.getRetweetStatus.mockResolvedValue(expectedResult);

      await controller.getRetweetStatus(differentPostId, mockRequest);

      expect(mockRetweetsService.getRetweetStatus).toHaveBeenCalledWith(
        differentPostId,
        userId,
      );
    });
  });

  describe('Authentication Guard', () => {
    it('JwtAuthGuard가 적용되어야 한다', () => {
      const guards = Reflect.getMetadata('__guards__', RetweetsController.prototype.toggleRetweet);
      expect(guards).toBeDefined();
    });

    it('getRetweetStatus 메서드에도 JwtAuthGuard가 적용되어야 한다', () => {
      const guards = Reflect.getMetadata('__guards__', RetweetsController.prototype.getRetweetStatus);
      expect(guards).toBeDefined();
    });
  });
});