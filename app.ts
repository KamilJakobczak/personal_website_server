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

const numCPUs = os.cpus().length;
const { host, backPort } = config;

if (cluster.isPrimary) {
	// If primary, set up worker clusters
	console.log(`Primary ${process.pid} is running`);

	for (let i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

	cluster.on('exit', (worker, code, signal) => {
		console.log(`Worker ${worker.process.pid} died`);
		// Optionally, restart the worker
		cluster.fork();
	});
} else {
	// Worker process: create HTTP server and start Apollo Server
	const httpServer = http.createServer(app);
	const port = Number(backPort);

	// General error handling
	httpServer.on('error', error => {
		console.error(
			`HTTP Server Error: ${error.message}`
		);
	});

	try {
		startApolloServer(app, httpServer)
			.then(() => {
				httpServer.listen(port, host, () => {
					console.log(
						`Worker ${process.pid} started and listening at http://${host}:${port}`
					);
				});
			})
			.catch(error => {
				console.error('Error starting Apollo Server');
			});
	} catch (error) {
		console.error(`Error initializing server`, error);
	}
	console.log(
		`Worker ${process.pid} started on Port: ${port}`
	);
}
