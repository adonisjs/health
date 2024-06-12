/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import debug from './debug.js'
import { HealthCheckContract, HealthCheckReport, HealthCheckResult } from './types.js'

/**
 * The HealthChecks acts as a repository and a runner to register/execute
 * health checks.
 */
export class HealthChecks {
  /**
   * Registered health checks
   */
  #checks: HealthCheckContract[] = []

  /**
   * The cachedResults map is used to keep the results of a given
   * health check (only if caching for that check is enabled).
   */
  #cachedResults: Map<string, HealthCheckResult> = new Map()

  /**
   * Returns the debugging info of the process
   */
  #getDebugInfo(): HealthCheckReport['debugInfo'] {
    return {
      pid: process.pid,
      ppid: process.ppid,
      platform: process.platform,
      uptime: process.uptime(),
      version: process.version,
    }
  }

  /**
   * Executes the check and respects the caching layer as well
   */
  async #runCheck(
    check: HealthCheckContract
  ): Promise<HealthCheckResult & { name: string; isCached: boolean }> {
    if (check.cacheDuration) {
      const cachedResult = this.#cachedResults.get(check.name)
      const cacheMilliseconds = Math.floor(check.cacheDuration * 1000)

      /**
       * Return cached result when cache is fresh
       */
      if (cachedResult && Date.now() < cachedResult.finishedAt.getTime() + cacheMilliseconds) {
        debug('returning cached results for "%s" check', check.name, cachedResult)
        return {
          name: check.name,
          isCached: true,
          ...cachedResult,
        }
      }

      /**
       * Run check and cache result
       */
      const result = await check.run()
      debug('executed "%s" check', check.name, result)
      this.#cachedResults.set(check.name, result)

      return {
        name: check.name,
        isCached: false,
        ...result,
      }
    }

    /**
     * Execute the check without caching it.
     */
    const result = await check.run()
    debug('executed "%s" check', check.name, result)
    return {
      name: check.name,
      isCached: false,
      ...result,
    }
  }

  /**
   * Register health checks. Existing health checks will be
   * removed during the register method call
   */
  register(checks: HealthCheckContract[]) {
    this.#checks = checks
    return this
  }

  /**
   * Append new set of health checks
   */
  append(checks: HealthCheckContract[]) {
    this.#checks = this.#checks.concat(checks)
    return this
  }

  /**
   * Executes all the checks in parallel and returns the
   * health check report
   */
  async run(): Promise<HealthCheckReport> {
    let isHealthy: boolean = true
    let status: HealthCheckReport['status'] = 'ok'

    const checks = await Promise.all(
      this.#checks.map(async (check) => {
        const result = await this.#runCheck(check)
        if (result.status === 'error') {
          status = 'error'
          isHealthy = false
        } else if (status === 'ok' && result.status === 'warning') {
          status = 'warning'
        }

        return result
      })
    )

    const finishedAt = new Date()
    return {
      isHealthy,
      status,
      finishedAt,
      debugInfo: this.#getDebugInfo(),
      checks,
    }
  }
}
