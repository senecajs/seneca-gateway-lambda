# Changes

## 2.0.0 2026-11-21

First entry of this change log. Earlier versions are on npm and in the git history.

* Seneca 4: the peer dependency is `seneca` `^4.0.0` (was
  `>=3||>=4.0.0-rc2`). Seneca 3 users stay on `@seneca/gateway-lambda@1`.
* The peer dependency `@seneca/gateway` is `^2.0.0` (was `>=1.3`), the
  Seneca 4 release of the gateway.
* Node.js 24 or later (`engines.node` `>=24`).
* The peer dependency `seneca-promisify` is removed. Seneca 4 has
  promises built in, and the tests no longer load the plugin (D4).
* The option defaults are built with the validator that Seneca passes to
  the plugin: `defaults` is now a function of `{ valid }` (B1). Seneca 4
  validates options with shape and rejects defaults built with Gubu, so
  1.1.0 stops at startup there with `plugin_gubu_shape`. The gubu import
  is removed; gubu was never a declared dependency. The option keys and
  values are unchanged. `auth.cookie` and `headers` stay open, so they
  accept keys that the defaults do not name, such as a cookie `domain`.
  Unknown keys in the other option objects, such as `auth` and
  `auth.cognito`, are rejected with `invalid_plugin_option`, as they were
  on Seneca 3 (B13).
* The runtime dependency `cookie` is `^0.7.2` (was `^0.6.0`), for the
  advisory GHSA-pxg6-pf52-xh8x. Cookie names, paths and domains with
  characters outside RFC 6265 are now rejected.
* TypeScript: the plugin function is typed `this: Seneca.Instance`, with
  a type-only import of `seneca` (B10).
* The tests load plugins by their full names (`@seneca/gateway`, B14) and
  cover the auth cookie directives.
