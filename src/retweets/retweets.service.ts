import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RetweetsService {
  constructor(private prisma: PrismaService) {}

  async toggleRetweet(postId: number, userId: number): Promise<{ message: string; isRetweeted: boolean }> {
    // 게시물 존재 확인
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    // 기존 리트윗 확인
    const existingRetweet = await this.prisma.retweet.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingRetweet) {
      // 리트윗 취소
      await this.prisma.$transaction(async (tx) => {
        // 리트윗 삭제
        await tx.retweet.delete({
          where: { id: existingRetweet.id },
        });

        // 게시물 리트윗 수 감소
        await tx.post.update({
          where: { id: postId },
          data: {
            retweetsCount: {
              decrement: 1,
            },
          },
        });
      });

      return { message: '리트윗이 취소되었습니다.', isRetweeted: false };
    } else {
      // 리트윗 등록
      await this.prisma.$transaction(async (tx) => {
        // 리트윗 생성
        await tx.retweet.create({
          data: {
            userId,
            postId,
          },
        });

        // 게시물 리트윗 수 증가
        await tx.post.update({
          where: { id: postId },
          data: {
            retweetsCount: {
              increment: 1,
            },
          },
        });
      });

      return { message: '리트윗이 등록되었습니다.', isRetweeted: true };
    }
  }

  async getRetweetStatus(postId: number, userId: number): Promise<{ isRetweeted: boolean }> {
    const retweet = await this.prisma.retweet.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    return { isRetweeted: !!retweet };
  }
}