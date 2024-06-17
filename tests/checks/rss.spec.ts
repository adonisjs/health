/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { MemoryRSSHealthCheck } from '../../src/checks/rss.js'

test.group('Memory RSS', () => {
  test('report error when RSS exceeds the define error threshold', async ({ expect }) => {
    const rssHealthCheck = new MemoryRSSHealthCheck().failWhenExceeds('1mb')

    expect(await rssHealthCheck.run()).toEqual({
      status: 'error',
      finishedAt: expect.any(Date),
      message: expect.any(String),
      meta: {
        memoryInBytes: {
          failureThreshold: 1048576,
          warningThreshold: 335544320,
          used: expect.any(Number),
        },
      },
    })
  })

  test('report warning when RSS exceeds the defined warning threshold', async ({ expect }) => {
    const rssHealthCheck = new MemoryRSSHealthCheck().warnWhenExceeds('1mb')

    expect(await rssHealthCheck.run()).toEqual({
      status: 'warning',
      finishedAt: expect.any(Date),
      message: expect.any(String),
      meta: {
        memoryInBytes: {
          failureThreshold: 367001600,
          warningThreshold: 1048576,
          used: expect.any(Number),
        },
      },
    })
  })

  test('prepare ok result when RSS usage is under defined thresholds', async ({ expect }) => {
    const rssHealthCheck = new MemoryRSSHealthCheck()

    expect(await rssHealthCheck.run()).toEqual({
      status: 'ok',
      finishedAt: expect.any(Date),
      message: 'RSS usage is under defined thresholds',
      meta: {
        memoryInBytes: {
          failureThreshold: 367001600,
          warningThreshold: 335544320,
          used: expect.any(Number),
        },
      },
    })
  })
})
