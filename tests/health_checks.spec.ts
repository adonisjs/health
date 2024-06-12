/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'

import { Result } from '../src/result.js'
import { BaseCheck } from '../src/base_check.js'
import { HealthChecks } from '../src/health_checks.js'
import type { HealthCheckResult } from '../src/types.js'

test.group('Health checks', () => {
  test('run custom health checks', async ({ expect }) => {
    class FakeCheck extends BaseCheck {
      name: string = 'fake'
      async run(): Promise<HealthCheckResult> {
        return Result.ok('Everything works!')
      }
    }

    const healthChecks = new HealthChecks().register([new FakeCheck()])
    const report = await healthChecks.run()

    expect(report).toEqual({
      isHealthy: true,
      status: 'ok',
      finishedAt: expect.any(Date),
      debugInfo: {
        pid: expect.any(Number),
        ppid: expect.any(Number),
        platform: process.platform,
        uptime: expect.any(Number),
        version: process.version,
      },
      checks: [
        {
          name: 'fake',
          status: 'ok',
          isCached: false,
          message: 'Everything works!',
          finishedAt: expect.any(Date),
        },
      ],
    })
  })

  test('compute the report status when there are checks with error and warning statuses', async ({
    expect,
  }) => {
    class PassingCheck extends BaseCheck {
      name: string = 'passing'
      async run(): Promise<HealthCheckResult> {
        return Result.ok('Everything works!')
      }
    }

    class FailingCheck extends BaseCheck {
      name: string = 'failing'
      async run(): Promise<HealthCheckResult> {
        return Result.failed('Oops!')
      }
    }

    class WarningCheck extends BaseCheck {
      name: string = 'warning'
      async run(): Promise<HealthCheckResult> {
        return Result.warning('System under load')
      }
    }

    const healthChecks = new HealthChecks().register([
      new PassingCheck(),
      new FailingCheck(),
      new WarningCheck(),
    ])
    const report = await healthChecks.run()

    expect(report).toEqual({
      isHealthy: false,
      status: 'error',
      finishedAt: expect.any(Date),
      debugInfo: {
        pid: expect.any(Number),
        ppid: expect.any(Number),
        platform: process.platform,
        uptime: expect.any(Number),
        version: process.version,
      },
      checks: [
        {
          name: 'passing',
          status: 'ok',
          isCached: false,
          message: 'Everything works!',
          finishedAt: expect.any(Date),
        },
        {
          name: 'failing',
          status: 'error',
          isCached: false,
          message: 'Oops!',
          finishedAt: expect.any(Date),
        },
        {
          name: 'warning',
          status: 'warning',
          isCached: false,
          message: 'System under load',
          finishedAt: expect.any(Date),
        },
      ],
    })
  })

  test('compute the report status when there are checks with warning status', async ({
    expect,
  }) => {
    class PassingCheck extends BaseCheck {
      name: string = 'passing'
      async run(): Promise<HealthCheckResult> {
        return Result.ok('Everything works!')
      }
    }

    class WarningCheck extends BaseCheck {
      name: string = 'warning'
      async run(): Promise<HealthCheckResult> {
        return Result.warning('System under load')
      }
    }

    const healthChecks = new HealthChecks().register([new PassingCheck(), new WarningCheck()])
    const report = await healthChecks.run()

    expect(report).toEqual({
      isHealthy: true,
      status: 'warning',
      finishedAt: expect.any(Date),
      debugInfo: {
        pid: expect.any(Number),
        ppid: expect.any(Number),
        platform: process.platform,
        uptime: expect.any(Number),
        version: process.version,
      },
      checks: [
        {
          name: 'passing',
          status: 'ok',
          isCached: false,
          message: 'Everything works!',
          finishedAt: expect.any(Date),
        },
        {
          name: 'warning',
          status: 'warning',
          isCached: false,
          message: 'System under load',
          finishedAt: expect.any(Date),
        },
      ],
    })
  })

  test('cache results of a check', async ({ expect }) => {
    class FakeCheck extends BaseCheck {
      name: string = 'fake'
      async run(): Promise<HealthCheckResult> {
        return Result.ok('Everything works!')
      }
    }

    const healthChecks = new HealthChecks().register([new FakeCheck().cacheFor('1sec')])

    const result = await healthChecks.run()
    expect(result).toEqual({
      isHealthy: true,
      status: 'ok',
      finishedAt: expect.any(Date),
      debugInfo: {
        pid: expect.any(Number),
        ppid: expect.any(Number),
        platform: process.platform,
        uptime: expect.any(Number),
        version: process.version,
      },
      checks: [
        {
          name: 'fake',
          status: 'ok',
          isCached: false,
          message: 'Everything works!',
          finishedAt: expect.any(Date),
        },
      ],
    })

    expect(await healthChecks.run()).toEqual({
      isHealthy: true,
      status: 'ok',
      finishedAt: expect.any(Date),
      debugInfo: {
        pid: expect.any(Number),
        ppid: expect.any(Number),
        platform: process.platform,
        uptime: expect.any(Number),
        version: process.version,
      },
      checks: [
        {
          name: 'fake',
          status: 'ok',
          isCached: true,
          message: 'Everything works!',
          finishedAt: result.checks[0].finishedAt,
        },
      ],
    })
  })

  test('define custom name', async ({ expect }) => {
    class FakeCheck extends BaseCheck {
      name: string = 'fake'
      async run(): Promise<HealthCheckResult> {
        return Result.ok('Everything works!')
      }
    }

    const healthChecks = new HealthChecks().register([new FakeCheck().as('simple_fake_check')])

    const result = await healthChecks.run()
    expect(result).toEqual({
      isHealthy: true,
      status: 'ok',
      finishedAt: expect.any(Date),
      debugInfo: {
        pid: expect.any(Number),
        ppid: expect.any(Number),
        platform: process.platform,
        uptime: expect.any(Number),
        version: process.version,
      },
      checks: [
        {
          name: 'simple_fake_check',
          status: 'ok',
          isCached: false,
          message: 'Everything works!',
          finishedAt: expect.any(Date),
        },
      ],
    })
  })

  test('append checks', async ({ expect }) => {
    class PassingCheck extends BaseCheck {
      name: string = 'passing'
      async run(): Promise<HealthCheckResult> {
        return Result.ok('Everything works!')
      }
    }

    class FailingCheck extends BaseCheck {
      name: string = 'failing'
      async run(): Promise<HealthCheckResult> {
        return Result.failed('Oops!')
      }
    }

    class WarningCheck extends BaseCheck {
      name: string = 'warning'
      async run(): Promise<HealthCheckResult> {
        return Result.warning('System under load')
      }
    }

    const healthChecks = new HealthChecks()
      .append([new FailingCheck(), new WarningCheck()])
      .append([new PassingCheck()])

    const report = await healthChecks.run()

    expect(report).toEqual({
      isHealthy: false,
      status: 'error',
      finishedAt: expect.any(Date),
      debugInfo: {
        pid: expect.any(Number),
        ppid: expect.any(Number),
        platform: process.platform,
        uptime: expect.any(Number),
        version: process.version,
      },
      checks: [
        {
          name: 'failing',
          status: 'error',
          isCached: false,
          message: 'Oops!',
          finishedAt: expect.any(Date),
        },
        {
          name: 'warning',
          status: 'warning',
          isCached: false,
          message: 'System under load',
          finishedAt: expect.any(Date),
        },
        {
          name: 'passing',
          status: 'ok',
          isCached: false,
          message: 'Everything works!',
          finishedAt: expect.any(Date),
        },
      ],
    })
  })
})
