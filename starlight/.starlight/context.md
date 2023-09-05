- Even though files are imported as .js, this is just a quirk of typescript. The files are actually typescript files and can be found at corresponding .ts filepaths.

> If you see an error like this, it's because you've tried to import a file without the .js extension. Just add the .js extension:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/Users/bweissmann/starlight/starlight/build/agents/coding-driver' imported from /Users/bweissmann/starlight/starlight/build/runner/utils.js
```

- Code written in typescript in /src and compuiled to javascript in /build