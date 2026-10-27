# MongoDB operations in Linklet

The existing Mongoose connection and URL model power these features. All regular
URL-management queries are restricted to the signed-in user's `createdBy` ID.
Search, filter, sort, and page inputs are allowlisted or validated on the server;
client-supplied MongoDB query objects are never accepted.

## Feature-to-operation map

| MongoDB operation or feature | Linklet implementation |
| --- | --- |
| `insertOne()` | Creating one URL with a validated Mongoose document and `save()` (Mongoose's schema-validated single-document insert). |
| `insertMany()` | `POST /url/bulk`, which accepts up to 50 validated URLs. |
| `find()` | Dashboard URL listing, with projection, sorting, skip, and page-size limit. |
| `findOne()` | Looking up a public short code, retrieving owned analytics, and loading an owned URL before replacement. |
| `updateOne()` | Editing URL metadata, atomically recording a successful click, and changing a multiplier. |
| `updateMany()` | Activating or archiving selected URLs. The startup migration also fills analytics fields on legacy URL documents. |
| `replaceOne()` | Admin-only whole-document replacement. It preserves `_id`, short code, owner, click history, count, and creation time. |
| `deleteOne()` | Confirmed deletion of one URL owned by the signed-in user. |
| `deleteMany()` | Confirmed bulk deletion, limited to selected URLs owned by the signed-in user. |
| `countDocuments()` | Dashboard total, active, expired, archived, and filtered-result counts. |
| `sort()` | Date created, click count, title, or expiry, ascending or descending. |
| `limit()` | Page size of 10, 20, or 50; pagination also uses `skip()`. |
| `$gt`, `$gte`, `$lt`, `$lte` | Click-threshold filters; created-on/after and expires-by filters use `$gte` and `$lte`; active-link expiry and multiplier bounds also use range operators. |
| `$or`, `$regex` | Escaped, case-insensitive partial search across title, destination, and short code; active-link date filtering also uses `$or`. |
| Projection (`1` / `0`) | The dashboard selects only the URL fields it needs with Mongoose `.select()`. |
| Filtering and implicit AND | The dashboard combines the owner constraint with validated status, search, date, and click filters. |
| `$set` | Editing title, destination, status, or expiry; bulk status changes. |
| `$inc` | Atomically increments `clickCount` on a valid, active redirect and appends that visit to history. |
| `$mul` | Multiplies only the bounded `analyticsMultiplier` factor. Weighted clicks are derived from raw clicks and this factor; raw click counts and click history are not multiplied. |

## Advanced administration

Set `ADMIN_EMAIL` in `.env` to the email address of an existing account to show
the advanced operations panel. The admin actions still only modify URLs owned
by that account. Multiplier changes require explicit confirmation, are limited
to a resulting value between `0.1` and `10`, and are recorded in the
`urlOperationAudits` collection. Replacing a record also records an audit entry.

On startup, legacy URL documents are initialized with `clickCount` copied from
their existing visit-history length, an active status, and a multiplier of `1`.
