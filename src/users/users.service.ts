import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
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

  async findById(id: string) {
    // 빈 값 체크
    if (!id || id.trim() === '') {
      throw new BadRequestException('사용자 ID를 입력해주세요');
    }

    // 숫자 형식 체크
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      throw new BadRequestException('유효하지 않은 사용자 ID입니다');
    }

    // 사용자 조회
    const user = await this.prisma.user.findUnique({
      where: { id: numericId },
      select: {
        id: true,
        loginId: true,
        name: true,
        nickname: true,
        profileImageUrl: true,
        createdAt: true,
      },
    });

    // 존재하지 않는 사용자 처리
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return user;
  }
}