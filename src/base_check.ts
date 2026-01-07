/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import stringHelpers from '@poppinss/utils/string'
import type { HealthCheckContract, HealthCheckResult } from './types.ts'

/**
 * Base class with shared affordances to define a custom health check
 *
 * @example
 * ```typescript
 * class CustomCheck extends BaseCheck {
 *   name = 'Custom check'
 *
 *   async run() {
 *     // Your health check logic
 *     return Result.ok('Everything is working fine')
 *   }
 * }
 *
 * const check = new CustomCheck()
 *   .as('My custom health check')
 *   .cacheFor('30s')
 * ```
 */
export abstract class BaseCheck implements HealthCheckContract {
  /**
   * A unique name for the health check
   */
  declare abstract name: string

  /**
   * The cache duration for the check result in seconds
   */
  declare cacheDuration?: number

  /**
   * Define a custom unique name for the check
   *
   * @param name - The unique name for the health check
   *
   * @example
   * ```typescript
   * const check = new MyCheck().as('Database connection check')
   * ```
   */
  as(name: string): this {
    this.name = name
    return this
  }

  /**
   * Specify the duration for which the check results should be cached
   *
   * @param duration - The cache duration as a string (e.g., '5s', '1m') or number in seconds
   *
   * @example
   * ```typescript
   * const check = new MyCheck().cacheFor('5 minutes')
   * // or
   * const check2 = new MyCheck().cacheFor(300) // 300 seconds
   * ```
   */
  cacheFor(duration: string | number) {
    this.cacheDuration = stringHelpers.seconds.parse(duration)
    return this
  }

  /**
   * Executes the health check and returns the result.
   * Must be implemented by all health check classes
   */
  abstract run(): Promise<HealthCheckResult>
}
