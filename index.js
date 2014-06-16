var create = exports.create = function(words) {
	var trie = {};

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
	_optimizeSuffixes(trie, end);

	for (var key in end) {
		if (end[key].count <= 10) continue;
		keepEnd[key] = endings.length;
		endings.push(end[key].obj);
	}

	_optimizeFinishSuffixes(trie, keepEnd, end);

	trie.$ = endings;
	return trie;
}

var serialize = exports.serialize = function(trie, validJSON) {
	if (validJSON) return JSON.serialize(trie);
	else return _stringifyTrie(trie);
}

/*
 * Search for a word in a trie.
 *
 * @param word String The word to look for in the trie
 * @param trie Object The trie object (@see load)
 * @param cur null Do not pass this
 *
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
