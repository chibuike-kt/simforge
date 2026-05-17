import { Controller, Get, Post, Body, Param } from '@nestjs/common';

import { ApprovalService } from './approval.service';

@Controller('api/approvals')
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get('pending')
  findPending() {
    return this.approvalService.findPendingRuns();
  }

  @Post(':runId/approve')
  approve(@Param('runId') runId: string) {
    return this.approvalService.approve(
      runId,
      '00000000-0000-0000-0000-000000000000',
    );
  }

  @Post(':runId/reject')
  reject(@Param('runId') runId: string, @Body('reason') reason: string) {
    return this.approvalService.reject(
      runId,
      '00000000-0000-0000-0000-000000000000',
      reason,
    );
  }
}
