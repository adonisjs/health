/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import stringHelpers from '@poppinss/utils/string'
import os from 'node:os'
import { Result } from '../result.ts'
import { BaseCheck } from '../base_check.ts'
import type { HealthCheckResult } from '../types.ts'

/**
 * Checks for the memory RSS size and report warning or error after a
 * certain threshold is exceeded. Thresholds can be defined as absolute
 * byte values or as percentages of the total system memory.
 *
 * @example
 * ```typescript
 * // Using byte thresholds
 * const rssCheckBytes = new MemoryRSSCheck()
 *   .as('RSS memory usage check (bytes)')
 *   .warnWhenExceeds('300 mb')
 *   .failWhenExceeds('400 mb')
 *   .cacheFor('1 minute')
 *
 * // Using percentage thresholds
 * const rssCheckPercentage = new MemoryRSSCheck()
 *   .as('RSS memory usage check (percentage)')
 *   .warnWhenExceedsPercentage(70) // Warning at 70% of total system RAM
 *   .failWhenExceedsPercentage(85) // Error at 85% of total system RAM
 *   .cacheFor('1 minute')
 *
 * const resultBytes = await rssCheckBytes.run()
 * console.log(resultBytes.status) // 'ok' | 'warning' | 'error'
 *
 * const resultPercentage = await rssCheckPercentage.run()
 * console.log(resultPercentage.status) // 'ok' | 'warning' | 'error'
 * ```
 */
export class MemoryRSSCheck extends BaseCheck {
  /**
   * The warning threshold for RSS memory usage in bytes.
   * Null if percentage threshold is active.
   */
  #warnThresholdBytes: number | null = stringHelpers.bytes.parse('320 mb')

  /**
   * The failure threshold for RSS memory usage in bytes.
   * Null if percentage threshold is active.
   */
  #failThresholdBytes: number | null = stringHelpers.bytes.parse('350 mb')

  /**
   * The warning threshold percentage for RSS memory usage.
   * Null if byte threshold is active.
   */
  #warnThresholdPercentage: number | null = null

