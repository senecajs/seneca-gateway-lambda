
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

    let evmock = (body: any, headers?: any) => ({
      body,
      queryStringParameters: body.queryStringParameters,
      pathParameters: body.pathParameters,
      headers: headers || {},
    })
    let ctxmock = {}

    let out = await handler(evmock({
      foo: 1,
      x: 2,
      pathParameters: { var: 1 },
      queryStringParameters: { query: 1 }
    }, { 'Foo-Bar': 'Zed' }), ctxmock)
    out.body = out.body.replace(/,"meta\$":\{"id":".*"\}/, '')

    expect(out).toMatchObject({
      "body": "{\"x\":2,\"y\":99}",
      "headers": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      "statusCode": 200,
    })

    out = await handler(evmock({ bad: 1 }), ctxmock)

    out.body =
      out.body.replace(/"id":"[^"]+"/g, '\"id\":\"METAID\"')

    expect(out).toMatchObject({
      "body": "{\"meta$\":{\"id\":\"METAID\",\"error\":true},\"name\":\"Error\",\"id\":\"METAID\",\"code\":\"act_not_found\"}",
      "headers": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      "statusCode": 500,
    })

  })


  test('headers', async () => {
    const seneca = Seneca({ legacy: false })
      .test()

      // use quiet$ directive when available
      .quiet()

      .use('promisify')
      .use('gateway')
      .use(GatewayLambda, {
        headers: {
          "Access-Control-Allow-Origin": "foo",
          "Access-Control-Allow-Headers": "bar"
        }
      })
      .act('sys:gateway,add:hook,hook:fixed', { action: { y: 99 } })
      .message('foo:1', async function(m: any) {
        expect(m.gateway.headers['foo-bar']).toEqual('Zed')
        return { x: m.x, y: m.y }
      })

    await seneca.ready()

    let handler = seneca.export('gateway-lambda/handler')

    let evmock = (body: any, headers?: any) => ({
      body,
      headers: headers || {}
    })
    let ctxmock = {}

    let out = await handler(evmock({ foo: 1, x: 2 }, { 'Foo-Bar': 'Zed' }), ctxmock)
    out.body = out.body.replace(/,"meta\$":\{"id":".*"\}/, '')

    expect(out).toMatchObject({
      "body": "{\"x\":2,\"y\":99}",
      "headers": {
        "Access-Control-Allow-Origin": "foo",
        "Access-Control-Allow-Headers": "bar"
      },
      "statusCode": 200,
    })
  })



  test('event-s3', async () => {

    const seneca = Seneca({ legacy: false })
      .test()

      // use quiet$ directive when available
      // .quiet()

      .use('promisify')
      .use('gateway')
      .use(GatewayLambda)
      .message('foo:1', async function(msg: any) {
        return { ok: true, bar: 2, event: msg.event }
      })

    await seneca.ready()

    let eventhandler = seneca.export('gateway-lambda/eventhandler')

    let res = await eventhandler(
      {
        seneca$: {
          msg: 'foo:1'
          // msg: { foo: 1 }
        },
        "Records": [
          {
            "eventVersion": "2.0",
            "eventSource": "aws:s3",
            "awsRegion": "us-west-2",
            "eventTime": "1970-01-01T00:00:00.000Z",
            "eventName": "ObjectCreated:Put",
            "userIdentity": {
              "principalId": "EXAMPLE"
            },
            "requestParameters": {
              "sourceIPAddress": "127.0.0.1"
            },
            "responseElements": {
              "x-amz-request-id": "EXAMPLE123456789",
              "x-amz-id-2": "EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH"
            },
            "s3": {
              "s3SchemaVersion": "1.0",
              "configurationId": "testConfigRule",
              "bucket": {
                "name": "my-s3-bucket",
                "ownerIdentity": {
                  "principalId": "EXAMPLE"
                },
                "arn": "arn:aws:s3:::example-bucket"
              },
              "object": {
                "key": "HappyFace.jpg",
                "size": 1024,
                "eTag": "0123456789abcdef0123456789abcdef",
                "sequencer": "0A1B2C3D4E5F678901"
              }
            }
          }
        ]
      },
      { ctx: true }
    )

    // console.log(res)

    let out = res.out

    expect(out).toMatchObject({ ok: true, bar: 2, event: {} })
  })


  test('webhooks', async () => {
    const seneca = Seneca({ legacy: false })
      // .test('print')

      // use quiet$ directive when available
      .quiet()

      .use('promisify')
      .use('gateway')
      .use(GatewayLambda, {
        webhooks: [{
          re: /api\/public\/hook\/([^\/]+)\/([^\/?]+)/,
          params: ['name', 'code'],
          fixed: { handle: 'hook' },
        }]
      })
      .message('handle:hook,name:foo', async function(m: any) {
        // console.log(m)

        return { x: m.body.x, y: m.gateway.query.y }
      })

    await seneca.ready()

    let handler = seneca.export('gateway-lambda/handler')

    let evmock = (path: string, body: any, headers?: any, query?: any) => ({
      path,
      body,
      headers: headers || {},
      queryStringParameters: query || {},
    })
    let ctxmock = {}

    let event = evmock(
      'http://example.com/api/public/hook/foo/bar?y=1',
      { x: 2 },
      { 'Foo-Bar': 'Zed' },
      { y: '1' },
    )

    //  console.log('EVENT', event)

    let out = await handler(event, ctxmock)
    out.body = out.body.replace(/,"meta\$":\{"id":".*"\}/, '')

    expect(out).toMatchObject({
      "body": "{\"x\":2,\"y\":\"1\"}",
      "statusCode": 200,
    })
  })


  test('custom-handler', async () => {
    const seneca = Seneca({ legacy: false })
      .test()
      .use('promisify')
      .use('gateway')
      .use(GatewayLambda)
      .act('sys:gateway,kind:lambda,add:hook,hook:handler', {
        handler: {
          name: 'sqs',
          match: (trigger: any) => {
            let matched = 'aws:sqs' === trigger.record.eventSource
            return matched
          },
          process: async function(this: typeof Seneca, trigger: any, gateway: any) {
            let msg = JSON.parse(trigger.record.body)
            // return seneca.post(body)
            return gateway(msg, trigger)
          }
        }
      })
      .message('a:1', async function(msg: any) {
        return { x: 1 + msg.x }
      })
    await seneca.ready()

    let handler = seneca.export('gateway-lambda/handler')

    let res = await handler({ Records: [{ eventSource: 'aws:sqs', body: '{"a":1,"x":1}' }] })

    expect(res.out).toMatchObject({ x: 2 })
  })


})
