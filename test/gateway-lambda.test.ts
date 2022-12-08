
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
      body,
      queryStringParameters:body.queryStringParameters,
      pathParameters:body.pathParameters
    })
    let ctxmock = {}

    let out = await handler(evmock({ foo: 1, x: 2, pathParameters: {var: 1}, queryStringParameters: {query: 1} }), ctxmock)
    out.body = out.body.replace(/,"meta\$":\{"id":".*"\}/, '')

    expect(out).toMatchObject({
      "body": "{\"x\":2,\"y\":99}",
      "queryStringParameters":"{\"query\":1}",
      "headers": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      "statusCode": 200,
    })

    out = await handler(evmock({ bad: 1 }), ctxmock)

    out.body =
      out.body.replace(/meta\$":\{"id":"[^"]+"/, 'meta$\":{\"id\":\"METAID\"')

    expect(out).toMatchObject({
      "body": "{\"meta$\":{\"id\":\"METAID\"},\"error$\":{\"name\":\"Error\",\"code\":\"act_not_found\"}}",
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

})
