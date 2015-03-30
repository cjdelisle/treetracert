/*
 * You may redistribute this program and/or modify it under the terms of
 * the GNU Affero General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 */
var Express = require('express');
var Http = require('http');
var Fs = require('fs');

var config = { httpPort: 8080 };

var app = Express();
app.use(Express.static(__dirname + '/www'));

var d3 = Fs.readFileSync(__dirname + '/node_modules/d3/d3.min.js');
app.get('/see_server_js/d3.js', function(req, res) {
    res.setHeader('Content-Type', 'text/javascript');
    res.send(d3);
});

Http.createServer(app).listen(config.httpPort);
console.log('listening on port ' + config.httpPort);

