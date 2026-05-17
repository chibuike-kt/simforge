import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';

import { TargetSystemService, CreateTargetDto } from './target-system.service';

@Controller('api/targets')
export class TargetSystemController {
  constructor(private readonly targetService: TargetSystemService) {}

  @Post()
  create(@Body() dto: CreateTargetDto) {
    // TODO: replace hardcoded id with real auth user id in Phase 4
    return this.targetService.create(
      dto,
      '00000000-0000-0000-0000-000000000000',
    );
  }

  @Get()
  findAll() {
    return this.targetService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.targetService.findById(id);
  }

  @Patch(':id/verify')
  verify(@Param('id') id: string) {
    return this.targetService.markVerified(id);
  }
}
