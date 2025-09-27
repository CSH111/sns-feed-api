import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findByLoginId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const createUserDto: CreateUserDto = {
      loginId: 'testuser',
      name: '테스트유저',
      nickname: 'testnick',
      password: 'password123!',
      profileImageUrl: 'https://example.com/profile.jpg',
    };

    it('회원가입에 성공해야 한다', async () => {
      const expectedResult = {
        id: 1,
        loginId: createUserDto.loginId,
        name: createUserDto.name,
        nickname: createUserDto.nickname,
        profileImageUrl: createUserDto.profileImageUrl,
        createdAt: new Date(),
      };

      mockUsersService.create.mockResolvedValue(expectedResult);

      const result = await controller.register(createUserDto);

      expect(result).toEqual(expectedResult);
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(mockUsersService.create).toHaveBeenCalledTimes(1);
    });

    it('중복된 ID로 회원가입 시 ConflictException을 던져야 한다', async () => {
      const conflictError = new ConflictException('이미 사용 중인 ID입니다');
      mockUsersService.create.mockRejectedValue(conflictError);

      await expect(controller.register(createUserDto)).rejects.toThrow(conflictError);

      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(mockUsersService.create).toHaveBeenCalledTimes(1);
    });

    it('중복된 닉네임으로 회원가입 시 ConflictException을 던져야 한다', async () => {
      const conflictError = new ConflictException('이미 사용 중인 닉네임입니다');
      mockUsersService.create.mockRejectedValue(conflictError);

      await expect(controller.register(createUserDto)).rejects.toThrow(conflictError);

      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(mockUsersService.create).toHaveBeenCalledTimes(1);
    });

    it('profileImageUrl 없이도 회원가입이 가능해야 한다', async () => {
      const dtoWithoutImage = {
        ...createUserDto,
        profileImageUrl: undefined,
      };

      const expectedResult = {
        id: 1,
        loginId: dtoWithoutImage.loginId,
        name: dtoWithoutImage.name,
        nickname: dtoWithoutImage.nickname,
        profileImageUrl: null,
        createdAt: new Date(),
      };

      mockUsersService.create.mockResolvedValue(expectedResult);

      const result = await controller.register(dtoWithoutImage);

      expect(result).toEqual(expectedResult);
      expect(mockUsersService.create).toHaveBeenCalledWith(dtoWithoutImage);
    });

    it('서비스 에러가 발생하면 에러를 전파해야 한다', async () => {
      const serviceError = new Error('서비스 에러');
      mockUsersService.create.mockRejectedValue(serviceError);

      await expect(controller.register(createUserDto)).rejects.toThrow(serviceError);

      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('모든 필수 필드가 올바르게 전달되어야 한다', async () => {
      const completeDto: CreateUserDto = {
        loginId: 'user123',
        name: '김철수',
        nickname: 'nickname',
        password: 'password123!',
        profileImageUrl: 'https://example.com/profile.jpg',
      };

      mockUsersService.create.mockResolvedValue({});

      await controller.register(completeDto);

      expect(mockUsersService.create).toHaveBeenCalledWith(completeDto);
    });
  });

  describe('findUser', () => {
    const loginId = 'testuser';

    it('사용자 조회에 성공해야 한다', async () => {
      const expectedResult = {
        id: 1,
        loginId,
        name: '테스트유저',
        nickname: 'testnick',
        profileImageUrl: 'https://example.com/profile.jpg',
        createdAt: new Date(),
      };

      mockUsersService.findByLoginId.mockResolvedValue(expectedResult);

      const result = await controller.findUser(loginId);

      expect(result).toEqual(expectedResult);
      expect(mockUsersService.findByLoginId).toHaveBeenCalledWith(loginId);
      expect(mockUsersService.findByLoginId).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 사용자 조회 시 null을 반환해야 한다', async () => {
      mockUsersService.findByLoginId.mockResolvedValue(null);

      const result = await controller.findUser(loginId);

      expect(result).toBeNull();
      expect(mockUsersService.findByLoginId).toHaveBeenCalledWith(loginId);
      expect(mockUsersService.findByLoginId).toHaveBeenCalledTimes(1);
    });

    it('loginId 파라미터가 올바르게 전달되어야 한다', async () => {
      const differentLoginId = 'anotheruser';
      mockUsersService.findByLoginId.mockResolvedValue(null);

      await controller.findUser(differentLoginId);

      expect(mockUsersService.findByLoginId).toHaveBeenCalledWith(differentLoginId);
    });

    it('서비스에서 에러가 발생하면 에러를 전파해야 한다', async () => {
      const serviceError = new Error('서비스 에러');
      mockUsersService.findByLoginId.mockRejectedValue(serviceError);

      await expect(controller.findUser(loginId)).rejects.toThrow(serviceError);

      expect(mockUsersService.findByLoginId).toHaveBeenCalledWith(loginId);
    });

    it('빈 문자열 loginId도 처리할 수 있어야 한다', async () => {
      const emptyLoginId = '';
      mockUsersService.findByLoginId.mockResolvedValue(null);

      await controller.findUser(emptyLoginId);

      expect(mockUsersService.findByLoginId).toHaveBeenCalledWith(emptyLoginId);
    });

    it('특수문자가 포함된 loginId도 처리할 수 있어야 한다', async () => {
      const specialLoginId = 'user@123';
      mockUsersService.findByLoginId.mockResolvedValue(null);

      await controller.findUser(specialLoginId);

      expect(mockUsersService.findByLoginId).toHaveBeenCalledWith(specialLoginId);
    });
  });

  describe('Controller metadata', () => {
    it('UsersController가 올바르게 정의되어야 한다', () => {
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(UsersController);
    });

    it('register 메서드가 정의되어야 한다', () => {
      expect(controller.register).toBeDefined();
      expect(typeof controller.register).toBe('function');
    });

    it('findUser 메서드가 정의되어야 한다', () => {
      expect(controller.findUser).toBeDefined();
      expect(typeof controller.findUser).toBe('function');
    });
  });
});