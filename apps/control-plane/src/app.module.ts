import { Module } from '@nestjs/common';

import { TargetModule } from './modules/target/target.module';
import { BehaviorModule } from './modules/behavior/behavior.module';
import { ScenarioModule } from './modules/scenario/scenario.module';
import { OrchestrationModule } from './modules/orchestration/orchestration.module';
import { ApprovalModule } from './modules/approval/approval.module';

@Module({
  imports: [
    TargetModule,
    BehaviorModule,
    ScenarioModule,
    OrchestrationModule,
    ApprovalModule,
  ],
})
export class AppModule {}
