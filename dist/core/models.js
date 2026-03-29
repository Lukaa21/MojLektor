"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobStatus = exports.ServiceType = void 0;
var ServiceType;
(function (ServiceType) {
    ServiceType["LEKTURA"] = "LEKTURA";
    ServiceType["KOREKTURA"] = "KOREKTURA";
    ServiceType["BOTH"] = "BOTH";
})(ServiceType || (exports.ServiceType = ServiceType = {}));
var JobStatus;
(function (JobStatus) {
    JobStatus["CREATED"] = "CREATED";
    JobStatus["READY"] = "READY";
    JobStatus["PROCESSING"] = "PROCESSING";
    JobStatus["DONE"] = "DONE";
    JobStatus["ERROR"] = "ERROR";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
