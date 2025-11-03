/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import v8 from 'node:v8'
import { Result } from '../result.ts'
import { BaseCheck } from '../base_check.ts'
import type { HealthCheckResult } from '../types.ts'

/**
 * Checks for the memory heap size and report warning or error after a
 * certain threshold is exceeded. Thresholds are defined as percentages
 * of the maximum V8 heap size limit for the Node.js process.
 *
 * @example
 * ```typescript
 * const heapCheck = new MemoryHeapCheck()
 *   .as('Heap memory usage check')
 *   .warnWhenExceeds(80) // Warning at 80% of max heap
 *   .failWhenExceeds(90) // Error at 90% of max heap
 *   .cacheFor('30s')
 *
 * const result = await heapCheck.run()
 * console.log(result.status) // 'ok' | 'warning' | 'error'
 * ```
 */
export class MemoryHeapCheck extends BaseCheck {
  /**
   * The warning threshold percentage for heap memory usage
   */
  #warnThreshold: number = 75

  /**
   * The failure threshold percentage for heap memory usage
   */
  #failThreshold: number = 80

  /**
   * Function to compute memory usage information
   */
  #computeFn: () => NodeJS.MemoryUsage = () => {
    return process.memoryUsage()
  }

  /**
   * The name of the memory heap check
   */
  name: string = 'Memory heap check'

  /**
   * Define the percentage threshold after which a warning
   * should be created.
   *
   * The value should be a number representing a percentage (0-100).
   *
   * @param valueInPercentage The percentage threshold for warnings
   */
  warnWhenExceeds(valueInPercentage: number) {
    this.#warnThreshold = valueInPercentage
    return this
  }

  /**
   * Define the percentage threshold after which an error
   * should be created.
   *
   * The value should be a number representing a percentage (0-100).
   *
   * @param valueInPercentage The percentage threshold for errors
   */
  failWhenExceeds(valueInPercentage: number) {
    this.#failThreshold = valueInPercentage
    return this
  }

  /**
   * Define a custom callback to compute the heap size. Defaults to
   * using "process.memoryUsage()" method call
   *
   * @param callback Function that returns memory usage information
   *
   * @example
   * ```typescript
   * const heapCheck = new MemoryHeapCheck()
   *   .compute(() => {
   *     // Custom memory computation logic
   *     const usage = process.memoryUsage()
   *     return { ...usage, heapUsed: usage.heapUsed * 0.8 } // Custom adjustment
   *   })
   * ```
   */
  compute(callback: () => NodeJS.MemoryUsage): this {
    this.#computeFn = callback
    return this
  }

  /**
   * Executes the heap memory usage check
   */
  async run(): Promise<HealthCheckResult> {
    const { heapUsed } = this.#computeFn()
    const heapStatistics = v8.getHeapStatistics()
    const maxHeapSize = heapStatistics.heap_size_limit

    const usedPercentage = Math.floor((heapUsed / maxHeapSize) * 100)

    const metaData = {
      sizeInPercentage: {
        used: usedPercentage,
        failureThreshold: this.#failThreshold,
        warningThreshold: this.#warnThreshold,
      },
      heapInBytes: {
        used: heapUsed,
        maxHeapSize: maxHeapSize,
        failureThreshold: Math.floor((this.#failThreshold / 100) * maxHeapSize),
        warningThreshold: Math.floor((this.#warnThreshold / 100) * maxHeapSize),
      },
    }

    if (usedPercentage >= this.#failThreshold) {
      return Result.failed(
        `Heap usage is ${usedPercentage}%, which is above the threshold of ${this.#failThreshold}%`
      ).mergeMetaData(metaData)
    }

    if (usedPercentage >= this.#warnThreshold) {
      return Result.warning(
        `Heap usage is ${usedPercentage}%, which is above the threshold of ${this.#warnThreshold}%`
      ).mergeMetaData(metaData)
    }

    return Result.ok('Heap usage is under defined thresholds').mergeMetaData(metaData)
  }
}
