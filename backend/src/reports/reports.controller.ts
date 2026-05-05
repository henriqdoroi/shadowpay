import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../users/current-user.decorator';
import { ReportsService } from './reports.service';

class TimeseriesQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 30;
}

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  // GET /api/reports/summary
  @Get('summary')
  summary(@CurrentUser() user: { id: string }) {
    return this.service.summary(user.id);
  }

  // GET /api/reports/timeseries?days=30
  @Get('timeseries')
  timeseries(@CurrentUser() user: { id: string }, @Query() q: TimeseriesQuery) {
    return this.service.timeseries(user.id, q.days);
  }

  // GET /api/reports/by-method
  @Get('by-method')
  byMethod(@CurrentUser() user: { id: string }) {
    return this.service.byMethod(user.id);
  }
}
