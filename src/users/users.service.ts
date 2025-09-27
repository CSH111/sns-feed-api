import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { loginId, nickname, password, ...rest } = createUserDto;

    // 중복 체크
    await this.checkDuplicates(loginId, nickname);

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = await this.prisma.user.create({
      data: {
        loginId,
        nickname,
        password: hashedPassword,
        ...rest,
      },
      select: {
        id: true,
        loginId: true,
        name: true,
        nickname: true,
        profileImageUrl: true,
        createdAt: true,
      },
    });

    return user;
  }

  private async checkDuplicates(loginId: string, nickname: string) {
    // loginId 중복 체크
    const existingUserByLoginId = await this.prisma.user.findUnique({
      where: { loginId },
    });

    if (existingUserByLoginId) {
      throw new ConflictException('이미 사용 중인 ID입니다');
    }

    // nickname 중복 체크
    const existingUserByNickname = await this.prisma.user.findUnique({
      where: { nickname },
    });

    if (existingUserByNickname) {
      throw new ConflictException('이미 사용 중인 닉네임입니다');
    }
  }

  async findByLoginId(loginId: string) {
    return this.prisma.user.findUnique({
      where: { loginId },
      select: {
        id: true,
        loginId: true,
        name: true,
        nickname: true,
        profileImageUrl: true,
        createdAt: true,
      },
    });
  }
}