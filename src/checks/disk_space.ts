/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import checkDiskSpace from 'check-disk-space'

import { Result } from '../result.js'
import { BaseCheck } from '../base_check.js'
import type { HealthCheckResult } from '../types.js'

/**
 * Checks for the disk space and report warning and errors after a
 * certain threshold is exceeded.
 */
export class DiskSpaceHealthCheck extends BaseCheck {
  #warnThreshold: number = 75
  #failThreshold: number = 80
  #computeFn: () => Promise<{ free: number; size: number }> = () => {
    // @ts-expect-error "Broken typings"
    return checkDiskSpace(this.diskPath)
  }

  name: string = 'Disk space check'
  diskPath = process.platform === 'win32' ? 'C:\\' : '/'

  /**
   * Define the percentage threshold after which a
   * warning should be created
   */
  warnWhenExceeds(valueInPercentage: number) {
    this.#warnThreshold = valueInPercentage
    return this
  }

  /**
   * Define the percentage threshold after which an
   * error should be created
   */
  failWhenExceeds(valueInPercentage: number) {
    this.#failThreshold = valueInPercentage
    return this
  }

  /**
   * Define a custom callback to compute the disk space. Defaults to
   * using "check-disk-space" package
   */
  compute(callback: () => Promise<{ free: number; size: number }>): this {
    this.#computeFn = callback
    return this
  }

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
