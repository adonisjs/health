/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import stringHelpers from '@poppinss/utils/string'
import v8 from 'node:v8'

import { Result } from '../result.ts'
import { BaseCheck } from '../base_check.ts'
import type { HealthCheckResult } from '../types.ts'

/**
 * Checks for the memory heap size and report warning or error after a
 * certain threshold is exceeded. Thresholds can be defined as absolute
 * byte values or as percentages of the maximum V8 heap size limit.
 *
 * @example
 * ```typescript
 * // Using byte thresholds
 * const heapCheckBytes = new MemoryHeapCheck()
 *   .as('Heap memory usage check (bytes)')
 *   .warnWhenExceeds('200 mb')
 *   .failWhenExceeds('300 mb')
 *   .cacheFor('30s')
 *
 * // Using percentage thresholds
 * const heapCheckPercentage = new MemoryHeapCheck()
 *   .as('Heap memory usage check (percentage)')
 *   .warnWhenExceedsPercentage(80) // Warning at 80% of max heap
 *   .failWhenExceedsPercentage(90) // Error at 90% of max heap
 *   .cacheFor('30s')
 *
 * const resultBytes = await heapCheckBytes.run()
 * console.log(resultBytes.status) // 'ok' | 'warning' | 'error'
 *
 * const resultPercentage = await heapCheckPercentage.run()
 * console.log(resultPercentage.status) // 'ok' | 'warning' | 'error'
 * ```
 */
export class MemoryHeapCheck extends BaseCheck {
  /**
   * The warning threshold for heap memory usage in bytes.
   * Null if percentage threshold is active.
   */
  #warnThresholdBytes: number | null = stringHelpers.bytes.parse('250 mb')

  /**
   * The failure threshold for heap memory usage in bytes.
   * Null if percentage threshold is active.
   */
  #failThresholdBytes: number | null = stringHelpers.bytes.parse('300 mb')

  /**
   * The warning threshold percentage for heap memory usage.
   * Null if byte threshold is active.
   */
  #warnThresholdPercentage: number | null = null

  /**
   * The failure threshold percentage for heap memory usage.
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
   * The name of the memory heap check
   */
  name: string = 'Memory heap check'

  /**
   * Define the heap threshold after which a warning
   * should be created. This method sets a byte-based threshold.
   *
   * The value should be either a number in bytes or a value expression string.
   *
   * @param value - The threshold value as bytes (number) or string expression (e.g., '200 mb')
   *
   * @example
   * ```typescript
   * const check = new MemoryHeapCheck().warnWhenExceeds('200 mb')
   * // or
   * const check2 = new MemoryHeapCheck().warnWhenExceeds(209715200) // 200 MB in bytes
   * ```
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
   * Define the heap threshold after which an error
   * should be created. This method sets a byte-based threshold.
   *
   * The value should be either a number in bytes or a value expression string.
   *
   * @param value - The threshold value as bytes (number) or string expression (e.g., '500 mb')
   *
   * @example
   * ```typescript
   * const check = new MemoryHeapCheck().failWhenExceeds('500 mb')
   * // or
   * const check2 = new MemoryHeapCheck().failWhenExceeds(524288000) // 500 MB in bytes
   * ```
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
   * should be created. This method sets a percentage-based threshold
   * relative to the V8 heap size limit.
   *
   * @param valueInPercentage - The percentage threshold for warnings (0-100)
   *
   * @example
   * ```typescript
   * const check = new MemoryHeapCheck().warnWhenExceedsPercentage(80)
   * ```
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
   * should be created. This method sets a percentage-based threshold
   * relative to the V8 heap size limit.
   *
   * @param valueInPercentage - The percentage threshold for errors (0-100)
   *
   * @example
   * ```typescript
   * const check = new MemoryHeapCheck().failWhenExceedsPercentage(90)
   * ```
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
   * Define a custom callback to compute the heap size. Defaults to
   * using "process.memoryUsage()" method call
   *
   * @param callback - Function that returns memory usage information
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

    const isWarningThresholdPercentageSet = this.#warnThresholdPercentage !== null
    const isFailureThresholdPercentageSet = this.#failThresholdPercentage !== null

    const compareAsPercentage = isWarningThresholdPercentageSet || isFailureThresholdPercentageSet

    let actualWarnThreshold: number
    let actualFailThreshold: number
    let valueToCompare: number

    let maxHeapSize: number | null = null
    let usedPercentage: number | null = null

    if (compareAsPercentage) {
      const heapStatistics = v8.getHeapStatistics()
      maxHeapSize = heapStatistics.heap_size_limit

      usedPercentage = Math.floor((heapUsed / maxHeapSize) * 100)
      valueToCompare = usedPercentage

      if (this.#warnThresholdPercentage !== null) {
        actualWarnThreshold = this.#warnThresholdPercentage
      } else if (this.#warnThresholdBytes !== null) {
        actualWarnThreshold = Math.floor((this.#warnThresholdBytes / maxHeapSize) * 100)
      } else {
        return Result.failed(
          'Warning threshold for percentage comparison is missing.'
        ).mergeMetaData({})
      }

      if (this.#failThresholdPercentage !== null) {
        actualFailThreshold = this.#failThresholdPercentage
      } else if (this.#failThresholdBytes !== null) {
        actualFailThreshold = Math.floor((this.#failThresholdBytes / maxHeapSize) * 100)
      } else {
        return Result.failed(
          'Failure threshold for percentage comparison is missing.'
        ).mergeMetaData({})
      }
    } else {
      valueToCompare = heapUsed

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
      if (maxHeapSize !== null) {
        metaData.heapInBytes = {
          used: heapUsed,
          maxHeapSize: maxHeapSize,
          failureThreshold: Math.floor((actualFailThreshold / 100) * maxHeapSize),
          warningThreshold: Math.floor((actualWarnThreshold / 100) * maxHeapSize),
        }
      }
    } else {
      metaData.memoryInBytes = {
        used: heapUsed,
        failureThreshold: actualFailThreshold,
        warningThreshold: actualWarnThreshold,
      }
    }

    if (valueToCompare >= actualFailThreshold) {
      const formattedUsed = compareAsPercentage
        ? `${valueToCompare}%`
        : stringHelpers.bytes.format(heapUsed)
      const formattedThreshold = compareAsPercentage
        ? `${actualFailThreshold}%`
        : stringHelpers.bytes.format(actualFailThreshold)

      return Result.failed(
        `Heap usage is ${formattedUsed}, which is above the threshold of ${formattedThreshold}`
      ).mergeMetaData(metaData)
    }

    if (valueToCompare >= actualWarnThreshold) {
      const formattedUsed = compareAsPercentage
        ? `${valueToCompare}%`
        : stringHelpers.bytes.format(heapUsed)
      const formattedThreshold = compareAsPercentage
        ? `${actualWarnThreshold}%`
        : stringHelpers.bytes.format(actualWarnThreshold)

      return Result.warning(
        `Heap usage is ${formattedUsed}, which is above the threshold of ${formattedThreshold}`
      ).mergeMetaData(metaData)
    }

    return Result.ok('Heap usage is under defined thresholds').mergeMetaData(metaData)
  }
}
