/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import string from '@poppinss/utils/string'
import { MemoryHeapHealthCheck } from '../../src/checks/heap.js'

test.group('Memory Heap', () => {
  test('report error when heap usage exceeds the define error threshold', async ({ expect }) => {
    const heapHealthCheck = new MemoryHeapHealthCheck().failWhenExceeds('1mb')

    expect(await heapHealthCheck.run()).toEqual({
      status: 'error',
      finishedAt: expect.any(Date),
      message: 'Heap usage exceeded the "1MB" threshold',
      meta: {
        bytes: {
          threshold: string.bytes.parse('1mb'),
          used: expect.any(Number),
        },
      },
    })
  })

  test('report warning when heap usage exceeds the defined warning threshold', async ({
    expect,
  }) => {
    const heapHealthCheck = new MemoryHeapHealthCheck().warnWhenExceeds('1mb')

    expect(await heapHealthCheck.run()).toEqual({
      status: 'warning',
      finishedAt: expect.any(Date),
      message: 'Heap usage exceeded the "1MB" threshold',
      meta: {
        bytes: {
          threshold: string.bytes.parse('1mb'),
          used: expect.any(Number),
        },
      },
    })
  })

  test('prepare ok result when heap usage is under defined thresholds', async ({ expect }) => {
    const heapHealthCheck = new MemoryHeapHealthCheck()

    expect(await heapHealthCheck.run()).toEqual({
      status: 'ok',
      finishedAt: expect.any(Date),
      message: 'Heap usage is under defined thresholds',
      meta: {
        bytes: {
          used: expect.any(Number),
        },
      },
    })
  })
})
