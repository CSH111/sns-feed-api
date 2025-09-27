import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

// bcrypt 모킹
jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);

    // bcrypt 모킹 설정
    mockBcrypt.hash.mockResolvedValue('hashedPassword123' as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      loginId: 'testuser',
      name: '테스트유저',
      nickname: 'testnick',
      password: 'password123!',
      profileImageUrl: 'https://example.com/profile.jpg',
    };

    it('사용자 생성에 성공해야 한다', async () => {
      const expectedUser = {
        id: 1,
        loginId: createUserDto.loginId,
        name: createUserDto.name,
        nickname: createUserDto.nickname,
        profileImageUrl: createUserDto.profileImageUrl,
        createdAt: new Date(),
      };

      // 중복 사용자 없음
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(expectedUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(expectedUser);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          loginId: createUserDto.loginId,
          nickname: createUserDto.nickname,
          password: 'hashedPassword123',
          name: createUserDto.name,
          profileImageUrl: createUserDto.profileImageUrl,
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
    });

    it('loginId가 중복일 때 ConflictException을 던져야 한다', async () => {
      // 첫 번째 호출 (loginId 체크)에서 기존 사용자 반환
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 1,
        loginId: createUserDto.loginId,
      });

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('이미 사용 중인 ID입니다'),
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { loginId: createUserDto.loginId },
      });
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('nickname이 중복일 때 ConflictException을 던져야 한다', async () => {
      // 첫 번째 호출 (loginId 체크)에서 null, 두 번째 호출 (nickname 체크)에서 기존 사용자 반환
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // loginId 체크
        .mockResolvedValueOnce({ // nickname 체크
          id: 2,
          nickname: createUserDto.nickname,
        });

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('이미 사용 중인 닉네임입니다'),
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.user.findUnique).toHaveBeenNthCalledWith(1, {
        where: { loginId: createUserDto.loginId },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenNthCalledWith(2, {
        where: { nickname: createUserDto.nickname },
      });
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('비밀번호가 올바르게 해싱되어야 한다', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({});

      await service.create(createUserDto);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
    });

    it('profileImageUrl 없이도 사용자 생성이 가능해야 한다', async () => {
      const dtoWithoutImage = {
        ...createUserDto,
        profileImageUrl: undefined,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({});

      await service.create(dtoWithoutImage);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          loginId: dtoWithoutImage.loginId,
          nickname: dtoWithoutImage.nickname,
          password: 'hashedPassword123',
          name: dtoWithoutImage.name,
          profileImageUrl: undefined,
        },
        select: expect.any(Object),
      });
    });

    it('중복 체크에서 두 조건 모두 확인해야 한다', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({});

      await service.create(createUserDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.user.findUnique).toHaveBeenNthCalledWith(1, {
        where: { loginId: createUserDto.loginId },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenNthCalledWith(2, {
        where: { nickname: createUserDto.nickname },
      });
    });
  });

  describe('findByLoginId', () => {
    const loginId = 'testuser';

    it('사용자 조회에 성공해야 한다', async () => {
      const expectedUser = {
        id: 1,
        loginId,
        name: '테스트유저',
        nickname: 'testnick',
        profileImageUrl: 'https://example.com/profile.jpg',
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(expectedUser);

      const result = await service.findByLoginId(loginId);

      expect(result).toEqual(expectedUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
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
    });

    it('존재하지 않는 사용자일 때 null을 반환해야 한다', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByLoginId(loginId);

      expect(result).toBeNull();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
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
    });

    it('비밀번호는 select에 포함되지 않아야 한다', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({});

      await service.findByLoginId(loginId);

      const selectFields = mockPrismaService.user.findUnique.mock.calls[0][0].select;
      expect(selectFields).not.toHaveProperty('password');
    });
  });
});