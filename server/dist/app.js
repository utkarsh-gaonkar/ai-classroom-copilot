"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const ai_1 = require("./routes/ai");
const health_1 = require("./routes/health");
const errorHandler_1 = require("./middleware/errorHandler");
function createApp(allowedOrigins) {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin(origin, callback) {
            callback(null, !origin || allowedOrigins.includes(origin));
        },
    }));
    app.use(express_1.default.json({ limit: '128kb' }));
    app.use('/api/health', health_1.healthRouter);
    app.use('/api/ai', ai_1.aiRouter);
    app.use('/api', (_req, res) => {
        res.status(404).json({ error: 'API endpoint not found.', status: 404 });
    });
    app.use(errorHandler_1.errorHandler);
    return app;
}
