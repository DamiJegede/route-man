const http = require("http");
const url = require("url");
const formidable = require("formidable");

let server;
let headers = [];

/**
 * Register routes for processing
 */
let routes = exports.routes = [];
let verbose = exports.verbose = false;

/**
 * Start server and set port for server to listen on
 * @param {Number} portNumber HTTP port to listen on. Default 9000
 */
exports.listen = (portNumber) => {
	server = http.createServer(routeManager);
	if (verbose) console.log("RouteMan: Server successfully created.");
	server.listen(portNumber ? portNumber : 9000);
	if (verbose) console.log(`RouteMan: Listening on port ${server.address().port}`);
}

exports.get = async (route, callback) => {
	routes.push({route: route, method: "GET", callback: callback});
	if (verbose) console.log(`RouteMan: Added GET route ${route}`);
}

exports.post = async (route, callback) => {
	routes.push({route: route, method: "POST", callback: callback});
	if (verbose) console.log(`RouteMan: Added POST route ${route}`);
}

/**
 * Set header attributes and values
 * @param {String} attribute
 * @param {String} value
 */
exports.setHeader = (attribute, value) => {
	if (attribute && value) {
		headers.push([attribute, value]);
		if (verbose) console.log(`RouteMan: Pushed header ${attribute}: ${value}`);
	}
}

let routeManager = async (request, response) => {
	for (let header of headers) {
		response.setHeader(header[0], header[1]);
	}

	let path = url.parse(request.url).pathname;
	let route = routes[path.split("/")[1]];

	//Check if route is available
	if (!route) {
		response.write(JSON.stringify({status: 402, message: `Unknown route to ${path}.`}));
		return response.end();
	}

	let form = new formidable.IncomingForm();
	form.parse(request, async (error, data, files) => {
		if (error) {
			response.write(JSON.stringify({status: 500, message: "Oops! That's an error. Please try again."}));
			return response.end();
		}

		if (verbose) console.log(`RouteMan: \nData: ${data} \nFiles: ${files}`);

		route.callback(data, files, request, response);
	});
};