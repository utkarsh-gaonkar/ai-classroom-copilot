"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const aiProvider_1 = require("../services/aiProvider");
exports.healthRouter = (0, express_1.Router)();
exports.healthRouter.get('/', (_req, res) => {
    res.json({
        status: 'ok',
        mode: (0, aiProvider_1.isAIConfigured)() ? 'ai' : 'demo',
        timestamp: new Date().toISOString(),
    });
});
