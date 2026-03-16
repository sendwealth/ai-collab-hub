import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { WorkflowsService } from './workflows.service';
import {
  CreateWorkflowTemplateDto,
  UpdateWorkflowTemplateDto,
  StartWorkflowDto,
  RunWorkflowDto,
} from './dto/workflow.dto';

@ApiTags('Workflows')
@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly service: WorkflowsService) {}

  // ============================================
  // Template Endpoints
  // ============================================

  @Post('templates')
  @ApiOperation({ summary: 'Create workflow template' })
  @ApiResponse({ status: 201, description: 'Template created' })
  async createTemplate(@Body() dto: CreateWorkflowTemplateDto) {
    return this.service.createTemplate(dto);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all workflow templates' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  async getTemplates(
    @Query('category') category?: string,
    @Query('isActive') isActive?: string
  ) {
    return this.service.getTemplates({
      category,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiResponse({ status: 200, description: 'Template found' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getTemplate(@Param('id') id: string) {
    return this.service.getTemplate(id);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update workflow template' })
  @ApiResponse({ status: 200, description: 'Template updated' })
  async updateTemplate(@Param('id') id: string, @Body() dto: UpdateWorkflowTemplateDto) {
    return this.service.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete workflow template' })
  @ApiResponse({ status: 200, description: 'Template deleted' })
  async deleteTemplate(@Param('id') id: string) {
    return this.service.deleteTemplate(id);
  }

  // ============================================
  // Instance Endpoints
  // ============================================

  @Post('instances')
  @ApiOperation({ summary: 'Start workflow instance' })
  @ApiResponse({ status: 201, description: 'Instance started' })
  async startWorkflow(@Body() dto: StartWorkflowDto) {
    return this.service.startWorkflow(dto);
  }

  @Get('instances')
  @ApiOperation({ summary: 'Get all workflow instances' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'templateId', required: false })
  async getInstances(
    @Query('status') status?: string,
    @Query('templateId') templateId?: string
  ) {
    return this.service.getInstances({ status, templateId });
  }

  @Get('instances/:id')
  @ApiOperation({ summary: 'Get instance by ID' })
  @ApiResponse({ status: 200, description: 'Instance found' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  async getInstance(@Param('id') id: string) {
    return this.service.getInstance(id);
  }

  @Get('instances/:id/state')
  @ApiOperation({ summary: 'Get workflow state' })
  @ApiResponse({ status: 200, description: 'State retrieved' })
  async getWorkflowState(@Param('id') id: string) {
    return this.service.getWorkflowState(id);
  }

  @Post('instances/:id/pause')
  @ApiOperation({ summary: 'Pause workflow' })
  @ApiResponse({ status: 200, description: 'Workflow paused' })
  async pauseWorkflow(@Param('id') id: string) {
    return this.service.pauseWorkflow(id);
  }

  @Post('instances/:id/resume')
  @ApiOperation({ summary: 'Resume workflow' })
  @ApiResponse({ status: 200, description: 'Workflow resumed' })
  async resumeWorkflow(@Param('id') id: string) {
    return this.service.resumeWorkflow(id);
  }

  @Post('instances/:id/cancel')
  @ApiOperation({ summary: 'Cancel workflow' })
  @ApiResponse({ status: 200, description: 'Workflow cancelled' })
  async cancelWorkflow(@Param('id') id: string) {
    return this.service.cancelWorkflow(id);
  }

  @Get('instances/:id/executions')
  @ApiOperation({ summary: 'Get node execution history' })
  @ApiResponse({ status: 200, description: 'Execution history retrieved' })
  async getNodeExecutions(@Param('id') id: string) {
    return this.service.getNodeExecutions(id);
  }

  // ============================================
  // Statistics Endpoint
  // ============================================

  @Get('statistics')
  @ApiOperation({ summary: 'Get workflow statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStatistics() {
    return this.service.getStatistics();
  }

  // ============================================
  // Run Workflow Directly (without template)
  // ============================================

  @Post('run')
  @ApiOperation({ summary: 'Run workflow definition directly' })
  @ApiResponse({ status: 200, description: 'Workflow executed' })
  @ApiResponse({ status: 400, description: 'Invalid workflow definition' })
  async runWorkflow(@Body() dto: RunWorkflowDto) {
    return this.service.runWorkflowDefinition(dto);
  }
}
