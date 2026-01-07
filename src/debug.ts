/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { debuglog } from 'node:util'

/**
 * Debug logger for the health module.
 * Enable by setting the NODE_DEBUG=adonisjs:health environment variable
 *
 * @example
 * ```typescript
 * // Enable debug logging
 * // NODE_DEBUG=adonisjs:health node app.js
 *
 * debug('Health check executed: %s', checkName)
 * ```
 */
export default debuglog('adonisjs:health')
