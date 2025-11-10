/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import v8 from 'node:v8'
import { mock } from 'node:test'
import { MemoryHeapCheck } from '../../src/checks/heap_check.ts'
import stringHelpers from '@poppinss/utils/string'

const maximumHeapSize = stringHelpers.bytes.parse('250 mb') as number

test.group('Memory Heap - byte thresholds', (group) => {
  group.each.setup(() => {
    mock.method(v8, 'getHeapStatistics', () => {
      return {
        heap_size_limit: maximumHeapSize,
        total_heap_size: 0,
        total_heap_size_executable: 0,
        total_physical_size: 0,
        total_available_size: 0,
        used_heap_size: 0,
        malloced_memory: 0,
        peak_malloced_memory: 0,
        does_zap_garbage: 0,
        number_of_native_context: 0,
        number_of_detached_context: 0,
      }
    })

    return () => {
      mock.reset()
    }
  })

  test('report error when heap usage exceeds the define error threshold', async ({ expect }) => {
    const heapHealthCheck = new MemoryHeapCheck().failWhenExceeds('1mb')

    expect(await heapHealthCheck.run()).toEqual({
      status: 'error',
      finishedAt: expect.any(Date),
      message: expect.any(String),
      meta: {
        memoryInBytes: {
          failureThreshold: 1048576,
          warningThreshold: 262144000,
          used: expect.any(Number),
        },
      },
    })
  })

  test('report warning when heap usage exceeds the defined warning threshold', async ({
    expect,
  }) => {
    const heapHealthCheck = new MemoryHeapCheck().warnWhenExceeds('1mb')

    expect(await heapHealthCheck.run()).toEqual({
      status: 'warning',
      finishedAt: expect.any(Date),
      message: expect.any(String),
      meta: {
        memoryInBytes: {
          failureThreshold: 314572800,
          warningThreshold: 1048576,
          used: expect.any(Number),
        },
      },
    })
  })

  test('prepare ok result when heap usage is under defined thresholds', async ({ expect }) => {
    const heapHealthCheck = new MemoryHeapCheck()

    expect(await heapHealthCheck.run()).toEqual({
      status: 'ok',
      finishedAt: expect.any(Date),
      message: 'Heap usage is under defined thresholds',
      meta: {
        memoryInBytes: {
          failureThreshold: 314572800,
          warningThreshold: 262144000,
          used: expect.any(Number),
        },
      },
    })
  })
})

