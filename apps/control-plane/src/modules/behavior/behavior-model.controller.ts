import { Controller, Get, Post, Body, Param } from '@nestjs/common';

import {
  BehaviorModelService,
  CreateBehaviorModelDto,
} from './behavior-model.service';

@Controller('api/behaviors')
export class BehaviorModelController {
  constructor(private readonly behaviorService: BehaviorModelService) {}

  @Post()
  create(@Body() dto: CreateBehaviorModelDto) {
    return this.behaviorService.create(
      dto,
      '00000000-0000-0000-0000-000000000000',
    );
  }

  @Get()
  findAll() {
    return this.behaviorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.behaviorService.findById(id);
  }
}
