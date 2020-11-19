/// <reference types="node" />
import { IncomingMessage, OutgoingMessage } from "http";
/**
 * Alias to process return message and close server connection
 */
export declare class RouteResponse extends OutgoingMessage {
    private response;
    constructor(response: OutgoingMessage);
    /**
     * Write response and end server request.
     * Automatically converts message: object to string
     */
    send (message: any): Function;
}
/**
 * Alias to process incoming request data
 */
export declare class RouteRequest extends IncomingMessage {
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
     * Start server and set port for server to listen on. Default port is 9000
     */
    listen (portNumber?: number): Function;
    /**
     * Register a GET route to routeMan for processing. Uses static or dynamic URIs.
     */
    get (route: string, callback: any): Function;
    /**
     * Register a POST route to routeMan for processing. Uses only static URIs.
     */
    post (route: string, callback: any): Function;
    /**
     * Set header attributes and values
     */
    setHeader (attribute: string, value: string): Function;
    private routeRequest;
}