# server

## *NOTE*

there's a bug in the node-redis library that crashes the server so you need to go in node_modules after you `npm i` and change `@redis-client/.../commands-queue.js` line 62 to:

```javascript
const tmp =  __classPrivateFieldGet(this, _RedisCommandsQueue_waitingForReply, "f").shift();
if (!tmp){return;}           
const { resolve, reject } = tmp;
```