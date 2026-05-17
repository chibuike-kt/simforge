import { Module } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { ApprovalController } from './approval.controller';

@Module({
  providers: [ApprovalService],
  controllers: [ApprovalController],
})
export class ApprovalModule {}
