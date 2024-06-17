/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { DiskSpaceHealthCheck } from '../../src/checks/disk_space.js'

test.group('Disk space', () => {
  test('report error when disk space exceeds the defined error threshold', async ({ expect }) => {
    const diskSpaceCheck = new DiskSpaceHealthCheck().failWhenExceeds(80)
    diskSpaceCheck.compute(async () => {
      return {
        free: 1,
        size: 10,
      }
    })

    expect(await diskSpaceCheck.run()).toEqual({
      status: 'error',
      finishedAt: expect.any(Date),
      message: 'Disk usage is 90%, which is above the threshold of 80%',
      meta: {
        sizeInPercentage: {
          failureThreshold: 80,
          warningThreshold: 75,
          used: 90,
        },
      },
    })
  })

  test('report warning when disk space exceeds the defined warning threshold', async ({
    expect,
  }) => {
    const diskSpaceCheck = new DiskSpaceHealthCheck().warnWhenExceeds(60)
    diskSpaceCheck.compute(async () => {
      return {
        free: 3,
        size: 10,
      }
    })

    expect(await diskSpaceCheck.run()).toEqual({
      status: 'warning',
      finishedAt: expect.any(Date),
      message: 'Disk usage is 70%, which is above the threshold of 60%',
      meta: {
        sizeInPercentage: {
          failureThreshold: 80,
          warningThreshold: 60,
          used: 70,
        },
      },
    })
  })

  test('compute actual disk space and prepare result', async ({ expect }) => {
    const diskSpaceCheck = new DiskSpaceHealthCheck().warnWhenExceeds(90).failWhenExceeds(99)

    expect(await diskSpaceCheck.run()).toEqual({
      status: 'ok',
      finishedAt: expect.any(Date),
      message: 'Disk usage is under defined thresholds',
      meta: {
        sizeInPercentage: {
          failureThreshold: 99,
          warningThreshold: 90,
          used: expect.any(Number),
        },
      },
    })
  }).timeout(6000)
})
