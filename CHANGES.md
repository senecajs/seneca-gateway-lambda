# Changes

## 2.0.0 2026-10-22

* Seneca 4 support. Seneca 4.0.0 validates with
  [shape](https://github.com/rjrodger/shape), the renamed successor of
  Gubu, and rejects option defaults built with Gubu, so 1.1.0 stops the
  process at startup there (`plugin_gubu_shape`), as does
  @seneca/sqs-transport, which loads it. `defaults` is now a function
  of `{ valid }`, the builders Seneca passes to it: shape on Seneca 4,
  Gubu on Seneca 3. The options are unchanged.
* The gubu import is removed. The package never declared gubu as a
  dependency; it was only available through Seneca's own dependency on
  it.
* Breaking: Seneca 3 support starts at 3.38. The peer range is
  `>=3.38||>=4.0.0-rc5` (was `>=3||>=4.0.0-rc2`). The tests run against
  Seneca 4.0.0, 4.0.0-rc5 (the development dependency, `^4.0.0-rc5`,
  was `^3.23.3`) and 3.38.
* Development: `.npmrc` sets `legacy-peer-deps` while the peer range of
  seneca-msg-test excludes the Seneca 4 prerelease, so @seneca/gateway
  and seneca-promisify, which the tests load, are development
  dependencies.
