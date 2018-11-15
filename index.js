const http = require("http");
const url = require("url");
const formidable = require("formidable");

let server;
let headers = [];

/**
 * Register routes for processing
 */
let map = exports.routes;

/**
 * Set port for server to listen on
 * @param {Number} portNumber HTTP port to listen on. Default 9000
 * @param {Object} routes Object of all mapped routes for route-man to process
 * @param {Boolean} verbose console.log() all route-man runtime activity. Default false
 */
exports.listen = (portNumber, routes, verbose) => {
	if (!routes) {
		console.log("No routes declared. Gracefully exiting route-man.");
		return;
	}
	else map = routes;

	(async () => {
		server = http.createServer(routeManager);
		if (verbose) console.log("RouteMan server setup complete.");
		server.listen(portNumber ? portNumber : 9000);
		if (verbose) console.log(`RouteMan is up and running on port ${server.address().port}.`);
	})();
}

/**
 * Set header attributes and values
 * @param {String} attribute
 * @param {String} value
 */
exports.setHeader = (attribute, value) => {
	if (attribute && value) headers.push([attribute, value]);
}

let routeManager = async (request, response) => {
	for (let header of headers) {
		response.setHeader(header[0], header[1]);
	}

	response.writeHead(200, {"Content-Type": "text/json"});

	let path = url.parse(request.url).pathname;
	let route = map[path.split("/")[1]];

	//Check if route is available
	if (!route) {
		response.write(JSON.stringify({status: 402, message: `Unknown route to ${path}.`}));
		return response.end();
	}

	let form = new formidable.IncomingForm();
	form.parse(request, async (error, fields, files) => {
		if (error) {
			response.write(JSON.stringify({status: 500, message: "Oops! That's an error. Please try again."}));
			return response.end();
		}

		console.log(fields, files);

		return route.route(path, fields, files, response);
	});
};