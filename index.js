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
 * @param {Number} portNumber
 * @param {Object} routes
 */
exports.listen = (portNumber, routes) => {
	if (portNumber) server.listen(portNumber);
	if (routes) map = routes;
}

/**
 * Set header attributes and values
 * @param {String} attribute
 * @param {String} value
 */
exports.setHeader = (attribute, value) => {
	if (attribute && value) headers.push([attribute, value]);
}

(async () => {
	server = http.createServer(routeManager);
})();

let routeManager = async (request, response) => {
	for (let header of headers) {
		response.setHeader(header[0], header[1]);
	}

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