import { Module } from '@nestjs/common';
import { TargetSystemService } from './target-system.service';
import { TargetSystemController } from './target-system.controller';

@Module({
  providers: [TargetSystemService],
  controllers: [TargetSystemController],
})
export class TargetModule {}
