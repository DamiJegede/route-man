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

/**
 * Register a GET route to routeMan for processing. Uses static or dynamic URIs.
 * @param {String} route Route URI to listen to e.g. /account/users/list (static) or /accounts/@userid/@messages (dynamic)
 * @param {Function} callback callback(variables, request, response)
 */
exports.get = async (route, callback) => {
	//Check if route has variables
	let variables = route.split("/@");
	if (variables.length > 1) {
		let key = variables[0];
		variables.shift();

		module.exports.routes[key] = {method: "GET", variables: variables, callback: callback};
		if (module.exports.verbose) console.log(`RouteMan: Added dynamic GET route ${route}`);
	}
	else {
		module.exports.routes[route] = {method: "GET", callback: callback};
		if (module.exports.verbose) console.log(`RouteMan: Added static GET route ${route}`);
	}
}

/**
 * Register a POST route to routeMan for processing. Uses only static URIs.
 * @param {String} route Route URI to listen to e.g. /account/users/update
 * @param {Function} callback callback(variables, request, response)
 */
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
	if (module.exports.verbose) console.log(`RouteMan: Looking for route ${path}`);
	let route = module.exports.routes[path];

	//Check if route is not a static route
	if (!route) {
		if (module.exports.verbose) console.log(`RouteMan: No static route ${path}. Switching to dynamic routes...`);

		//If path not found check dynamic routes
		let dynamicRoute = path.split("/@");
		route = module.exports.routes[dynamicRoute[0]];
		dynamicRoute.shift();

		if (route && dynamicRoute.length === route.variables.length) {
			if (module.exports.verbose) console.log(`RouteMan: Found ${path} in dynamic routes...`);

			//Map variables to correct indexes
			let variables = {};
			for (let i=0; i<route.variables.length; i++) {
				variables[route.variables[i]] = dynamicRoute[i];
			}

			return route.callback(request, response, variables);
		}
	
		if (module.exports.verbose) console.log(`RouteMan: Couldn't find route ${path}. Available routes...`, module.exports.routes);

		response.write(JSON.stringify({status: 404, message: `Unknown route to ${path}.`}));
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

		if (route.method === "POST") return route.callback(data, files, request, response);
		else return route.callback(request, response);
	});
};