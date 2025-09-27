import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import type { Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto, req: Request) {
    const { loginId, password, deviceId } = loginDto;

    // 사용자 조회
    const user = await this.prisma.user.findUnique({
      where: { loginId },
    });

    if (!user) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다');
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다');
    }

    // JWT 페이로드
    const payload: JwtPayload = {
      sub: user.id,
      loginId: user.loginId,
    };

    // 토큰 생성
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '30m',
    });

    const refreshToken = this.generateRefreshToken();

    // 리프레시 토큰 저장
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후 만료

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        deviceId: deviceId || null,
        userAgent: req.headers['user-agent'] || null,
        ipAddress: this.getClientIp(req),
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        loginId: user.loginId,
        name: user.name,
        nickname: user.nickname,
        profileImageUrl: user.profileImageUrl || 'https://picsum.photos/40/40?random=1',
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string, req: Request) {
    // 리프레시 토큰 조회
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다');
    }

    // 만료 확인
    if (tokenRecord.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
      throw new UnauthorizedException('만료된 리프레시 토큰입니다');
    }

    // 새 액세스 토큰 생성
    const payload: JwtPayload = {
      sub: tokenRecord.user.id,
      loginId: tokenRecord.user.loginId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '30m',
    });

    // 새 리프레시 토큰 생성 (토큰 로테이션)
    const newRefreshToken = this.generateRefreshToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    // 기존 토큰 업데이트
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: {
        token: newRefreshToken,
        expiresAt: newExpiresAt,
        lastUsedAt: new Date(),
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    // RefreshToken 검증
    if (!refreshToken || refreshToken.trim() === '') {
      throw new BadRequestException('리프레시 토큰이 필요합니다');
    }

    // DB에서 RefreshToken 존재 확인
    const existingToken = await this.prisma.refreshToken.findFirst({
      where: { token: refreshToken },
    });

    if (!existingToken) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다');
    }

    // 토큰 만료 확인
    if (existingToken.expiresAt < new Date()) {
      // 만료된 토큰 삭제
      await this.prisma.refreshToken.delete({
        where: { id: existingToken.id },
      });
      throw new UnauthorizedException('만료된 리프레시 토큰입니다');
    }

    // 유효한 리프레시 토큰 삭제 (로그아웃)
    await this.prisma.refreshToken.delete({
      where: { id: existingToken.id },
    });

    return { message: '로그아웃되었습니다' };
  }

  private generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1'
    );
  }
}