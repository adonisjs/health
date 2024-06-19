/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { MemoryHeapCheck } from '../../src/checks/heap_check.js'

test.group('Memory Heap', () => {
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
