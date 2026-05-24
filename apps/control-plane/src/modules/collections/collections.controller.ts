import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CollectionsService, CreateCollectionDto } from './collections.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const SYSTEM_USER = '00000000-0000-0000-0000-000000000000';

@Controller('api/collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  findAll() {
    return this.collectionsService.findAll(SYSTEM_USER);
  }

  @Post()
  create(@Body() dto: CreateCollectionDto) {
    return this.collectionsService.create(dto, SYSTEM_USER);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateCollectionDto>) {
    return this.collectionsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.collectionsService.delete(id);
  }

  @Post(':id/scenarios/:scenarioId')
  addScenario(
    @Param('id') id: string,
    @Param('scenarioId') scenarioId: string,
  ) {
    return this.collectionsService.addScenario(id, scenarioId);
  }

  @Delete(':id/scenarios/:scenarioId')
  removeScenario(
    @Param('id') id: string,
    @Param('scenarioId') scenarioId: string,
  ) {
    return this.collectionsService.removeScenario(id, scenarioId);
  }
}
