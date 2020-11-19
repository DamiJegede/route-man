"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const url = require("url");
const formidable = require("formidable");
/**
 * Alias to process return message and close server connection
 */
class RouteResponse extends http_1.OutgoingMessage {
    constructor(response) {
        super();
        /**
         * Write response and end server request.
         * Automatically converts message: object to string
         */
        this.send = (message) => {
            if (typeof message === "string")
                this.response.write(message);
            else
                this.response.write(JSON.stringify(message));
            return this.response.end();
        };
        this.response = response;
    }
}
exports.RouteResponse = RouteResponse;
/**
 * Alias to process incoming request data
 */
class RouteRequest extends http_1.IncomingMessage {
}
exports.RouteRequest = RouteRequest;
/**
 * Superclass for all RouteManager routes
 */
class Route {
    constructor(router) {
        this.router = router;
    }
}
exports.Route = Route;
class RouteManager {
    /**
     * Log all activity from router
     * @param verbose set to true to show all log output
     */
    constructor(verbose) {
        this.headers = [];
        this.routes = {};
        this.verbose = false;
        /**
         * Start server and set port for server to listen on. Default port is 9000
         */
        this.listen = function (portNumber) {
            this.server = http_1.createServer(this.routeRequest);
            if (this.verbose)
                console.log("RouteMan: Server successfully created.");
            //Set default port if not provided
            portNumber = portNumber ? portNumber : 9000;
            this.server.listen(portNumber);
            if (this.verbose)
                console.log(`RouteMan: Listening on port ${portNumber}`);
        };
        /**
         * Register a GET route to routeMan for processing. Uses static or dynamic URIs.
         */
        this.get = function (route, callback) {
            //Check if route has variables
            let variables = route.split("/@");
            if (variables.length > 1) {
                let key = variables[0];
                variables.shift();
                this.routes[key] = { method: "GET", variables: variables, callback: callback };
                if (this.verbose)
                    console.log(`RouteMan: Added dynamic GET route ${route}`);
            }
            else {
                this.routes[route] = { method: "GET", callback: callback };
                if (this.verbose)
                    console.log(`RouteMan: Added static GET route ${route}`);
            }
        };
        /**
         * Register a POST route to routeMan for processing. Uses only static URIs.
         */
        this.post = function (route, callback) {
            this.routes[route] = { method: "POST", callback: callback };
            if (this.verbose)
                console.log(`RouteMan: Added POST route ${route}`);
        };
        /**
         * Set header attributes and values
         */
        this.setHeader = function (attribute, value) {
            if (attribute && value) {
                this.headers.push([attribute, value]);
                if (this.verbose)
                    console.log(`RouteMan: Pushed header ${attribute}: ${value}`);
            }
        };
        this.routeRequest = (request, httpResponse) => __awaiter(this, void 0, void 0, function* () {
            for (let header of this.headers) {
                httpResponse.setHeader(header[0], header[1]);
            }
            let response = new RouteResponse(httpResponse);
            let path = url.parse(request.url).pathname;
            if (this.verbose)
                console.log(`RouteMan: Looking for route ${path}`);
            let route = this.routes[path];
            //Check if route is not a static route
            if (!route) {
                if (this.verbose)
                    console.log(`RouteMan: No static route ${path}. Switching to dynamic routes...`);
                //If path not found check dynamic routes
                let dynamicRoute = path.split("/@");
                //Check if path prefix exists
                route = this.routes[dynamicRoute[0]];
                //Remove path prefix to check variables
                dynamicRoute.shift();
                if (route && dynamicRoute.length === route.variables.length) {
                    if (this.verbose)
                        console.log(`RouteMan: Found ${path} in dynamic routes...`);
                    //Map variables to correct indexes
                    let data = {};
                    for (let i = 0; i < route.variables.length; i++) {
                        data[route.variables[i]] = dynamicRoute[i];
                    }
                    let routeData = {
                        fields: data,
                        request: request,
                        response: response
                    };
                    return route.callback(routeData);
                }
                else {
                    if (this.verbose)
                        console.log(`RouteMan: Couldn't find route ${path}. Available routes...`, this.routes);
                    return response.send({ status: 404, message: `Unknown route to ${path}.` });
                }
            }
            let form = new formidable.IncomingForm();
            form.parse(request, (error, data, files) => __awaiter(this, void 0, void 0, function* () {
                if (error)
                    return response.send({ status: 500, message: "Oops! That's an error. Please try again." });
                if (this.verbose) {
                    console.log("RouteMan: data...", data);
                    console.log("RouteMan: files...", files);
                }
                let routeData = {
                    fields: data,
                    files: files,
                    request: request,
                    response: response
                };
                return route.callback(routeData);
            }));
        });
        this.verbose = verbose;
    }
}
exports.RouteManager = RouteManager;
;
