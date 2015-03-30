# TreeTracert

A tool for building graphical depictions of traceroutes from many source locations to a single
destination. This tool uses RIPE Atlas formatted data to fold a multititude of traceroutes from
many starting locations around the world (for example Atlas Probes) into a tree structure with
the traceroute destination at the tree root and the starting points at the leaves. The nodes
in the middle are the IP routers where the packet stops.

## To run

    git clone git://github.com/cjdelisle/treetracert.git
    cd treetracert
    npm install
    node ./server.js
    ### Open your favorite browser to http://127.0.0.1:8080/ and see the result

## Interpreting results

* Starting points are in orange, the destination is red and the intermediate routers are blue.
* Clicking on a starting point will print the traceroute in the side of the screen.
* Local routers (192.168.0.0/16, 10.0.0.0/8 etc.) are omitted from the graph but will still
show in the traces.
* This is a hackathon project, there are bugs.

## Running with different input data
This is by default running set of traceroutes to cloudflare anycast DNS nodes from RIPE Atlas
probes in New Zealand. To run it with different data, just change the content of the file
`source_data.json`. Here is the command which got that data.

    wget -4 'https://atlas.ripe.net/api/v1/measurement/1850590/result/?start=1422662400&stop=1422748799&format=json' -O ./www/source_data.json

![aint-it-purty](https://raw.github.com/cjdelisle/treetracert/master/screenshot.jpg)

