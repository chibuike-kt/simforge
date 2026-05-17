import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScenarioModule } from './modules/scenario/scenario.module';
import { BehaviorModule } from './modules/behavior/behavior.module';
import { TargetModule } from './modules/target/target.module';
import { OrchestrationModule } from './modules/orchestration/orchestration.module';
import { ApprovalModule } from './modules/approval/approval.module';

@Module({
  imports: [
    ScenarioModule,
    BehaviorModule,
    TargetModule,
    OrchestrationModule,
    ApprovalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
