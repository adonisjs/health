/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import os from 'node:os'
import { mock } from 'node:test'
import { MemoryRSSCheck } from '../../src/checks/rss_check.ts'
import stringHelpers from '@poppinss/utils/string'

const totalSystemMemory = stringHelpers.bytes.parse('4GB') as number

test.group('Memory RSS - byte threshold', (group) => {
  group.each.setup(() => {
    mock.method(os, 'totalmem', () => {
      return totalSystemMemory
    })

    return () => {
      mock.reset()
    }
  })

  test('report error when RSS exceeds the define error threshold', async ({ expect }) => {
    const rssHealthCheck = new MemoryRSSCheck().failWhenExceeds('1mb')

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
    const rssHealthCheck = new MemoryRSSCheck().warnWhenExceeds('1mb')

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
    const rssHealthCheck = new MemoryRSSCheck()

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

test.group('Memory RSS - percentage threshold', (group) => {
  group.each.setup(() => {
    mock.method(os, 'totalmem', () => {
      return totalSystemMemory
    })

    return () => {
      mock.reset()
    }
  })

  test('report error when RSS exceeds the defined error threshold', async ({ expect }) => {
    const errorPercentageThreshold = 90
    const warningPercentageThreshold = 75
    const rssUsedBytes = Math.floor((errorPercentageThreshold / 100) * totalSystemMemory) + 1

    mock.method(process, 'memoryUsage', () => {
      return {
        rss: rssUsedBytes,
        heapTotal: 0,
        heapUsed: 0,
        external: 0,
        arrayBuffers: 0,
      }
    })

    const rssHealthCheck = new MemoryRSSCheck()
      .failWhenExceedsPercentage(errorPercentageThreshold)
      .warnWhenExceedsPercentage(warningPercentageThreshold)

    const result = await rssHealthCheck.run()
    const usedPercentage = Math.floor((rssUsedBytes / totalSystemMemory) * 100)

    expect(result.status).toEqual('error')
    expect(result.message).toEqual(
      `RSS usage is ${usedPercentage}%, which is above the threshold of ${errorPercentageThreshold}%`
    )
    expect(result.finishedAt).toEqual(expect.any(Date))
    expect(result.meta).toEqual({
      sizeInPercentage: {
        used: usedPercentage,
        failureThreshold: errorPercentageThreshold,
        warningThreshold: warningPercentageThreshold,
      },
      memoryInBytes: {
        used: rssUsedBytes,
        totalSystemMemory: totalSystemMemory,
        failureThreshold: Math.floor((errorPercentageThreshold / 100) * totalSystemMemory),
        warningThreshold: Math.floor((warningPercentageThreshold / 100) * totalSystemMemory),
      },
    })
  })

  test('report warning when RSS exceeds the defined warning threshold', async ({ expect }) => {
    const warningPercentageThreshold = 80
    const errorPercentageThreshold = 90
    const rssUsedBytes = Math.floor((warningPercentageThreshold / 100) * totalSystemMemory) + 1

    mock.method(process, 'memoryUsage', () => {
      return {
        rss: rssUsedBytes,
        heapTotal: 0,
        heapUsed: 0,
        external: 0,
        arrayBuffers: 0,
      }
    })

    const rssHealthCheck = new MemoryRSSCheck()
      .warnWhenExceedsPercentage(warningPercentageThreshold)
      .failWhenExceedsPercentage(errorPercentageThreshold)

    const result = await rssHealthCheck.run()
    const usedPercentage = Math.floor((rssUsedBytes / totalSystemMemory) * 100)

    expect(result.status).toEqual('warning')
    expect(result.message).toEqual(
      `RSS usage is ${usedPercentage}%, which is above the threshold of ${warningPercentageThreshold}%`
    )
    expect(result.finishedAt).toEqual(expect.any(Date))
    expect(result.meta).toEqual({
      sizeInPercentage: {
        used: usedPercentage,
        failureThreshold: errorPercentageThreshold,
        warningThreshold: warningPercentageThreshold,
      },
      memoryInBytes: {
        used: rssUsedBytes,
        totalSystemMemory: totalSystemMemory,
        failureThreshold: Math.floor((errorPercentageThreshold / 100) * totalSystemMemory),
        warningThreshold: Math.floor((warningPercentageThreshold / 100) * totalSystemMemory),
      },
    })
  })

  test('prepare ok result when RSS usage is under defined thresholds', async ({ expect }) => {
    const warningPercentageThreshold = 75
    const errorPercentageThreshold = 80
    const rssUsedBytes = Math.floor((warningPercentageThreshold / 100) * totalSystemMemory) - 1

    mock.method(process, 'memoryUsage', () => {
      return {
        rss: rssUsedBytes,
        heapTotal: 0,
        heapUsed: 0,
        external: 0,
        arrayBuffers: 0,
      }
    })

    const rssHealthCheck = new MemoryRSSCheck()
      .warnWhenExceedsPercentage(warningPercentageThreshold)
      .failWhenExceedsPercentage(errorPercentageThreshold)

    const result = await rssHealthCheck.run()
    const usedPercentage = Math.floor((rssUsedBytes / totalSystemMemory) * 100)

    expect(result.status).toEqual('ok')
    expect(result.message).toEqual('RSS usage is under defined thresholds')
    expect(result.finishedAt).toEqual(expect.any(Date))
    expect(result.meta).toEqual({
      sizeInPercentage: {
        used: usedPercentage,
        failureThreshold: errorPercentageThreshold,
        warningThreshold: warningPercentageThreshold,
      },
      memoryInBytes: {
        used: rssUsedBytes,
        totalSystemMemory: totalSystemMemory,
        failureThreshold: Math.floor((errorPercentageThreshold / 100) * totalSystemMemory),
        warningThreshold: Math.floor((warningPercentageThreshold / 100) * totalSystemMemory),
      },
    })
  })
})
