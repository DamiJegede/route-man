const http = require("http");
const url = require("url");
const formidable = require("formidable");

let server;
let headers = [];

/**
 * Register routes for processing
 */
module.exports.routes = {};
module.exports.verbose = false;

/**
 * Start server and set port for server to listen on
 * @param {Number} portNumber HTTP port to listen on. Default 9000
 */
exports.listen = (portNumber) => {
	server = http.createServer(routeManager);
	if (module.exports.verbose) console.log("RouteMan: Server successfully created.");
	server.listen(portNumber ? portNumber : 9000);
	if (module.exports.verbose) console.log(`RouteMan: Listening on port ${server.address().port}`);
}

exports.get = async (route, callback) => {
	module.exports.routes[route] = {method: "GET", callback: callback};
	if (module.exports.verbose) console.log(`RouteMan: Added GET route ${route}`);
}

exports.post = async (route, callback) => {
	module.exports.routes[route] = {method: "POST", callback: callback};
	if (module.exports.verbose) console.log(`RouteMan: Added POST route ${route}`);
}

/**
 * Set header attributes and values
 * @param {String} attribute
 * @param {String} value
 */
exports.setHeader = (attribute, value) => {
	if (attribute && value) {
		headers.push([attribute, value]);
		if (module.exports.verbose) console.log(`RouteMan: Pushed header ${attribute}: ${value}`);
	}
}

let routeManager = async (request, response) => {
	for (let header of headers) {
		response.setHeader(header[0], header[1]);
	}

	let path = url.parse(request.url).pathname;
	if (module.exports.verbose) console.log(`RouteMan: Looking for path ${path}`);
	let route = module.exports.routes[path];

	//Check if route is available
	if (!route) {
		if (module.exports.verbose) console.log(`RouteMan: Couldn't find route ${path}. Available routes...`, module.exports.routes);
		response.write(JSON.stringify({status: 402, message: `Unknown route to ${path}.`}));
		return response.end();
	}

	let form = new formidable.IncomingForm();
	form.parse(request, async (error, data, files) => {
		if (error) {
			response.write(JSON.stringify({status: 500, message: "Oops! That's an error. Please try again."}));
			return response.end();
		}

		if (module.exports.verbose) {
			console.log("RouteMan: data...", data);
			console.log("RouteMan: files...", files);
		}

		route.callback(data, files, request, response);
	});
};