var isPrivate = function (ip) {
    if (/^172\.[1-3][0-9]/.test(ip)) { return true; }
    if (/^10\./.test(ip)) { return true; }
    if (/^192\.168\./.test(ip)) { return true; }
    return false;
};

var parseResult = function (from) {
    var out = {};
    for (var i = 0; i < from.length; i++) {
        if (from[i].x) { continue; }
        if (from[i].late) { continue; }
        var ip = from[i].from;
        if (isPrivate(ip)) { continue; }
        if (!(ip in out) || Number(out[ip]) < Number(from[i].rtt)) {
            out[ip] = from[i].rtt;
            if (!out[ip]) { out[ip] = { raw: JSON.stringify(from[i]) }; }
        }
    }
    return out;
};

var isEndResult = function (from) {
    for (var i = 0; i < from.length; i++) {
        if (from[i].x) { continue; }
        if (from[i].err === 'A') { return true; }
    }
    return false;
};

var processLine = function (line, ctx) {
    var dat = JSON.parse(line);
    //console.log(dat);
    var processed = [];
    for (var i = 0; i < dat.result.length; i++) {
        var pr = parseResult(dat.result[i].result);
        for (var x in pr) { processed.push(pr); break; }
    }
    ctx.nodeMap[dat.from] = ctx.nodeMap[dat.from] || {
        peers: { },
        probe: dat.prb_id,
        traceroute: dat
    };
    ctx.nodeMap[dat.dst_addr] = ctx.nodeMap[dat.dst_addr] || { peers: { }, dst:true };
    var lastIps = [ {ip: dat.from, ttl:0 } ];
    processed.forEach(function (elem) {
        var nextIps = [];
        Object.keys(elem).forEach(function (ip) {
            entry = ctx.nodeMap[ip] = ctx.nodeMap[ip] || { peers: { } };
            lastIps.forEach(function (lastEntry) {
                entry.peers[lastEntry.ip] = (elem[ip] - lastEntry.ttl);
            });
            nextIps.push({ip:ip, ttl:elem[ip]});
        });
        lastIps = nextIps;
    });
    //ctx.nodes.push.apply(ctx.nodes, processed);
/*
console.log(processed);

    var last = dat.result.pop();
    var dstEntry = ctx.nodeMap[dat.dst_addr] = ctx.nodeMap[dat.dst_addr] || { peers: { } };
    for (var i = 0; i < last.result.length; i++) {
        if (last.result[i].x) { continue; }
        // check if it's reached the end, if so we connect it to the target.
        // Administratively prohibited, consider it connected.
        if (last.result[i].err === 'A') {
            //last.result[i]
            //dstEntry
        }
    }*/
};

var check = function (ctx) {
    Object.keys(ctx.nodeMap).forEach(function (node) {
        var peers = ctx.nodeMap[node].peers;
        Object.keys(peers).forEach(function (p) {
            if (!(p in ctx.nodeMap)) { throw new Error("missing " + p); }
        });
    });
};

var PAD_WIDTH = 9
var padJoin = function (elems) {
    var out = [];
    for (var i = 0; i < elems.length; i++) {
        var len = elems[i].length % PAD_WIDTH;
        out.push(elems[i]);
        if (len) { out.push((new Array(PAD_WIDTH - len)).join('&nbsp;')); }
    }
    return out.join('&nbsp;');
};

var printTraceRoute = function (json) {
    var out = [
        'Source: ' + json.from + ' <a href="https://atlas.ripe.net/probes/' + json.prb_id + '/">Probe #' + json.prb_id + '</a>',
        'Destination: ' + json.dst_addr,
    ];
    if (json.result.length === 0) { return 'no data'; }
    var ip;
    for (var i = 0; i < json.result.length; i++) {
        var res = json.result[i];
        var outLine = [ "hop" + res.hop ];
        for (var j = 0; j < res.result.length; j++) {
            var resj = res.result[j];
            if ('x' in resj) {
                outLine.push(resj.x);
                continue;
            }
            if ('late' in resj) { continue; }
            if (!('from' in resj && 'rtt' in resj)) {
                outLine.push(JSON.stringify(resj));
                continue;
            }
            if (j === 0) {
                outLine.push(resj.from);
                ip = resj.from;
            } else if (ip !== resj.from) {
console.error("kicking the can " + json.from);
                res.result.splice(j+1, 0, { hop:res.hop, result: [ { from: resj.from, rtt: resj.rtt } ] });
                continue;
            }
            outLine.push(resj.rtt + 'ms');
        }
        out.push(padJoin(outLine));
    }
    return out.join('\n');
};

var flattenData = function (ctx) {
    check(ctx);
    Object.keys(ctx.nodeMap).forEach(function (key) {
        var node = { name:key, group:1 };
        if (ctx.nodeMap[key].probe) {
            node.group = 2;
            node.name = node.name + " (probe #" + ctx.nodeMap[key].probe + ")";
            node.traceroute = printTraceRoute(ctx.nodeMap[key].traceroute);
        }
        if (ctx.nodeMap[key].dst) {
            node.group = 3;
            node.name = node.name + " (destination)";
        }
        ctx.nodes.push(node);
        ctx.nodeMap[key].index = ctx.nodes.length - 1;
    });
    Object.keys(ctx.nodeMap).forEach(function (key) {
        Object.keys(ctx.nodeMap[key].peers).forEach(function (peerkey) {
            var latencyDiff = ctx.nodeMap[key].peers[peerkey];
            if (latencyDiff < 1) { latencyDiff = 1; }
            ctx.links.push({
                source: ctx.nodeMap[peerkey].index,
                target: ctx.nodeMap[key].index,
                value: latencyDiff,
            });
        });
    });
};

var printAll = function (ctx) {
    flattenData(ctx);
    console.log(JSON.stringify({nodes: ctx.nodes, links: ctx.links}, null, '  '));
};

var nodeMain = function () {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    var data = "";
    var ctx = {
        nodes: [],
        links: [],
        nodeMap: {}
    };
    process.stdin.on('data', function(chunk) {
        var lines = (data + chunk).split('\n');
        data = lines.pop();
        lines.forEach(function (line) { processLine(line, ctx); });
    });
    process.stdin.on('end', function() {
        processLine(data, ctx);
        printAll(ctx);
    });
};
nodeMain();

module.exports.flatten = 
