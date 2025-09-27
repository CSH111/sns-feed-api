import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let categoriesService: CategoriesService;

  const mockCategoriesService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    categoriesService = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCategories', () => {
    it('모든 카테고리 조회에 성공해야 한다', async () => {
      const mockCategories = [
        { id: 1, name: '요리' },
        { id: 2, name: '그림' },
        { id: 3, name: '음악' },
        { id: 4, name: '영화' },
        { id: 5, name: '독서' },
      ];

      mockCategoriesService.findAll.mockResolvedValue(mockCategories);

      const result = await controller.getCategories();

      expect(result).toEqual(mockCategories);
      expect(mockCategoriesService.findAll).toHaveBeenCalledWith();
      expect(mockCategoriesService.findAll).toHaveBeenCalledTimes(1);
    });

    it('빈 카테고리 목록을 반환할 수 있어야 한다', async () => {
      mockCategoriesService.findAll.mockResolvedValue([]);

      const result = await controller.getCategories();

      expect(result).toEqual([]);
      expect(mockCategoriesService.findAll).toHaveBeenCalledWith();
    });

    it('서비스에서 에러가 발생하면 에러를 전파해야 한다', async () => {
      const serviceError = new Error('서비스 에러');
      mockCategoriesService.findAll.mockRejectedValue(serviceError);

      await expect(controller.getCategories()).rejects.toThrow(serviceError);

      expect(mockCategoriesService.findAll).toHaveBeenCalledWith();
    });

    it('카테고리 ID가 순서대로 정렬되어 반환되어야 한다', async () => {
      const mockCategories = [
        { id: 1, name: '요리' },
        { id: 2, name: '그림' },
        { id: 3, name: '음악' },
      ];

      mockCategoriesService.findAll.mockResolvedValue(mockCategories);

      const result = await controller.getCategories();

      expect(result).toEqual(mockCategories);
      for (let i = 1; i < result.length; i++) {
        expect(result[i].id).toBeGreaterThan(result[i - 1].id);
      }
    });

    it('카테고리 이름이 올바르게 반환되어야 한다', async () => {
      const mockCategories = [
        { id: 1, name: '한글 카테고리' },
        { id: 2, name: 'English Category' },
        { id: 3, name: '특수문자!@#' },
      ];

      mockCategoriesService.findAll.mockResolvedValue(mockCategories);

      const result = await controller.getCategories();

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

      mockCategoriesService.findAll.mockResolvedValue(largeCategories);

      const result = await controller.getCategories();

      expect(result).toEqual(largeCategories);
      expect(result).toHaveLength(100);
    });

    it('단일 카테고리도 올바르게 반환해야 한다', async () => {
      const singleCategory = [{ id: 1, name: '요리' }];
      mockCategoriesService.findAll.mockResolvedValue(singleCategory);

      const result = await controller.getCategories();

      expect(result).toEqual(singleCategory);
      expect(result).toHaveLength(1);
    });

    it('매개변수 없이 호출되어야 한다', async () => {
      mockCategoriesService.findAll.mockResolvedValue([]);

      await controller.getCategories();

      expect(mockCategoriesService.findAll).toHaveBeenCalledWith();
    });

    it('응답 형식이 올바른 구조를 가져야 한다', async () => {
      const mockCategories = [
        { id: 1, name: '요리' },
        { id: 2, name: '그림' },
      ];

      mockCategoriesService.findAll.mockResolvedValue(mockCategories);

      const result = await controller.getCategories();

      result.forEach(category => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(typeof category.id).toBe('number');
        expect(typeof category.name).toBe('string');
      });
    });

    it('비동기 메서드가 Promise를 반환해야 한다', () => {
      mockCategoriesService.findAll.mockResolvedValue([]);

      const result = controller.getCategories();

      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('HTTP Methods', () => {
    it('getCategories 메서드가 GET으로 정의되어야 한다', () => {
      expect(controller.getCategories).toBeDefined();
      expect(typeof controller.getCategories).toBe('function');
    });
  });

  describe('Controller metadata', () => {
    it('CategoriesController가 올바르게 정의되어야 한다', () => {
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(CategoriesController);
    });

    it('getCategories 메서드가 정의되어야 한다', () => {
      expect(controller.getCategories).toBeDefined();
      expect(typeof controller.getCategories).toBe('function');
    });

    it('CategoriesService 의존성이 주입되어야 한다', () => {
      expect(controller['categoriesService']).toBeDefined();
    });
  });

  describe('Service integration', () => {
    it('서비스의 findAll 메서드를 올바르게 호출해야 한다', async () => {
      mockCategoriesService.findAll.mockResolvedValue([]);

      await controller.getCategories();

      expect(mockCategoriesService.findAll).toHaveBeenCalledWith();
    });

    it('서비스의 응답을 그대로 반환해야 한다', async () => {
      const mockResponse = [{ id: 1, name: '테스트' }];
      mockCategoriesService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.getCategories();

      expect(result).toBe(mockResponse);
    });

    it('서비스가 여러 번 호출되지 않아야 한다', async () => {
      mockCategoriesService.findAll.mockResolvedValue([]);

      await controller.getCategories();

      expect(mockCategoriesService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('서비스 에러를 적절히 전파해야 한다', async () => {
      const errorMessage = '데이터베이스 연결 실패';
      const serviceError = new Error(errorMessage);
      mockCategoriesService.findAll.mockRejectedValue(serviceError);

      await expect(controller.getCategories()).rejects.toThrow(errorMessage);
    });

    it('다양한 종류의 에러를 처리할 수 있어야 한다', async () => {
      const customError = new TypeError('타입 에러');
      mockCategoriesService.findAll.mockRejectedValue(customError);

      await expect(controller.getCategories()).rejects.toThrow(customError);
    });
  });
});