test.group('Memory Heap - percentage threshold', (group) => {
  group.each.setup(() => {
    mock.method(v8, 'getHeapStatistics', () => {
      return {
        heap_size_limit: maximumHeapSize,
        total_heap_size: 0,
        total_heap_size_executable: 0,
        total_physical_size: 0,
        total_available_size: 0,
        used_heap_size: 0,
        malloced_memory: 0,
        peak_malloced_memory: 0,
        does_zap_garbage: 0,
        number_of_native_context: 0,
        number_of_detached_context: 0,
      }
    })

    return () => {
      mock.reset()
    }
  })

  test('report error when heap usage exceeds the defined percentage error threshold', async ({
    expect,
  }) => {
    const errorPercentageThreshold = 90
    const warningPercentageThreshold = 75
    const heapUsedBytes = Math.floor((errorPercentageThreshold / 100) * maximumHeapSize) + 1

    mock.method(process, 'memoryUsage', () => {
      return {
        rss: 0,
        heapTotal: 0,
        heapUsed: heapUsedBytes,
        external: 0,
        arrayBuffers: 0,
      }
    })

    const heapHealthCheck = new MemoryHeapCheck()
      .warnWhenExceedsPercentage(warningPercentageThreshold)
      .failWhenExceedsPercentage(errorPercentageThreshold)

    const result = await heapHealthCheck.run()
    const usedPercentage = Math.floor((heapUsedBytes / maximumHeapSize) * 100)

    expect(result.status).toEqual('error')
    expect(result.message).toEqual(
      `Heap usage is ${usedPercentage}%, which is above the threshold of ${errorPercentageThreshold}%`
    )
    expect(result.finishedAt).toEqual(expect.any(Date))
    expect(result.meta).toEqual({
      sizeInPercentage: {
        used: usedPercentage,
        failureThreshold: errorPercentageThreshold,
        warningThreshold: warningPercentageThreshold,
      },
      heapInBytes: {
        used: heapUsedBytes,
        maxHeapSize: maximumHeapSize,
        failureThreshold: Math.floor((errorPercentageThreshold / 100) * maximumHeapSize),
        warningThreshold: Math.floor((warningPercentageThreshold / 100) * maximumHeapSize),
      },
    })
  })

  test('report warning when heap usage exceeds the defined percentage warning threshold', async ({
    expect,
  }) => {
    const warningPercentageThreshold = 80
    const errorPercentageThreshold = 90
    const heapUsedBytes = Math.floor((warningPercentageThreshold / 100) * maximumHeapSize) + 1

    mock.method(process, 'memoryUsage', () => {
      return {
        rss: 0,
        heapTotal: 0,
        heapUsed: heapUsedBytes,
        external: 0,
        arrayBuffers: 0,
      }
    })

    const heapHealthCheck = new MemoryHeapCheck()
      .warnWhenExceedsPercentage(warningPercentageThreshold)
      .failWhenExceedsPercentage(errorPercentageThreshold)

    const result = await heapHealthCheck.run()
    const usedPercentage = Math.floor((heapUsedBytes / maximumHeapSize) * 100)

    expect(result.status).toEqual('warning')
    expect(result.message).toEqual(
      `Heap usage is ${usedPercentage}%, which is above the threshold of ${warningPercentageThreshold}%`
    )
    expect(result.finishedAt).toEqual(expect.any(Date))
    expect(result.meta).toEqual({
      sizeInPercentage: {
        used: usedPercentage,
        failureThreshold: errorPercentageThreshold,
        warningThreshold: warningPercentageThreshold,
      },
      heapInBytes: {
        used: heapUsedBytes,
        maxHeapSize: maximumHeapSize,
        failureThreshold: Math.floor((errorPercentageThreshold / 100) * maximumHeapSize),
        warningThreshold: Math.floor((warningPercentageThreshold / 100) * maximumHeapSize),
      },
    })
  })

  test('prepare ok result when heap usage is under defined percentage thresholds', async ({
    expect,
  }) => {
    const warningPercentageThreshold = 75
    const errorPercentageThreshold = 80
    const heapUsedBytes = Math.floor((warningPercentageThreshold / 100) * maximumHeapSize) - 1

    mock.method(process, 'memoryUsage', () => {
      return {
        rss: 0,
        heapTotal: 0,
        heapUsed: heapUsedBytes,
        external: 0,
        arrayBuffers: 0,
      }
    })

    const heapHealthCheck = new MemoryHeapCheck()
      .warnWhenExceedsPercentage(warningPercentageThreshold)
      .failWhenExceedsPercentage(errorPercentageThreshold)

    const result = await heapHealthCheck.run()
    const usedPercentage = Math.floor((heapUsedBytes / maximumHeapSize) * 100)

    expect(result.status).toEqual('ok')
    expect(result.message).toEqual('Heap usage is under defined thresholds')
    expect(result.finishedAt).toEqual(expect.any(Date))
    expect(result.meta).toEqual({
      sizeInPercentage: {
        used: usedPercentage,
        failureThreshold: errorPercentageThreshold,
        warningThreshold: warningPercentageThreshold,
      },
      heapInBytes: {
        used: heapUsedBytes,
        maxHeapSize: maximumHeapSize,
        failureThreshold: Math.floor((errorPercentageThreshold / 100) * maximumHeapSize),
        warningThreshold: Math.floor((warningPercentageThreshold / 100) * maximumHeapSize),
      },
    })
  })
})
