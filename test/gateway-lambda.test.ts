
import GatewayLambda from '../src/gateway-lambda'

const Seneca = require('seneca')

describe('gateway-lambda', () => {

  test('happy', async () => {
    const seneca = Seneca({ legacy: false })
      .test()
      .use('promisify')
      .use('gateway')
      .use(GatewayLambda)
    await seneca.ready()
  })

  test('basic', async () => {
    const seneca = Seneca({ legacy: false })
      .test()

      // use quiet$ directive when available
      .quiet()

      .use('promisify')
      .use('gateway')
      .use(GatewayLambda)
      .act('sys:gateway,add:hook,hook:fixed', { action: { y: 99 } })
      .message('foo:1', async function(m: any) {
        return { x: m.x, y: m.y }
      })

    await seneca.ready()

    let handler = seneca.export('gateway-lambda/handler')

    let evmock = (body: any) => ({
      body
    })
    let ctxmock = {}

    let out = await handler(evmock({ foo: 1, x: 2 }), ctxmock)
    out.body = out.body.replace(/,"meta\$":\{"id":".*"\}/, '')

    // console.log(out)

    expect(out).toMatchObject({
      "body": "{\"x\":2,\"y\":99}",
      "headers": {
        "Access-Control-Allow-Origin": "*",
      },
      "statusCode": 200,
    })

    out = await handler(evmock({ bad: 1 }), ctxmock)

    expect(out).toMatchObject({
      "body": "{\"seneca$\":true,\"code$\":\"act_not_found\",\"error$\":true}",
      "headers": {
        "Access-Control-Allow-Origin": "*",
      },
      "statusCode": 400,
    })

  })

})

