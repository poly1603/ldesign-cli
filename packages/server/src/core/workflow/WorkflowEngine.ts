/**
 * 工作流引擎
 * 负责执行工作流定义
 */

import { EventEmitter } from 'events'
import type {
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowStep,
  WorkflowStepInstance,
  WorkflowStatus,
  WorkflowStepStatus,
  WorkflowExecutionOptions,
  WorkflowContext,
} from '@ldesign/cli-shared/types.js'
import { getToolManager } from '../tool-manager'
import { logger, generateId, delay } from '@ldesign/cli-shared/utils.js'

export class WorkflowEngine extends EventEmitter {
  private workflows: Map<string, WorkflowDefinition> = new Map()
  private instances: Map<string, WorkflowInstance> = new Map()

  /**
   * 注册工作流定义
   */
  registerWorkflow(workflow: WorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow)
    logger.info(`[WorkflowEngine] 注册工作流: ${workflow.name}`)
  }

  /**
   * 执行工作流
   */
  async executeWorkflow(
    workflowId: string,
    options: WorkflowExecutionOptions
  ): Promise<WorkflowInstance> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`工作流未找到: ${workflowId}`)
    }

    logger.info(`[WorkflowEngine] 开始执行工作流: ${workflow.name}`)

    // 创建工作流实例
    const instance: WorkflowInstance = {
      id: generateId('wf'),
      projectId: options.projectId,
      workflowId,
      name: workflow.name,
      status: 'running',
      currentStep: 0,
      steps: workflow.steps.map((step) => this.createStepInstance(step)),
      variables: { ...workflow.variables, ...options.variables },
      startedAt: Date.now(),
      createdAt: Date.now(),
    }

    this.instances.set(instance.id, instance)

    // 发送开始事件
    this.emit('workflow-start', { workflowId: instance.id, timestamp: Date.now() })

    try {
      // 执行所有步骤
      for (let i = 0; i < instance.steps.length; i++) {
        instance.currentStep = i
        const stepInstance = instance.steps[i]

        if (options.skipSteps?.includes(stepInstance.stepId)) {
          stepInstance.status = 'skipped'
          continue
        }

        await this.executeStep(instance, stepInstance, workflow.steps[i])

        if (stepInstance.status === 'failed' && !workflow.steps[i].continueOnError) {
          instance.status = 'failed'
          instance.error = stepInstance.error
          break
        }
      }

      // 完成
      if (instance.status === 'running') {
        instance.status = 'completed'
      }

      instance.completedAt = Date.now()

      logger.success(`[WorkflowEngine] 工作流执行完成: ${workflow.name}`)

      this.emit('workflow-complete', { workflowId: instance.id, timestamp: Date.now() })
    } catch (error) {
      instance.status = 'failed'
      instance.error = error instanceof Error ? error.message : String(error)
      instance.completedAt = Date.now()

      logger.error(`[WorkflowEngine] 工作流执行失败: ${workflow.name}`, error)

      this.emit('workflow-error', { workflowId: instance.id, error, timestamp: Date.now() })
    }

    return instance
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(
    instance: WorkflowInstance,
    stepInstance: WorkflowStepInstance,
    stepDef: WorkflowStep
  ): Promise<void> {
    logger.info(`[WorkflowEngine] 执行步骤: ${stepDef.name}`)

    stepInstance.status = 'running'
    stepInstance.startedAt = Date.now()
    stepInstance.logs = []

    this.emit('workflow-step-start', {
      workflowId: instance.id,
      stepId: stepInstance.id,
      timestamp: Date.now(),
    })

    try {
      const toolManager = getToolManager()
      const result = await toolManager.executeTool(stepDef.tool, stepDef.action, stepDef.params)

      stepInstance.result = result.data
      stepInstance.status = 'completed'
      stepInstance.completedAt = Date.now()

      this.emit('workflow-step-complete', {
        workflowId: instance.id,
        stepId: stepInstance.id,
        result,
        timestamp: Date.now(),
      })

      logger.success(`[WorkflowEngine] 步骤完成: ${stepDef.name}`)
    } catch (error) {
      stepInstance.status = 'failed'
      stepInstance.error = error instanceof Error ? error.message : String(error)
      stepInstance.completedAt = Date.now()

      this.emit('workflow-step-error', {
        workflowId: instance.id,
        stepId: stepInstance.id,
        error,
        timestamp: Date.now(),
      })

      logger.error(`[WorkflowEngine] 步骤失败: ${stepDef.name}`, error)

      throw error
    }
  }

  /**
   * 创建步骤实例
   */
  private createStepInstance(step: WorkflowStep): WorkflowStepInstance {
    return {
      id: generateId('step'),
      stepId: step.id,
      name: step.name,
      status: 'pending',
    }
  }

  /**
   * 获取工作流实例
   */
  getInstance(id: string): WorkflowInstance | undefined {
    return this.instances.get(id)
  }

  /**
   * 停止工作流
   */
  async stopWorkflow(id: string): Promise<void> {
    const instance = this.instances.get(id)
    if (instance && instance.status === 'running') {
      instance.status = 'cancelled'
      instance.completedAt = Date.now()
      logger.info(`[WorkflowEngine] 工作流已停止: ${instance.name}`)
    }
  }
}

// 导出单例
let instance: WorkflowEngine | null = null

export function getWorkflowEngine(): WorkflowEngine {
  if (!instance) {
    instance = new WorkflowEngine()
  }
  return instance
}


