/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import diagnostics_channel from 'node:diagnostics_channel'
import { type HealthCheckTracingData } from './types.ts'

/**
 * Diagnostic tracing channel for health check execution.
 * Subscribe to this channel to monitor health check lifecycle events
 *
 * @example
 * ```typescript
 * healthCheck.subscribe({
 *   start(data) {
 *     console.log(`Starting health check: ${data.check.name}`)
 *   },
 *   end(data, result) {
 *     console.log(`Finished health check: ${data.check.name}`, result)
 *   },
 *   error(data, error) {
 *     console.error(`Health check failed: ${data.check.name}`, error)
 *   }
 * })
 * ```
 */
export const healthCheck = diagnostics_channel.tracingChannel<
  'adonisjs.health.check',
  HealthCheckTracingData
>('adonisjs.health.check')
