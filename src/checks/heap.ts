/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import stringHelpers from '@poppinss/utils/string'

import { Result } from '../result.js'
import { BaseCheck } from '../base_check.js'
import type { HealthCheckResult } from '../types.js'

/**
 * Checks for the memory heap size and report warning and errors after a
 * certain threshold is exceeded.
 */
export class MemoryHeapHealthCheck extends BaseCheck {
  #warnThreshold: number = stringHelpers.bytes.parse('150 mb')
  #failThreshold: number = stringHelpers.bytes.parse('300 mb')
  #computeFn: () => NodeJS.MemoryUsage = () => {
    return process.memoryUsage()
  }

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
   */
  warnWhenExceeds(value: string | number) {
    this.#warnThreshold = stringHelpers.bytes.parse(value)
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
   */
  failWhenExceeds(value: string | number) {
    this.#failThreshold = stringHelpers.bytes.parse(value)
    return this
  }

  /**
   * Define a custom callback to compute the heap size. Defaults to
   * using "process.memoryUsage()" method call
   */
  compute(callback: () => NodeJS.MemoryUsage): this {
    this.#computeFn = callback
    return this
  }

  async run(): Promise<HealthCheckResult> {
    const { heapUsed } = this.#computeFn()

    if (heapUsed > this.#failThreshold) {
      return Result.failed(
        `Heap usage exceeded the "${stringHelpers.bytes.format(this.#failThreshold)}" threshold`
      ).mergeMetaData({
        bytes: {
          used: heapUsed,
          threshold: this.#failThreshold,
        },
      })
    }

    if (heapUsed > this.#warnThreshold) {
      return Result.warning(
        `Heap usage exceeded the "${stringHelpers.bytes.format(this.#warnThreshold)}" threshold`
      ).mergeMetaData({
        bytes: {
          used: heapUsed,
          threshold: this.#warnThreshold,
        },
      })
    }

    return Result.ok('Heap usage is under defined thresholds').mergeMetaData({
      bytes: {
        used: heapUsed,
      },
    })
  }
}
