# [A Simple JavaScript Trie](http://ejohn.org/blog/javascript-trie-performance-analysis/)
## By John Resig

## Install

	npm install --save resig-trie

## Usage

```js
var trie = require('trie');

trie.create(['a', 'an', 'banana', 'bananas', 'byte', 'boolean', 'chocolate', 'code', ...]);
//=> <trie object>

trie.serialize(<trie object>, true); // true to create valid JSON
//=> '<trie object as JSON>'

trie.serialize(<trie object>, false); // false to create valid JavaScript (not JSON) - more efficient, but must be require('<trie')d
//=> '<trie object as long string>'

trie.find(<trie object>, 'banana');
//=> true, because 'banana' is in the trie

trie.find(<trie object>, 'microsoft');
//=> false, because 'microsoft' is not in the trie
```

## License
Copyright 2011 John Resig. Packaged as a simple npm module by Josh Oldenburg in 2014. Released under the MIT license.
