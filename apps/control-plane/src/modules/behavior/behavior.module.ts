import { Module } from '@nestjs/common';
import { BehaviorModelService } from './behavior-model.service';
import { BehaviorModelController } from './behavior-model.controller';

@Module({
  providers: [BehaviorModelService],
  controllers: [BehaviorModelController],
})
export class BehaviorModule {}
