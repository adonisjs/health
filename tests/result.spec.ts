import { test } from '@japa/runner'
import { Result } from '../src/result.js'

test.group('Result', () => {
  test('create ok result', ({ expect }) => {
    expect(Result.ok('Database connection is healthy')).toEqual({
      message: 'Database connection is healthy',
      status: 'ok',
      finishedAt: expect.any(Date),
    })
  })

  test('create error result', ({ expect }) => {
    expect(Result.failed('Unable to connect to database')).toEqual({
      message: 'Unable to connect to database',
      status: 'error',
      finishedAt: expect.any(Date),
    })

    const error = new Error('Connection failed')
    expect(Result.failed(error)).toEqual({
      message: 'Connection failed',
      status: 'error',
      meta: {
        error,
      },
      finishedAt: expect.any(Date),
    })

    expect(Result.failed('Unable to connect to database', error)).toEqual({
      message: 'Unable to connect to database',
      status: 'error',
      meta: {
        error,
      },
      finishedAt: expect.any(Date),
    })
  })

  test('create warning result', ({ expect }) => {
    expect(Result.warning('70% threshold crossed')).toEqual({
      message: '70% threshold crossed',
      status: 'warning',
      finishedAt: expect.any(Date),
    })
  })

  test('merge custom meta-data', ({ expect }) => {
    const result = Result.warning('70% threshold crossed').mergeMetaData({ currentLoad: '83%' })
    expect(result.toJSON()).toEqual({
      message: '70% threshold crossed',
      status: 'warning',
      meta: {
        currentLoad: '83%',
      },
      finishedAt: expect.any(Date),
    })
  })

  test('override finishedAt date', ({ expect }) => {
    const finishedAt = new Date()
    const result = Result.warning('70% threshold crossed').setFinishedAt(finishedAt)

    expect(result.toJSON()).toEqual({
      message: '70% threshold crossed',
      status: 'warning',
      finishedAt: finishedAt,
    })
  })
})
