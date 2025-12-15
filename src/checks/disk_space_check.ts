/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import checkDiskSpace from 'check-disk-space'

import { Result } from '../result.ts'
import { BaseCheck } from '../base_check.ts'
import type { HealthCheckResult } from '../types.ts'

/**
 * Checks for the disk space and report warning or error after a
 * certain threshold is exceeded.
 *
 * @example
 * ```typescript
 * const diskCheck = new DiskSpaceCheck()
 *   .as('Root disk space check')
 *   .warnWhenExceeds(70)  // Warning at 70%
 *   .failWhenExceeds(85)  // Error at 85%
 *   .cacheFor('1 minute')
 *
 * const result = await diskCheck.run()
 * console.log(result.status) // 'ok' | 'warning' | 'error'
 * ```
 */
export class DiskSpaceCheck extends BaseCheck {
  /**
   * The warning threshold percentage for disk usage
   */
  #warnThreshold: number = 75

  /**
   * The failure threshold percentage for disk usage
   */
  #failThreshold: number = 80

  /**
   * Function to compute disk space information
   */
  #computeFn: () => Promise<{ free: number; size: number }> = () => {
    // @ts-expect-error "Broken typings"
    return checkDiskSpace(this.diskPath)
  }

  /**
   * The name of the disk space check
   */
  name: string = 'Disk space check'

  /**
   * The disk path to check for space usage
   */
  diskPath = process.platform === 'win32' ? 'C:\\' : '/'

  /**
   * Define the percentage threshold after which a
   * warning should be created
   *
   * @param valueInPercentage - The percentage threshold for warnings (0-100)
   *
   * @example
   * ```typescript
   * const diskCheck = new DiskSpaceCheck().warnWhenExceeds(70)
   * ```
   */
  warnWhenExceeds(valueInPercentage: number) {
    this.#warnThreshold = valueInPercentage
    return this
  }

  /**
   * Define the percentage threshold after which an
   * error should be created
   *
   * @param valueInPercentage - The percentage threshold for errors (0-100)
   *
   * @example
   * ```typescript
   * const diskCheck = new DiskSpaceCheck().failWhenExceeds(85)
   * ```
   */
  failWhenExceeds(valueInPercentage: number) {
    this.#failThreshold = valueInPercentage
    return this
  }

  /**
   * Define a custom callback to compute the disk space. Defaults to
   * using "check-disk-space" package
   *
   * @param callback - Function that returns disk space information
   *
   * @example
   * ```typescript
   * const diskCheck = new DiskSpaceCheck()
   *   .compute(async () => {
   *     // Custom disk space computation
   *     return { free: 1000000000, size: 5000000000 } // 1GB free, 5GB total
   *   })
   * ```
   */
  compute(callback: () => Promise<{ free: number; size: number }>): this {
    this.#computeFn = callback
    return this
  }

  /**
   * Executes the disk space usage check
   */
  async run(): Promise<HealthCheckResult> {
    const { free, size } = await this.#computeFn()
    const usedPercentage = Math.floor(((size - free) / size) * 100)
    const metaData = {
      sizeInPercentage: {
        used: usedPercentage,
        failureThreshold: this.#failThreshold,
        warningThreshold: this.#warnThreshold,
      },
    }

    if (usedPercentage >= this.#failThreshold) {
      return Result.failed(
        `Disk usage is ${usedPercentage}%, which is above the threshold of ${this.#failThreshold}%`
      ).mergeMetaData(metaData)
    }

    if (usedPercentage >= this.#warnThreshold) {
      return Result.warning(
        `Disk usage is ${usedPercentage}%, which is above the threshold of ${this.#warnThreshold}%`
      ).mergeMetaData(metaData)
    }

    return Result.ok('Disk usage is under defined thresholds').mergeMetaData(metaData)
  }
}
