import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TargetModule } from './modules/target/target.module';
import { BehaviorModule } from './modules/behavior/behavior.module';
import { ScenarioModule } from './modules/scenario/scenario.module';
import { OrchestrationModule } from './modules/orchestration/orchestration.module';
import { ApprovalModule } from './modules/approval/approval.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { RunsModule } from './modules/runs/runs.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    TargetModule,
    BehaviorModule,
    ScenarioModule,
    OrchestrationModule,
    ApprovalModule,
    RealtimeModule,
    MetricsModule,
    CollectionsModule,
    RunsModule,
  ],
})
export class AppModule {}
