import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RetweetsService } from './retweets.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RetweetsService', () => {
  let service: RetweetsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    post: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    retweet: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetweetsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RetweetsService>(RetweetsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toggleRetweet', () => {
    const postId = 1;
    const userId = 1;
    const existingRetweet = { id: 1, userId, postId, createdAt: new Date() };

    it('게시물이 존재하지 않을 때 NotFoundException을 던져야 한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.toggleRetweet(postId, userId)).rejects.toThrow(
        new NotFoundException('게시물을 찾을 수 없습니다.'),
      );

      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: postId },
        select: { id: true },
      });
    });

    it('리트윗이 없을 때 리트윗을 등록해야 한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({ id: postId });
      mockPrismaService.retweet.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          retweet: {
            create: mockPrismaService.retweet.create,
          },
          post: {
            update: mockPrismaService.post.update,
          },
        });
      });

      const result = await service.toggleRetweet(postId, userId);

      expect(result).toEqual({
        message: '리트윗이 등록되었습니다.',
        isRetweeted: true,
      });

      expect(mockPrismaService.retweet.findUnique).toHaveBeenCalledWith({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('리트윗이 있을 때 리트윗을 취소해야 한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({ id: postId });
      mockPrismaService.retweet.findUnique.mockResolvedValue(existingRetweet);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          retweet: {
            delete: mockPrismaService.retweet.delete,
          },
          post: {
            update: mockPrismaService.post.update,
          },
        });
      });

      const result = await service.toggleRetweet(postId, userId);

      expect(result).toEqual({
        message: '리트윗이 취소되었습니다.',
        isRetweeted: false,
      });

      expect(mockPrismaService.retweet.findUnique).toHaveBeenCalledWith({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('리트윗 등록 시 트랜잭션에서 retweet 생성과 post 카운트 증가를 수행해야 한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({ id: postId });
      mockPrismaService.retweet.findUnique.mockResolvedValue(null);

      const mockTx = {
        retweet: {
          create: jest.fn(),
        },
        post: {
          update: jest.fn(),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await service.toggleRetweet(postId, userId);

      expect(mockTx.retweet.create).toHaveBeenCalledWith({
        data: {
          userId,
          postId,
        },
      });

      expect(mockTx.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: {
          retweetsCount: {
            increment: 1,
          },
        },
      });
    });

    it('리트윗 취소 시 트랜잭션에서 retweet 삭제와 post 카운트 감소를 수행해야 한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({ id: postId });
      mockPrismaService.retweet.findUnique.mockResolvedValue(existingRetweet);

      const mockTx = {
        retweet: {
          delete: jest.fn(),
        },
        post: {
          update: jest.fn(),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await service.toggleRetweet(postId, userId);

      expect(mockTx.retweet.delete).toHaveBeenCalledWith({
        where: { id: existingRetweet.id },
      });

      expect(mockTx.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: {
          retweetsCount: {
            decrement: 1,
          },
        },
      });
    });
  });

  describe('getRetweetStatus', () => {
    const postId = 1;
    const userId = 1;

    it('리트윗이 있을 때 isRetweeted: true를 반환해야 한다', async () => {
      const existingRetweet = { id: 1, userId, postId, createdAt: new Date() };
      mockPrismaService.retweet.findUnique.mockResolvedValue(existingRetweet);

      const result = await service.getRetweetStatus(postId, userId);

      expect(result).toEqual({ isRetweeted: true });
      expect(mockPrismaService.retweet.findUnique).toHaveBeenCalledWith({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
    });

    it('리트윗이 없을 때 isRetweeted: false를 반환해야 한다', async () => {
      mockPrismaService.retweet.findUnique.mockResolvedValue(null);

      const result = await service.getRetweetStatus(postId, userId);

      expect(result).toEqual({ isRetweeted: false });
      expect(mockPrismaService.retweet.findUnique).toHaveBeenCalledWith({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
    });
  });
});