/**
 * Create a trie object from an array of words
 *
 * @param words Array The words to trie-ify
 * @return Object The trie object
 */
/* eslint-disable */
var create = exports.create = function(words) {
	if (!words || words == null || words.length == 0) return null;
	var trie = {};

	// must sort first for trie to be built properly
	words.sort((a, b) => a.localeCompare(b));

	for (var i = 0, wordsLength = words.length; i < wordsLength; i++) {
		var word = words[i];
		var letters = word.split('');
		var cur = trie;

		for (var j = 0; j < letters.length; j++) {
			var letter = letters[j];
			var pos = cur[letter];

			if (pos == null) cur = cur[letter] = (j === letters.length - 1 ? 0 : {});
			else if (pos === 0) cur = cur[letter] = { $: 0 };
			else cur = cur[letter];
		}
	}

	_optimize(trie);
	var end = {};
	_optimizeSuffixes(trie, end);

	var keepEnd = {};
	var endings = [0];
	for (var key in end) {
		if (end[key].count <= 10) continue;
		keepEnd[key] = endings.length;
		endings.push(end[key].obj);
	}

	_optimizeFinishSuffixes(trie, keepEnd, end);

	trie.$ = endings;
	return trie;
}

/**
 * Take a trie object and serialize it (into a string)
 *
 * @param trie Object The trie object
 * @param validJSON Boolean Whether the output should be valid JSON (the
 *                          alternative is more compact)
 * @return String The serialized trie
 */
var serialize = exports.serialize = function(trie, validJSON) {
	if (validJSON) return JSON.stringify(trie);
	else return _stringifyTrie(trie);
}

/**
 * Take a serialized trie (as a string) and make it an object
 *
 * @param trieString String The serialized trie
 * @return Object The trie object
 * @warning This uses eval(), so don't pass user input
 */
var unserialize = exports.unserialize = function(trieString) {
	return eval('(' + trieString + ')');
}

/**
 * Search for a word in a trie.
 *
 * @param word String The word to look for in the trie
 * @param trie Object The trie object (@see load)
 * @param cur null Do not pass this
 * @return Boolean Whether the word is in the trie
 */
var find = exports.find = function(word, trie, cur) {
	cur = cur || trie;

	for (var node in cur) {
		if (word.indexOf(node) === 0) {
			var val = (typeof cur[node] === "number" && cur[node] ? trie.$[cur[node]] : cur[node]);

			if (node.length === word.length) return val === 0 || val.$ === 0;
			else return find(word.slice(node.length), trie, val);
		}
	}

	return false;
}

/**
 * Find longest first word in a string: return a string of the longest word starting at position zero
 *
 * @param word String The text to segment
 * @param trie Object The trie object (@see load)
 * @param cur null Do not pass this
 * @return String the longest word
 */
var findLongestFirstWord = exports.findLongestFirstWord = function(word, trie, cur) {
	cur = cur || trie;

	for (var node in cur) {
		var nodeWithoutDollarSign = node;
		if (node.length > 1 && node.indexOf('$') === node.length - 1) {
			nodeWithoutDollarSign = node.slice(0, node.length - 1);
		}
		if (word.indexOf(node) === 0 || word.indexOf(nodeWithoutDollarSign) === 0) {
			var val = (typeof cur[node] === "number" && cur[node] ? trie.$[cur[node]] : cur[node]);

			if (val === 0) {
				return nodeWithoutDollarSign;
			}
			if (nodeWithoutDollarSign.length === word.length) {
				return (val === 0 || val.$ === 0) ? nodeWithoutDollarSign : '';
			}
			var remaining = findLongestFirstWord(word.slice(nodeWithoutDollarSign.length), trie, val);
			if (remaining.length > 0) {
				return nodeWithoutDollarSign + remaining;
			}
			return (val.$ === 0) ? nodeWithoutDollarSign : '';
		}
	}

	return '';
}

/**
 * Find possible words in a string
 */

var findPossibleWords = exports.findPossibleWords = function(word, trie) {
  const possibleWords =  findPossibleWordsRecurse(word, trie)
  if (typeof possibleWords === 'string') {
    return possibleWords ? [possibleWords] : []
  }
  return possibleWords
}

var findPossibleWordsRecurse = function(word, trie, cur, buf) {
  cur = cur || trie;
  buf = buf || ''

	for (var node in cur) {
		var nodeWithoutDollarSign = node;
		if (node.length > 1 && node.indexOf('$') === node.length - 1) {
			nodeWithoutDollarSign = node.slice(0, node.length - 1);
		}
		if (word.indexOf(node) === 0 || word.indexOf(nodeWithoutDollarSign) === 0) {
			var val = (typeof cur[node] === "number" && cur[node] ? trie.$[cur[node]] : cur[node]);
      const isWord = val.$ === 0

      // leaf node

			if (val === 0) {
				return buf + nodeWithoutDollarSign;
      }

			if (nodeWithoutDollarSign.length === word.length) {
				return isWord ? buf + nodeWithoutDollarSign : '';
      }

      // non-leaf

      var remaining = findPossibleWordsRecurse(word.slice(nodeWithoutDollarSign.length), trie, val, buf + nodeWithoutDollarSign);

      if (typeof remaining === 'string') {
        if (remaining.length > 0) {
          if (isWord) {
            return [buf + nodeWithoutDollarSign, remaining]
          }
          return remaining
        }
      } else if (typeof remaining === 'object') {
        if (isWord) {
          return [buf + nodeWithoutDollarSign].concat(remaining)
        }
        return remaining
      }

      return isWord ? buf + nodeWithoutDollarSign : '';
		}
	}

	return '';
}

// Private functions
function _optimize(cur) {
	var num = 0;
	var last;

	for (var node in cur) {
		if (typeof cur[node] === 'object') {
			var ret = _optimize(cur[node]);

			if (ret) {
				delete cur[node];
				cur[node + ret.name] = ret.value;
				node = node + ret.name;
			}
		}

		last = node;
		num++;
	}

	if (num === 1) return { name: last, value: cur[last] };
}

function _optimizeSuffixes(cur, end) {
	var hasObject = false;
	var key = '';

	for (var node in cur) {
		if (typeof cur[node] === 'object') {
			hasObject = true;

			var ret = _optimizeSuffixes(cur[node], end);
			if (ret) cur[node] = ret;
		}

		key += ',' + node;
	}

	if (!hasObject) {
		if (end[key]) end[key].count++;
		else end[key] = { obj: cur, count: 1 };

		return key;
	}
}

function _optimizeFinishSuffixes(cur, keepEnd, end) {
	for (var node in cur) {
		var val = cur[node];

		if (typeof val === 'object') _optimizeFinishSuffixes(val, keepEnd, end);
		else if (typeof val === 'string') cur[node] = keepEnd[val] || end[val].obj;
	}
}

var reserved = require('reserved');
function _stringifyTrie(trie) {
	var ret = JSON.stringify(trie).replace(/"/g, '');

	for (var i = 0; i < reserved.length; i++) {
		ret = ret.replace(new RegExp('([{,])(' + reserved[i] + '):', 'g'), "$1'$2':");
	}

	return ret;
}
