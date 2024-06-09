/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import stringHelpers from '@poppinss/utils/string'
import type { HealthCheckContract, HealthCheckResult } from './types.js'

/**
 * BaseCheck with shared affordances to define a custom health
 * check
 */
export abstract class BaseCheck implements HealthCheckContract {
  declare abstract name: string
  declare cacheDuration?: number

  /**
   * Define a custom unique name for the check
   */
  as(name: string): this {
    this.name = name
    return this
  }

  /**
   * Specify the duration for which the check should be
   * cached for
   */
  cacheFor(duration: string | number) {
    this.cacheDuration = stringHelpers.seconds.parse(duration)
    return this
  }

  abstract run(): Promise<HealthCheckResult>
}
