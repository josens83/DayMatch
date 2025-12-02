import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '카테고리 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '카테고리 상세 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findById(id);
  }

  @Get(':id/sub-categories')
  @Public()
  @ApiOperation({ summary: '서브 카테고리 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findSubCategories(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findSubCategories(id);
  }
}
