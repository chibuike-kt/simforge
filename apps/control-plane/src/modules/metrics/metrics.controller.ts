import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MetricsService, ShardMetricsDto } from './metrics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('runs/:runId')
  getRunMetrics(@Param('runId') runId: string) {
    return this.metricsService.getRunMetrics(runId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('scenarios/:scenarioId/runs')
  listScenarioRunMetrics(@Param('scenarioId') scenarioId: string) {
    return this.metricsService.listRunMetricsSummaries(scenarioId);
  }

  // Called by the worker via internal API
  @Post('shards')
  ingestShardMetrics(@Body() dto: ShardMetricsDto) {
    return this.metricsService.upsertShardMetrics(dto);
  }
}
