/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import os from 'node:os'
import { Result } from '../result.ts'
import { BaseCheck } from '../base_check.ts'
import type { HealthCheckResult } from '../types.ts'

/**
 * Checks for the memory RSS size and report warning or error after a
 * certain threshold is exceeded. Thresholds are defined as percentages
 * of the total system memory.
 *
 * @example
 * ```typescript
 * const rssCheck = new MemoryRSSCheck()
 *   .as('RSS memory usage check')
 *   .warnWhenExceeds(70) // Warning at 70% of total system RAM
 *   .failWhenExceeds(85) // Error at 85% of total system RAM
 *   .cacheFor('1 minute')
 *
 * const result = await rssCheck.run()
 * console.log(result.status) // 'ok' | 'warning' | 'error'
 * ```
 */
export class MemoryRSSCheck extends BaseCheck {
  /**
   * The warning threshold percentage for RSS memory usage
   */
  #warnThreshold: number = 75

  /**
   * The failure threshold percentage for RSS memory usage
   */
  #failThreshold: number = 80

  /**
   * Function to compute memory usage information
   */
  #computeFn: () => NodeJS.MemoryUsage = () => {
    return process.memoryUsage()
  }

  /**
   * The name of the memory RSS check
   */
  name: string = 'Memory RSS check'

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
   * Define a custom callback to compute the RSS size. Defaults to
   * using "process.memoryUsage()" method call
   *
   * @param callback Function that returns memory usage information
   *
   * @example
   * ```typescript
   * const rssCheck = new MemoryRSSCheck()
   *   .compute(() => {
   *     // Custom RSS computation logic
   *     const usage = process.memoryUsage()
   *     return { ...usage, rss: usage.rss * 0.9 } // Custom adjustment
   *   })
   * ```
   */
  compute(callback: () => NodeJS.MemoryUsage): this {
    this.#computeFn = callback
    return this
  }

  /**
   * Executes the RSS memory usage check
   */
  async run(): Promise<HealthCheckResult> {
    const { rss } = this.#computeFn()
    const totalSystemMemory = os.totalmem()

    const usedPercentage = Math.floor((rss / totalSystemMemory) * 100)

    const metaData = {
      sizeInPercentage: {
        used: usedPercentage,
        failureThreshold: this.#failThreshold,
        warningThreshold: this.#warnThreshold,
      },
      memoryInBytes: {
        used: rss,
        totalSystemMemory: totalSystemMemory,
        failureThreshold: Math.floor((this.#failThreshold / 100) * totalSystemMemory),
        warningThreshold: Math.floor((this.#warnThreshold / 100) * totalSystemMemory),
      },
    }

    if (usedPercentage >= this.#failThreshold) {
      return Result.failed(
        `RSS usage is ${usedPercentage}%, which is above the threshold of ${this.#failThreshold}%`
      ).mergeMetaData(metaData)
    }

    if (usedPercentage >= this.#warnThreshold) {
      return Result.warning(
        `RSS usage is ${usedPercentage}%, which is above the threshold of ${this.#warnThreshold}%`
      ).mergeMetaData(metaData)
    }

    return Result.ok('RSS usage is under defined thresholds').mergeMetaData(metaData)
  }
}
