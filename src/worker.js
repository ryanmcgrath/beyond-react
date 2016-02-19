onmessage = function(event) {
    importScripts('/node_modules/highlight.js/lib/highlight.js');
    var result = self.hljs.highlightAuto(event.data.source);
    postMessage({sha: event.data.sha, source: result.value});
}
