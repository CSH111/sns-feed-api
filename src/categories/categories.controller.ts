import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: '카테고리 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '카테고리 목록 조회 성공',
    schema: {
      example: [
        {
          id: 1,
          name: '요리',
        },
        {
          id: 2,
          name: '그림',
        },
        {
          id: 3,
          name: '음악',
        },
        {
          id: 4,
          name: '영화',
        },
        {
          id: 5,
          name: '독서',
        },
      ],
    },
  })
  async getCategories() {
    return this.categoriesService.findAll();
  }
}
