import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    category: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('모든 카테고리 조회에 성공해야 한다', async () => {
      const mockCategories = [
        { id: 1, name: '요리' },
        { id: 2, name: '그림' },
        { id: 3, name: '음악' },
        { id: 4, name: '영화' },
        { id: 5, name: '독서' },
      ];

      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.findAll();

      expect(result).toEqual(mockCategories);
      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          id: 'asc',
        },
      });
      expect(mockPrismaService.category.findMany).toHaveBeenCalledTimes(1);
    });

    it('빈 카테고리 목록을 반환할 수 있어야 한다', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          id: 'asc',
        },
      });
    });

    it('카테고리가 ID 순으로 정렬되어야 한다', async () => {
      const mockCategories = [
        { id: 1, name: '요리' },
        { id: 2, name: '그림' },
        { id: 3, name: '음악' },
      ];

      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

      await service.findAll();

      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          id: 'asc',
        },
      });
    });

    it('필요한 필드만 선택해야 한다', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([]);

      await service.findAll();

      const selectFields = mockPrismaService.category.findMany.mock.calls[0][0].select;
      expect(selectFields).toEqual({
        id: true,
        name: true,
      });
    });

    it('Prisma 에러가 발생하면 에러를 전파해야 한다', async () => {
      const prismaError = new Error('데이터베이스 연결 실패');
      mockPrismaService.category.findMany.mockRejectedValue(prismaError);

      await expect(service.findAll()).rejects.toThrow(prismaError);

      expect(mockPrismaService.category.findMany).toHaveBeenCalledTimes(1);
    });

    it('단일 카테고리도 올바르게 반환해야 한다', async () => {
      const singleCategory = [{ id: 1, name: '요리' }];
      mockPrismaService.category.findMany.mockResolvedValue(singleCategory);

      const result = await service.findAll();

      expect(result).toEqual(singleCategory);
      expect(result).toHaveLength(1);
    });

    it('카테고리 이름이 올바르게 반환되어야 한다', async () => {
      const mockCategories = [
        { id: 1, name: '한글 카테고리' },
        { id: 2, name: 'English Category' },
        { id: 3, name: '特殊문자!@#' },
      ];

      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.findAll();

      expect(result).toEqual(mockCategories);
      result.forEach((category, index) => {
        expect(category.name).toBe(mockCategories[index].name);
      });
    });

    it('대량의 카테고리도 처리할 수 있어야 한다', async () => {
      const largeCategories = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `카테고리 ${i + 1}`,
      }));

      mockPrismaService.category.findMany.mockResolvedValue(largeCategories);

      const result = await service.findAll();

      expect(result).toEqual(largeCategories);
      expect(result).toHaveLength(100);
    });
  });

  describe('Service initialization', () => {
    it('CategoriesService가 올바르게 정의되어야 한다', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(CategoriesService);
    });

    it('findAll 메서드가 정의되어야 한다', () => {
      expect(service.findAll).toBeDefined();
      expect(typeof service.findAll).toBe('function');
    });

    it('PrismaService 의존성이 주입되어야 한다', () => {
      expect(service['prisma']).toBeDefined();
    });
  });
});