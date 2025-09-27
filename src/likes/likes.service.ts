import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LikesService {
  constructor(private prisma: PrismaService) {}

  async toggleLike(postId: number, userId: number): Promise<{ message: string; isLiked: boolean }> {
    // 게시물 존재 확인
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    // 기존 좋아요 확인
    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      // 좋아요 취소
      await this.prisma.$transaction(async (tx) => {
        // 좋아요 삭제
        await tx.like.delete({
          where: { id: existingLike.id },
        });

        // 게시물 좋아요 수 감소
        await tx.post.update({
          where: { id: postId },
          data: {
            likesCount: {
              decrement: 1,
            },
          },
        });
      });

      return { message: '좋아요가 취소되었습니다.', isLiked: false };
    } else {
      // 좋아요 등록
      await this.prisma.$transaction(async (tx) => {
        // 좋아요 생성
        await tx.like.create({
          data: {
            userId,
            postId,
          },
        });

        // 게시물 좋아요 수 증가
        await tx.post.update({
          where: { id: postId },
          data: {
            likesCount: {
              increment: 1,
            },
          },
        });
      });

      return { message: '좋아요가 등록되었습니다.', isLiked: true };
    }
  }

  async getLikeStatus(postId: number, userId: number): Promise<{ isLiked: boolean }> {
    const like = await this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    return { isLiked: !!like };
  }
}