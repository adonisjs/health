/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import stringHelpers from '@poppinss/utils/string'

import { Result } from '../result.ts'
import { BaseCheck } from '../base_check.ts'
import type { HealthCheckResult } from '../types.ts'

/**
 * Checks for the memory heap size and report warning or error after a
 * certain threshold is exceeded.
 *
 * @example
 * ```typescript
 * const heapCheck = new MemoryHeapCheck()
 *   .as('Heap memory usage check')
 *   .warnWhenExceeds('200 mb')
 *   .failWhenExceeds('300 mb')
 *   .cacheFor('30s')
 *
 * const result = await heapCheck.run()
 * console.log(result.status) // 'ok' | 'warning' | 'error'
 * ```
 */
export class MemoryHeapCheck extends BaseCheck {
  /**
   * The warning threshold for heap memory usage in bytes
   */
  #warnThreshold: number = stringHelpers.bytes.parse('250 mb')!

  /**
   * The failure threshold for heap memory usage in bytes
   */
  #failThreshold: number = stringHelpers.bytes.parse('300 mb')!

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
   * Define the heap threshold after which a warning
   * should be created.
   *
   * - The value should be either a number in bytes
   * - Or it should be a value expression in string.
   *
   * ```
   * .warnWhenExceeds('200 mb')
   * ```
   *
   * @param value The threshold value as bytes (number) or string expression
   */
  warnWhenExceeds(value: string | number) {
    this.#warnThreshold = stringHelpers.bytes.parse(value)!
    return this
  }

  /**
   * Define the heap threshold after which an error
   * should be created.
   *
   * - The value should be either a number in bytes
   * - Or it should be a value expression in string.
   *
   * ```
   * .failWhenExceeds('500 mb')
   * ```
   *
   * @param value The threshold value as bytes (number) or string expression
   */
  failWhenExceeds(value: string | number) {
    this.#failThreshold = stringHelpers.bytes.parse(value)!
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
    const metaData = {
      memoryInBytes: {
        used: heapUsed,
        failureThreshold: this.#failThreshold,
        warningThreshold: this.#warnThreshold,
      },
    }

    if (heapUsed > this.#failThreshold) {
      return Result.failed(
        `Heap usage is ${stringHelpers.bytes.format(heapUsed)}, which is above the threshold of ${stringHelpers.bytes.format(this.#failThreshold)}`
      ).mergeMetaData(metaData)
    }

    if (heapUsed > this.#warnThreshold) {
      return Result.warning(
        `Heap usage is ${stringHelpers.bytes.format(heapUsed)}, which is above the threshold of ${stringHelpers.bytes.format(this.#warnThreshold)}`
      ).mergeMetaData(metaData)
    }

    return Result.ok('Heap usage is under defined thresholds').mergeMetaData(metaData)
  }
}