  /**
   * The failure threshold percentage for RSS memory usage.
   * Null if byte threshold is active.
   */
  #failThresholdPercentage: number | null = null

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
   * Define the RSS threshold after which a warning
   * should be created. This method sets a byte-based threshold.
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
    const parsedValue = stringHelpers.bytes.parse(value)
    if (parsedValue === null) {
      throw new Error(`Invalid byte value for warnWhenExceeds: ${value}`)
    }
    this.#warnThresholdBytes = parsedValue
    this.#warnThresholdPercentage = null
    return this
  }

  /**
   * Define the RSS threshold after which an error
   * should be created. This method sets a byte-based threshold.
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
    const parsedValue = stringHelpers.bytes.parse(value)
    if (parsedValue === null) {
      throw new Error(`Invalid byte value for failWhenExceeds: ${value}`)
    }
    this.#failThresholdBytes = parsedValue
    this.#failThresholdPercentage = null
    return this
  }

  /**
   * Define the percentage threshold after which a warning
   * should be created. This method sets a percentage-based threshold.
   *
   * The value should be a number representing a percentage (0-100).
   *
   * @param valueInPercentage The percentage threshold for warnings
   */
  warnWhenExceedsPercentage(valueInPercentage: number) {
    if (valueInPercentage < 0 || valueInPercentage > 100) {
      throw new Error('Warn threshold percentage must be between 0 and 100.')
    }
    this.#warnThresholdPercentage = valueInPercentage
    this.#warnThresholdBytes = null
    return this
  }

  /**
   * Define the percentage threshold after which an error
   * should be created. This method sets a percentage-based threshold.
   *
   * The value should be a number representing a percentage (0-100).
   *
   * @param valueInPercentage The percentage threshold for errors
   */
  failWhenExceedsPercentage(valueInPercentage: number) {
    if (valueInPercentage < 0 || valueInPercentage > 100) {
      throw new Error('Fail threshold percentage must be between 0 and 100.')
    }
    this.#failThresholdPercentage = valueInPercentage
    this.#failThresholdBytes = null
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

    const isWarningThresholdPercentageSet = this.#warnThresholdPercentage !== null
    const isFailureThresholdPercentageSet = this.#failThresholdPercentage !== null

    const compareAsPercentage = isWarningThresholdPercentageSet || isFailureThresholdPercentageSet

    let actualWarnThreshold: number
    let actualFailThreshold: number
    let valueToCompare: number

    let totalSystemMemory: number | null = null
    let usedPercentage: number | null = null

    if (compareAsPercentage) {
      totalSystemMemory = os.totalmem()

      if (totalSystemMemory === 0) {
        return Result.failed('Cannot determine total system memory (0 bytes).').mergeMetaData({
          memoryInBytes: {
            used: rss,
            totalSystemMemory: totalSystemMemory,
          },
        })
      }

      usedPercentage = Math.floor((rss / totalSystemMemory) * 100)
      valueToCompare = usedPercentage

      if (this.#warnThresholdPercentage !== null) {
        actualWarnThreshold = this.#warnThresholdPercentage
      } else if (this.#warnThresholdBytes !== null) {
        actualWarnThreshold = Math.floor((this.#warnThresholdBytes / totalSystemMemory) * 100)
      } else {
        return Result.failed(
          'Warning threshold for percentage comparison is missing.'
        ).mergeMetaData({})
      }

      if (this.#failThresholdPercentage !== null) {
        actualFailThreshold = this.#failThresholdPercentage
      } else if (this.#failThresholdBytes !== null) {
        actualFailThreshold = Math.floor((this.#failThresholdBytes / totalSystemMemory) * 100)
      } else {
        return Result.failed(
          'Failure threshold for percentage comparison is missing.'
        ).mergeMetaData({})
      }
    } else {
      valueToCompare = rss

      if (this.#warnThresholdBytes === null) {
        return Result.failed('Warning threshold (bytes) is missing.').mergeMetaData({})
      }
      actualWarnThreshold = this.#warnThresholdBytes

      if (this.#failThresholdBytes === null) {
        return Result.failed('Failure threshold (bytes) is missing.').mergeMetaData({})
      }
      actualFailThreshold = this.#failThresholdBytes
    }

    const metaData: Record<string, any> = {}

    if (compareAsPercentage) {
      metaData.sizeInPercentage = {
        used: usedPercentage,
        failureThreshold: actualFailThreshold,
        warningThreshold: actualWarnThreshold,
      }
      if (totalSystemMemory !== null) {
        metaData.memoryInBytes = {
          used: rss,
          totalSystemMemory: totalSystemMemory,
          failureThreshold: Math.floor((actualFailThreshold / 100) * totalSystemMemory),
          warningThreshold: Math.floor((actualWarnThreshold / 100) * totalSystemMemory),
        }
      }
    } else {
      metaData.memoryInBytes = {
        used: rss,
        failureThreshold: actualFailThreshold,
        warningThreshold: actualWarnThreshold,
      }
    }

    if (valueToCompare >= actualFailThreshold) {
      const formattedUsed = compareAsPercentage
        ? `${valueToCompare}%`
        : stringHelpers.bytes.format(rss)
      const formattedThreshold = compareAsPercentage
        ? `${actualFailThreshold}%`
        : stringHelpers.bytes.format(actualFailThreshold)

      return Result.failed(
        `RSS usage is ${formattedUsed}, which is above the threshold of ${formattedThreshold}`
      ).mergeMetaData(metaData)
    }

    if (valueToCompare >= actualWarnThreshold) {
      const formattedUsed = compareAsPercentage
        ? `${valueToCompare}%`
        : stringHelpers.bytes.format(rss)
      const formattedThreshold = compareAsPercentage
        ? `${actualWarnThreshold}%`
        : stringHelpers.bytes.format(actualWarnThreshold)

      return Result.warning(
        `RSS usage is ${formattedUsed}, which is above the threshold of ${formattedThreshold}`
      ).mergeMetaData(metaData)
    }

    return Result.ok('RSS usage is under defined thresholds').mergeMetaData(metaData)
  }
}
