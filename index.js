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
