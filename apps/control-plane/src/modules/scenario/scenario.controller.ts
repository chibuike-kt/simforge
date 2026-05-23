import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';

import { ScenarioService, CreateScenarioDto } from './scenario.service';

@Controller('api/scenarios')
export class ScenarioController {
  constructor(private readonly scenarioService: ScenarioService) {}

  @Post()
  create(@Body() dto: CreateScenarioDto) {
    return this.scenarioService.create(
      dto,
      '00000000-0000-0000-0000-000000000000',
    );
  }

  @Get()
  findAll() {
    return this.scenarioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scenarioService.findById(id);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.scenarioService.publish(id);
  }

  @Post(':id/runs')
  submitRun(
    @Param('id') id: string,
    @Body()
    body: {
      agentCount?: number;
      flowSteps?: Record<string, unknown>;
      entryNodeId?: string;
      baseUrl?: string;
    },
  ) {
    return this.scenarioService.submitRun(
      id,
      '00000000-0000-0000-0000-000000000000',
      body?.agentCount,
      body?.flowSteps,
      body?.entryNodeId,
      body?.baseUrl,
    );
  }

  @Get(':id/runs')
  getRuns(@Param('id') id: string) {
    return this.scenarioService.findRuns(id);
  }
}
