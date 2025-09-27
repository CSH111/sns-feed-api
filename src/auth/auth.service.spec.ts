import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import type { Request } from 'express';

// Mock modules
jest.mock('bcrypt');
jest.mock('crypto');

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockRandomBytes = randomBytes as jest.MockedFunction<typeof randomBytes>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockRequest = {
    headers: {
      'user-agent': 'Mozilla/5.0',
    },
    connection: {
      remoteAddress: '127.0.0.1',
    },
    socket: {
      remoteAddress: '127.0.0.1',
    },
  } as any as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Default mock implementations
    mockConfigService.get.mockReturnValue('15m');
    mockJwtService.sign.mockReturnValue('mock-access-token');
    mockRandomBytes.mockReturnValue(Buffer.from('mock-refresh-token'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      loginId: 'testuser',
      password: 'password123!',
      deviceId: 'device-123',
    };

    const mockUser = {
      id: 1,
      loginId: 'testuser',
      name: '테스트유저',
      nickname: 'testnick',
      password: 'hashedPassword',
      profileImageUrl: 'https://example.com/profile.jpg',
    };

    it('로그인에 성공해야 한다', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.login(loginDto, mockRequest);

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          loginId: mockUser.loginId,
          name: mockUser.name,
          nickname: mockUser.nickname,
          profileImageUrl: mockUser.profileImageUrl,
        },
        accessToken: 'mock-access-token',
        refreshToken: '6d6f636b2d726566726573682d746f6b656e',
      });

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { loginId: loginDto.loginId },
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.id, loginId: mockUser.loginId },
        { expiresIn: '30m' },
      );
    });

    it('존재하지 않는 사용자로 로그인 시 UnauthorizedException을 던져야 한다', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto, mockRequest)).rejects.toThrow(
        new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다'),
      );

      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it('잘못된 비밀번호로 로그인 시 UnauthorizedException을 던져야 한다', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.login(loginDto, mockRequest)).rejects.toThrow(
        new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다'),
      );

      expect(mockBcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
    });

    it('프로필 이미지가 없을 때 기본 이미지를 제공해야 한다', async () => {
      const userWithoutProfile = { ...mockUser, profileImageUrl: null };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithoutProfile);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.login(loginDto, mockRequest);

      expect(result.user.profileImageUrl).toBe('https://picsum.photos/40/40?random=1');
    });

    it('리프레시 토큰을 데이터베이스에 저장해야 한다', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      await service.login(loginDto, mockRequest);

      expect(mockPrismaService.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          token: '6d6f636b2d726566726573682d746f6b656e',
          deviceId: loginDto.deviceId,
          userAgent: 'Mozilla/5.0',
          ipAddress: '127.0.0.1',
          expiresAt: expect.any(Date),
        },
      });
    });

    it('deviceId가 없어도 로그인이 가능해야 한다', async () => {
      const loginDtoWithoutDevice = {
        loginId: 'testuser',
        password: 'password123!',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      await service.login(loginDtoWithoutDevice, mockRequest);

      expect(mockPrismaService.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deviceId: null,
        }),
      });
    });
  });

  describe('refresh', () => {
    const refreshToken = 'valid-refresh-token';
    const mockTokenRecord = {
      id: 1,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 86400000), // 1일 후
      user: {
        id: 1,
        loginId: 'testuser',
      },
    };

    it('토큰 갱신에 성공해야 한다', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(mockTokenRecord);
      mockPrismaService.refreshToken.update.mockResolvedValue({});

      const result = await service.refresh(refreshToken, mockRequest);

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: '6d6f636b2d726566726573682d746f6b656e',
      });

      expect(mockPrismaService.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: refreshToken },
        include: { user: true },
      });
    });

    it('유효하지 않은 리프레시 토큰에 대해 UnauthorizedException을 던져야 한다', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh(refreshToken, mockRequest)).rejects.toThrow(
        new UnauthorizedException('유효하지 않은 리프레시 토큰입니다'),
      );
    });

    it('만료된 리프레시 토큰에 대해 UnauthorizedException을 던져야 한다', async () => {
      const expiredTokenRecord = {
        ...mockTokenRecord,
        expiresAt: new Date(Date.now() - 86400000), // 1일 전
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(expiredTokenRecord);
      mockPrismaService.refreshToken.delete.mockResolvedValue({});

      await expect(service.refresh(refreshToken, mockRequest)).rejects.toThrow(
        new UnauthorizedException('만료된 리프레시 토큰입니다'),
      );

      expect(mockPrismaService.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: expiredTokenRecord.id },
      });
    });

    it('토큰 로테이션을 수행해야 한다', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(mockTokenRecord);
      mockPrismaService.refreshToken.update.mockResolvedValue({});

      await service.refresh(refreshToken, mockRequest);

      expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: mockTokenRecord.id },
        data: {
          token: '6d6f636b2d726566726573682d746f6b656e',
          expiresAt: expect.any(Date),
          lastUsedAt: expect.any(Date),
        },
      });
    });
  });

  describe('logout', () => {
    const refreshToken = 'valid-refresh-token';

    it('로그아웃에 성공해야 한다', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.logout(refreshToken);

      expect(result).toEqual({
        message: '로그아웃되었습니다',
      });

      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: refreshToken },
      });
    });

    it('존재하지 않는 토큰으로도 로그아웃이 가능해야 한다', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.logout('invalid-token');

      expect(result).toEqual({
        message: '로그아웃되었습니다',
      });
    });
  });

  describe('private methods', () => {
    it('generateRefreshToken이 고유한 토큰을 생성해야 한다', async () => {
      // private 메서드 테스트를 위해 public으로 노출
      const token1 = (service as any).generateRefreshToken();
      const token2 = (service as any).generateRefreshToken();

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(typeof token1).toBe('string');
      expect(typeof token2).toBe('string');
    });

    it('getClientIp가 올바른 IP를 반환해야 한다', () => {
      const mockReqWithForwarded = {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
        connection: { remoteAddress: '127.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' },
      } as any as Request;

      const ip = (service as any).getClientIp(mockReqWithForwarded);
      expect(ip).toBe('192.168.1.1');
    });

    it('getClientIp가 기본 IP를 반환해야 한다', () => {
      const mockReqEmpty = {
        headers: {},
        connection: {},
        socket: {},
      } as any as Request;

      const ip = (service as any).getClientIp(mockReqEmpty);
      expect(ip).toBe('127.0.0.1');
    });
  });
});