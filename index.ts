import { createServer, Server, IncomingMessage, OutgoingMessage, RequestListener } from "http";
import * as url from "url";
import * as formidable from "formidable";

/**
 * Alias to process return message and close server connection
 */
export class RouteResponse extends OutgoingMessage {
	private response: OutgoingMessage;

	constructor (response: OutgoingMessage) {
		super();
		this.response = response;
	}

	/**
	 * Write response and end server request.
	 * Automatically converts message: object to string
	 */
	public send: Function = (message: any): void => {
		if (typeof message === "string") this.response.write(message);
		else this.response.write(JSON.stringify(message));
		return this.response.end();
	};
}

/**
 * Alias to process incoming request data
 */
export class RouteRequest extends IncomingMessage {}

/**
 * Incoming parsed RouteManager request
 */
export type RouteData = {
	fields: any,
	files?: any,
	request?: IncomingMessage,
	response: RouteResponse
};

/**
 * Superclass for all RouteManager routes
 */
export class Route {
	public router: RouteManager;

	constructor (router: RouteManager) {
		this.router = router;
	}
}

export class RouteManager {
	private server: Server | undefined;
	private headers: Array<any> = [];
	public routes: object = {};
	public verbose: boolean | undefined = false;

	/**
	 * Log all activity from router
	 * @param verbose set to true to show all log output
	 */
	constructor (verbose?: boolean | undefined) {
		this.verbose = verbose;
	}

	/**
	 * Start server and set port for server to listen on. Default port is 9000
	 */
	public listen: Function = function (portNumber?: number): void {
		this.server = createServer(this.routeRequest);
		if (this.verbose) console.log("RouteMan: Server successfully created.");

		//Set default port if not provided
		portNumber = portNumber ? portNumber : 9000;

		this.server.listen(portNumber);
		if (this.verbose) console.log(`RouteMan: Listening on port ${portNumber}`);
	}

	/**
	 * Register a GET route to routeMan for processing. Uses static or dynamic URIs.
	 */
	public get: Function = function (route: string, callback: any): void {
		//Check if route has variables
		let variables: Array<string> = route.split("/@");
		if (variables.length > 1) {
			let key = variables[0];
			variables.shift();

			this.routes[key] = {method: "GET", variables: variables, callback: callback};
			if (this.verbose) console.log(`RouteMan: Added dynamic GET route ${route}`);
		}
		else {
			this.routes[route] = {method: "GET", callback: callback};
			if (this.verbose) console.log(`RouteMan: Added static GET route ${route}`);
		}
	}

	/**
	 * Register a POST route to routeMan for processing. Uses only static URIs.
	 */
	public post: Function = function (route: string, callback: any): void {
		this.routes[route] = {method: "POST", callback: callback};
		if (this.verbose) console.log(`RouteMan: Added POST route ${route}`);
	}

	/**
	 * Set header attributes and values
	 */
	public setHeader: Function = function (attribute: string, value: string): void {
		if (attribute && value) {
			this.headers.push([attribute, value]);
			if (this.verbose) console.log(`RouteMan: Pushed header ${attribute}: ${value}`);
		}
	}

	private routeRequest: RequestListener = async (request: IncomingMessage, httpResponse: OutgoingMessage) => {
		for (let header of this.headers) {
			httpResponse.setHeader(header[0], header[1]);
		}

		let response: RouteResponse = new RouteResponse(httpResponse);

		let path = url.parse(request.url).pathname;
		if (this.verbose) console.log(`RouteMan: Looking for route ${path}`);
		let route = this.routes[path];

		//Check if route is not a static route
		if (!route) {
			if (this.verbose) console.log(`RouteMan: No static route ${path}. Switching to dynamic routes...`);

			//If path not found check dynamic routes
			let dynamicRoute: Array<string> = path.split("/@");
			//Check if path prefix exists
			route = this.routes[dynamicRoute[0]];
			//Remove path prefix to check variables
			dynamicRoute.shift();

			if (route && dynamicRoute.length === route.variables.length) {
				if (this.verbose) console.log(`RouteMan: Found ${path} in dynamic routes...`);

				//Map variables to correct indexes
				let data = {};
				for (let i=0; i<route.variables.length; i++) {
					data[route.variables[i]] = dynamicRoute[i];
				}

				let routeData: RouteData = {
					fields: data,
					request: request,
					response: response
				};
	
				return route.callback(routeData);
			}
			else {
				if (this.verbose) console.log(`RouteMan: Couldn't find route ${path}. Available routes...`, this.routes);
				return response.send({status: 404, message: `Unknown route to ${path}.`});
			}
		}

		let form = new formidable.IncomingForm();
		form.parse(request, async (error, data, files) => {
			if (error) return response.send({status: 500, message: "Oops! That's an error. Please try again."});

			if (this.verbose) {
				console.log("RouteMan: data...", data);
				console.log("RouteMan: files...", files);
			}

			let routeData: RouteData = {
				fields: data,
				files: files,
				request: request,
				response: response
			};

			return route.callback(routeData);
		});
	}
};