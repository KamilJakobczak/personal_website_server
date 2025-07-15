// Core Modules
import http from 'http';
import cluster from 'cluster';
import os from 'os';

// App Modules
import { app } from './src/express';
import config from './config';
import { startApolloServer } from './src/bookCollection/apolloServer';
import { Role, User } from '@prisma/client';

// Session type extension. Don't know why but it works here and not where it's supposed to
declare module 'express-session' {
	export interface SessionData {
		user: {
			id: string;
			profileId: string;
			role: Role;
		};
	}
}

declare module 'epub' {
	export interface Metadata {
		creator: string;
		creatorFileAs: string;
		title: string;
		language: string;
		subject: string;
		date: string;
		description: string;
		cover: any;
		// added by myself
		publisher: string;
		ISBN: string;
	}
}

const { host, backPort } = config;
const port = Number(backPort);
const isProduction = process.env.NODE_ENV === 'production';

async function launchServer() {
	const httpServer = http.createServer(app);

	httpServer.on('error', error => {
		console.error(`HTTP Server Error: ${error.message}`);
	});

	try {
		await startApolloServer(app, httpServer);
		httpServer.listen(port, host, () => {
			console.log(
				`🚀 Server running at http://${host}:${port} | PID: ${process.pid}`
			);
		});
	} catch (error) {
		console.error('Error starting Apollo Server', error);
	}
}

if (isProduction && cluster.isPrimary) {
	console.log(`Primary ${process.pid} is running in Production mode`);
	const numCPUs = os.cpus().length;
	for (let i = 0; i < numCPUs; i++) {
		cluster.fork();
	}
	cluster.on('exit', (worker, code, signal) => {
		console.log(`Worker ${worker.process.pid} died. Restarting...`);
		// Optionally, restart the worker
		cluster.fork();
	});
} else {
	console.log(
		`🔧 ${process.pid} running in ${
			isProduction ? 'Production' : 'Development'
		} mode`
	);
	launchServer();
}
