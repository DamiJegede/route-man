/// <reference types="node" />
import { IncomingMessage, OutgoingMessage } from "http";
/**
 * Alias to process return message and close server connection
 * @param {Object} message
 */
export declare class RouteResponse extends OutgoingMessage {
    private response;
    constructor(response: OutgoingMessage);
    /**
     * Write response and end server request.
     * Automatically converts message: object to string
     */
    send: Function;
}
/**
 * Incoming parsed RouteManager request
 */
export declare type RouteData = {
    fields: any;
    files?: any;
    request?: IncomingMessage;
    response: RouteResponse;
};
/**
 * Superclass for all RouteManager routes
 */
export declare class Route {
    router: RouteManager;
    constructor(router: RouteManager);
}
export declare class RouteManager {
    private server;
    private headers;
    routes: object;
    verbose: boolean | undefined;
    /**
     * Log all activity from router
     * @param verbose set to true to show all log output
     */
    constructor(verbose?: boolean | undefined);
    /**
     * Start server and set port for server to listen on
     * @param {Number} portNumber HTTP port to listen on. Default 9000
     */
    listen: Function;
    /**
     * Register a GET route to routeMan for processing. Uses static or dynamic URIs.
     * @param {String} route Route URI to listen to e.g. /account/users/list (static) or /accounts/@userid/@messages (dynamic)
     * @param {Function} callback callback(variables, request, response)
     */
    get: Function;
    /**
     * Register a POST route to routeMan for processing. Uses only static URIs.
     * @param {String} route Route URI to listen to e.g. /account/users/update
     * @param {Function} callback callback(variables, request, response)
     */
    post: Function;
    /**
     * Set header attributes and values
     * @param {String} attribute
     * @param {String} value
     */
    setHeader: Function;
    private routeRequest;
}
