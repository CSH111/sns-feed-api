import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

describe('CommentsService', () => {
  let service: CommentsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    post: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    comment: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    prismaService = module.get<PrismaService>(PrismaService);
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

    it('댓글 생성에 성공해야 한다', async () => {
      const mockComment = {
        id: 1,
        postId,
        userId,
        content: createCommentDto.content,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: userId,
          nickname: 'testuser',
          profileImageUrl: null,
        },
      };

      mockPrismaService.post.findUnique.mockResolvedValue({ id: postId });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          comment: {
            create: mockPrismaService.comment.create.mockResolvedValue(mockComment),
          },
          post: {
            update: mockPrismaService.post.update,
          },
        });
      });

      const result = await service.create(postId, userId, createCommentDto);

      expect(result).toEqual(mockComment);
      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: postId },
        select: { id: true },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('게시물이 존재하지 않을 때 NotFoundException을 던져야 한다', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.create(postId, userId, createCommentDto)).rejects.toThrow(
        new NotFoundException('게시물을 찾을 수 없습니다.'),
      );
    });

    it('댓글 생성 시 게시물 댓글 수가 증가해야 한다', async () => {
      const mockComment = {
        id: 1,
        postId,
        userId,
        content: createCommentDto.content,
        user: { id: userId, nickname: 'testuser', profileImageUrl: null },
      };

      mockPrismaService.post.findUnique.mockResolvedValue({ id: postId });

      const mockTx = {
        comment: {
          create: jest.fn().mockResolvedValue(mockComment),
        },
        post: {
          update: jest.fn(),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await service.create(postId, userId, createCommentDto);

      expect(mockTx.comment.create).toHaveBeenCalledWith({
        data: {
          postId,
          userId,
          content: createCommentDto.content,
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              profileImageUrl: true,
            },
          },
        },
      });

      expect(mockTx.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: {
          commentsCount: {
            increment: 1,
          },
        },
      });
    });
  });

  describe('findByPost', () => {
    const postId = 1;
    const mockComments = [
      {
        id: 1,
        content: '첫 번째 댓글',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 1, nickname: 'user1', profileImageUrl: null },
      },
      {
        id: 2,
        content: '두 번째 댓글',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 2, nickname: 'user2', profileImageUrl: null },
      },
    ];

    it('댓글 목록 조회에 성공해야 한다', async () => {
      mockPrismaService.comment.findMany.mockResolvedValue(mockComments);
      mockPrismaService.comment.count.mockResolvedValue(2);

      const result = await service.findByPost(postId, 1, 20);

      expect(result).toEqual({
        comments: mockComments,
        total: 2,
        page: 1,
        limit: 20,
      });

      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith({
        where: { postId },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              profileImageUrl: true,
            },
          },
        },
      });
    });

    it('페이지네이션이 올바르게 적용되어야 한다', async () => {
      mockPrismaService.comment.findMany.mockResolvedValue([]);
      mockPrismaService.comment.count.mockResolvedValue(0);

      await service.findByPost(postId, 2, 10);

      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith({
        where: { postId },
        skip: 10, // (2-1) * 10
        take: 10,
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              profileImageUrl: true,
            },
          },
        },
      });
    });
  });

  describe('update', () => {
    const commentId = 1;
    const userId = 1;
    const updateCommentDto: UpdateCommentDto = {
      content: '수정된 댓글입니다.',
    };

    it('댓글 수정에 성공해야 한다', async () => {
      const mockUpdatedComment = {
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

      mockPrismaService.comment.findUnique.mockResolvedValue({ userId });
      mockPrismaService.comment.update.mockResolvedValue(mockUpdatedComment);

      const result = await service.update(commentId, userId, updateCommentDto);

      expect(result).toEqual(mockUpdatedComment);
      expect(mockPrismaService.comment.update).toHaveBeenCalledWith({
        where: { id: commentId },
        data: { content: updateCommentDto.content },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              profileImageUrl: true,
            },
          },
        },
      });
    });

    it('댓글이 존재하지 않을 때 NotFoundException을 던져야 한다', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      await expect(service.update(commentId, userId, updateCommentDto)).rejects.toThrow(
        new NotFoundException('댓글을 찾을 수 없습니다.'),
      );
    });

    it('작성자가 아닐 때 ForbiddenException을 던져야 한다', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({ userId: 999 });

      await expect(service.update(commentId, userId, updateCommentDto)).rejects.toThrow(
        new ForbiddenException('댓글을 수정할 권한이 없습니다.'),
      );
    });
  });

  describe('remove', () => {
    const commentId = 1;
    const userId = 1;
    const postId = 1;

    it('댓글 삭제에 성공해야 한다', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({ userId, postId });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          comment: {
            delete: mockPrismaService.comment.delete,
          },
          post: {
            update: mockPrismaService.post.update,
          },
        });
      });

      const result = await service.remove(commentId, userId);

      expect(result).toEqual({
        message: '댓글이 성공적으로 삭제되었습니다.',
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('댓글이 존재하지 않을 때 NotFoundException을 던져야 한다', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      await expect(service.remove(commentId, userId)).rejects.toThrow(
        new NotFoundException('댓글을 찾을 수 없습니다.'),
      );
    });

    it('작성자가 아닐 때 ForbiddenException을 던져야 한다', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({ userId: 999, postId });

      await expect(service.remove(commentId, userId)).rejects.toThrow(
        new ForbiddenException('댓글을 삭제할 권한이 없습니다.'),
      );
    });

    it('댓글 삭제 시 게시물 댓글 수가 감소해야 한다', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue({ userId, postId });

      const mockTx = {
        comment: {
          delete: jest.fn(),
        },
        post: {
          update: jest.fn(),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await service.remove(commentId, userId);

      expect(mockTx.comment.delete).toHaveBeenCalledWith({
        where: { id: commentId },
      });

      expect(mockTx.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: {
          commentsCount: {
            decrement: 1,
          },
        },
      });
    });
  });
});