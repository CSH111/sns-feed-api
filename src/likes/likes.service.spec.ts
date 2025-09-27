import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LikesService } from './likes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LikesService', () => {
  let service: LikesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    post: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    like: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LikesService>(LikesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toggleLike', () => {
    const postId = 1;
    const userId = 1;
    const existingLike = { id: 1, userId, postId, createdAt: new Date() };

    it('게시물이 존재하지 않을 때 NotFoundException을 던져야 한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.toggleLike(postId, userId)).rejects.toThrow(
        new NotFoundException('게시물을 찾을 수 없습니다.'),
      );

      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: postId },
        select: { id: true },
      });
    });

    it('좋아요가 없을 때 좋아요를 등록해야 한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({ id: postId });
      mockPrismaService.like.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          like: {
            create: mockPrismaService.like.create,
          },
          post: {
            update: mockPrismaService.post.update,
          },
        });
      });

      const result = await service.toggleLike(postId, userId);

      expect(result).toEqual({
        message: '좋아요가 등록되었습니다.',
        isLiked: true,
      });

      expect(mockPrismaService.like.findUnique).toHaveBeenCalledWith({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('좋아요가 있을 때 좋아요를 취소해야 한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({ id: postId });
      mockPrismaService.like.findUnique.mockResolvedValue(existingLike);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          like: {
            delete: mockPrismaService.like.delete,
          },
          post: {
            update: mockPrismaService.post.update,
          },
        });
      });

      const result = await service.toggleLike(postId, userId);

      expect(result).toEqual({
        message: '좋아요가 취소되었습니다.',
        isLiked: false,
      });

      expect(mockPrismaService.like.findUnique).toHaveBeenCalledWith({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('좋아요 등록 시 트랜잭션에서 like 생성과 post 카운트 증가를 수행해야 한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({ id: postId });
      mockPrismaService.like.findUnique.mockResolvedValue(null);

      const mockTx = {
        like: {
          create: jest.fn(),
        },
        post: {
          update: jest.fn(),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await service.toggleLike(postId, userId);

      expect(mockTx.like.create).toHaveBeenCalledWith({
        data: {
          userId,
          postId,
        },
      });

      expect(mockTx.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      });
    });

    it('좋아요 취소 시 트랜잭션에서 like 삭제와 post 카운트 감소를 수행해야 한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({ id: postId });
      mockPrismaService.like.findUnique.mockResolvedValue(existingLike);

      const mockTx = {
        like: {
          delete: jest.fn(),
        },
        post: {
          update: jest.fn(),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await service.toggleLike(postId, userId);

      expect(mockTx.like.delete).toHaveBeenCalledWith({
        where: { id: existingLike.id },
      });

      expect(mockTx.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
      });
    });
  });

  describe('getLikeStatus', () => {
    const postId = 1;
    const userId = 1;

    it('좋아요가 있을 때 isLiked: true를 반환해야 한다', async () => {
      const existingLike = { id: 1, userId, postId, createdAt: new Date() };
      mockPrismaService.like.findUnique.mockResolvedValue(existingLike);

      const result = await service.getLikeStatus(postId, userId);

      expect(result).toEqual({ isLiked: true });
      expect(mockPrismaService.like.findUnique).toHaveBeenCalledWith({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
    });

    it('좋아요가 없을 때 isLiked: false를 반환해야 한다', async () => {
      mockPrismaService.like.findUnique.mockResolvedValue(null);

      const result = await service.getLikeStatus(postId, userId);

      expect(result).toEqual({ isLiked: false });
      expect(mockPrismaService.like.findUnique).toHaveBeenCalledWith({
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