import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentResponseDto } from './dto/comment-response.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(postId: number, userId: number, createCommentDto: CreateCommentDto): Promise<CommentResponseDto> {
    const { content } = createCommentDto;

    // 게시물 존재 확인
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    // 트랜잭션으로 댓글 생성 및 카운트 증가
    const comment = await this.prisma.$transaction(async (tx) => {
      // 댓글 생성
      const newComment = await tx.comment.create({
        data: {
          postId,
          userId,
          content,
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

      // 게시물 댓글 수 증가
      await tx.post.update({
        where: { id: postId },
        data: {
          commentsCount: {
            increment: 1,
          },
        },
      });

      return newComment;
    });

    return comment as CommentResponseDto;
  }

  async findByPost(postId: number, page: number = 1, limit: number = 20): Promise<{
    comments: CommentResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { postId },
        skip,
        take: limit,
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
      }),
      this.prisma.comment.count({ where: { postId } }),
    ]);

    return {
      comments: comments as CommentResponseDto[],
      total,
      page,
      limit,
    };
  }

  async update(id: number, userId: number, updateCommentDto: UpdateCommentDto): Promise<CommentResponseDto> {
    const { content } = updateCommentDto;

    // 댓글 존재 및 권한 확인
    const existingComment = await this.prisma.comment.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingComment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (existingComment.userId !== userId) {
      throw new ForbiddenException('댓글을 수정할 권한이 없습니다.');
    }

    // 댓글 수정
    const updatedComment = await this.prisma.comment.update({
      where: { id },
      data: { content },
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

    return updatedComment as CommentResponseDto;
  }

  async remove(id: number, userId: number): Promise<{ message: string }> {
    // 댓글 존재 및 권한 확인
    const existingComment = await this.prisma.comment.findUnique({
      where: { id },
      select: { userId: true, postId: true },
    });

    if (!existingComment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (existingComment.userId !== userId) {
      throw new ForbiddenException('댓글을 삭제할 권한이 없습니다.');
    }

    // 트랜잭션으로 댓글 삭제 및 카운트 감소
    await this.prisma.$transaction(async (tx) => {
      // 댓글 삭제
      await tx.comment.delete({
        where: { id },
      });

      // 게시물 댓글 수 감소
      await tx.post.update({
        where: { id: existingComment.postId },
        data: {
          commentsCount: {
            decrement: 1,
          },
        },
      });
    });

    return { message: '댓글이 성공적으로 삭제되었습니다.' };
  }
}