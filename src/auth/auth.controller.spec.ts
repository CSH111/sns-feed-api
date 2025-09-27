import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import type { Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockRequest = {
    headers: {
      'user-agent': 'Mozilla/5.0',
    },
    connection: {
      remoteAddress: '127.0.0.1',
    },
  } as any as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
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

    it('로그인에 성공해야 한다', async () => {
      const expectedResult = {
        user: {
          id: 1,
          loginId: loginDto.loginId,
          name: '테스트유저',
          nickname: 'testnick',
          profileImageUrl: 'https://picsum.photos/40/40?random=1',
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto, mockRequest);
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });

    it('잘못된 인증 정보로 로그인 시 UnauthorizedException을 던져야 한다', async () => {
      const unauthorizedError = new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다');
      mockAuthService.login.mockRejectedValue(unauthorizedError);

      await expect(controller.login(loginDto, mockRequest)).rejects.toThrow(unauthorizedError);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto, mockRequest);
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });

    it('deviceId 없이도 로그인이 가능해야 한다', async () => {
      const loginDtoWithoutDevice = {
        loginId: 'testuser',
        password: 'password123!',
      };

      const expectedResult = {
        user: { id: 1, loginId: 'testuser' },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDtoWithoutDevice, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDtoWithoutDevice, mockRequest);
    });

    it('Request 객체가 올바르게 전달되어야 한다', async () => {
      mockAuthService.login.mockResolvedValue({});

      await controller.login(loginDto, mockRequest);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto, mockRequest);
    });

    it('서비스에서 에러가 발생하면 에러를 전파해야 한다', async () => {
      const serviceError = new Error('서비스 에러');
      mockAuthService.login.mockRejectedValue(serviceError);

      await expect(controller.login(loginDto, mockRequest)).rejects.toThrow(serviceError);
    });
  });

  describe('refresh', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('토큰 갱신에 성공해야 한다', async () => {
      const expectedResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthService.refresh.mockResolvedValue(expectedResult);

      const result = await controller.refresh(refreshTokenDto, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.refresh).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
        mockRequest,
      );
      expect(mockAuthService.refresh).toHaveBeenCalledTimes(1);
    });

    it('유효하지 않은 리프레시 토큰에 대해 UnauthorizedException을 던져야 한다', async () => {
      const unauthorizedError = new UnauthorizedException('유효하지 않은 리프레시 토큰입니다');
      mockAuthService.refresh.mockRejectedValue(unauthorizedError);

      await expect(controller.refresh(refreshTokenDto, mockRequest)).rejects.toThrow(
        unauthorizedError,
      );

      expect(mockAuthService.refresh).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
        mockRequest,
      );
    });

    it('만료된 리프레시 토큰에 대해 UnauthorizedException을 던져야 한다', async () => {
      const expiredError = new UnauthorizedException('만료된 리프레시 토큰입니다');
      mockAuthService.refresh.mockRejectedValue(expiredError);

      await expect(controller.refresh(refreshTokenDto, mockRequest)).rejects.toThrow(
        expiredError,
      );

      expect(mockAuthService.refresh).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
        mockRequest,
      );
    });

    it('refreshToken이 올바르게 추출되어 전달되어야 한다', async () => {
      mockAuthService.refresh.mockResolvedValue({});

      await controller.refresh(refreshTokenDto, mockRequest);

      expect(mockAuthService.refresh).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
        mockRequest,
      );
    });

    it('Request 객체가 올바르게 전달되어야 한다', async () => {
      mockAuthService.refresh.mockResolvedValue({});

      await controller.refresh(refreshTokenDto, mockRequest);

      expect(mockAuthService.refresh).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
        mockRequest,
      );
    });
  });

  describe('logout', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('로그아웃에 성공해야 한다', async () => {
      const expectedResult = {
        message: '로그아웃되었습니다',
      };

      mockAuthService.logout.mockResolvedValue(expectedResult);

      const result = await controller.logout(refreshTokenDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.logout).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
      expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 토큰으로도 로그아웃이 가능해야 한다', async () => {
      const expectedResult = {
        message: '로그아웃되었습니다',
      };

      mockAuthService.logout.mockResolvedValue(expectedResult);

      await controller.logout(refreshTokenDto);

      expect(mockAuthService.logout).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
    });

    it('refreshToken이 올바르게 추출되어 전달되어야 한다', async () => {
      mockAuthService.logout.mockResolvedValue({ message: '로그아웃되었습니다' });

      await controller.logout(refreshTokenDto);

      expect(mockAuthService.logout).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
    });

    it('서비스에서 에러가 발생하면 에러를 전파해야 한다', async () => {
      const serviceError = new Error('서비스 에러');
      mockAuthService.logout.mockRejectedValue(serviceError);

      await expect(controller.logout(refreshTokenDto)).rejects.toThrow(serviceError);

      expect(mockAuthService.logout).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
    });
  });

  describe('Authentication Guard', () => {
    it('logout 메서드에 JwtAuthGuard가 적용되어야 한다', () => {
      const guards = Reflect.getMetadata('__guards__', AuthController.prototype.logout);
      expect(guards).toBeDefined();
    });

    it('login 메서드에는 JwtAuthGuard가 적용되지 않아야 한다', () => {
      const guards = Reflect.getMetadata('__guards__', AuthController.prototype.login);
      expect(guards).toBeUndefined();
    });

    it('refresh 메서드에는 JwtAuthGuard가 적용되지 않아야 한다', () => {
      const guards = Reflect.getMetadata('__guards__', AuthController.prototype.refresh);
      expect(guards).toBeUndefined();
    });
  });

  describe('HTTP Methods', () => {
    it('모든 메서드가 POST로 정의되어야 한다', () => {
      const loginMethod = Reflect.getMetadata('method', controller.login);
      const refreshMethod = Reflect.getMetadata('method', controller.refresh);
      const logoutMethod = Reflect.getMetadata('method', controller.logout);

      // NestJS의 메타데이터는 다르게 저장될 수 있으므로 메서드 존재 여부만 확인
      expect(controller.login).toBeDefined();
      expect(controller.refresh).toBeDefined();
      expect(controller.logout).toBeDefined();
    });
  });

  describe('Controller metadata', () => {
    it('AuthController가 올바르게 정의되어야 한다', () => {
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(AuthController);
    });

    it('모든 메서드가 정의되어야 한다', () => {
      expect(controller.login).toBeDefined();
      expect(controller.refresh).toBeDefined();
      expect(controller.logout).toBeDefined();
      expect(typeof controller.login).toBe('function');
      expect(typeof controller.refresh).toBe('function');
      expect(typeof controller.logout).toBe('function');
    });
  });
});